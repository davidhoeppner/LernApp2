// @ts-nocheck
/* eslint-env node */
const fs = require('fs');
const path = require('path');
const __dirname = process.cwd();

class UnusedCodeAnalyzer {
  constructor() {
    this.imports = new Map();
    this.exports = new Map();
    this.usages = new Map();
    this.files = [];
    this.dynamicImports = new Set();
    this.routeReferences = new Set();
  }

  async analyzeProject() {
    console.log('🔍 Starting unused code analysis...\n');

    const srcDir = path.join(process.cwd(), '..', 'src');
    await this.scanDirectory(srcDir);

    // Build dependency graph
    this.buildDependencyGraph();

    // Find unused code
    const unusedImports = this.findUnusedImports();
    const unusedExports = this.findUnusedExports();
    const unusedComponents = this.findUnusedComponents();
    const unusedServices = this.findUnusedServices();

    return {
      unusedImports,
      unusedExports,
      unusedComponents,
      unusedServices,
      dynamicImports: Array.from(this.dynamicImports),
      routeReferences: Array.from(this.routeReferences),
    };
  }

  async scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        this.files.push(fullPath);
        await this.analyzeFile(fullPath);
      }
    }
  }

  async analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(
      path.join(process.cwd(), '..'),
      filePath
    );

    // Extract imports
    const importMatches = content.matchAll(
      /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g
    );
    const imports = [];

    for (const match of importMatches) {
      if (match[1]) {
        // Named imports
        const names = match[1].split(',').map(n => n.trim());
        names.forEach(name => {
          imports.push({ name, from: match[3], type: 'named' });
        });
      } else if (match[2]) {
        // Default import
        imports.push({ name: match[2], from: match[3], type: 'default' });
      }
    }

    this.imports.set(relativePath, imports);

    // Extract exports
    const exports = [];

    // Default exports
    const defaultExportMatch = content.match(
      /export\s+default\s+(?:class\s+)?(\w+)/
    );
    if (defaultExportMatch) {
      exports.push({ name: defaultExportMatch[1], type: 'default' });
    }

    // Named exports
    const namedExportMatches = content.matchAll(
      /export\s+(?:class|function|const|let|var)\s+(\w+)/g
    );
    for (const match of namedExportMatches) {
      exports.push({ name: match[1], type: 'named' });
    }

    // Export { ... } syntax
    const exportBlockMatches = content.matchAll(/export\s+{([^}]+)}/g);
    for (const match of exportBlockMatches) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
      names.forEach(name => {
        exports.push({ name, type: 'named' });
      });
    }

    this.exports.set(relativePath, exports);

    // Track dynamic imports
    const dynamicImportMatches = content.matchAll(
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    );
    for (const match of dynamicImportMatches) {
      this.dynamicImports.add(match[1]);
    }

    // Track route references (string-based)
    const routeMatches = content.matchAll(/['"]\/[^'"]*['"]/g);
    for (const match of routeMatches) {
      this.routeReferences.add(match[0].slice(1, -1));
    }

    // Track usages (simple identifier matching)
    const identifiers = content.match(/\b[A-Z][a-zA-Z0-9]*\b/g) || [];
    this.usages.set(relativePath, new Set(identifiers));
  }

  buildDependencyGraph() {
    // Build a map of what imports what
    for (const [file, imports] of this.imports.entries()) {
      for (const imp of imports) {
        const resolvedPath = this.resolveImportPath(file, imp.from);
        if (resolvedPath) {
          if (!this.usages.has(resolvedPath)) {
            this.usages.set(resolvedPath, new Set());
          }
        }
      }
    }
  }

  resolveImportPath(fromFile, importPath) {
    if (importPath.startsWith('.')) {
      const dir = path.dirname(fromFile);
      let resolved = path.join(dir, importPath);

      // Try with .js extension
      if (!resolved.endsWith('.js')) {
        resolved += '.js';
      }

      return path.relative(path.join(process.cwd(), '..'), resolved);
    }
    return null;
  }

  findUnusedImports() {
    const unused = [];

    for (const [file, imports] of this.imports.entries()) {
      const content = fs.readFileSync(
        path.join(process.cwd(), '..', file),
        'utf-8'
      );

      for (const imp of imports) {
        // Check if the imported name is used in the file
        const usagePattern = new RegExp(`\\b${imp.name}\\b`, 'g');
        const matches = content.match(usagePattern) || [];

        // If only 1 match, it's just the import statement itself
        if (matches.length <= 1) {
          unused.push({ file, import: imp });
        }
      }
    }

    return unused;
  }

  findUnusedExports() {
    const unused = [];

    for (const [file, exports] of this.exports.entries()) {
      for (const exp of exports) {
        let isUsed = false;

        // Check if any file imports this export
        for (const [importingFile, imports] of this.imports.entries()) {
          for (const imp of imports) {
            const resolvedPath = this.resolveImportPath(
              importingFile,
              imp.from
            );
            if (resolvedPath === file && imp.name === exp.name) {
              isUsed = true;
              break;
            }
          }
          if (isUsed) break;
        }

        // Check dynamic imports
        const fileName = path.basename(file, '.js');
        if (
          this.dynamicImports.has(`./${file}`) ||
          this.dynamicImports.has(`../${file}`) ||
          Array.from(this.dynamicImports).some(di => di.includes(fileName))
        ) {
          isUsed = true;
        }

        if (!isUsed) {
          unused.push({ file, export: exp });
        }
      }
    }

    return unused;
  }

  findUnusedComponents() {
    const components = [];

    for (const [file, exports] of this.exports.entries()) {
      if (file.includes('components/')) {
        const componentName =
          exports.find(e => e.type === 'default')?.name ||
          path.basename(file, '.js');

        let isUsed = false;

        // Check if imported anywhere
        for (const [, imports] of this.imports.entries()) {
          if (imports.some(imp => imp.name === componentName)) {
            isUsed = true;
            break;
          }
        }

        // Check dynamic imports
        if (
          Array.from(this.dynamicImports).some(di => di.includes(componentName))
        ) {
          isUsed = true;
        }

        if (!isUsed) {
          components.push({ file, component: componentName });
        }
      }
    }

    return components;
  }

  findUnusedServices() {
    const services = [];

    for (const [file, exports] of this.exports.entries()) {
      if (file.includes('services/')) {
        const serviceName =
          exports.find(e => e.type === 'default')?.name ||
          path.basename(file, '.js');

        let isUsed = false;

        // Check if imported anywhere
        for (const [, imports] of this.imports.entries()) {
          if (imports.some(imp => imp.name === serviceName)) {
            isUsed = true;
            break;
          }
        }

        if (!isUsed) {
          services.push({ file, service: serviceName });
        }
      }
    }

    return services;
  }
}

// Run analysis
const analyzer = new UnusedCodeAnalyzer();

(async () => {
  try {
    const results = await analyzer.analyzeProject();

    console.log('✅ Analysis complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   - Files analyzed: ${analyzer.files.length}`);
    console.log(`   - Unused imports: ${results.unusedImports.length}`);
    console.log(`   - Unused exports: ${results.unusedExports.length}`);
    console.log(`   - Unused components: ${results.unusedComponents.length}`);
    console.log(`   - Unused services: ${results.unusedServices.length}`);
    console.log(`   - Dynamic imports found: ${results.dynamicImports.length}`);

    // Export results for report generation (available after run)
    module.exports = { analyzer, results };
  } catch (err) {
    console.error('Analysis failed:', err);
    process.exit(1);
  }
})();
