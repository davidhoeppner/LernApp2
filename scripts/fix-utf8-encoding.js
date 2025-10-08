// @ts-nocheck
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Encoding mappings for German characters and common corruptions
const encodingFixes = {
  'Ã¼': 'ü', // u-umlaut
  'Ã¶': 'ö', // o-umlaut
  'Ã¤': 'ä', // a-umlaut
  ÃŸ: 'ß', // eszett
  Ãœ: 'Ü', // U-umlaut
  'Ã–': 'Ö', // O-umlaut
  'Ã„': 'Ä', // A-umlaut
  'â€œ': '"', // left double quote
  'â€': '"', // right double quote
  'â€™': "'", // right single quote
  'â€"': '–', // en/em dash
};

/**
 * Apply encoding fixes to a string using regex-based replacement
 */
function applyEncodingFixes(content) {
  let fixedContent = content;
  const appliedFixes = [];

  for (const [corrupted, correct] of Object.entries(encodingFixes)) {
    const regex = new RegExp(corrupted, 'g');
    const matches = content.match(regex);

    if (matches) {
      fixedContent = fixedContent.replace(regex, correct);
      appliedFixes.push({
        from: corrupted,
        to: correct,
        count: matches.length,
      });
    }
  }

  return { fixedContent, appliedFixes };
}

/**
 * Validate JSON structure
 */
