// @ts-nocheck
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { formatBytes } from '../src/utils/formatUtils.js';

const __filename = fileURLToPath(import.meta.url);
const process.cwd() = path.dirname(__filename);

class PerformanceAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      bundleSize: {},
      fileCount: {},
      codeMetrics: {},
      comparison: {},
    };
  }

  // Get directory size recursively
  getDirectorySize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;

    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        const subResult = this.getDirectorySize(itemPath);
        totalSize += subResult.size;
        fileCount += subResult.count;
      } else if (item.isFile()) {
        const stats = fs.statSync(itemPath);
        totalSize += stats.size;
        fileCount++;
      }
    }

    return { size: totalSize, count: fileCount };
  }

  // Measure bundle size
  measureBundleSize() {
    console.log('📦 Measuring bundle size...\n');

    const distPath = path.join(process.cwd(), '..', 'dist');

    if (!fs.existsSync(distPath)) {
      console.log('⚠️  Dist folder not found. Run "npm run build" first.');
      return;
    }

    const distResult = this.getDirectorySize(distPath);
    this.results.bundleSize.total = distResult.size;
    this.results.bundleSize.totalFormatted = formatBytes(distResult.size);
    this.results.bundleSize.fileCount = distResult.count;

    // Measure individual asset sizes
    const assetsPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      const assets = fs.readdirSync(assetsPath);
      this.results.bundleSize.assets = {};

      for (const asset of assets) {
        const assetPath = path.join(assetsPath, asset);
        const stats = fs.statSync(assetPath);
        this.results.bundleSize.assets[asset] = {
          size: stats.size,
          formatted: formatBytes(stats.size),
        };
      }
    }

    console.log(`Total Bundle Size: ${this.results.bundleSize.totalFormatted}`);
    console.log(`Total Files: ${this.results.bundleSize.fileCount}`);
    console.log('');
  }

  // Count source files
  countSourceFiles() {
    console.log('📁 Counting source files...\n');

    const srcPath = path.join(process.cwd(), '..', 'src');
    const srcResult = this.getDirectorySize(srcPath);

    this.results.fileCount.source = {
      total: srcResult.count,
      size: srcResult.size,
      sizeFormatted: formatBytes(srcResult.size),
    };

    // Count by type
    const countByType = (dir, extensions) => {
      let count = 0;
      let size = 0;

      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          const subResult = countByType(itemPath, extensions);
          count += subResult.count;
          size += subResult.size;
        } else if (item.isFile()) {
          const ext = path.extname(item.name);
          if (extensions.includes(ext)) {
            count++;
            const stats = fs.statSync(itemPath);
            size += stats.size;
          }
        }
      }

      return { count, size };
    };

    const jsResult = countByType(srcPath, ['.js']);
    const cssResult = countByType(srcPath, ['.css']);
    const jsonResult = countByType(srcPath, ['.json']);

    this.results.fileCount.byType = {
      javascript: {
        count: jsResult.count,
        size: jsResult.size,
        sizeFormatted: formatBytes(jsResult.size),
      },
      css: {
        count: cssResult.count,
        size: cssResult.size,
        sizeFormatted: formatBytes(cssResult.size),
      },
      json: {
        count: jsonResult.count,
        size: jsonResult.size,
        sizeFormatted: formatBytes(jsonResult.size),
      },
    };

    console.log(`Total Source Files: ${this.results.fileCount.source.total}`);
    console.log(
      `Total Source Size: ${this.results.fileCount.source.sizeFormatted}`
    );
    console.log(
      `JavaScript Files: ${this.results.fileCount.byType.javascript.count} (${this.results.fileCount.byType.javascript.sizeFormatted})`
    );
    console.log(
      `CSS Files: ${this.results.fileCount.byType.css.count} (${this.results.fileCount.byType.css.sizeFormatted})`
    );
    console.log(
      `JSON Files: ${this.results.fileCount.byType.json.count} (${this.results.fileCount.byType.json.sizeFormatted})`
    );
    console.log('');
  }

  // Count lines of code
  countLinesOfCode() {
    console.log('📊 Counting lines of code...\n');

    const countLines = (dir, extensions) => {
      let totalLines = 0;
      let codeLines = 0;
      let commentLines = 0;
      let blankLines = 0;

      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          const subResult = countLines(itemPath, extensions);
          totalLines += subResult.totalLines;
          codeLines += subResult.codeLines;
          commentLines += subResult.commentLines;
          blankLines += subResult.blankLines;
        } else if (item.isFile()) {
          const ext = path.extname(item.name);
          if (extensions.includes(ext)) {
            const content = fs.readFileSync(itemPath, 'utf-8');
            const lines = content.split('\n');

            totalLines += lines.length;

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed === '') {
                blankLines++;
              } else if (
                trimmed.startsWith('//') ||
                trimmed.startsWith('/*') ||
                trimmed.startsWith('*')
              ) {
                commentLines++;
              } else {
                codeLines++;
              }
            }
          }
        }
      }

      return { totalLines, codeLines, commentLines, blankLines };
    };

    const srcPath = path.join(process.cwd(), '..', 'src');
    const jsResult = countLines(srcPath, ['.js']);

    this.results.codeMetrics.javascript = jsResult;

    console.log(`Total Lines: ${jsResult.totalLines}`);
    console.log(`Code Lines: ${jsResult.codeLines}`);
    console.log(`Comment Lines: ${jsResult.commentLines}`);
    console.log(`Blank Lines: ${jsResult.blankLines}`);
    console.log('');
  }

  // Load previous results for comparison
  loadPreviousResults() {
    const reportPath = path.join(process.cwd(), '..', 'PERFORMANCE_METRICS.json');

    if (fs.existsSync(reportPath)) {
      try {
        const content = fs.readFileSync(reportPath, 'utf-8');
        return JSON.parse(content);
      } catch {
        return null;
      }
    }

    return null;
  }

  // Compare with previous results
  compareResults() {
    const previous = this.loadPreviousResults();

    if (!previous) {
      console.log('ℹ️  No previous results found for comparison.\n');
      return;
    }

    console.log('📈 Comparing with previous results...\n');

    // Compare bundle size
    if (previous.bundleSize && this.results.bundleSize.total) {
      const diff = this.results.bundleSize.total - previous.bundleSize.total;
      const percentChange = ((diff / previous.bundleSize.total) * 100).toFixed(
        2
      );

      this.results.comparison.bundleSize = {
        previous: previous.bundleSize.totalFormatted,
        current: this.results.bundleSize.totalFormatted,
        difference: formatBytes(Math.abs(diff)),
        percentChange: percentChange + '%',
        improved: diff < 0,
      };

      console.log('Bundle Size:');
      console.log(`  Previous: ${previous.bundleSize.totalFormatted}`);
      console.log(`  Current: ${this.results.bundleSize.totalFormatted}`);
      console.log(
        `  Change: ${diff < 0 ? '↓' : '↑'} ${formatBytes(Math.abs(diff))} (${percentChange}%)`
      );
      console.log('');
    }

    // Compare file count
    if (previous.fileCount && this.results.fileCount.source) {
      const diff =
        this.results.fileCount.source.total - previous.fileCount.source.total;
      const percentChange = (
        (diff / previous.fileCount.source.total) *
        100
      ).toFixed(2);

      this.results.comparison.fileCount = {
        previous: previous.fileCount.source.total,
        current: this.results.fileCount.source.total,
        difference: Math.abs(diff),
        percentChange: percentChange + '%',
        improved: diff < 0,
      };

      console.log('Source Files:');
      console.log(`  Previous: ${previous.fileCount.source.total}`);
      console.log(`  Current: ${this.results.fileCount.source.total}`);
      console.log(
        `  Change: ${diff < 0 ? '↓' : '↑'} ${Math.abs(diff)} files (${percentChange}%)`
      );
      console.log('');
    }

    // Compare lines of code
    if (previous.codeMetrics && this.results.codeMetrics.javascript) {
      const diff =
        this.results.codeMetrics.javascript.totalLines -
        previous.codeMetrics.javascript.totalLines;
      const percentChange = (
        (diff / previous.codeMetrics.javascript.totalLines) *
        100
      ).toFixed(2);

      this.results.comparison.linesOfCode = {
        previous: previous.codeMetrics.javascript.totalLines,
        current: this.results.codeMetrics.javascript.totalLines,
        difference: Math.abs(diff),
        percentChange: percentChange + '%',
        improved: diff < 0,
      };

      console.log('Lines of Code:');
      console.log(`  Previous: ${previous.codeMetrics.javascript.totalLines}`);
      console.log(
        `  Current: ${this.results.codeMetrics.javascript.totalLines}`
      );
      console.log(
        `  Change: ${diff < 0 ? '↓' : '↑'} ${Math.abs(diff)} lines (${percentChange}%)`
      );
      console.log('');
    }
  }

  // Generate report
  generateReport() {
    const reportPath = path.join(process.cwd(), '..', 'PERFORMANCE_METRICS.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log('✅ Performance metrics saved to PERFORMANCE_METRICS.json\n');
  }

  // Run all analyses
  async analyze() {
    console.log('🔍 Performance Analysis\n');
    console.log('='.repeat(60));
    console.log('');

    this.measureBundleSize();
    this.countSourceFiles();
    this.countLinesOfCode();
    this.compareResults();
    this.generateReport();

    console.log('='.repeat(60));
  }
}

// Run the analyzer
const analyzer = new PerformanceAnalyzer();
analyzer.analyze().catch(console.error);
