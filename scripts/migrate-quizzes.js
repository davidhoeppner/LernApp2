// @ts-nocheck
/* eslint-env node */
/**
 * Quiz Migration Script
 * Migrates regular quizzes to IHK format
 *
 * Usage: node scripts/migrate-quizzes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple migration tool (inline version)
class QuizMigrationTool {
  constructor() {
    this.categoryMapping = {
      'module-1': 'FÜ-02',
      'module-2': 'FÜ-02',
      'module-3': 'FÜ-02',
      'module-4': 'BP-03',
    };
  }

  migrateQuiz(regularQuiz) {
    return {
      id: this.generateIHKId(regularQuiz.title),
      moduleId: regularQuiz.moduleId,
      title: regularQuiz.title,
      description: regularQuiz.description,
      category: this.categoryMapping[regularQuiz.moduleId] || 'FÜ-02',
      difficulty: this.inferDifficulty(regularQuiz),
      examRelevance: 'medium',
      newIn2025: false,
      timeLimit: Math.ceil(regularQuiz.questions.length * 1.5),
      passingScore: 70,
      questions: regularQuiz.questions.map((q, index) => ({
        id: `q${index + 1}`,
        type: q.type === 'true-false' ? 'true-false' : 'single-choice',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: 1,
        category: this.inferQuestionCategory(q.question),
      })),
      tags: this.generateTags(regularQuiz),
      lastUpdated: new Date().toISOString(),
    };
  }

  generateIHKId(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  inferDifficulty(quiz) {
    const avgLength =
      quiz.questions.reduce((sum, q) => sum + q.question.length, 0) /
      quiz.questions.length;
    return avgLength > 100
      ? 'advanced'
      : avgLength > 60
        ? 'intermediate'
        : 'beginner';
  }

  inferQuestionCategory(text) {
    const lower = text.toLowerCase();
    if (lower.includes('variable') || lower.includes('const'))
      return 'Variables';
    if (lower.includes('function')) return 'Functions';
    if (lower.includes('array')) return 'Arrays';
    if (lower.includes('promise') || lower.includes('async')) return 'Async';
    if (lower.includes('dom')) return 'DOM';
    return 'General';
  }

  generateTags(quiz) {
    const tags = new Set();
    const text = `${quiz.title} ${quiz.description}`.toLowerCase();

    const keywords = [
      'JavaScript',
      'Array',
      'Async',
      'Promise',
      'DOM',
      'Function',
    ];
    keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) tags.add(keyword);
    });

    return Array.from(tags);
  }
}

// Main migration function
async function migrateQuizzes() {
  console.log('🚀 Starting quiz migration...\n');

  try {
    // Read original quizzes
    const quizzesPath = path.join(__dirname, '../src/data/quizzes.json');
    const quizzesData = fs.readFileSync(quizzesPath, 'utf8');
    const originalQuizzes = JSON.parse(quizzesData);

    console.log(`📚 Found ${originalQuizzes.length} quizzes to migrate\n`);

    // Create migration tool
    const migrator = new QuizMigrationTool();

    // Migrate each quiz
    const migratedQuizzes = [];
    const outputDir = path.join(__dirname, '../src/data/ihk/quizzes');

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const quiz of originalQuizzes) {
      console.log(`  Migrating: ${quiz.title}...`);

      const migratedQuiz = migrator.migrateQuiz(quiz);
      migratedQuizzes.push(migratedQuiz);

      // Write to individual file
      const filename = `${migratedQuiz.id}.json`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(migratedQuiz, null, 2));

      console.log(`    ✅ Saved to: ${filename}`);
      console.log(
        `    📊 Category: ${migratedQuiz.category}, Difficulty: ${migratedQuiz.difficulty}`
      );
      console.log(`    ⏱️  Time Limit: ${migratedQuiz.timeLimit} minutes`);
      console.log(`    🏷️  Tags: ${migratedQuiz.tags.join(', ')}\n`);
    }

    // Generate migration report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalQuizzes: originalQuizzes.length,
        migratedSuccessfully: migratedQuizzes.length,
        outputDirectory: 'src/data/ihk/quizzes/',
      },
      quizzes: migratedQuizzes.map((quiz, index) => ({
        originalId: originalQuizzes[index].id,
        newId: quiz.id,
        title: quiz.title,
        category: quiz.category,
        difficulty: quiz.difficulty,
        questionCount: quiz.questions.length,
        timeLimit: quiz.timeLimit,
        tags: quiz.tags,
      })),
    };

    // Save migration report
    const reportPath = path.join(__dirname, '../QUIZ_MIGRATION_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('✨ Migration complete!\n');
    console.log(`📄 Migration report saved to: QUIZ_MIGRATION_REPORT.json`);
    console.log(`📁 Migrated quizzes saved to: src/data/ihk/quizzes/\n`);
    console.log('Summary:');
    console.log(`  Total quizzes: ${report.summary.totalQuizzes}`);
    console.log(
      `  Successfully migrated: ${report.summary.migratedSuccessfully}`
    );
    console.log(`\nNext steps:`);
    console.log(`  1. Review migrated quiz files in src/data/ihk/quizzes/`);
    console.log(`  2. Run data validation to check for issues`);
    console.log(`  3. Update IHKContentService to load these quizzes`);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrateQuizzes();
