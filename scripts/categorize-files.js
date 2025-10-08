// @ts-nocheck
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const process.cwd() = path.dirname(__filename);
const rootDir = path.resolve(process.cwd(), '..');

// Define KEEP list (essential docs)
const KEEP_PATTERNS = [
  'README.md',
  'LICENSE',
  'DEPLOYMENT.md',
  '.deployment-checklist.md',
  'ERROR_HANDLING_GUIDE.md',
  /^ACCESSIBILITY_.*\.md$/,
  /^RESPONSIVE_.*\.md$/,
  'package.json',
  'package-lock.json',
  '.gitignore',
  '.editorconfig',
  '.prettierrc',
  '.prettierignore',
  'eslint.config.js',
  'vite.config.js',
  'index.html',
  'netlify.toml',
  'vercel.json',
  // Spec files (both in .kiro/specs and root)
  /^\.kiro\/specs\/.*\/(requirements|design|tasks)\.md$/,
  'requirements.md',
  'design.md',
  'tasks.md',
];

// Define REMOVE list (temporary/redundant docs)
const REMOVE_PATTERNS = [
  // Task summaries
  /^TASK_.*_SUMMARY\.md$/,
  /^TASK_.*_COMPLETE\.md$/,
  /^\.kiro\/specs\/.*\/TASK_.*\.md$/,

  // Fix documentation
  /.*_FIXED\.md$/,
  /.*_FIX\.md$/,
  /^FINAL_.*\.md$/,
  'BUILD_FIXED.md',
  'JSON_LOADING_FIXED.md',
  'MODULE_LOADING_FIXED.md',
  'MODULE_DETAIL_FIXED.md',
  'LOADINGSPINNER_FIX.md',
  'DYNAMIC_IMPORTS_FIXED.md',

  // Deployment duplicates
  'DEPLOYMENT_COMPLETE.md',
  /^DEPLOYMENT_SUCCESS_.*\.md$/,
  'DEPLOYMENT_SUMMARY.md',
  'GITHUB_PAGES_DEPLOYED.md',
  'GITHUB_PUBLISHED.md',

  // Analysis and audit reports
  'CODE_QUALITY_VERIFICATION.json',
  'COMPLEXITY_ANALYSIS.json',
  'DEPENDENCY_AUDIT.json',
  'PERFORMANCE_METRICS.json',
  'COMPREHENSIVE_VALIDATION_REPORT.json',
  'DATA_VALIDATION_REPORT.json',
  'JSON_STRUCTURE_VALIDATION_REPORT.json',
  'MARKDOWN_CONTENT_VALIDATION_REPORT.json',
  'ROUTE_AUDIT_REPORT.json',
  'ROUTE_FIXES_REPORT.json',
  'QUIZ_MIGRATION_REPORT.json',
  'QUIZ_STATISTICS_REPORT.json',
  'QUIZ_VALIDATION_REPORT.json',
  'UTF8_ENCODING_REPORT.json',
  'UTF8_ENCODING_FIX_REPORT.json',
  'UTF8_ENCODING_FIX_REPORT.md',
  'UNUSED_IMPORTS_REMOVED.json',
  'IMPORTS_ORGANIZED.json',

  // Code cleanup summaries
  'CODE_CLEANUP_SUMMARY.md',
  'CODE_QUALITY_FIX_SUMMARY.md',
  'FIXES_APPLIED.md',
  'SEAMLESS_INTEGRATION_COMPLETE.md',
  'ZERO_PROBLEMS_ACHIEVED.md',

  // Quiz-related temporary docs
  'QUIZ_GENERATION_SUMMARY.md',
  'QUIZ_INTEGRATION_SUMMARY.md',
  'QUIZ_INTEGRATION_TEST_REPORT.md',
  'QUIZ_SERVICE_FIX.md',
  'QUIZ_ROUTING_FIX.md',
  'FINAL_QUIZ_FIX.md',

  // Integration docs
  /^INTEGRATION_.*\.md$/,
  /.*_INTEGRATION_.*\.md$/,
  'IHK_CONTENT_FIX_SUMMARY.md',

  // Style audits
  /^STYLE_.*\.md$/,
  'STYLE_AUDIT_REPORT.md',

  // Unused code reports
  'UNUSED_CODE_REPORT.md',
  'DUPLICATE_CODE_REPORT.md',

  // Route audit reports
  'ROUTE_AUDIT_FINAL_REPORT.md',
  'ROUTE_ISSUES_ANALYSIS.md',
  /^\.kiro\/specs\/.*\/ROUTE_AUDIT\.md$/,
  /^\.kiro\/specs\/.*\/INTEGRATION_EVALUATION\.md$/,
  /^\.kiro\/specs\/.*\/PERFORMANCE_REPORT\.md$/,
  /^\.kiro\/specs\/.*\/MANUAL_TEST_CHECKLIST\.md$/,
  /^\.kiro\/specs\/.*\/COMPLEXITY_ANALYSIS\.md$/,

  // Other temporary files
  'HOW_TO_ACCESS_CONTENT.md',
  'POLISH_IMPROVEMENTS.md',
  'COMMIT_MESSAGE.txt',
];

// Directories to exclude from scanning
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.backup',
  'src',
  'public',
  'scripts',
  '.vscode',
  '.github',
];

/**
 * Check if a file matches any pattern in the list
 */
