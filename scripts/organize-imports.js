import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImportOrganizer {
  constructor() {
    this.results = {
      filesScanned: 0,
      filesModified: 0,
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

    const { imports, firstNonImportLine } = this.extractImports(lines);

    if (imports.length === 0) {
      return; // No imports to organize
    }

    const organizedImports = this.organizeImports(imports);
    const originalImportBlock = this.getImportBlock(imports, lines);
    const newImportBlock = this.formatImports(organizedImports);

    if (originalImportBlock !== newImportBlock) {
      const newContent = this.replaceImports(
        lines,
        imports,
        organizedImports,
        firstNonImportLine
      );
      fs.writeFileSync(filePath, newContent, 'utf-8');

      this.results.filesModified++;
      const relativePath = path.relative(baseDir, filePath);
      this.results.details.push({
        file: relativePath,
        importCount: imports.length,
      });

      console.log(`✓ ${relativePath}: Organized ${imports.length} import(s)`);
    }
  }

  extractImports(lines) {
    const imports = [];
    let firstNonImportLine = 0;
    let inImportBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and comments at the start
      if (line === '' || line.startsWith('//') || line.startsWith('/*')) {
        if (!inImportBlock) continue;
      }

      if (line.startsWith('import ')) {
        inImportBlock = true;
        imports.push({
          line: i,
          fullLine: lines[i],
          trimmed: line,
        });
      } else if (inImportBlock && line !== '') {
        // Found first non-import line
        firstNonImportLine = i;
        break;
      }
    }

    return { imports, firstNonImportLine };
  }

  organizeImports(imports) {
    const categorized = {
      external: [],
      services: [],
      components: [],
      utils: [],
      data: [],
      styles: [],
      other: [],
    };

    for (const imp of imports) {
      const line = imp.trimmed;

      // Extract the source path
      const match = line.match(/from\s+['"](.+)['"]/);
      if (!match) {
        categorized.other.push(imp);
        continue;
      }

      const source = match[1];

      // Categorize based on source path
      if (!source.startsWith('.') && !source.startsWith('/')) {
        // External dependency (node_modules)
        categorized.external.push(imp);
      } else if (source.includes('/services/')) {
        categorized.services.push(imp);
      } else if (source.includes('/components/')) {
        categorized.components.push(imp);
      } else if (source.includes('/utils/')) {
        categorized.utils.push(imp);
      } else if (source.includes('/data/')) {
        categorized.data.push(imp);
      } else if (source.includes('.css') || source.includes('/styles/')) {
        categorized.styles.push(imp);
      } else {
        categorized.other.push(imp);
      }
    }

    // Sort each category alphabetically
    for (const category in categorized) {
      categorized[category].sort((a, b) => a.trimmed.localeCompare(b.trimmed));
    }

    return categorized;
  }

  getImportBlock(imports, lines) {
    if (imports.length === 0) return '';

    const firstLine = imports[0].line;
    const lastLine = imports[imports.length - 1].line;

    return lines.slice(firstLine, lastLine + 1).join('\n');
  }

  formatImports(categorized) {
    const sections = [];

    // Add each non-empty category with a blank line separator
    if (categorized.external.length > 0) {
      sections.push(categorized.external.map(imp => imp.trimmed).join('\n'));
    }

    if (categorized.services.length > 0) {
      sections.push(categorized.services.map(imp => imp.trimmed).join('\n'));
    }

    if (categorized.components.length > 0) {
      sections.push(categorized.components.map(imp => imp.trimmed).join('\n'));
    }

    if (categorized.utils.length > 0) {
      sections.push(categorized.utils.map(imp => imp.trimmed).join('\n'));
    }

    if (categorized.data.length > 0) {
      sections.push(categorized.data.map(imp => imp.trimmed).join('\n'));
    }

    if (categorized.styles.length > 0) {
      sections.push(categorized.styles.map(imp => imp.trimmed).join('\n'));
    }

    if (categorized.other.length > 0) {
      sections.push(categorized.other.map(imp => imp.trimmed).join('\n'));
    }

    return sections.join('\n\n');
  }

  replaceImports(
    lines,
    originalImports,
    organizedImports,
    _firstNonImportLine
  ) {
    if (originalImports.length === 0) return lines.join('\n');

    const firstImportLine = originalImports[0].line;
    const lastImportLine = originalImports[originalImports.length - 1].line;

    // Get content before imports
    const beforeImports = lines.slice(0, firstImportLine);

    // Get content after imports (skip empty lines immediately after imports)
    let afterImportsStart = lastImportLine + 1;
    while (
      afterImportsStart < lines.length &&
      lines[afterImportsStart].trim() === ''
    ) {
      afterImportsStart++;
    }
    const afterImports = lines.slice(afterImportsStart);

    // Build new content
    const newLines = [
      ...beforeImports,
      this.formatImports(organizedImports),
      '',
      ...afterImports,
    ];

    return newLines.join('\n');
  }

  generateReport() {
    const report = {
      summary: {
        filesScanned: this.results.filesScanned,
        filesModified: this.results.filesModified,
      },
      details: this.results.details,
    };

    const reportPath = path.join(__dirname, '..', 'IMPORTS_ORGANIZED.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n=== Import Organization Summary ===');
    console.log(`Files scanned: ${report.summary.filesScanned}`);
    console.log(`Files modified: ${report.summary.filesModified}`);
    console.log(`\nDetailed report saved to: IMPORTS_ORGANIZED.json`);
  }
}

// Run the organizer
const organizer = new ImportOrganizer();
const srcDir = path.join(__dirname, '..', 'src');

await organizer.scanDirectory(srcDir);
organizer.generateReport();
