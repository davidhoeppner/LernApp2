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
    this.minBlockSize = 5; // Minimum lines for a code block
  }

  async analyzeProject() {
    console.log('🔍 Starting duplicate code detection...\n');

    const srcDir = path.join(__dirname, '..', 'src');
    await this.scanDirectory(srcDir);

    // Find exact duplicates
    const exactDuplicates = this.findExactDuplicates();

    // Find structural duplicates
    const structuralDuplicates = this.findStructuralDuplicates();

    // Find functional duplicates (similar logic)
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

    // Extract code blocks (functions, classes, etc.)
    this.extractCodeBlocks(relativePath, lines);
  }

  extractCodeBlocks(filePath, lines) {
    let currentBlock = [];
    let blockStart = 0;
    let braceCount = 0;
    let inBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and comments
      if (
        !line ||
        line.startsWith('//') ||
        line.startsWith('/*') ||
        line.startsWith('*')
      ) {
        if (!inBlock) continue;
      }

      // Detect function/class start
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

        // Block complete
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
    // Normalize code before hashing
    const normalized = code
      .replace(/\s+/g, ' ')
      .replace(/\/\/.*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  findExactDuplicates() {
    const duplicates = [];

    for (const [, blocks] of this.codeBlocks.entries()) {
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
    // Normalize both code blocks
    const normalize = code => {
      return code
        .replace(/\b[a-z][a-zA-Z0-9]*\b/g, 'VAR') // Replace variable names
        .replace(/["'].*?["']/g, 'STR') // Replace strings
        .replace(/\d+/g, 'NUM') // Replace numbers
        .replace(/\s+/g, ' ')
        .trim();
    };

    const norm1 = normalize(code1);
    const norm2 = normalize(code2);

    // Calculate Levenshtein distance
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

    // Group by similar patterns
    const patterns = new Map();

    for (const block of allBlocks) {
      const pattern = this.extractPattern(block.code);

      if (!patterns.has(pattern)) {
        patterns.set(pattern, []);
      }

      patterns.get(pattern).push(block);
    }

    // Find groups with multiple instances
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
    // Identify common patterns
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

// Run detection
const detector = new DuplicateCodeDetector();
const results = await detector.analyzeProject();

console.log('✅ Duplicate code detection complete!\n');
console.log(`📊 Summary:`);
console.log(`   - Files analyzed: ${results.totalFiles}`);
console.log(`   - Exact duplicates: ${results.exactDuplicates.length}`);
console.log(
  `   - Structural duplicates: ${results.structuralDuplicates.length}`
);

// Export for report generation
export { detector, results };
