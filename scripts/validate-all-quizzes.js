// @ts-nocheck
/* eslint-env node */
/**
 * Validate All Quizzes Script
 * Validates all quiz files in src/data/ihk/quizzes/
 *
 * Usage: node scripts/validate-all-quizzes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const process.cwd() = path.dirname(__filename);

// Import QuizValidator
const QuizValidatorPath = path.join(
  process.cwd(),
  '../src/utils/validators/QuizValidator.js'
);
const { default: QuizValidator } = await import(`file://${QuizValidatorPath}`);

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

async function validateAllQuizzes() {
  console.log(
    `${colors.bold}${colors.cyan}=== Quiz Validation Report ===${colors.reset}\n`
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

  console.log(`Found ${files.length} quiz files to validate\n`);

  const validator = new QuizValidator();
  let totalErrors = 0;
  let totalWarnings = 0;
  let validQuizzes = 0;
  let invalidQuizzes = 0;
  const results = [];

  // Validate each quiz
  for (const file of files) {
    const filePath = path.join(quizzesDir, file);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const quiz = JSON.parse(content);

      const validation = validator.validate(quiz);

      results.push({
        file,
        quiz: quiz.title || 'Untitled',
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      });

      if (validation.valid) {
        validQuizzes++;
        console.log(`${colors.green}✓${colors.reset} ${file}`);

        if (validation.warnings.length > 0) {
          console.log(
            `  ${colors.yellow}${validation.warnings.length} warning(s)${colors.reset}`
          );
        }
      } else {
        invalidQuizzes++;
        console.log(`${colors.red}✗${colors.reset} ${file}`);
        console.log(
          `  ${colors.red}${validation.errors.length} error(s)${colors.reset}`
        );
      }

      totalErrors += validation.errors.length;
      totalWarnings += validation.warnings.length;
    } catch (error) {
      invalidQuizzes++;
      console.log(`${colors.red}✗${colors.reset} ${file}`);
      console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);

      results.push({
        file,
        quiz: 'Parse Error',
        valid: false,
        errors: [error.message],
        warnings: [],
      });

      totalErrors++;
    }
  }

  // Print summary
  console.log(`\n${colors.bold}${colors.cyan}=== Summary ===${colors.reset}`);
  console.log(`Total Quizzes: ${files.length}`);
  console.log(`${colors.green}Valid: ${validQuizzes}${colors.reset}`);
  console.log(`${colors.red}Invalid: ${invalidQuizzes}${colors.reset}`);
  console.log(`${colors.red}Total Errors: ${totalErrors}${colors.reset}`);
  console.log(
    `${colors.yellow}Total Warnings: ${totalWarnings}${colors.reset}`
  );

  // Print detailed errors and warnings
  const invalidResults = results.filter(r => !r.valid);

  if (invalidResults.length > 0) {
    console.log(
      `\n${colors.bold}${colors.red}=== Detailed Errors ===${colors.reset}`
    );

    invalidResults.forEach(result => {
      console.log(
        `\n${colors.bold}${result.file}${colors.reset} (${result.quiz})`
      );

      result.errors.forEach(error => {
        console.log(`  ${colors.red}✗${colors.reset} ${error}`);
      });
    });
  }

  // Print warnings for valid quizzes
  const resultsWithWarnings = results.filter(
    r => r.valid && r.warnings.length > 0
  );

  if (resultsWithWarnings.length > 0) {
    console.log(
      `\n${colors.bold}${colors.yellow}=== Warnings ===${colors.reset}`
    );

    resultsWithWarnings.forEach(result => {
      console.log(
        `\n${colors.bold}${result.file}${colors.reset} (${result.quiz})`
      );

      result.warnings.forEach(warning => {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${warning}`);
      });
    });
  }

  // Save detailed report to file
  const reportPath = path.join(process.cwd(), '../QUIZ_VALIDATION_REPORT.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          totalQuizzes: files.length,
          validQuizzes,
          invalidQuizzes,
          totalErrors,
          totalWarnings,
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

  // Exit with error code if there are invalid quizzes
  if (invalidQuizzes > 0) {
    console.log(
      `\n${colors.red}Validation failed. Please fix the errors above.${colors.reset}`
    );
    process.exit(1);
  } else {
    console.log(`\n${colors.green}All quizzes are valid!${colors.reset}`);
    process.exit(0);
  }
}

// Run validation
validateAllQuizzes().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
