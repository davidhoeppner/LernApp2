import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DuplicateCodeDetector {
  constructor() {
    this.files = [];
    this.codeBlocks = new Map();
    this.duplicates = [];
    this.minBlockSize = 5;
  }

  async analyzeProject() {
    const srcDir = path.join(__dirname, '..', 'src');
    await this.scanDirectory(srcDir);

    const exactDuplicates = this.findExactDuplicates();
    const structuralDuplicates = this.findStructuralDuplicates();
    const functionalDuplicates = this.findFunctionalDuplicates();

    return {
      exactDuplicates,
      structuralDuplicates,
      functionalDuplicates,
      totalFiles: this.files.length,
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
    const lines = content.split('\n');

    this.extractCodeBlocks(relativePath, lines);
  }

  extractCodeBlocks(filePath, lines) {
    let currentBlock = [];
    let blockStart = 0;
    let braceCount = 0;
    let inBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (
        !line ||
        line.startsWith('//') ||
        line.startsWith('/*') ||
        line.startsWith('*')
      ) {
        if (!inBlock) continue;
      }

      if (
        !inBlock &&
        (line.includes('function ') ||
          line.includes('class ') ||
          (line.includes('const ') && line.includes('=>')) ||
          (line.includes('let ') && line.includes('=>')))
      ) {
        inBlock = true;
        blockStart = i;
        currentBlock = [line];
        braceCount =
          (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      } else if (inBlock) {
        currentBlock.push(line);
        braceCount +=
          (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

        if (braceCount === 0 && currentBlock.length >= this.minBlockSize) {
          const blockCode = currentBlock.join('\n');
          const hash = this.hashCode(blockCode);

          if (!this.codeBlocks.has(hash)) {
            this.codeBlocks.set(hash, []);
          }

          this.codeBlocks.get(hash).push({
            file: filePath,
            startLine: blockStart + 1,
            endLine: i + 1,
            code: blockCode,
            lines: currentBlock.length,
          });

          inBlock = false;
          currentBlock = [];
        }
      }
    }
  }

  hashCode(code) {
    const normalized = code
      .replace(/\s+/g, ' ')
      .replace(/\/\/.*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  findExactDuplicates() {
    const duplicates = [];

    for (const [hash, blocks] of this.codeBlocks.entries()) {
      if (blocks.length > 1) {
        duplicates.push({
          type: 'exact',
          instances: blocks.length,
          locations: blocks,
          linesOfCode: blocks[0].lines,
          similarity: 100,
        });
      }
    }

    return duplicates.sort((a, b) => b.linesOfCode - a.linesOfCode);
  }

  findStructuralDuplicates() {
    const duplicates = [];
    const analyzed = new Set();

    const allBlocks = Array.from(this.codeBlocks.values()).flat();

    for (let i = 0; i < allBlocks.length; i++) {
      for (let j = i + 1; j < allBlocks.length; j++) {
        const key = `${i}-${j}`;
        if (analyzed.has(key)) continue;
        analyzed.add(key);

        const similarity = this.calculateStructuralSimilarity(
          allBlocks[i].code,
          allBlocks[j].code
        );

        if (similarity >= 70 && similarity < 100) {
          duplicates.push({
            type: 'structural',
            instances: 2,
            locations: [allBlocks[i], allBlocks[j]],
            linesOfCode: Math.max(allBlocks[i].lines, allBlocks[j].lines),
            similarity,
          });
        }
      }
    }

    return duplicates.sort((a, b) => b.similarity - a.similarity);
  }

  calculateStructuralSimilarity(code1, code2) {
    const normalize = code => {
      return code
        .replace(/\b[a-z][a-zA-Z0-9]*\b/g, 'VAR')
        .replace(/["'].*?["']/g, 'STR')
        .replace(/\d+/g, 'NUM')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const norm1 = normalize(code1);
    const norm2 = normalize(code2);

    const distance = this.levenshteinDistance(norm1, norm2);
    const maxLength = Math.max(norm1.length, norm2.length);

    return Math.round((1 - distance / maxLength) * 100);
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  findFunctionalDuplicates() {
    const duplicates = [];
    const allBlocks = Array.from(this.codeBlocks.values()).flat();

    const patterns = new Map();

    for (const block of allBlocks) {
      const pattern = this.extractPattern(block.code);

      if (!patterns.has(pattern)) {
        patterns.set(pattern, []);
      }

      patterns.get(pattern).push(block);
    }

    for (const [pattern, blocks] of patterns.entries()) {
      if (blocks.length > 1 && pattern !== 'unknown') {
        duplicates.push({
          type: 'functional',
          pattern,
          instances: blocks.length,
          locations: blocks,
          linesOfCode: blocks[0].lines,
          similarity: 85,
        });
      }
    }

    return duplicates.sort((a, b) => b.instances - a.instances);
  }

  extractPattern(code) {
    if (code.includes('fetch(') || code.includes('await')) {
      return 'async-data-fetching';
    }
    if (code.includes('addEventListener') || code.includes('onclick')) {
      return 'event-handling';
    }
    if (code.includes('createElement') || code.includes('innerHTML')) {
      return 'dom-manipulation';
    }
    if (code.includes('localStorage') || code.includes('sessionStorage')) {
      return 'storage-operations';
    }
    if (
      code.includes('map(') ||
      code.includes('filter(') ||
      code.includes('reduce(')
    ) {
      return 'array-operations';
    }
    if (code.includes('try') && code.includes('catch')) {
      return 'error-handling';
    }
    if (code.includes('validate') || code.includes('check')) {
      return 'validation';
    }

    return 'unknown';
  }
}

function generateReport(results) {
  const timestamp = new Date().toISOString();

  let report = `# Duplicate Code Analysis Report\n\n`;
  report += `Generated: ${timestamp}\n\n`;
  report += `## Executive Summary\n\n`;
  report += `- **Files Analyzed**: ${results.totalFiles}\n`;
  report += `- **Exact Duplicates**: ${results.exactDuplicates.length}\n`;
  report += `- **Structural Duplicates**: ${results.structuralDuplicates.length}\n`;
  report += `- **Functional Duplicates**: ${results.functionalDuplicates.length}\n\n`;

  const totalDuplicateLines = results.exactDuplicates.reduce(
    (sum, d) => sum + d.linesOfCode * (d.instances - 1),
    0
  );

  report += `- **Total Duplicate Lines**: ~${totalDuplicateLines}\n\n`;

  report += `## Duplication Types\n\n`;
  report += `### Exact Duplicates\n`;
  report += `Identical code blocks that appear multiple times.\n\n`;

  report += `### Structural Duplicates\n`;
  report += `Code blocks with similar structure but different variable names or values.\n\n`;

  report += `### Functional Duplicates\n`;
  report += `Code blocks that perform similar operations using similar patterns.\n\n`;

  report += `---\n\n`;

  if (results.exactDuplicates.length > 0) {
    report += `## 🔴 Exact Duplicates\n\n`;
    report += `These are identical code blocks that should be extracted into shared functions.\n\n`;

    results.exactDuplicates.forEach((dup, index) => {
      report += `### Duplicate ${index + 1}\n`;
      report += `- **Instances**: ${dup.instances}\n`;
      report += `- **Lines of Code**: ${dup.linesOfCode}\n`;
      report += `- **Similarity**: ${dup.similarity}%\n`;
      report += `- **Potential Savings**: ${dup.linesOfCode * (dup.instances - 1)} lines\n\n`;

      report += `**Locations:**\n`;
      dup.locations.forEach(loc => {
        report += `- \`${loc.file}\` (lines ${loc.startLine}-${loc.endLine})\n`;
      });
      report += `\n`;

      report += `**Refactoring Recommendation:**\n`;
      report += `Extract this code into a shared utility function or method.\n\n`;
      report += `---\n\n`;
    });
  }

  if (results.structuralDuplicates.length > 0) {
    report += `## 🟡 Structural Duplicates\n\n`;
    report += `These code blocks have similar structure and could be refactored.\n\n`;

    results.structuralDuplicates.slice(0, 10).forEach((dup, index) => {
      report += `### Structural Duplicate ${index + 1}\n`;
      report += `- **Similarity**: ${dup.similarity}%\n`;
      report += `- **Lines of Code**: ${dup.linesOfCode}\n\n`;

      report += `**Locations:**\n`;
      dup.locations.forEach(loc => {
        report += `- \`${loc.file}\` (lines ${loc.startLine}-${loc.endLine})\n`;
      });
      report += `\n`;

      report += `**Refactoring Recommendation:**\n`;
      report += `Consider parameterizing the differences and creating a shared function.\n\n`;
      report += `---\n\n`;
    });

    if (results.structuralDuplicates.length > 10) {
      report += `*... and ${results.structuralDuplicates.length - 10} more structural duplicates*\n\n`;
    }
  }

  if (results.functionalDuplicates.length > 0) {
    report += `## 🔵 Functional Duplicates\n\n`;
    report += `These code blocks perform similar operations and could share common utilities.\n\n`;

    results.functionalDuplicates.forEach((dup, index) => {
      report += `### ${dup.pattern.replace(/-/g, ' ').toUpperCase()}\n`;
      report += `- **Instances**: ${dup.instances}\n`;
      report += `- **Pattern**: ${dup.pattern}\n\n`;

      report += `**Locations:**\n`;
      dup.locations.slice(0, 5).forEach(loc => {
        report += `- \`${loc.file}\` (lines ${loc.startLine}-${loc.endLine})\n`;
      });

      if (dup.locations.length > 5) {
        report += `- *... and ${dup.locations.length - 5} more locations*\n`;
      }
      report += `\n`;

      report += `**Refactoring Recommendation:**\n`;
      report += `Create a shared utility module for ${dup.pattern} operations.\n\n`;
      report += `---\n\n`;
    });
  }

  report += `## Refactoring Opportunities\n\n`;

  if (results.exactDuplicates.length > 0) {
    report += `### High Priority\n`;
    report += `1. Extract exact duplicates into shared functions\n`;
    report += `2. Create utility modules for common patterns\n`;
    report += `3. Update all references to use shared code\n\n`;
  }

  if (results.structuralDuplicates.length > 0) {
    report += `### Medium Priority\n`;
    report += `1. Refactor structural duplicates with parameterization\n`;
    report += `2. Create base classes or mixins for similar components\n`;
    report += `3. Extract common logic into helper functions\n\n`;
  }

  if (results.functionalDuplicates.length > 0) {
    report += `### Low Priority\n`;
    report += `1. Create pattern-specific utility modules\n`;
    report += `2. Standardize common operations\n`;
    report += `3. Document best practices for each pattern\n\n`;
  }

  report += `## Estimated Impact\n\n`;
  report += `- **Lines Reduced**: ~${totalDuplicateLines} lines\n`;
  report += `- **Maintainability**: Improved (single source of truth)\n`;
  report += `- **Bug Risk**: Reduced (fix once, apply everywhere)\n`;
  report += `- **Code Clarity**: Improved (clear abstractions)\n\n`;

  report += `## Next Steps\n\n`;
  report += `1. Review exact duplicates and prioritize refactoring\n`;
  report += `2. Create shared utility modules\n`;
  report += `3. Refactor code to use shared utilities\n`;
  report += `4. Test thoroughly after each refactoring\n`;
  report += `5. Update documentation\n`;

  return report;
}

// Run analysis and generate report
console.log('🔍 Analyzing codebase for duplicate code...\n');

const detector = new DuplicateCodeDetector();
const results = await detector.analyzeProject();

console.log('📝 Generating report...\n');

const report = generateReport(results);
const reportPath = path.join(__dirname, '..', 'DUPLICATE_CODE_REPORT.md');
fs.writeFileSync(reportPath, report);

console.log('✅ Report generated successfully!');
console.log(`📄 Report saved to: DUPLICATE_CODE_REPORT.md\n`);

console.log('📊 Summary:');
console.log(`   - Files analyzed: ${results.totalFiles}`);
console.log(`   - Exact duplicates: ${results.exactDuplicates.length}`);
console.log(
  `   - Structural duplicates: ${results.structuralDuplicates.length}`
);
console.log(
  `   - Functional duplicates: ${results.functionalDuplicates.length}`
);
