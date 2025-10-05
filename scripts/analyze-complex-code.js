import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ComplexityAnalyzer {
  constructor() {
    this.results = {
      longFunctions: [],
      complexFunctions: [],
      magicNumbers: [],
      magicStrings: [],
      nestedConditionals: [],
    };
  }

  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    this.findLongFunctions(filePath, content, lines);
    this.findComplexConditionals(filePath, content, lines);
    this.findMagicValues(filePath, content, lines);
  }

  findLongFunctions(filePath, content, lines) {
    // Match function declarations and expressions
    const functionRegex =
      /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))\s*\([^)]*\)\s*{/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1] || match[2];
      const startPos = match.index;
      const startLine = content.substring(0, startPos).split('\n').length;

      // Find matching closing brace
      const endLine = this.findFunctionEnd(content, startPos, lines);
      const lineCount = endLine - startLine + 1;

      if (lineCount > 50) {
        this.results.longFunctions.push({
          file: filePath,
          function: functionName,
          startLine,
          endLine,
          lineCount,
          severity:
            lineCount > 100 ? 'high' : lineCount > 75 ? 'medium' : 'low',
        });
      }

      // Check cyclomatic complexity
      const functionBody = lines.slice(startLine - 1, endLine).join('\n');
      const complexity = this.calculateComplexity(functionBody);

      if (complexity > 10) {
        this.results.complexFunctions.push({
          file: filePath,
          function: functionName,
          startLine,
          endLine,
          complexity,
          severity:
            complexity > 20 ? 'high' : complexity > 15 ? 'medium' : 'low',
        });
      }
    }
  }

  findFunctionEnd(content, startPos, _lines) {
    let braceCount = 0;
    let inFunction = false;
    let currentLine = content.substring(0, startPos).split('\n').length;

    for (let i = startPos; i < content.length; i++) {
      const char = content[i];

      if (char === '{') {
        braceCount++;
        inFunction = true;
      } else if (char === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          return content.substring(0, i).split('\n').length;
        }
      } else if (char === '\n') {
        currentLine++;
      }
    }

    return currentLine;
  }

  calculateComplexity(code) {
    let complexity = 1; // Base complexity

    // Count decision points
    const patterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g,
    ];

    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  findComplexConditionals(filePath, content, _lines) {
    _lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Find nested if statements (3+ levels)
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1].length : 0;

      if (trimmed.startsWith('if') && indent >= 12) {
        // 3+ levels of nesting
        this.results.nestedConditionals.push({
          file: filePath,
          line: index + 1,
          code: trimmed,
          indentLevel: Math.floor(indent / 4),
          severity: indent >= 20 ? 'high' : 'medium',
        });
      }

      // Find complex boolean expressions
      const andCount = (line.match(/&&/g) || []).length;
      const orCount = (line.match(/\|\|/g) || []).length;

      if (andCount + orCount >= 3) {
        this.results.nestedConditionals.push({
          file: filePath,
          line: index + 1,
          code: trimmed,
          reason: 'Complex boolean expression',
          operators: andCount + orCount,
          severity: andCount + orCount >= 5 ? 'high' : 'medium',
        });
      }
    });
  }

  findMagicValues(filePath, content, lines) {
    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Skip comments and imports
      if (
        trimmed.startsWith('//') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('import') ||
        trimmed.startsWith('*')
      ) {
        return;
      }

      // Find magic numbers (excluding common values like 0, 1, -1, 100)
      const numberRegex = /(?<![a-zA-Z0-9_])(\d{2,}|\d+\.\d+)(?![a-zA-Z0-9_])/g;
      let numberMatch;

      while ((numberMatch = numberRegex.exec(line)) !== null) {
        const number = numberMatch[1];

        // Skip common values
        if (['0', '1', '-1', '100', '10', '2'].includes(number)) {
          continue;
        }

        // Skip if it's part of a constant definition
        if (
          line.includes('const') &&
          line.includes('=') &&
          line.indexOf('const') < numberMatch.index
        ) {
          continue;
        }

        this.results.magicNumbers.push({
          file: filePath,
          line: index + 1,
          value: number,
          code: trimmed,
          severity: 'low',
        });
      }

      // Find magic strings (excluding empty strings and single chars)
      const stringRegex = /(['"`])(?:(?=(\\?))\2.){3,}\1/g;
      let stringMatch;

      while ((stringMatch = stringRegex.exec(line)) !== null) {
        const string = stringMatch[0];

        // Skip if it's part of a constant definition
        if (
          line.includes('const') &&
          line.includes('=') &&
          line.indexOf('const') < stringMatch.index
        ) {
          continue;
        }

        // Skip URLs, paths, and common patterns
        if (
          string.includes('http') ||
          string.includes('/') ||
          string.includes('\\') ||
          string.length < 5
        ) {
          continue;
        }

        this.results.magicStrings.push({
          file: filePath,
          line: index + 1,
          value: string,
          code: trimmed,
          severity: 'low',
        });
      }
    });
  }

  async analyzeDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (
          !entry.name.startsWith('.') &&
          entry.name !== 'node_modules' &&
          entry.name !== 'dist'
        ) {
          await this.analyzeDirectory(fullPath);
        }
      } else if (entry.name.endsWith('.js')) {
        this.analyzeFile(fullPath);
      }
    }
  }

  generateReport() {
    const report = {
      summary: {
        longFunctions: this.results.longFunctions.length,
        complexFunctions: this.results.complexFunctions.length,
        nestedConditionals: this.results.nestedConditionals.length,
        magicNumbers: this.results.magicNumbers.length,
        magicStrings: this.results.magicStrings.length,
        totalIssues:
          this.results.longFunctions.length +
          this.results.complexFunctions.length +
          this.results.nestedConditionals.length +
          this.results.magicNumbers.length +
          this.results.magicStrings.length,
      },
      details: this.results,
    };

    return report;
  }

  generateMarkdownReport() {
    let md = '# Code Complexity Analysis Report\n\n';
    md += `Generated: ${new Date().toISOString()}\n\n`;

    md += '## Summary\n\n';
    md += `- **Long Functions (>50 lines)**: ${this.results.longFunctions.length}\n`;
    md += `- **Complex Functions (complexity >10)**: ${this.results.complexFunctions.length}\n`;
    md += `- **Nested Conditionals**: ${this.results.nestedConditionals.length}\n`;
    md += `- **Magic Numbers**: ${this.results.magicNumbers.length}\n`;
    md += `- **Magic Strings**: ${this.results.magicStrings.length}\n\n`;

    // Long Functions
    if (this.results.longFunctions.length > 0) {
      md += '## Long Functions (>50 lines)\n\n';
      md +=
        'Functions that exceed 50 lines should be broken down into smaller, focused functions.\n\n';

      const sorted = [...this.results.longFunctions].sort(
        (a, b) => b.lineCount - a.lineCount
      );
      sorted.forEach(item => {
        md += `### ${item.function} - ${item.lineCount} lines [${item.severity.toUpperCase()}]\n`;
        md += `- **File**: \`${item.file}\`\n`;
        md += `- **Lines**: ${item.startLine}-${item.endLine}\n`;
        md += `- **Recommendation**: Break down into smaller helper functions\n\n`;
      });
    }

    // Complex Functions
    if (this.results.complexFunctions.length > 0) {
      md += '## Complex Functions (Cyclomatic Complexity >10)\n\n';
      md +=
        'Functions with high cyclomatic complexity are harder to test and maintain.\n\n';

      const sorted = [...this.results.complexFunctions].sort(
        (a, b) => b.complexity - a.complexity
      );
      sorted.forEach(item => {
        md += `### ${item.function} - Complexity: ${item.complexity} [${item.severity.toUpperCase()}]\n`;
        md += `- **File**: \`${item.file}\`\n`;
        md += `- **Lines**: ${item.startLine}-${item.endLine}\n`;
        md += `- **Recommendation**: Simplify conditional logic, extract helper functions\n\n`;
      });
    }

    // Nested Conditionals
    if (this.results.nestedConditionals.length > 0) {
      md += '## Nested Conditionals\n\n';
      md +=
        'Deep nesting and complex boolean expressions reduce readability.\n\n';

      const grouped = {};
      this.results.nestedConditionals.forEach(item => {
        if (!grouped[item.file]) grouped[item.file] = [];
        grouped[item.file].push(item);
      });

      Object.entries(grouped).forEach(([file, items]) => {
        md += `### ${file}\n\n`;
        items.slice(0, 5).forEach(item => {
          md += `- **Line ${item.line}** [${item.severity.toUpperCase()}]: ${item.code.substring(0, 80)}...\n`;
          if (item.reason) md += `  - ${item.reason}\n`;
        });
        if (items.length > 5) {
          md += `- ... and ${items.length - 5} more\n`;
        }
        md += '\n';
      });
    }

    // Magic Numbers
    if (this.results.magicNumbers.length > 0) {
      md += '## Magic Numbers\n\n';
      md += 'Hardcoded numbers should be extracted into named constants.\n\n';

      const grouped = {};
      this.results.magicNumbers.forEach(item => {
        if (!grouped[item.file]) grouped[item.file] = [];
        grouped[item.file].push(item);
      });

      Object.entries(grouped).forEach(([file, items]) => {
        md += `### ${file}\n\n`;
        const unique = [...new Set(items.map(i => i.value))];
        unique.slice(0, 10).forEach(value => {
          const occurrences = items.filter(i => i.value === value);
          md += `- **${value}** - ${occurrences.length} occurrence(s)\n`;
        });
        if (unique.length > 10) {
          md += `- ... and ${unique.length - 10} more unique values\n`;
        }
        md += '\n';
      });
    }

    // Magic Strings
    if (this.results.magicStrings.length > 0) {
      md += '## Magic Strings\n\n';
      md += 'Hardcoded strings should be extracted into named constants.\n\n';

      const grouped = {};
      this.results.magicStrings.forEach(item => {
        if (!grouped[item.file]) grouped[item.file] = [];
        grouped[item.file].push(item);
      });

      Object.entries(grouped).forEach(([file, items]) => {
        md += `### ${file}\n\n`;
        items.slice(0, 5).forEach(item => {
          md += `- **Line ${item.line}**: ${item.value.substring(0, 50)}...\n`;
        });
        if (items.length > 5) {
          md += `- ... and ${items.length - 5} more\n`;
        }
        md += '\n';
      });
    }

    md += '## Recommendations\n\n';
    md +=
      '1. **Long Functions**: Break down into smaller, single-purpose functions\n';
    md +=
      '2. **Complex Functions**: Simplify conditional logic, use early returns\n';
    md +=
      '3. **Nested Conditionals**: Replace with guard clauses, extract to named functions\n';
    md +=
      '4. **Magic Values**: Extract into named constants at the top of files\n';

    return md;
  }
}

