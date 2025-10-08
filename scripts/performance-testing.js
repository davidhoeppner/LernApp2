// @ts-nocheck
/* eslint-env node */
/**
 * Performance Testing Script
 *
 * This script measures and documents performance improvements
 * after code cleanup and refactoring.
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const process.cwd() = dirname(__filename);
const projectRoot = join(process.cwd(), '..');

class PerformanceTester {
  constructor() {
    this.results = {
      bundleAnalysis: {},
      codeMetrics: {},
      loadTimeEstimates: {},
      memoryEstimates: {},
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Run all performance tests
   */
  async runAllTests() {
    console.log('🚀 Starting Performance Testing');
    console.log('===============================');

    try {
      await this.analyzeBundleSize();
      await this.analyzeCodeMetrics();
      await this.estimateLoadTimes();
      await this.analyzeMemoryUsage();
      await this.generatePerformanceReport();
    } catch (error) {
      console.error('❌ Performance testing failed:', error);
    }
  }

  /**
   * Analyze bundle size and composition
   */
  async analyzeBundleSize() {
    console.log('\n📦 Analyzing Bundle Size...');

    const bundleAnalysis = {
      totalSize: 0,
      fileCount: 0,
      breakdown: {
        javascript: { size: 0, count: 0 },
        css: { size: 0, count: 0 },
        json: { size: 0, count: 0 },
        images: { size: 0, count: 0 },
        other: { size: 0, count: 0 },
      },
    };

    // Analyze src directory
    await this.analyzeDirectory(join(projectRoot, 'src'), bundleAnalysis);

    // Analyze public directory
    await this.analyzeDirectory(join(projectRoot, 'public'), bundleAnalysis);

    this.results.bundleAnalysis = bundleAnalysis;

    console.log(`📊 Bundle Analysis Results:`);
    console.log(`   Total Size: ${this.formatBytes(bundleAnalysis.totalSize)}`);
    console.log(`   Total Files: ${bundleAnalysis.fileCount}`);
    console.log(
      `   JavaScript: ${this.formatBytes(bundleAnalysis.breakdown.javascript.size)} (${bundleAnalysis.breakdown.javascript.count} files)`
    );
    console.log(
      `   CSS: ${this.formatBytes(bundleAnalysis.breakdown.css.size)} (${bundleAnalysis.breakdown.css.count} files)`
    );
    console.log(
      `   JSON: ${this.formatBytes(bundleAnalysis.breakdown.json.size)} (${bundleAnalysis.breakdown.json.count} files)`
    );
    console.log(
      `   Images: ${this.formatBytes(bundleAnalysis.breakdown.images.size)} (${bundleAnalysis.breakdown.images.count} files)`
    );
    console.log(
      `   Other: ${this.formatBytes(bundleAnalysis.breakdown.other.size)} (${bundleAnalysis.breakdown.other.count} files)`
    );
  }

  /**
   * Analyze directory recursively
   */
  async analyzeDirectory(dirPath, analysis) {
    try {
      const entries = await readdir(dirPath);

      for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          // Skip node_modules and .git directories
          if (
            entry !== 'node_modules' &&
            entry !== '.git' &&
            !entry.startsWith('.')
          ) {
            await this.analyzeDirectory(fullPath, analysis);
          }
        } else if (stats.isFile()) {
          const ext = extname(entry).toLowerCase();
          const size = stats.size;

          analysis.totalSize += size;
          analysis.fileCount++;

          // Categorize by file type
          if (['.js', '.mjs', '.ts'].includes(ext)) {
            analysis.breakdown.javascript.size += size;
            analysis.breakdown.javascript.count++;
          } else if (['.css', '.scss', '.sass'].includes(ext)) {
            analysis.breakdown.css.size += size;
            analysis.breakdown.css.count++;
          } else if (['.json'].includes(ext)) {
            analysis.breakdown.json.size += size;
            analysis.breakdown.json.count++;
          } else if (
            ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)
          ) {
            analysis.breakdown.images.size += size;
            analysis.breakdown.images.count++;
          } else {
            analysis.breakdown.other.size += size;
            analysis.breakdown.other.count++;
          }
        }
      }
    } catch (error) {
      console.warn(
        `⚠️  Could not analyze directory ${dirPath}:`,
        error.message
      );
    }
  }

  /**
   * Analyze code metrics
   */
  async analyzeCodeMetrics() {
    console.log('\n📈 Analyzing Code Metrics...');

    const metrics = {
      totalLines: 0,
      codeLines: 0,
      commentLines: 0,
      blankLines: 0,
      fileCount: 0,
      averageLinesPerFile: 0,
      complexity: {
        functions: 0,
        classes: 0,
        imports: 0,
        exports: 0,
      },
    };

    await this.analyzeCodeInDirectory(join(projectRoot, 'src'), metrics);

    metrics.averageLinesPerFile =
      metrics.fileCount > 0
        ? Math.round(metrics.totalLines / metrics.fileCount)
        : 0;

    this.results.codeMetrics = metrics;

    console.log(`📊 Code Metrics Results:`);
    console.log(`   Total Lines: ${metrics.totalLines.toLocaleString()}`);
    console.log(`   Code Lines: ${metrics.codeLines.toLocaleString()}`);
    console.log(`   Comment Lines: ${metrics.commentLines.toLocaleString()}`);
    console.log(`   Blank Lines: ${metrics.blankLines.toLocaleString()}`);
    console.log(`   Files: ${metrics.fileCount}`);
    console.log(`   Avg Lines/File: ${metrics.averageLinesPerFile}`);
    console.log(`   Functions: ${metrics.complexity.functions}`);
    console.log(`   Classes: ${metrics.complexity.classes}`);
    console.log(`   Imports: ${metrics.complexity.imports}`);
    console.log(`   Exports: ${metrics.complexity.exports}`);
  }

  /**
   * Analyze code in directory
   */
  async analyzeCodeInDirectory(dirPath, metrics) {
    try {
      const entries = await readdir(dirPath);

      for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          await this.analyzeCodeInDirectory(fullPath, metrics);
        } else if (
          stats.isFile() &&
          ['.js', '.mjs', '.ts'].includes(extname(entry).toLowerCase())
        ) {
          await this.analyzeCodeFile(fullPath, metrics);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not analyze code in ${dirPath}:`, error.message);
    }
  }

  /**
   * Analyze individual code file
   */
  async analyzeCodeFile(filePath, metrics) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      metrics.fileCount++;
      metrics.totalLines += lines.length;

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === '') {
          metrics.blankLines++;
        } else if (
          trimmed.startsWith('//') ||
          trimmed.startsWith('/*') ||
          trimmed.startsWith('*')
        ) {
          metrics.commentLines++;
        } else {
          metrics.codeLines++;

          // Count complexity indicators
          if (trimmed.includes('function ') || trimmed.includes('=> ')) {
            metrics.complexity.functions++;
          }
          if (trimmed.includes('class ')) {
            metrics.complexity.classes++;
          }
          if (trimmed.startsWith('import ')) {
            metrics.complexity.imports++;
          }
          if (trimmed.startsWith('export ')) {
            metrics.complexity.exports++;
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not analyze file ${filePath}:`, error.message);
    }
  }

  /**
   * Estimate load times based on bundle size
   */
  async estimateLoadTimes() {
    console.log('\n⏱️  Estimating Load Times...');

    const bundleSize = this.results.bundleAnalysis.totalSize;

    // Network speed estimates (bytes per second)
    const networkSpeeds = {
      'Slow 3G': 50 * 1024, // 50 KB/s
      'Fast 3G': 150 * 1024, // 150 KB/s
      '4G': 1.5 * 1024 * 1024, // 1.5 MB/s
      WiFi: 5 * 1024 * 1024, // 5 MB/s
      'Fast WiFi': 25 * 1024 * 1024, // 25 MB/s
    };

    const loadTimes = {};

    for (const [network, speed] of Object.entries(networkSpeeds)) {
      const downloadTime = bundleSize / speed;
      const parseTime = bundleSize / (10 * 1024 * 1024); // Assume 10MB/s parse speed
      const totalTime = downloadTime + parseTime;

      loadTimes[network] = {
        download: Math.round(downloadTime * 1000) / 1000,
        parse: Math.round(parseTime * 1000) / 1000,
        total: Math.round(totalTime * 1000) / 1000,
      };
    }

    this.results.loadTimeEstimates = loadTimes;

    console.log(`📊 Load Time Estimates:`);
    for (const [network, times] of Object.entries(loadTimes)) {
      console.log(
        `   ${network}: ${times.total}s (${times.download}s download + ${times.parse}s parse)`
      );
    }
  }

  /**
   * Analyze estimated memory usage
   */
  async analyzeMemoryUsage() {
    console.log('\n🧠 Analyzing Memory Usage...');

    const bundleSize = this.results.bundleAnalysis.totalSize;
    const codeMetrics = this.results.codeMetrics;

    // Rough estimates based on bundle size and complexity
    const estimates = {
      initialLoad: Math.round(((bundleSize * 2.5) / 1024 / 1024) * 100) / 100, // ~2.5x bundle size in MB
      runtime: Math.round(
        codeMetrics.complexity.functions * 0.1 +
          codeMetrics.complexity.classes * 0.5
      ), // KB
      domNodes: Math.round(codeMetrics.codeLines * 0.01), // Estimated DOM nodes
      eventListeners: Math.round(codeMetrics.complexity.functions * 0.3), // Estimated event listeners
    };

    this.results.memoryEstimates = estimates;

    console.log(`📊 Memory Usage Estimates:`);
    console.log(`   Initial Load: ~${estimates.initialLoad} MB`);
    console.log(`   Runtime Overhead: ~${estimates.runtime} KB`);
    console.log(`   Estimated DOM Nodes: ~${estimates.domNodes}`);
    console.log(`   Estimated Event Listeners: ~${estimates.eventListeners}`);
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport() {
    console.log('\n📋 Generating Performance Report...');

    const report = {
      summary: this.generateSummary(),
      recommendations: this.generateRecommendations(),
      detailed: this.results,
    };

    // Write report to file
    const reportContent = this.formatReport(report);

    try {
      const { writeFile } = await import('fs/promises');
      await writeFile(
        join(projectRoot, 'PERFORMANCE_REPORT.md'),
        reportContent
      );
      console.log('✅ Performance report saved to PERFORMANCE_REPORT.md');
    } catch (error) {
      console.error('❌ Failed to save performance report:', error);
      console.log('\n📄 Performance Report:');
      console.log(reportContent);
    }
  }

  /**
   * Generate performance summary
   */
  generateSummary() {
    const bundle = this.results.bundleAnalysis;
    const code = this.results.codeMetrics;
    const load = this.results.loadTimeEstimates;

    return {
      bundleSize: this.formatBytes(bundle.totalSize),
      fileCount: bundle.fileCount,
      codeLines: code.codeLines.toLocaleString(),
      estimatedLoadTime4G: `${load['4G'].total}s`,
      estimatedLoadTimeWiFi: `${load['WiFi'].total}s`,
      memoryEstimate: `${this.results.memoryEstimates.initialLoad} MB`,
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const bundle = this.results.bundleAnalysis;
    const code = this.results.codeMetrics;
    const load = this.results.loadTimeEstimates;

    // Bundle size recommendations
    if (bundle.totalSize > 1024 * 1024) {
      // > 1MB
      recommendations.push({
        category: 'Bundle Size',
        priority: 'High',
        issue: 'Large bundle size detected',
        recommendation:
          'Consider code splitting and lazy loading for non-critical components',
      });
    }

    // Load time recommendations
    if (load['4G'].total > 3) {
      recommendations.push({
        category: 'Load Time',
        priority: 'High',
        issue: 'Slow load time on 4G networks',
        recommendation:
          'Optimize bundle size and implement progressive loading',
      });
    }

    // Code complexity recommendations
    if (code.averageLinesPerFile > 200) {
      recommendations.push({
        category: 'Code Quality',
        priority: 'Medium',
        issue: 'Large average file size',
        recommendation:
          'Consider breaking down large files into smaller, focused modules',
      });
    }

    // Image optimization
    if (bundle.breakdown.images.size > 500 * 1024) {
      // > 500KB
      recommendations.push({
        category: 'Assets',
        priority: 'Medium',
        issue: 'Large image assets',
        recommendation:
          'Optimize images with compression and modern formats (WebP, AVIF)',
      });
    }

    // If no issues found
    if (recommendations.length === 0) {
      recommendations.push({
        category: 'Overall',
        priority: 'Info',
        issue: 'No major performance issues detected',
        recommendation:
          'Continue monitoring performance as the application grows',
      });
    }

    return recommendations;
  }

  /**
   * Format performance report
   */
  formatReport(report) {
    return `# Performance Testing Report

Generated: ${new Date().toISOString()}

## Executive Summary

| Metric | Value |
|--------|-------|
| Bundle Size | ${report.summary.bundleSize} |
| File Count | ${report.summary.fileCount} |
| Code Lines | ${report.summary.codeLines} |
| Load Time (4G) | ${report.summary.estimatedLoadTime4G} |
| Load Time (WiFi) | ${report.summary.estimatedLoadTimeWiFi} |
| Memory Estimate | ${report.summary.memoryEstimate} |

## Bundle Analysis

### Size Breakdown
- **JavaScript**: ${this.formatBytes(report.detailed.bundleAnalysis.breakdown.javascript.size)} (${report.detailed.bundleAnalysis.breakdown.javascript.count} files)
- **CSS**: ${this.formatBytes(report.detailed.bundleAnalysis.breakdown.css.size)} (${report.detailed.bundleAnalysis.breakdown.css.count} files)
- **JSON**: ${this.formatBytes(report.detailed.bundleAnalysis.breakdown.json.size)} (${report.detailed.bundleAnalysis.breakdown.json.count} files)
- **Images**: ${this.formatBytes(report.detailed.bundleAnalysis.breakdown.images.size)} (${report.detailed.bundleAnalysis.breakdown.images.count} files)
- **Other**: ${this.formatBytes(report.detailed.bundleAnalysis.breakdown.other.size)} (${report.detailed.bundleAnalysis.breakdown.other.count} files)

**Total**: ${this.formatBytes(report.detailed.bundleAnalysis.totalSize)} (${report.detailed.bundleAnalysis.fileCount} files)

## Code Metrics

| Metric | Value |
|--------|-------|
| Total Lines | ${report.detailed.codeMetrics.totalLines.toLocaleString()} |
| Code Lines | ${report.detailed.codeMetrics.codeLines.toLocaleString()} |
| Comment Lines | ${report.detailed.codeMetrics.commentLines.toLocaleString()} |
| Blank Lines | ${report.detailed.codeMetrics.blankLines.toLocaleString()} |
| Average Lines per File | ${report.detailed.codeMetrics.averageLinesPerFile} |
| Functions | ${report.detailed.codeMetrics.complexity.functions} |
| Classes | ${report.detailed.codeMetrics.complexity.classes} |
| Imports | ${report.detailed.codeMetrics.complexity.imports} |
| Exports | ${report.detailed.codeMetrics.complexity.exports} |

## Load Time Estimates

| Network | Download | Parse | Total |
|---------|----------|-------|-------|
${Object.entries(report.detailed.loadTimeEstimates)
  .map(
    ([network, times]) =>
      `| ${network} | ${times.download}s | ${times.parse}s | **${times.total}s** |`
  )
  .join('\n')}

## Memory Usage Estimates

| Metric | Estimate |
|--------|----------|
| Initial Load | ~${report.detailed.memoryEstimates.initialLoad} MB |
| Runtime Overhead | ~${report.detailed.memoryEstimates.runtime} KB |
| DOM Nodes | ~${report.detailed.memoryEstimates.domNodes} |
| Event Listeners | ~${report.detailed.memoryEstimates.eventListeners} |

## Recommendations

${report.recommendations
  .map(
    rec => `
### ${rec.category} - ${rec.priority} Priority

**Issue**: ${rec.issue}

**Recommendation**: ${rec.recommendation}
`
  )
  .join('\n')}

## Performance Benchmarks

### Acceptable Performance Targets
- **Bundle Size**: < 1MB for initial load
- **Load Time (4G)**: < 3 seconds
- **Load Time (WiFi)**: < 1 second
- **Memory Usage**: < 50MB initial load
- **Code Lines per File**: < 200 average

### Current Status
${this.generateStatusIndicators(report)}

## Next Steps

1. **Monitor Performance**: Set up continuous performance monitoring
2. **Optimize Critical Path**: Focus on optimizing the most impactful areas
3. **Implement Lazy Loading**: Consider lazy loading for non-critical components
4. **Regular Audits**: Perform regular performance audits as the codebase grows
5. **User Testing**: Validate performance improvements with real user testing

---

*This report was generated automatically by the performance testing script.*
`;
  }

  /**
   * Generate status indicators
   */
  generateStatusIndicators(report) {
    const indicators = [];
    const bundle = report.detailed.bundleAnalysis;
    const load = report.detailed.loadTimeEstimates;
    const memory = report.detailed.memoryEstimates;
    const code = report.detailed.codeMetrics;

    // Bundle size status
    if (bundle.totalSize < 1024 * 1024) {
      indicators.push('✅ Bundle Size: Good');
    } else {
      indicators.push('⚠️ Bundle Size: Needs Optimization');
    }

    // Load time status
    if (load['4G'].total < 3) {
      indicators.push('✅ Load Time (4G): Good');
    } else {
      indicators.push('⚠️ Load Time (4G): Needs Optimization');
    }

    // Memory status
    if (memory.initialLoad < 50) {
      indicators.push('✅ Memory Usage: Good');
    } else {
      indicators.push('⚠️ Memory Usage: Monitor Closely');
    }

    // Code quality status
    if (code.averageLinesPerFile < 200) {
      indicators.push('✅ Code Quality: Good');
    } else {
      indicators.push('⚠️ Code Quality: Consider Refactoring');
    }

    return indicators.join('\n');
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run performance testing
const tester = new PerformanceTester();
tester.runAllTests().catch(console.error);

export default PerformanceTester;
