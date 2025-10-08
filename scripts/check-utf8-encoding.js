// @ts-nocheck
/* eslint-env node */
/**
 * Check UTF-8 Encoding Script
 * Checks all quiz files for proper UTF-8 encoding and German umlauts
 *
 * Usage: node scripts/check-utf8-encoding.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const process.cwd() = path.dirname(__filename);

const quizzesDir = path.join(process.cwd(), '../src/data/ihk/quizzes');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Patterns to check for incorrect encoding
// Note: We need to be careful not to flag English words like "True", "Queue", "Query"
const problematicPatterns = [
  {
    pattern: /\b(Ueb|ueb)(ung|er|ertrag|ersicht|erpr|erw|ernahm)/gi,
    should: 'ü',
    description: 'ue should be ü in German words',
    example: 'Uebung → Übung, Uebertragung → Übertragung',
  },
  {
    pattern: /\b(Loes|loes|Moegl|moegl|Groess|groess)(ung|ich|e)/gi,
    should: 'ö',
    description: 'oe should be ö in German words',
    example: 'Loesung → Lösung, Moeglichkeit → Möglichkeit',
  },
  {
    pattern:
      /\b(Pruef|pruef|Qualitaet|qualitaet|Schluessel|schluessel)(ung|en|s)?/gi,
    should: 'ü/ä',
    description: 'ue/ae should be ü/ä in German words',
    example: 'Pruefung → Prüfung, Qualitaet → Qualität',
  },
  {
    pattern: /\b(Aend|aend|Oeff|oeff)(erung|nung|en)/gi,
    should: 'Ä/Ö',
    description: 'Ae/Oe should be Ä/Ö in German words',
    example: 'Aenderung → Änderung, Oeffnung → Öffnung',
  },
  {
    pattern: /\b(Verschluessel|verschluessel|Erklaer|erklaer)(ung|en)/gi,
    should: 'ü/ä',
    description: 'ue/ae should be ü/ä in German words',
    example: 'Verschluesselung → Verschlüsselung, Erklaerung → Erklärung',
  },
];

// Common German words that should have umlauts
const commonWords = [
  { wrong: 'Uebung', correct: 'Übung' },
  { wrong: 'Loesung', correct: 'Lösung' },
  { wrong: 'Erklaerung', correct: 'Erklärung' },
  { wrong: 'Moeglichkeit', correct: 'Möglichkeit' },
  { wrong: 'Qualitaet', correct: 'Qualität' },
  { wrong: 'Sicherheit', correct: 'Sicherheit' }, // correct
  { wrong: 'Verschluesselung', correct: 'Verschlüsselung' },
  { wrong: 'Uebertragung', correct: 'Übertragung' },
  { wrong: 'Pruefung', correct: 'Prüfung' },
  { wrong: 'Groesse', correct: 'Größe' },
  { wrong: 'Schluessel', correct: 'Schlüssel' },
  { wrong: 'Aenderung', correct: 'Änderung' },
  { wrong: 'Oeffnung', correct: 'Öffnung' },
  { wrong: 'Uebersicht', correct: 'Übersicht' },
];

async function checkUTF8Encoding() {
  console.log(
    `${colors.bold}${colors.cyan}=== UTF-8 Encoding Check ===${colors.reset}\n`
  );

  // Read all quiz files
  const files = fs
    .readdirSync(quizzesDir)
    .filter(file => file.endsWith('.json'));

  if (files.length === 0) {
    console.log(
      `${colors.yellow}No quiz files found in ${quizzesDir}${colors.reset}`
    );
    return;
  }

  console.log(
    `Checking ${files.length} quiz files for UTF-8 encoding issues\n`
  );

  let totalIssues = 0;
  let filesWithIssues = 0;
  const results = [];

  // Check each quiz file
  for (const file of files) {
    const filePath = path.join(quizzesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Check for problematic patterns
    problematicPatterns.forEach(({ pattern, should, description, example }) => {
      const matches = [...content.matchAll(pattern)];

      if (matches.length > 0) {
        matches.forEach(match => {
          issues.push({
            type: 'pattern',
            found: match[0],
            should,
            description,
            example,
            position: match.index,
          });
        });
      }
    });

    // Check for common wrong words
    commonWords.forEach(({ wrong, correct }) => {
      if (wrong !== correct && content.includes(wrong)) {
        const regex = new RegExp(wrong, 'g');
        const matches = [...content.matchAll(regex)];

        matches.forEach(match => {
          issues.push({
            type: 'word',
            found: wrong,
            should: correct,
            description: `Common word with wrong encoding`,
            position: match.index,
          });
        });
      }
    });

    // Report results for this file
    if (issues.length > 0) {
      filesWithIssues++;
      totalIssues += issues.length;

      console.log(`${colors.yellow}⚠${colors.reset} ${file}`);
      console.log(
        `  ${colors.yellow}${issues.length} encoding issue(s) found${colors.reset}`
      );

      results.push({
        file,
        issueCount: issues.length,
        issues,
      });
    } else {
      console.log(`${colors.green}✓${colors.reset} ${file}`);

      results.push({
        file,
        issueCount: 0,
        issues: [],
      });
    }
  }

  // Print summary
  console.log(`\n${colors.bold}${colors.cyan}=== Summary ===${colors.reset}`);
  console.log(`Total Files: ${files.length}`);
  console.log(
    `${colors.green}Clean Files: ${files.length - filesWithIssues}${colors.reset}`
  );
  console.log(
    `${colors.yellow}Files with Issues: ${filesWithIssues}${colors.reset}`
  );
  console.log(`${colors.yellow}Total Issues: ${totalIssues}${colors.reset}`);

  // Print detailed issues
  const filesWithProblems = results.filter(r => r.issueCount > 0);

  if (filesWithProblems.length > 0) {
    console.log(
      `\n${colors.bold}${colors.yellow}=== Detailed Issues ===${colors.reset}`
    );

    filesWithProblems.forEach(result => {
      console.log(`\n${colors.bold}${result.file}${colors.reset}`);

      // Group issues by type
      const uniqueIssues = new Map();

      result.issues.forEach(issue => {
        const key = `${issue.found} → ${issue.should}`;
        if (!uniqueIssues.has(key)) {
          uniqueIssues.set(key, { ...issue, count: 1 });
        } else {
          uniqueIssues.get(key).count++;
        }
      });

      uniqueIssues.forEach(issue => {
        console.log(
          `  ${colors.yellow}⚠${colors.reset} Found "${issue.found}" ${issue.count}x → should be "${issue.should}"`
        );
        console.log(`    ${colors.cyan}${issue.description}${colors.reset}`);
        if (issue.example) {
          console.log(`    Example: ${issue.example}`);
        }
      });
    });

    console.log(`\n${colors.yellow}Recommendation:${colors.reset}`);
    console.log(`  1. Open each file with issues in a UTF-8 capable editor`);
    console.log(`  2. Use Find & Replace to fix the encoding issues`);
    console.log(`  3. Save the file with UTF-8 encoding`);
    console.log(`  4. Run this script again to verify`);
  }

  // Save detailed report to file
  const reportPath = path.join(process.cwd(), '../UTF8_ENCODING_REPORT.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          totalFiles: files.length,
          cleanFiles: files.length - filesWithIssues,
          filesWithIssues,
          totalIssues,
        },
        results,
      },
      null,
      2
    )
  );

  console.log(
    `\n${colors.cyan}Detailed report saved to: ${reportPath}${colors.reset}`
  );

  // Exit with appropriate code
  if (filesWithIssues > 0) {
    console.log(
      `\n${colors.yellow}UTF-8 encoding issues found. Please review and fix.${colors.reset}`
    );
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run check
checkUTF8Encoding().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