// Main execution
async function main() {
  console.log('Analyzing code complexity...\n');

  const analyzer = new ComplexityAnalyzer();
  const srcDir = path.join(__dirname, '..', 'src');

  await analyzer.analyzeDirectory(srcDir);

  const report = analyzer.generateReport();
  const markdown = analyzer.generateMarkdownReport();

  // Save JSON report
  const jsonPath = path.join(__dirname, '..', 'COMPLEXITY_ANALYSIS.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`✓ JSON report saved to ${jsonPath}`);

  // Save Markdown report
  const mdPath = path.join(
    __dirname,
    '..',
    '.kiro',
    'specs',
    'code-cleanup-refactor',
    'COMPLEXITY_ANALYSIS.md'
  );
  fs.writeFileSync(mdPath, markdown);
  console.log(`✓ Markdown report saved to ${mdPath}`);

  console.log('\n=== Summary ===');
  console.log(`Long Functions: ${report.summary.longFunctions}`);
  console.log(`Complex Functions: ${report.summary.complexFunctions}`);
  console.log(`Nested Conditionals: ${report.summary.nestedConditionals}`);
  console.log(`Magic Numbers: ${report.summary.magicNumbers}`);
  console.log(`Magic Strings: ${report.summary.magicStrings}`);
  console.log(`Total Issues: ${report.summary.totalIssues}`);
}

main().catch(console.error);
