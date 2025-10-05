import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Group files by reason
 */
function groupFilesByReason(files) {
  const groups = {};

  for (const file of files) {
    const reason = file.reason;
    if (!groups[reason]) {
      groups[reason] = [];
    }
    groups[reason].push(file);
  }

  return groups;
}

/**
 * Generate cleanup plan markdown document
 */
function generateCleanupPlan(report) {
  const groups = groupFilesByReason(report.remove);
  const totalSize = report.summary.totalSizeToRemove;
  const totalFiles = report.summary.removeFiles;

  let markdown = `# File Cleanup Plan

Generated: ${new Date().toISOString()}

## Summary

This document outlines the plan to remove ${totalFiles} temporary and redundant documentation files from the workspace, freeing up approximately **${formatBytes(totalSize)}** of disk space.

## Rationale

The workspace has accumulated numerous temporary documentation files during development:
- Task summaries and completion reports
- Temporary fix documentation
- Duplicate deployment guides
- Analysis and audit reports (now outdated)
- Code cleanup summaries
- Quiz integration temporary docs
- Integration evaluation reports
- Style audit reports
- Unused code reports

These files served their purpose during development but are no longer needed. Removing them will:
- Improve workspace organization
- Reduce clutter in the repository
- Make it easier to find essential documentation
- Reduce repository size

## Files to Remove

`;

  // Sort groups by number of files (descending)
  const sortedGroups = Object.entries(groups).sort(
    (a, b) => b[1].length - a[1].length
  );

  for (const [reason, files] of sortedGroups) {
    const groupSize = files.reduce((sum, f) => sum + f.size, 0);
    markdown += `### ${reason} (${files.length} files, ${formatBytes(groupSize)})\n\n`;

    // Sort files alphabetically
    const sortedFiles = files.sort((a, b) => a.path.localeCompare(b.path));

    for (const file of sortedFiles) {
      markdown += `- \`${file.path}\` (${formatBytes(file.size)})\n`;
    }

    markdown += '\n';
  }

  markdown += `## Files to Keep

The following essential documentation will be preserved:

`;

  // Group keep files by type
  const keepGroups = {
    'Project Documentation': [],
    'Deployment & Configuration': [],
    'Accessibility Documentation': [],
    'Responsive Design Documentation': [],
    'Spec Files': [],
    'Package Files': [],
  };

  for (const filePath of report.keep) {
    if (filePath.includes('ACCESSIBILITY')) {
      keepGroups['Accessibility Documentation'].push(filePath);
    } else if (filePath.includes('RESPONSIVE')) {
      keepGroups['Responsive Design Documentation'].push(filePath);
    } else if (
      filePath.includes('.kiro/specs') ||
      ['requirements.md', 'design.md', 'tasks.md'].includes(filePath)
    ) {
      keepGroups['Spec Files'].push(filePath);
    } else if (filePath.includes('package')) {
      keepGroups['Package Files'].push(filePath);
    } else if (
      filePath.includes('DEPLOYMENT') ||
      filePath.includes('vercel') ||
      filePath.includes('.deployment')
    ) {
      keepGroups['Deployment & Configuration'].push(filePath);
    } else {
      keepGroups['Project Documentation'].push(filePath);
    }
  }

  for (const [groupName, files] of Object.entries(keepGroups)) {
    if (files.length > 0) {
      markdown += `### ${groupName}\n\n`;
      for (const file of files.sort()) {
        markdown += `- \`${file}\`\n`;
      }
      markdown += '\n';
    }
  }

  markdown += `## Execution Plan

1. **Backup**: Create a backup of all files to be removed (already handled by .backup directory)
2. **Validation**: Verify no broken file references in remaining documentation
3. **Removal**: Delete all files listed in the "Files to Remove" section
4. **Summary**: Generate CLEANUP_SUMMARY.md with list of removed files
5. **Verification**: Confirm workspace is clean and organized

## Safety Measures

- All files are backed up before removal
- Only documentation files (.md, .json, .txt) in root and .kiro/specs are affected
- Source code, dependencies, and build artifacts are not touched
- Essential documentation (README, LICENSE, deployment guides, etc.) is preserved
- Spec files (requirements.md, design.md, tasks.md) are preserved

## Next Steps

To execute this cleanup plan, run:

\`\`\`bash
node scripts/execute-cleanup.js
\`\`\`

This will:
1. Remove all files listed above
2. Generate CLEANUP_SUMMARY.md
3. Verify no broken references remain
`;

  return markdown;
}

/**
 * Main execution
 */
function main() {
  console.log('📋 Generating file cleanup plan...\n');

  // Read categorization report
  const reportPath = path.join(rootDir, 'FILE_CATEGORIZATION_REPORT.json');

  if (!fs.existsSync(reportPath)) {
    console.error('❌ Error: FILE_CATEGORIZATION_REPORT.json not found');
    console.error('   Please run: node scripts/categorize-files.js first\n');
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

  // Generate cleanup plan
  const cleanupPlan = generateCleanupPlan(report);

  // Save cleanup plan
  const planPath = path.join(rootDir, 'FILE_CLEANUP_PLAN.md');
  fs.writeFileSync(planPath, cleanupPlan);

  console.log('✅ Cleanup plan generated!\n');
  console.log(`📄 Plan saved to: ${path.relative(rootDir, planPath)}\n`);
  console.log('📊 Summary:');
  console.log(`  Files to remove: ${report.summary.removeFiles}`);
  console.log(`  Files to keep: ${report.summary.keepFiles}`);
  console.log(
    `  Disk space to free: ${formatBytes(report.summary.totalSizeToRemove)}\n`
  );
  console.log('👉 Review the plan and run: node scripts/execute-cleanup.js\n');
}

// Run if executed directly
const isMainModule =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  main();
}

export { generateCleanupPlan, formatBytes, groupFilesByReason };
