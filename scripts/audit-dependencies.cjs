// @ts-nocheck
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const process.cwd() = path.dirname(__filename);

class DependencyAuditor {
  constructor() {
    this.packageJson = null;
    this.usedPackages = new Set();
    this.results = {
      totalDependencies: 0,
      totalDevDependencies: 0,
      usedDependencies: [],
      unusedDependencies: [],
      usedDevDependencies: [],
      unusedDevDependencies: [],
    };
  }

  async audit() {
    // Read package.json
    const packagePath = path.join(process.cwd(), '..', 'package.json');
    this.packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

    // Scan codebase for imports
    await this.scanForImports(path.join(process.cwd(), '..', 'src'));
    await this.scanForImports(path.join(process.cwd(), '..', 'scripts'));

    // Check configuration files
    this.checkConfigFiles();

    // Analyze dependencies
    this.analyzeDependencies();

    // Generate report
    this.generateReport();
  }

  async scanForImports(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (
          !entry.name.startsWith('.') &&
          entry.name !== 'node_modules' &&
          entry.name !== 'dist'
        ) {
          await this.scanForImports(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        this.scanFileForImports(fullPath);
      }
    }
  }

  scanFileForImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      // Match: import X from 'package'
      const importMatch = line.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const importPath = importMatch[1];
        // Extract package name (handle scoped packages)
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          const packageName = importPath.startsWith('@')
            ? importPath.split('/').slice(0, 2).join('/')
            : importPath.split('/')[0];
          this.usedPackages.add(packageName);
        }
      }

      // Match: import('package') - dynamic imports
      const dynamicImportMatch = line.match(
        /import\s*\(\s*['"]([^'"]+)['"]\s*\)/
      );
      if (dynamicImportMatch) {
        const importPath = dynamicImportMatch[1];
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          const packageName = importPath.startsWith('@')
            ? importPath.split('/').slice(0, 2).join('/')
            : importPath.split('/')[0];
          this.usedPackages.add(packageName);
        }
      }

      // Match: require('package')
      const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
      if (requireMatch) {
        const importPath = requireMatch[1];
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          const packageName = importPath.startsWith('@')
            ? importPath.split('/').slice(0, 2).join('/')
            : importPath.split('/')[0];
          this.usedPackages.add(packageName);
        }
      }
    }
  }

  checkConfigFiles() {
    // Check vite.config.js
    const viteConfigPath = path.join(process.cwd(), '..', 'vite.config.js');
    if (fs.existsSync(viteConfigPath)) {
      this.usedPackages.add('vite');
    }

    // Check eslint.config.js
    const eslintConfigPath = path.join(process.cwd(), '..', 'eslint.config.js');
    if (fs.existsSync(eslintConfigPath)) {
      this.usedPackages.add('eslint');
      const content = fs.readFileSync(eslintConfigPath, 'utf-8');
      if (content.includes('prettier')) {
        this.usedPackages.add('eslint-config-prettier');
        this.usedPackages.add('eslint-plugin-prettier');
      }
    }

    // Check .prettierrc
    const prettierConfigPath = path.join(process.cwd(), '..', '.prettierrc');
    if (fs.existsSync(prettierConfigPath)) {
      this.usedPackages.add('prettier');
    }

    // Check package.json scripts
    const scripts = this.packageJson.scripts || {};
    for (const script of Object.values(scripts)) {
      if (script.includes('gh-pages')) {
        this.usedPackages.add('gh-pages');
      }
      if (script.includes('vite')) {
        this.usedPackages.add('vite');
      }
      if (script.includes('eslint')) {
        this.usedPackages.add('eslint');
      }
      if (script.includes('prettier')) {
        this.usedPackages.add('prettier');
      }
    }
  }

  analyzeDependencies() {
    const dependencies = this.packageJson.dependencies || {};
    const devDependencies = this.packageJson.devDependencies || {};

    this.results.totalDependencies = Object.keys(dependencies).length;
    this.results.totalDevDependencies = Object.keys(devDependencies).length;

    // Check regular dependencies
    for (const [pkg, version] of Object.entries(dependencies)) {
      if (this.usedPackages.has(pkg)) {
        this.results.usedDependencies.push({ package: pkg, version });
      } else {
        this.results.unusedDependencies.push({ package: pkg, version });
      }
    }

    // Check dev dependencies
    for (const [pkg, version] of Object.entries(devDependencies)) {
      if (this.usedPackages.has(pkg)) {
        this.results.usedDevDependencies.push({ package: pkg, version });
      } else {
        this.results.unusedDevDependencies.push({ package: pkg, version });
      }
    }
  }

  generateReport() {
    console.log('\n=== Dependency Audit Report ===\n');

    console.log('📦 Dependencies:');
    console.log(`   Total: ${this.results.totalDependencies}`);
    console.log(`   Used: ${this.results.usedDependencies.length}`);
    console.log(`   Unused: ${this.results.unusedDependencies.length}`);

    if (this.results.usedDependencies.length > 0) {
      console.log('\n   ✓ Used dependencies:');
      this.results.usedDependencies.forEach(dep => {
        console.log(`     - ${dep.package}@${dep.version}`);
      });
    }

    if (this.results.unusedDependencies.length > 0) {
      console.log('\n   ⚠ Unused dependencies (can be removed):');
      this.results.unusedDependencies.forEach(dep => {
        console.log(`     - ${dep.package}@${dep.version}`);
      });
    }

    console.log('\n🛠️  Dev Dependencies:');
    console.log(`   Total: ${this.results.totalDevDependencies}`);
    console.log(`   Used: ${this.results.usedDevDependencies.length}`);
    console.log(`   Unused: ${this.results.unusedDevDependencies.length}`);

    if (this.results.usedDevDependencies.length > 0) {
      console.log('\n   ✓ Used dev dependencies:');
      this.results.usedDevDependencies.forEach(dep => {
        console.log(`     - ${dep.package}@${dep.version}`);
      });
    }

    if (this.results.unusedDevDependencies.length > 0) {
      console.log('\n   ⚠ Unused dev dependencies (can be removed):');
      this.results.unusedDevDependencies.forEach(dep => {
        console.log(`     - ${dep.package}@${dep.version}`);
      });
    }

    // Save detailed report
    const reportPath = path.join(process.cwd(), '..', 'DEPENDENCY_AUDIT.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log('\n📄 Detailed report saved to: DEPENDENCY_AUDIT.json');

    // Generate removal commands if there are unused dependencies
    const allUnused = [
      ...this.results.unusedDependencies,
      ...this.results.unusedDevDependencies,
    ];

    if (allUnused.length > 0) {
      // Unused dependencies found (already reported above)
    } else {
      // All dependencies are in use
    }
  }
}

// Run the auditor
const auditor = new DependencyAuditor();
await auditor.audit();
