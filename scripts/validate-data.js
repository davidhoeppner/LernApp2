/**
 * Data Validation Script
 * Validates all IHK quiz, module, and learning path data
 *
 * Usage: node scripts/validate-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import validators (inline versions for script)
class QuizValidator {
  constructor() {
    this.validDifficulties = ['beginner', 'intermediate', 'advanced'];
    this.validRelevance = ['low', 'medium', 'high'];
    this.validQuestionTypes = [
      'single-choice',
      'multiple-choice',
      'true-false',
      'code',
    ];
  }

  validate(quiz) {
    const errors = [];
    const warnings = [];

    if (!quiz.id) errors.push('Missing required field: id');
    if (!quiz.title) errors.push('Missing required field: title');
    if (!quiz.description) errors.push('Missing required field: description');
    if (!quiz.category) errors.push('Missing required field: category');
    if (!quiz.difficulty) errors.push('Missing required field: difficulty');
    if (!quiz.questions || quiz.questions.length === 0) {
      errors.push('Quiz must have at least one question');
    }

    if (quiz.difficulty && !this.validDifficulties.includes(quiz.difficulty)) {
      errors.push(`Invalid difficulty: "${quiz.difficulty}"`);
    }

    if (
      quiz.examRelevance &&
      !this.validRelevance.includes(quiz.examRelevance)
    ) {
      errors.push(`Invalid examRelevance: "${quiz.examRelevance}"`);
    }

    if (
      quiz.passingScore !== undefined &&
      (quiz.passingScore < 0 || quiz.passingScore > 100)
    ) {
      errors.push('Passing score must be between 0 and 100');
    }

    if (quiz.category && !quiz.category.match(/^(FÜ|BP)-\d{2}$/)) {
      errors.push(`Invalid category format: "${quiz.category}"`);
    }

    if (quiz.questions && Array.isArray(quiz.questions)) {
      quiz.questions.forEach((q, index) => {
        const prefix = `Question ${index + 1}`;
        if (!q.id) errors.push(`${prefix}: Missing id`);
        if (!q.type) errors.push(`${prefix}: Missing type`);
        if (!q.question) errors.push(`${prefix}: Missing question text`);
        if (q.correctAnswer === undefined)
          errors.push(`${prefix}: Missing correctAnswer`);

        if (q.type && !this.validQuestionTypes.includes(q.type)) {
          errors.push(`${prefix}: Invalid type "${q.type}"`);
        }

        if (['single-choice', 'multiple-choice'].includes(q.type)) {
          if (!q.options || q.options.length < 2) {
            errors.push(`${prefix}: Must have at least 2 options`);
          }
          if (
            q.type === 'single-choice' &&
            q.options &&
            !q.options.includes(q.correctAnswer)
          ) {
            errors.push(
              `${prefix}: correctAnswer "${q.correctAnswer}" not in options`
            );
          }
        }
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

class ModuleValidator {
  validate(module) {
    const errors = [];
    const warnings = [];

    if (!module.id) errors.push('Missing required field: id');
    if (!module.title) errors.push('Missing required field: title');
    if (!module.description) errors.push('Missing required field: description');
    if (!module.content) errors.push('Missing required field: content');
    if (!module.category) errors.push('Missing required field: category');
    if (!module.difficulty) errors.push('Missing required field: difficulty');

    if (module.category && !module.category.match(/^(FÜ|BP)-\d{2}$/)) {
      errors.push(`Invalid category format: "${module.category}"`);
    }

    if (module.content) {
      const codeBlockCount = (module.content.match(/```/g) || []).length;
      if (codeBlockCount % 2 !== 0) {
        errors.push('Unclosed code block in content');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

class LearningPathValidator {
  constructor(allModules = new Map()) {
    this.allModules = allModules;
  }

  validate(learningPath) {
    const errors = [];
    const warnings = [];

    if (!learningPath.id) errors.push('Missing required field: id');
    if (!learningPath.title) errors.push('Missing required field: title');
    if (!learningPath.modules || learningPath.modules.length === 0) {
      errors.push('Learning path must have at least one module');
    }

    if (learningPath.modules && Array.isArray(learningPath.modules)) {
      learningPath.modules.forEach((moduleId, index) => {
        if (this.allModules.size > 0 && !this.allModules.has(moduleId)) {
          errors.push(
            `Module ${index + 1}: Referenced module "${moduleId}" does not exist`
          );
        }
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

// Main validation function
async function validateAllData() {
  console.log('🔍 Starting data validation...\n');

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: 0,
      validFiles: 0,
      invalidFiles: 0,
      totalErrors: 0,
      totalWarnings: 0,
    },
    quizzes: [],
    modules: [],
    learningPaths: [],
  };

  try {
    // Validate Quizzes
    console.log('📝 Validating quizzes...');
    const quizzesDir = path.join(__dirname, '../src/data/ihk/quizzes');
    const quizValidator = new QuizValidator();

    if (fs.existsSync(quizzesDir)) {
      const quizFiles = fs
        .readdirSync(quizzesDir)
        .filter(f => f.endsWith('.json'));

      for (const file of quizFiles) {
        const filepath = path.join(quizzesDir, file);
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        const validation = quizValidator.validate(data);

        report.quizzes.push({
          file,
          quizId: data.id,
          title: data.title,
          ...validation,
        });

        report.summary.totalFiles++;
        if (validation.valid) {
          report.summary.validFiles++;
          console.log(`  ✅ ${file}`);
        } else {
          report.summary.invalidFiles++;
          console.log(`  ❌ ${file} (${validation.errors.length} errors)`);
        }
        report.summary.totalErrors += validation.errors.length;
        report.summary.totalWarnings += validation.warnings.length;
      }
    }

    // Validate Modules
    console.log('\n📚 Validating modules...');
    const modulesDir = path.join(__dirname, '../src/data/ihk/modules');
    const moduleValidator = new ModuleValidator();
    const allModules = new Map();

    if (fs.existsSync(modulesDir)) {
      const moduleFiles = fs
        .readdirSync(modulesDir)
        .filter(f => f.endsWith('.json'));

      for (const file of moduleFiles) {
        const filepath = path.join(modulesDir, file);
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        allModules.set(data.id, data);
        const validation = moduleValidator.validate(data);

        report.modules.push({
          file,
          moduleId: data.id,
          title: data.title,
          ...validation,
        });

        report.summary.totalFiles++;
        if (validation.valid) {
          report.summary.validFiles++;
          console.log(`  ✅ ${file}`);
        } else {
          report.summary.invalidFiles++;
          console.log(`  ❌ ${file} (${validation.errors.length} errors)`);
        }
        report.summary.totalErrors += validation.errors.length;
        report.summary.totalWarnings += validation.warnings.length;
      }
    }

    // Validate Learning Paths
    console.log('\n🛤️  Validating learning paths...');
    const pathsDir = path.join(__dirname, '../src/data/ihk/learning-paths');
    const pathValidator = new LearningPathValidator(allModules);

    if (fs.existsSync(pathsDir)) {
      const pathFiles = fs
        .readdirSync(pathsDir)
        .filter(f => f.endsWith('.json'));

      for (const file of pathFiles) {
        const filepath = path.join(pathsDir, file);
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        const validation = pathValidator.validate(data);

        report.learningPaths.push({
          file,
          pathId: data.id,
          title: data.title,
          ...validation,
        });

        report.summary.totalFiles++;
        if (validation.valid) {
          report.summary.validFiles++;
          console.log(`  ✅ ${file}`);
        } else {
          report.summary.invalidFiles++;
          console.log(`  ❌ ${file} (${validation.errors.length} errors)`);
        }
        report.summary.totalErrors += validation.errors.length;
        report.summary.totalWarnings += validation.warnings.length;
      }
    }

    // Save report
    const reportPath = path.join(__dirname, '../DATA_VALIDATION_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Validation Summary');
    console.log('='.repeat(60));
    console.log(`Total files validated: ${report.summary.totalFiles}`);
    console.log(`Valid files: ${report.summary.validFiles} ✅`);
    console.log(`Invalid files: ${report.summary.invalidFiles} ❌`);
    console.log(`Total errors: ${report.summary.totalErrors}`);
    console.log(`Total warnings: ${report.summary.totalWarnings}`);
    console.log('='.repeat(60));

    if (report.summary.invalidFiles > 0) {
      console.log(
        '\n⚠️  Found validation errors. Check DATA_VALIDATION_REPORT.json for details.'
      );
    } else {
      console.log('\n✨ All data is valid!');
    }

    console.log(`\n📄 Full report saved to: DATA_VALIDATION_REPORT.json`);
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run validation
validateAllData();
