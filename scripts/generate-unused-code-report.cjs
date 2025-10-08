// @ts-nocheck
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const srcDir = path.join(__dirname, '..', 'src');
    await this.scanDirectory(srcDir);
    this.buildDependencyGraph();

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
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);

    const importMatches = content.matchAll(
      /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g
    );
    const imports = [];

    for (const match of importMatches) {
      if (match[1]) {
        const names = match[1].split(',').map(n => n.trim());
        names.forEach(name => {
          imports.push({ name, from: match[3], type: 'named' });
        });
      } else if (match[2]) {
        imports.push({ name: match[2], from: match[3], type: 'default' });
      }
    }

    this.imports.set(relativePath, imports);

    const exports = [];
    const defaultExportMatch = content.match(
      /export\s+default\s+(?:class\s+)?(\w+)/
    );
    if (defaultExportMatch) {
      exports.push({ name: defaultExportMatch[1], type: 'default' });
    }

    const namedExportMatches = content.matchAll(
      /export\s+(?:class|function|const|let|var)\s+(\w+)/g
    );
    for (const match of namedExportMatches) {
      exports.push({ name: match[1], type: 'named' });
    }

    const exportBlockMatches = content.matchAll(/export\s+{([^}]+)}/g);
    for (const match of exportBlockMatches) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
      names.forEach(name => {
        exports.push({ name, type: 'named' });
      });
    }

    this.exports.set(relativePath, exports);

    const dynamicImportMatches = content.matchAll(
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    );
    for (const match of dynamicImportMatches) {
      this.dynamicImports.add(match[1]);
    }

    const routeMatches = content.matchAll(/['"]\/[^'"]*['"]/g);
    for (const match of routeMatches) {
      this.routeReferences.add(match[0].slice(1, -1));
    }

    const identifiers = content.match(/\b[A-Z][a-zA-Z0-9]*\b/g) || [];
    this.usages.set(relativePath, new Set(identifiers));
  }

  buildDependencyGraph() {
    for (const [file, imports] of this.imports.entries()) {
      for (const imp of imports) {
        const resolvedPath = this.resolveImportPath(file, imp.from);
        if (resolvedPath && !this.usages.has(resolvedPath)) {
          this.usages.set(resolvedPath, new Set());
        }
      }
    }
  }

  resolveImportPath(fromFile, importPath) {
    if (importPath.startsWith('.')) {
      const dir = path.dirname(fromFile);
      let resolved = path.join(dir, importPath);
      if (!resolved.endsWith('.js')) {
        resolved += '.js';
      }
      return path
        .relative(path.join(__dirname, '..'), resolved)
        .replace(/\\/g, '/');
    }
    return null;
  }

  findUnusedImports() {
    const unused = [];

    for (const [file, imports] of this.imports.entries()) {
      const content = fs.readFileSync(
        path.join(__dirname, '..', file),
        'utf-8'
      );

      for (const imp of imports) {
        const usagePattern = new RegExp(`\\b${imp.name}\\b`, 'g');
        const matches = content.match(usagePattern) || [];

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

        for (const [, imports] of this.imports.entries()) {
          if (imports.some(imp => imp.name === componentName)) {
            isUsed = true;
            break;
          }
        }

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

function generateReport(results, analyzer) {
  const timestamp = new Date().toISOString();

  let report = `# Unused Code Analysis Report\n\n`;
  report += `Generated: ${timestamp}\n\n`;
  report += `## Executive Summary\n\n`;
  report += `- **Files Analyzed**: ${analyzer.files.length}\n`;
  report += `- **Unused Imports**: ${results.unusedImports.length}\n`;
  report += `- **Unused Exports**: ${results.unusedExports.length}\n`;
  report += `- **Unused Components**: ${results.unusedComponents.length}\n`;
  report += `- **Unused Services**: ${results.unusedServices.length}\n`;
  report += `- **Dynamic Imports Found**: ${results.dynamicImports.length}\n\n`;

  report += `## Severity Classification\n\n`;

  // Critical: Unused components and services
  const critical =
    results.unusedComponents.length + results.unusedServices.length;
  report += `### 🔴 Critical (${critical})\n`;
  report += `Large unused code blocks that should be evaluated for removal or integration.\n\n`;

  // Warning: Unused exports
  const warning = results.unusedExports.length;
  report += `### 🟡 Warning (${warning})\n`;
  report += `Exported functions/classes that are not imported anywhere.\n\n`;

  // Info: Unused imports
  const info = results.unusedImports.length;
  report += `### 🔵 Info (${info})\n`;
  report += `Import statements that can be safely removed.\n\n`;

  report += `---\n\n`;

  // Detailed findings
  if (results.unusedComponents.length > 0) {
    report += `## 🔴 Unused Components (Critical)\n\n`;
    report += `These components are not imported or used anywhere in the codebase.\n\n`;
    results.unusedComponents.forEach(({ file, component }) => {
      report += `### ${component}\n`;
      report += `- **File**: \`${file}\`\n`;
      report += `- **Recommendation**: Evaluate for integration or removal\n`;
      report += `- **Action Required**: Review component functionality before deletion\n\n`;
    });
  }

  if (results.unusedServices.length > 0) {
    report += `## 🔴 Unused Services (Critical)\n\n`;
    report += `These services are not imported or used anywhere in the codebase.\n\n`;
    results.unusedServices.forEach(({ file, service }) => {
      report += `### ${service}\n`;
      report += `- **File**: \`${file}\`\n`;
      report += `- **Recommendation**: Evaluate for consolidation or removal\n`;
      report += `- **Action Required**: Check if functionality is duplicated elsewhere\n\n`;
    });
  }

  if (results.unusedExports.length > 0) {
    report += `## 🟡 Unused Exports (Warning)\n\n`;
    report += `These exports are not imported anywhere. They may be:\n`;
    report += `- Dead code that can be removed\n`;
    report += `- Internal functions that should not be exported\n`;
    report += `- Functions used via dynamic imports (check carefully)\n\n`;

    const byFile = {};
    results.unusedExports.forEach(({ file, export: exp }) => {
      if (!byFile[file]) byFile[file] = [];
      byFile[file].push(exp);
    });

    Object.entries(byFile).forEach(([file, exports]) => {
      report += `### ${file}\n`;
      exports.forEach(exp => {
        report += `- \`${exp.name}\` (${exp.type} export)\n`;
      });
      report += `\n`;
    });
  }

  if (results.unusedImports.length > 0) {
    report += `## 🔵 Unused Imports (Info)\n\n`;
    report += `These imports can be safely removed to clean up the code.\n\n`;

    const byFile = {};
    results.unusedImports.forEach(({ file, import: imp }) => {
      if (!byFile[file]) byFile[file] = [];
      byFile[file].push(imp);
    });

    Object.entries(byFile).forEach(([file, imports]) => {
      report += `### ${file}\n`;
      imports.forEach(imp => {
        report += `- \`${imp.name}\` from \`${imp.from}\`\n`;
      });
      report += `\n`;
    });
  }

  report += `## Dynamic Imports\n\n`;
  report += `The following dynamic imports were detected. Code referenced by these should NOT be removed:\n\n`;
  if (results.dynamicImports.length > 0) {
    results.dynamicImports.forEach(di => {
      report += `- \`${di}\`\n`;
    });
  } else {
    report += `None found.\n`;
  }
  report += `\n`;

  report += `## Route References\n\n`;
  report += `The following route paths were found in the code:\n\n`;
  if (results.routeReferences.length > 0) {
    const routes = Array.from(results.routeReferences).filter(r =>
      r.startsWith('/')
    );
    routes.sort().forEach(route => {
      report += `- \`${route}\`\n`;
    });
  } else {
    report += `None found.\n`;
  }
  report += `\n`;

  report += `## Recommendations\n\n`;
  report += `1. **Review Critical Items First**: Evaluate unused components and services for integration opportunities\n`;
  report += `2. **Check Dynamic References**: Verify that unused exports are not referenced via dynamic imports\n`;
  report += `3. **Clean Imports**: Remove unused imports to improve code clarity\n`;
  report += `4. **Document Decisions**: Record why code is kept or removed\n\n`;

  report += `## Next Steps\n\n`;
  report += `1. Run duplicate code analysis\n`;
  report += `2. Analyze integration opportunities for unused components\n`;
  report += `3. Create consolidation plan for overlapping services\n`;
  report += `4. Execute cleanup in phases with testing between each phase\n`;

  return report;
}

// Run analysis and generate report
console.log('🔍 Analyzing codebase for unused code...\n');

const analyzer = new UnusedCodeAnalyzer();
const results = await analyzer.analyzeProject();

console.log('📝 Generating report...\n');

const report = generateReport(results, analyzer);
const reportPath = path.join(__dirname, '..', 'UNUSED_CODE_REPORT.md');
fs.writeFileSync(reportPath, report);

console.log('✅ Report generated successfully!');
console.log(`📄 Report saved to: UNUSED_CODE_REPORT.md\n`);

console.log('📊 Summary:');
console.log(`   - Files analyzed: ${analyzer.files.length}`);
console.log(`   - Unused imports: ${results.unusedImports.length}`);
console.log(`   - Unused exports: ${results.unusedExports.length}`);
console.log(`   - Unused components: ${results.unusedComponents.length}`);
console.log(`   - Unused services: ${results.unusedServices.length}`);