function validateJSON(content) {
  try {
    JSON.parse(content);
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Create backup of a file before modification
 */
function createBackup(filePath, backupDir) {
  const fileName = path.basename(filePath);
  const backupPath = path.join(backupDir, fileName);

  try {
    fs.copyFileSync(filePath, backupPath);
    return { success: true, backupPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Scan all modules for encoding issues
 */
function scanModulesForEncodingIssues(modulesDir) {
  const affectedFiles = [];

  try {
    const files = fs.readdirSync(modulesDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(modulesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for "Ã" character sequences
      const issueMatches = content.match(/Ã/g);

      if (issueMatches) {
        affectedFiles.push({
          file,
          path: filePath,
          issueCount: issueMatches.length,
        });
      }
    }

    return { success: true, affectedFiles };
  } catch (error) {
    return { success: false, error: error.message, affectedFiles: [] };
  }
}

/**
 * Apply encoding fixes to all affected modules
 */
function fixModuleEncoding(filePath, backupDir) {
  const result = {
    file: path.basename(filePath),
    success: false,
    backup: null,
    fixes: [],
    validation: null,
    error: null,
  };

  try {
    // Create backup
    const backup = createBackup(filePath, backupDir);
    result.backup = backup;

    if (!backup.success) {
      result.error = `Backup failed: ${backup.error}`;
      return result;
    }

    // Read original content
    const originalContent = fs.readFileSync(filePath, 'utf8');

    // Validate original JSON
    const originalValidation = validateJSON(originalContent);
    if (!originalValidation.valid) {
      result.error = `Original JSON invalid: ${originalValidation.error}`;
      return result;
    }

    // Apply encoding fixes
    const { fixedContent, appliedFixes } = applyEncodingFixes(originalContent);
    result.fixes = appliedFixes;

    // Validate fixed JSON
    const fixedValidation = validateJSON(fixedContent);
    result.validation = fixedValidation;

    if (!fixedValidation.valid) {
      result.error = `Fixed JSON invalid: ${fixedValidation.error}`;
      return result;
    }

    // Write fixed content with UTF-8 encoding
    fs.writeFileSync(filePath, fixedContent, 'utf8');

    result.success = true;
  } catch (error) {
    result.error = error.message;
  }

  return result;
}

/**
 * Generate fix report
 */
function generateFixReport(scanResults, fixResults, outputPath) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalModulesScanned: scanResults.affectedFiles.length,
      modulesFixed: fixResults.filter(r => r.success).length,
      modulesFailed: fixResults.filter(r => !r.success).length,
      totalFixesApplied: fixResults.reduce(
        (sum, r) => sum + r.fixes.reduce((s, f) => s + f.count, 0),
        0
      ),
    },
    affectedFiles: scanResults.affectedFiles,
    fixResults: fixResults.map(r => ({
      file: r.file,
      success: r.success,
      backupCreated: r.backup?.success || false,
      fixesApplied: r.fixes.length,
      fixes: r.fixes,
      error: r.error,
    })),
  };

  // Write JSON report
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

  // Write human-readable report
  const readablePath = outputPath.replace('.json', '.md');
  let markdown = '# UTF-8 Encoding Fix Report\n\n';
  markdown += `**Generated:** ${report.timestamp}\n\n`;
  markdown += '## Summary\n\n';
  markdown += `- Total modules scanned: ${report.summary.totalModulesScanned}\n`;
  markdown += `- Modules fixed: ${report.summary.modulesFixed}\n`;
  markdown += `- Modules failed: ${report.summary.modulesFailed}\n`;
  markdown += `- Total fixes applied: ${report.summary.totalFixesApplied}\n\n`;

  if (report.summary.modulesFixed > 0) {
    markdown += '## Fixed Files\n\n';
    fixResults
      .filter(r => r.success)
      .forEach(result => {
        markdown += `### ${result.file}\n\n`;
        if (result.fixes.length > 0) {
          markdown += '**Encoding fixes applied:**\n\n';
          result.fixes.forEach(fix => {
            markdown += `- \`${fix.from}\` → \`${fix.to}\` (${fix.count} occurrences)\n`;
          });
          markdown += '\n';
        }
      });
  }

  if (report.summary.modulesFailed > 0) {
    markdown += '## Failed Files\n\n';
    fixResults
      .filter(r => !r.success)
      .forEach(result => {
        markdown += `### ${result.file}\n\n`;
        markdown += `**Error:** ${result.error}\n\n`;
      });
  }

  fs.writeFileSync(readablePath, markdown, 'utf8');

  return report;
}

/**
 * Main execution
 */
function main() {
  const modulesDir = path.join(__dirname, '../src/data/ihk/modules');
  const backupDir = path.join(
    __dirname,
    '../.backup/encoding-fix-' +
      new Date().toISOString().replace(/:/g, '-').split('.')[0]
  );
  const reportPath = path.join(__dirname, '../UTF8_ENCODING_FIX_REPORT.json');

  console.log('🔍 Scanning modules for encoding issues...\n');

  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Scan for encoding issues
  const scanResults = scanModulesForEncodingIssues(modulesDir);

  if (!scanResults.success) {
    console.error('❌ Scan failed:', scanResults.error);
    process.exit(1);
  }

  console.log(
    `Found ${scanResults.affectedFiles.length} files with encoding issues:\n`
  );
  scanResults.affectedFiles.forEach(file => {
    console.log(`  - ${file.file} (${file.issueCount} issues)`);
  });

  if (scanResults.affectedFiles.length === 0) {
    console.log('\n✅ No encoding issues found!');
    return;
  }

  console.log(`\n🔧 Applying fixes...\n`);

  // Apply fixes to all affected files
  const fixResults = [];
  for (const fileInfo of scanResults.affectedFiles) {
    const result = fixModuleEncoding(fileInfo.path, backupDir);
    fixResults.push(result);

    if (result.success) {
      console.log(
        `  ✅ ${result.file} - ${result.fixes.reduce((s, f) => s + f.count, 0)} fixes applied`
      );
    } else {
      console.log(`  ❌ ${result.file} - ${result.error}`);
    }
  }

  // Generate report
  console.log('\n📊 Generating report...\n');
  generateFixReport(scanResults, fixResults, reportPath);

  console.log('✅ Fix complete!\n');
  console.log(`Backup location: ${backupDir}`);
}

// Run if executed directly
main();

export {
  applyEncodingFixes,
  validateJSON,
  createBackup,
  scanModulesForEncodingIssues,
  fixModuleEncoding,
  generateFixReport,
};
