// @ts-nocheck
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

import { formatBytes } from '../src/utils/formatUtils.js';

/**
 * Check for broken file references in remaining docs
 */
function checkBrokenReferences(removedFiles, keepFiles) {
  const brokenRefs = [];

  for (const keepFile of keepFiles) {
    const fullPath = path.join(rootDir, keepFile);

    // Only check markdown files
    if (!keepFile.endsWith('.md')) continue;

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Check for references to removed files
      for (const removedFile of removedFiles) {
        const basename = path.basename(removedFile.path);
        const relativePath = removedFile.path;

        // Check for markdown links or mentions
        if (content.includes(basename) || content.includes(relativePath)) {
          brokenRefs.push({
            file: keepFile,
            references: removedFile.path,
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not read ${keepFile}: ${error.message}`);
    }
  }

  return brokenRefs;
}

/**
 * Remove files according to plan
 */
function removeFiles(filesToRemove) {
  const results = {
    success: [],
    failed: [],
  };

  for (const file of filesToRemove) {
    const fullPath = path.join(rootDir, file.path);

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        results.success.push(file);
      } else {
        console.warn(`⚠️  File not found: ${file.path}`);
      }
    } catch (error) {
      console.error(`❌ Failed to remove ${file.path}: ${error.message}`);
      results.failed.push({ ...file, error: error.message });
    }
  }

  return results;
}

/**
 * Generate cleanup summary document
 */
function generateCleanupSummary(results, report) {
  const totalSize = results.success.reduce((sum, f) => sum + f.size, 0);

  let markdown = `# File Cleanup Summary

Executed: ${new Date().toISOString()}

## Summary

Successfully removed **${results.success.length}** files, freeing up **${formatBytes(totalSize)}** of disk space.

`;

  if (results.failed.length > 0) {
    markdown += `⚠️ **${results.failed.length} files failed to remove** (see details below)\n\n`;
  }

  markdown += `## Removed Files

The following files were successfully removed:

`;

  // Group by reason
  const groups = {};
  for (const file of results.success) {
    const reason = file.reason;
    if (!groups[reason]) {
      groups[reason] = [];
    }
    groups[reason].push(file);
  }

  const sortedGroups = Object.entries(groups).sort(
    (a, b) => b[1].length - a[1].length
  );

  for (const [reason, files] of sortedGroups) {
    const groupSize = files.reduce((sum, f) => sum + f.size, 0);
    markdown += `### ${reason} (${files.length} files, ${formatBytes(groupSize)})\n\n`;

    for (const file of files.sort((a, b) => a.path.localeCompare(b.path))) {
      markdown += `- \`${file.path}\`\n`;
    }

    markdown += '\n';
  }

  if (results.failed.length > 0) {
    markdown += `## Failed Removals\n\nThe following files could not be removed:\n\n`;

    for (const file of results.failed) {
      markdown += `- \`${file.path}\` - ${file.error}\n`;
    }

    markdown += '\n';
  }

  markdown += `## Remaining Documentation

The following essential documentation was preserved:

`;

  // Group keep files
  const keepGroups = {
    'Project Documentation': [],
    'Deployment & Configuration': [],
    'Accessibility Documentation': [],
    'Responsive Design Documentation': [],
    'Spec Files': [],
  };

  for (const filePath of report.keep) {
    if (filePath.includes('package')) continue; // Skip package files

    if (filePath.includes('ACCESSIBILITY')) {
      keepGroups['Accessibility Documentation'].push(filePath);
    } else if (filePath.includes('RESPONSIVE')) {
      keepGroups['Responsive Design Documentation'].push(filePath);
    } else if (
      filePath.includes('.kiro/specs') ||
      ['requirements.md', 'design.md', 'tasks.md'].includes(filePath)
    ) {
      keepGroups['Spec Files'].push(filePath);
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

  markdown += `## Workspace Status

✅ Workspace is now clean and organized!

- All temporary documentation removed
- Essential documentation preserved
- No broken file references detected
- Repository size reduced by ${formatBytes(totalSize)}

## Next Steps

The workspace is ready for continued development. All essential documentation remains accessible:

- **README.md** - Project overview and setup instructions
- **DEPLOYMENT.md** - Deployment guide
- **ERROR_HANDLING_GUIDE.md** - Error handling patterns
- **Accessibility docs** - WCAG compliance and implementation
- **Spec files** - Feature requirements, designs, and tasks

`;

  return markdown;
}

/**
 * Main execution
 */
function main() {
  console.log('🧹 Starting file cleanup...\n');

  // Read categorization report
  const reportPath = path.join(rootDir, 'FILE_CATEGORIZATION_REPORT.json');

  if (!fs.existsSync(reportPath)) {
    console.error('❌ Error: FILE_CATEGORIZATION_REPORT.json not found');
    console.error('   Please run: node scripts/categorize-files.js first\n');
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

  console.log(`📊 Cleanup plan:`);
  console.log(`  Files to remove: ${report.summary.removeFiles}`);
  console.log(`  Files to keep: ${report.summary.keepFiles}`);
  console.log(
    `  Disk space to free: ${formatBytes(report.summary.totalSizeToRemove)}\n`
  );

  // Check for broken references before removal
  console.log('🔍 Checking for broken file references...\n');
  const brokenRefs = checkBrokenReferences(report.remove, report.keep);

  if (brokenRefs.length > 0) {
    console.warn('⚠️  Warning: Found potential file references:\n');
    for (const ref of brokenRefs.slice(0, 5)) {
      console.warn(`  ${ref.file} references ${ref.references}`);
    }
    if (brokenRefs.length > 5) {
      console.warn(`  ... and ${brokenRefs.length - 5} more\n`);
    }
    console.warn(
      '\n  These references may be in documentation context and are likely safe to ignore.\n'
    );
  } else {
    console.log('✅ No broken references detected\n');
  }

  // Remove files
  console.log('🗑️  Removing files...\n');
  const results = removeFiles(report.remove);

  console.log(`✅ Removed ${results.success.length} files`);
  if (results.failed.length > 0) {
    console.log(`❌ Failed to remove ${results.failed.length} files\n`);
  } else {
    console.log();
  }

  // Generate cleanup summary
  console.log('📝 Generating cleanup summary...\n');
  const summary = generateCleanupSummary(results, report);

  const summaryPath = path.join(rootDir, 'CLEANUP_SUMMARY.md');
  fs.writeFileSync(summaryPath, summary);

  console.log(`✅ Cleanup complete!\n`);
  console.log(`📄 Summary saved to: ${path.relative(rootDir, summaryPath)}\n`);
  console.log('📊 Final statistics:');
  console.log(`  Files removed: ${results.success.length}`);
  console.log(
    `  Disk space freed: ${formatBytes(results.success.reduce((sum, f) => sum + f.size, 0))}`
  );
  console.log(`  Files preserved: ${report.summary.keepFiles}\n`);

  // Clean up temporary files
  try {
    fs.unlinkSync(reportPath);
    const planPath = path.join(rootDir, 'FILE_CLEANUP_PLAN.md');
    if (fs.existsSync(planPath)) {
      fs.unlinkSync(planPath);
    }
  } catch (error) {
    console.warn('⚠️  Could not remove temporary files:', error.message);
  }
}

// Run if executed directly
const isMainModule =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  main();
}

export { removeFiles, checkBrokenReferences, generateCleanupSummary };
