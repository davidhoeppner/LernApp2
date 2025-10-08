// @ts-nocheck
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UnusedImportRemover {
  constructor() {
    this.results = {
      filesScanned: 0,
      filesModified: 0,
      importsRemoved: 0,
      details: [],
    };
  }

  async scanDirectory(dir, baseDir = dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (
          !entry.name.startsWith('.') &&
          entry.name !== 'node_modules' &&
          entry.name !== 'dist'
        ) {
          await this.scanDirectory(fullPath, baseDir);
        }
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        await this.processFile(fullPath, baseDir);
      }
    }
  }

  async processFile(filePath, baseDir) {
    this.results.filesScanned++;
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const imports = this.extractImports(lines);
    const unusedImports = this.findUnusedImports(imports, content);

    if (unusedImports.length > 0) {
      const newContent = this.removeUnusedImports(content, unusedImports);
      fs.writeFileSync(filePath, newContent, 'utf-8');

      this.results.filesModified++;
      this.results.importsRemoved += unusedImports.length;

      const relativePath = path.relative(baseDir, filePath);
      this.results.details.push({
        file: relativePath,
        removed: unusedImports,
      });

      console.log(
        `✓ ${relativePath}: Removed ${unusedImports.length} unused import(s)`
      );
    }
  }

  extractImports(lines) {
    const imports = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Match: import X from 'Y'
      const defaultImport = line.match(/^import\s+(\w+)\s+from\s+['"](.+)['"]/);
      if (defaultImport) {
        imports.push({
          line: i,
          fullLine: lines[i],
          type: 'default',
          name: defaultImport[1],
          source: defaultImport[2],
        });
        continue;
      }

      // Match: import { X, Y } from 'Z'
      const namedImport = line.match(
        /^import\s+\{([^}]+)\}\s+from\s+['"](.+)['"]/
      );
      if (namedImport) {
        const names = namedImport[1]
          .split(',')
          .map(n => n.trim().split(' as ')[0].trim());
        imports.push({
          line: i,
          fullLine: lines[i],
          type: 'named',
          names: names,
          source: namedImport[2],
        });
        continue;
      }

      // Match: import * as X from 'Y'
      const namespaceImport = line.match(
        /^import\s+\*\s+as\s+(\w+)\s+from\s+['"](.+)['"]/
      );
      if (namespaceImport) {
        imports.push({
          line: i,
          fullLine: lines[i],
          type: 'namespace',
          name: namespaceImport[1],
          source: namespaceImport[2],
        });
      }
    }

    return imports;
  }

  findUnusedImports(imports, content) {
    const unused = [];

    // Remove import statements from content for checking usage
    const contentWithoutImports = content
      .split('\n')
      .filter((line, i) => !imports.some(imp => imp.line === i))
      .join('\n');

    for (const imp of imports) {
      if (imp.type === 'default' || imp.type === 'namespace') {
        // Check if the imported name is used in the code
        const nameRegex = new RegExp(`\\b${imp.name}\\b`);
        if (!nameRegex.test(contentWithoutImports)) {
          unused.push(imp);
        }
      } else if (imp.type === 'named') {
        // Check each named import
        const unusedNames = imp.names.filter(name => {
          const nameRegex = new RegExp(`\\b${name}\\b`);
          return !nameRegex.test(contentWithoutImports);
        });

        if (unusedNames.length === imp.names.length) {
          // All names are unused, remove entire import
          unused.push(imp);
        } else if (unusedNames.length > 0) {
          // Some names are unused, mark for partial removal
          unused.push({
            ...imp,
            partialRemoval: true,
            unusedNames: unusedNames,
          });
        }
      }
    }

    return unused;
  }

  removeUnusedImports(content, unusedImports) {
    const lines = content.split('\n');

    for (const imp of unusedImports) {
      if (imp.partialRemoval) {
        // Remove only unused names from named import
        const usedNames = imp.names.filter(n => !imp.unusedNames.includes(n));
        const newImport = `import { ${usedNames.join(', ')} } from '${imp.source}';`;
        lines[imp.line] = lines[imp.line].replace(
          /^(\s*).*$/,
          `$1${newImport}`
        );
      } else {
        // Remove entire import line
        lines[imp.line] = '';
      }
    }

    // Remove consecutive empty lines in import section
    let result = [];
    let emptyCount = 0;
    let inImportSection = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed === '' && inImportSection) {
        emptyCount++;
        if (emptyCount <= 1) {
          result.push(line);
        }
      } else {
        emptyCount = 0;
        result.push(line);

        // Exit import section after first non-import, non-empty line
        if (trimmed !== '' && !trimmed.startsWith('import ')) {
          inImportSection = false;
        }
      }
    }

    return result.join('\n');
  }

  generateReport() {
    const report = {
      summary: {
        filesScanned: this.results.filesScanned,
        filesModified: this.results.filesModified,
        importsRemoved: this.results.importsRemoved,
      },
      details: this.results.details,
    };

    const reportPath = path.join(
      __dirname,
      '..',
      'UNUSED_IMPORTS_REMOVED.json'
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n=== Unused Import Removal Summary ===');
    console.log(`Files scanned: ${report.summary.filesScanned}`);
    console.log(`Files modified: ${report.summary.filesModified}`);
    console.log(`Imports removed: ${report.summary.importsRemoved}`);
    console.log(`\nDetailed report saved to: UNUSED_IMPORTS_REMOVED.json`);
  }
}

// Run the analyzer
const remover = new UnusedImportRemover();
const srcDir = path.join(__dirname, '..', 'src');

console.log('Scanning for unused imports...\n');
await remover.scanDirectory(srcDir);
remover.generateReport();