function matchesPattern(filename, relativePath, patterns) {
  for (const pattern of patterns) {
    if (pattern instanceof RegExp) {
      if (pattern.test(filename) || pattern.test(relativePath)) {
        return true;
      }
    } else if (typeof pattern === 'string') {
      if (filename === pattern || relativePath === pattern) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Recursively scan directory for files
 */
function scanDirectory(dir, baseDir = dir) {
  const files = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (entry.isDirectory()) {
        // Skip excluded directories
        if (!EXCLUDE_DIRS.includes(entry.name)) {
          files.push(...scanDirectory(fullPath, baseDir));
        }
      } else if (entry.isFile()) {
        // Only include .md, .json, and .txt files in root and .kiro/specs
        const ext = path.extname(entry.name);
        if (['.md', '.json', '.txt'].includes(ext)) {
          files.push({
            name: entry.name,
            path: fullPath,
            relativePath: relativePath.replace(/\\/g, '/'),
            size: fs.statSync(fullPath).size,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }

  return files;
}

/**
 * Categorize files as KEEP or REMOVE
 */
function categorizeFiles(files) {
  const categorized = {
    keep: [],
    remove: [],
    unknown: [],
  };

  for (const file of files) {
    const isKeep = matchesPattern(file.name, file.relativePath, KEEP_PATTERNS);
    const isRemove = matchesPattern(
      file.name,
      file.relativePath,
      REMOVE_PATTERNS
    );

    if (isKeep && !isRemove) {
      categorized.keep.push(file);
    } else if (isRemove && !isKeep) {
      categorized.remove.push(file);
    } else if (isKeep && isRemove) {
      // Conflict - prefer KEEP
      categorized.keep.push(file);
    } else {
      // Unknown - needs manual review
      categorized.unknown.push(file);
    }
  }

  return categorized;
}

/**
 * Generate categorization report
 */
function generateReport(categorized) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles:
        categorized.keep.length +
        categorized.remove.length +
        categorized.unknown.length,
      keepFiles: categorized.keep.length,
      removeFiles: categorized.remove.length,
      unknownFiles: categorized.unknown.length,
      totalSizeToRemove: categorized.remove.reduce((sum, f) => sum + f.size, 0),
    },
    keep: categorized.keep.map(f => f.relativePath).sort(),
    remove: categorized.remove
      .map(f => ({
        path: f.relativePath,
        size: f.size,
        reason: determineRemovalReason(f.name, f.relativePath),
      }))
      .sort((a, b) => a.path.localeCompare(b.path)),
    unknown: categorized.unknown.map(f => f.relativePath).sort(),
  };

  return report;
}

/**
 * Determine reason for file removal
 */
function determineRemovalReason(filename) {
  if (/^TASK_.*\.md$/.test(filename)) return 'Task summary file';
  if (/.*_FIXED\.md$/.test(filename)) return 'Temporary fix documentation';
  if (/.*_FIX\.md$/.test(filename)) return 'Temporary fix documentation';
  if (/^FINAL_.*\.md$/.test(filename)) return 'Temporary fix documentation';
  if (/^DEPLOYMENT_.*\.md$/.test(filename) && filename !== 'DEPLOYMENT.md')
    return 'Duplicate deployment documentation';
  if (/^GITHUB_.*\.md$/.test(filename))
    return 'Duplicate deployment documentation';
  if (/.*_REPORT\.(json|md)$/.test(filename)) return 'Analysis/audit report';
  if (/.*_ANALYSIS\.json$/.test(filename)) return 'Analysis report';
  if (/.*_AUDIT\.json$/.test(filename)) return 'Audit report';
  if (/.*_METRICS\.json$/.test(filename)) return 'Metrics report';
  if (/.*_VALIDATION_REPORT\.json$/.test(filename)) return 'Validation report';
  if (/CODE_.*_SUMMARY\.md$/.test(filename)) return 'Code cleanup summary';
  if (/QUIZ_.*\.md$/.test(filename))
    return 'Quiz-related temporary documentation';
  if (/INTEGRATION_.*\.md$/.test(filename)) return 'Integration documentation';
  if (/STYLE_.*\.md$/.test(filename)) return 'Style audit report';
  if (/UNUSED_.*\.md$/.test(filename)) return 'Unused code report';
  if (/DUPLICATE_.*\.md$/.test(filename)) return 'Duplicate code report';
  if (/ROUTE_.*\.md$/.test(filename)) return 'Route audit report';
  if (filename === 'COMMIT_MESSAGE.txt') return 'Temporary commit message file';

  return 'Temporary/redundant documentation';
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning workspace for files...\n');

  const files = scanDirectory(rootDir);
  console.log(`Found ${files.length} files to categorize\n`);

  console.log('📋 Categorizing files...\n');
  const categorized = categorizeFiles(files);

  console.log('✅ Categorization complete!\n');
  console.log(`  KEEP: ${categorized.keep.length} files`);
  console.log(`  REMOVE: ${categorized.remove.length} files`);
  console.log(
    `  UNKNOWN: ${categorized.unknown.length} files (need manual review)\n`
  );

  const report = generateReport(categorized);

  // Save report
  const reportPath = path.join(rootDir, 'FILE_CATEGORIZATION_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved to: ${path.relative(rootDir, reportPath)}\n`);

  // Display summary
  console.log('📊 Summary:');
  console.log(`  Total files: ${report.summary.totalFiles}`);
  console.log(`  Files to keep: ${report.summary.keepFiles}`);
  console.log(`  Files to remove: ${report.summary.removeFiles}`);
  console.log(`  Files needing review: ${report.summary.unknownFiles}`);
  console.log(
    `  Disk space to free: ${(report.summary.totalSizeToRemove / 1024).toFixed(2)} KB\n`
  );

  if (categorized.unknown.length > 0) {
    console.log('⚠️  Unknown files (need manual review):');
    categorized.unknown.forEach(f => console.log(`    - ${f.relativePath}`));
    console.log();
  }

  return report;
}

// Run if executed directly
const isMainModule =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  main();
}

export { categorizeFiles, scanDirectory, generateReport };
