// @ts-nocheck
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CodeQualityVerifier {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      linting: {},
      imports: {},
      diagnostics: {},
      consoleErrors: {},
      summary: {},
    };
    this.issues = [];
  }

  // Run linter
  runLinter() {
    console.log('🔍 Running ESLint...\n');

    try {
      execSync('npm run lint', {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        encoding: 'utf-8',
      });

      this.results.linting.status = 'passed';
      this.results.linting.errors = 0;
      this.results.linting.warnings = 0;
      console.log('✅ No linting errors found\n');
    } catch (error) {
      const output = error.stdout || error.stderr || '';

      // Parse linting output
      const errorMatch = output.match(/(\d+)\s+error/);
      const warningMatch = output.match(/(\d+)\s+warning/);

      const errors = errorMatch ? parseInt(errorMatch[1]) : 0;
      const warnings = warningMatch ? parseInt(warningMatch[1]) : 0;

      this.results.linting.status = errors > 0 ? 'failed' : 'passed';
      this.results.linting.errors = errors;
      this.results.linting.warnings = warnings;

      if (errors > 0) {
        console.log(`❌ Found ${errors} linting errors\n`);
        this.issues.push(`Linting: ${errors} errors found`);
      } else {
        console.log(`✅ No linting errors (${warnings} warnings)\n`);
      }
    }
  }

  // Check for broken imports
  checkImports() {
    console.log('🔗 Checking for broken imports...\n');

    const srcPath = path.join(__dirname, '..', 'src');
    const brokenImports = [];

    const checkFile = filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for import statements
        const importMatch = line.match(/import\s+.*\s+from\s+['"](.+)['"]/);
        if (importMatch) {
          const importPath = importMatch[1];

          // Skip node_modules imports
          if (!importPath.startsWith('.')) return;

          // Resolve the import path
          const dir = path.dirname(filePath);
          let resolvedPath = path.resolve(dir, importPath);

          // Try with .js extension if not present
          if (!fs.existsSync(resolvedPath)) {
            resolvedPath = resolvedPath + '.js';
          }

          if (!fs.existsSync(resolvedPath)) {
            brokenImports.push({
              file: path.relative(path.join(__dirname, '..'), filePath),
              line: index + 1,
              import: importPath,
            });
          }
        }
      });
    };

    const scanDirectory = dir => {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          scanDirectory(itemPath);
        } else if (item.isFile() && item.name.endsWith('.js')) {
          checkFile(itemPath);
        }
      }
    };

    scanDirectory(srcPath);

    this.results.imports.brokenCount = brokenImports.length;
    this.results.imports.broken = brokenImports;

    if (brokenImports.length > 0) {
      console.log(`❌ Found ${brokenImports.length} broken imports:\n`);
      brokenImports.forEach(item => {
        console.log(`  ${item.file}:${item.line} - ${item.import}`);
      });
      console.log('');
      this.issues.push(`Imports: ${brokenImports.length} broken imports`);
    } else {
      console.log('✅ No broken imports found\n');
    }
  }

  // Check for console statements in production code
  checkConsoleStatements() {
    console.log('🖥️  Checking for console statements...\n');

    const srcPath = path.join(__dirname, '..', 'src');
    const consoleStatements = [];

    const checkFile = filePath => {
      // Skip if it's a script file
      if (filePath.includes('scripts')) return;

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for console.log, console.info, console.debug
        if (
          /console\.(log|info|debug)/.test(line) &&
          !line.trim().startsWith('//')
        ) {
          consoleStatements.push({
            file: path.relative(path.join(__dirname, '..'), filePath),
            line: index + 1,
            code: line.trim(),
          });
        }
      });
    };

    const scanDirectory = dir => {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          scanDirectory(itemPath);
        } else if (item.isFile() && item.name.endsWith('.js')) {
          checkFile(itemPath);
        }
      }
    };

    scanDirectory(srcPath);

    this.results.consoleErrors.count = consoleStatements.length;
    this.results.consoleErrors.statements = consoleStatements;

    if (consoleStatements.length > 0) {
      console.log(
        `⚠️  Found ${consoleStatements.length} console statements in production code:\n`
      );
      consoleStatements.slice(0, 5).forEach(item => {
        console.log(`  ${item.file}:${item.line}`);
      });
      if (consoleStatements.length > 5) {
        console.log(`  ... and ${consoleStatements.length - 5} more`);
      }
      console.log('');
    } else {
      console.log('✅ No console statements in production code\n');
    }
  }

  // Check for TODO/FIXME comments
  checkTodoComments() {
    console.log('📝 Checking for TODO/FIXME comments...\n');

    const srcPath = path.join(__dirname, '..', 'src');
    const todos = [];

    const checkFile = filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (/TODO|FIXME/i.test(line)) {
          todos.push({
            file: path.relative(path.join(__dirname, '..'), filePath),
            line: index + 1,
            comment: line.trim(),
          });
        }
      });
    };

    const scanDirectory = dir => {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          scanDirectory(itemPath);
        } else if (item.isFile() && item.name.endsWith('.js')) {
          checkFile(itemPath);
        }
      }
    };

    scanDirectory(srcPath);

    this.results.diagnostics.todoCount = todos.length;
    this.results.diagnostics.todos = todos;

    if (todos.length > 0) {
      console.log(`ℹ️  Found ${todos.length} TODO/FIXME comments\n`);
    } else {
      console.log('✅ No TODO/FIXME comments found\n');
    }
  }

  // Verify build works
  verifyBuild() {
    console.log('🏗️  Verifying build process...\n');

    try {
      execSync('npm run build', {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        encoding: 'utf-8',
      });

      this.results.diagnostics.buildStatus = 'passed';
      console.log('✅ Build completed successfully\n');
    } catch {
      this.results.diagnostics.buildStatus = 'failed';
      console.log('❌ Build failed\n');
      this.issues.push('Build: Build process failed');
    }
  }

  // Generate summary
  generateSummary() {
    console.log('📊 Generating summary...\n');

    this.results.summary = {
      totalIssues: this.issues.length,
      lintingPassed: this.results.linting.status === 'passed',
      noBrokenImports: this.results.imports.brokenCount === 0,
      buildPassed: this.results.diagnostics.buildStatus === 'passed',
      overallStatus: this.issues.length === 0 ? 'PASSED' : 'FAILED',
    };

    console.log('='.repeat(60));
    console.log('📋 Code Quality Summary');
    console.log('='.repeat(60));
    console.log('');
    console.log(
      `Linting: ${this.results.linting.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}`
    );
    console.log(
      `  Errors: ${this.results.linting.errors || 0}, Warnings: ${this.results.linting.warnings || 0}`
    );
    console.log('');
    console.log(
      `Imports: ${this.results.imports.brokenCount === 0 ? '✅ PASSED' : '❌ FAILED'}`
    );
    console.log(`  Broken imports: ${this.results.imports.brokenCount || 0}`);
    console.log('');
    console.log(
      `Build: ${this.results.diagnostics.buildStatus === 'passed' ? '✅ PASSED' : '❌ FAILED'}`
    );
    console.log('');
    console.log(
      `Console Statements: ${this.results.consoleErrors.count || 0} found`
    );
    console.log(
      `TODO Comments: ${this.results.diagnostics.todoCount || 0} found`
    );
    console.log('');
    console.log('='.repeat(60));
    console.log(
      `Overall Status: ${this.results.summary.overallStatus === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}`
    );
    console.log('='.repeat(60));
    console.log('');

    if (this.issues.length > 0) {
      console.log('❌ Issues found:');
      this.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      console.log('');
    } else {
      console.log('✅ No critical issues found!\n');
    }
  }

  // Save results
  saveResults() {
    const reportPath = path.join(
      __dirname,
      '..',
      'CODE_QUALITY_VERIFICATION.json'
    );
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log('📄 Results saved to CODE_QUALITY_VERIFICATION.json\n');
  }

  // Run all verifications
  async verify() {
    console.log('🔍 Code Quality Verification\n');
    console.log('='.repeat(60));

    this.runLinter();
    this.checkImports();
    this.checkConsoleStatements();
    this.checkTodoComments();
    this.verifyBuild();
    this.generateSummary();
    this.saveResults();

    // Exit with error code if issues found
    if (this.issues.length > 0) {
      process.exit(1);
    }
  }
}

// Run the verifier
const verifier = new CodeQualityVerifier();
verifier.verify().catch(console.error);
