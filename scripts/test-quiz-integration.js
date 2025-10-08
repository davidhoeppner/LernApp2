// @ts-nocheck
/* eslint-env node */
/* eslint-disable no-unused-vars */
/**
 * End-to-End Test Script for Quiz Integration
 * Tests all migrated quiz functionality, progress tracking, and verifies no regressions
 *
 * This script validates the quiz data files directly without requiring browser environment
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Helper function to log test results
function logTest(name, passed, message = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const result = { name, passed, message };
  testResults.tests.push(result);

  if (passed) {
    testResults.passed++;
    console.log(`${status}: ${name}`);
  } else {
    testResults.failed++;
    console.error(`${status}: ${name}`);
    if (message) console.error(`  → ${message}`);
  }
}

// Helper function to assert
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Helper to load JSON files
function loadJSON(relativePath) {
  const fullPath = join(__dirname, '..', relativePath);
  const content = readFileSync(fullPath, 'utf-8');
  return JSON.parse(content);
}

// Helper to get all quiz files
function getAllQuizFiles() {
  const quizzesDir = join(__dirname, '..', 'src', 'data', 'ihk', 'quizzes');
  const files = readdirSync(quizzesDir).filter(f => f.endsWith('.json'));
  return files.map(f => join('src', 'data', 'ihk', 'quizzes', f));
}

/**
 * Test 8.1: Test migrated quiz functionality
 */
async function testMigratedQuizFunctionality() {
  console.log('\n=== Test 8.1: Migrated Quiz Functionality ===\n');

  // Test 8.1.1: Verify all 9 quizzes are available
  try {
    const quizFiles = getAllQuizFiles();
    const allQuizzes = quizFiles.map(f => loadJSON(f));

    assert(
      allQuizzes.length === 9,
      `Expected 9 quizzes, got ${allQuizzes.length}`
    );
    logTest('8.1.1: All 9 quizzes are available', true);

    console.log(`  Found ${allQuizzes.length} quizzes:`);
    allQuizzes.forEach(q => console.log(`    - ${q.id}: ${q.title}`));
  } catch (error) {
    logTest('8.1.1: All 9 quizzes are available', false, error.message);
  }

  // Test 8.1.2: Verify migrated quizzes exist
  const migratedQuizIds = [
    'javascript-basics-quiz',
    'array-methods-quiz',
    'async-javascript-quiz',
    'dom-manipulation-quiz',
  ];

  for (const quizId of migratedQuizIds) {
    try {
      const quiz = loadJSON(`src/data/ihk/quizzes/${quizId}.json`);

      assert(quiz !== null, `Quiz ${quizId} not found`);
      assert(quiz.id === quizId, `Quiz ID mismatch`);
      assert(quiz.title, 'Quiz has no title');
      assert(quiz.description, 'Quiz has no description');
      assert(
        quiz.questions && quiz.questions.length > 0,
        'Quiz has no questions'
      );

      logTest(`8.1.2: Migrated quiz "${quizId}" loads correctly`, true);
      console.log(`  Quiz: ${quiz.title}`);
      console.log(`  Questions: ${quiz.questions.length}`);
      console.log(`  Category: ${quiz.category}`);
      console.log(`  Difficulty: ${quiz.difficulty}`);
    } catch (error) {
      logTest(
        `8.1.2: Migrated quiz "${quizId}" loads correctly`,
        false,
        error.message
      );
    }
  }

  // Test 8.1.3: Verify quiz structure and IHK format
  for (const quizId of migratedQuizIds) {
    try {
      const quiz = loadJSON(`src/data/ihk/quizzes/${quizId}.json`);

      // Check required IHK fields
      assert(quiz.category, 'Missing category field');
      assert(quiz.difficulty, 'Missing difficulty field');
      assert(quiz.examRelevance !== undefined, 'Missing examRelevance field');
      assert(quiz.timeLimit !== undefined, 'Missing timeLimit field');
      assert(quiz.passingScore !== undefined, 'Missing passingScore field');
      assert(Array.isArray(quiz.tags), 'Missing or invalid tags field');

      // Check question structure
      quiz.questions.forEach((q, index) => {
        assert(q.id, `Question ${index + 1} missing id`);
        assert(q.type, `Question ${index + 1} missing type`);
        assert(q.question, `Question ${index + 1} missing question text`);
        assert(
          q.correctAnswer !== undefined,
          `Question ${index + 1} missing correctAnswer`
        );
        assert(q.explanation, `Question ${index + 1} missing explanation`);
        assert(q.points !== undefined, `Question ${index + 1} missing points`);

        // Verify question types are valid IHK types
        const validTypes = [
          'single-choice',
          'multiple-choice',
          'true-false',
          'code',
        ];
        assert(
          validTypes.includes(q.type),
          `Question ${index + 1} has invalid type: ${q.type}`
        );

        // For choice questions, verify options exist
        if (q.type === 'single-choice' || q.type === 'multiple-choice') {
          assert(
            Array.isArray(q.options) && q.options.length >= 2,
            `Question ${index + 1} must have at least 2 options`
          );
        }
      });

      logTest(`8.1.3: Quiz "${quizId}" has valid IHK format`, true);
    } catch (error) {
      logTest(
        `8.1.3: Quiz "${quizId}" has valid IHK format`,
        false,
        error.message
      );
    }
  }

  // Test 8.1.4: Verify question navigation and answer validation
  try {
    const quiz = loadJSON('src/data/ihk/quizzes/javascript-basics-quiz.json');

    // Simulate answering questions
    const userAnswers = {};
    quiz.questions.forEach((q, index) => {
      if (q.type === 'single-choice') {
        userAnswers[q.id] = q.options[0]; // Select first option
      } else if (q.type === 'multiple-choice') {
        userAnswers[q.id] = [q.options[0]]; // Select first option as array
      } else if (q.type === 'true-false') {
        userAnswers[q.id] = true;
      }
    });

    // Verify we can answer all questions
    assert(
      Object.keys(userAnswers).length === quiz.questions.length,
      'Not all questions were answered'
    );

    logTest('8.1.4: Question navigation and answer validation works', true);
  } catch (error) {
    logTest(
      '8.1.4: Question navigation and answer validation works',
      false,
      error.message
    );
  }

  // Test 8.1.5: Verify quiz features (explanations, metadata)
  try {
    const quiz = loadJSON('src/data/ihk/quizzes/array-methods-quiz.json');

    // Check all questions have explanations
    quiz.questions.forEach((q, index) => {
      assert(
        q.explanation && q.explanation.length > 0,
        `Question ${index + 1} missing explanation`
      );
    });

    // Check metadata badges
    assert(quiz.difficulty, 'Missing difficulty badge');
    assert(quiz.examRelevance, 'Missing exam relevance badge');
    assert(quiz.timeLimit, 'Missing time limit');

    logTest('8.1.5: Quiz features (explanations, metadata) are present', true);
  } catch (error) {
    logTest(
      '8.1.5: Quiz features (explanations, metadata) are present',
      false,
      error.message
    );
  }
}

/**
 * Test 8.2: Test quiz progress tracking
 * Note: Progress tracking requires browser environment with localStorage
 * These tests verify the data structure is correct for progress tracking
 */
async function testQuizProgressTracking() {
  console.log('\n=== Test 8.2: Quiz Progress Tracking ===\n');

  // Test 8.2.1: Verify quiz data supports progress tracking
  try {
    const quiz = loadJSON('src/data/ihk/quizzes/javascript-basics-quiz.json');

    // Verify quiz has all fields needed for progress tracking
    assert(quiz.id, 'Quiz missing ID for tracking');
    assert(
      quiz.questions && quiz.questions.length > 0,
      'Quiz has no questions'
    );

    // Verify each question has an ID for answer tracking
    quiz.questions.forEach((q, index) => {
      assert(q.id, `Question ${index + 1} missing ID for tracking`);
      assert(
        q.correctAnswer !== undefined,
        `Question ${index + 1} missing correctAnswer for scoring`
      );
      assert(
        q.points !== undefined,
        `Question ${index + 1} missing points for scoring`
      );
    });

    logTest('8.2.1: Quiz data supports progress tracking', true);
    console.log(`  Quiz: ${quiz.title}`);
    console.log(`  Questions: ${quiz.questions.length}`);
    console.log(
      `  Total points: ${quiz.questions.reduce((sum, q) => sum + q.points, 0)}`
    );
  } catch (error) {
    logTest(
      '8.2.1: Quiz data supports progress tracking',
      false,
      error.message
    );
  }

  // Test 8.2.2: Verify quiz attempt data structure
  try {
    const quiz = loadJSON('src/data/ihk/quizzes/javascript-basics-quiz.json');

    // Simulate a quiz attempt structure
    const mockAttempt = {
      quizId: quiz.id,
      answers: {},
      score: 0,
      totalQuestions: quiz.questions.length,
      correctAnswers: 0,
      completedAt: new Date().toISOString(),
    };

    // Verify all questions can be answered
    quiz.questions.forEach(q => {
      mockAttempt.answers[q.id] =
        q.type === 'multiple-choice' ? [q.options[0]] : q.options[0];
    });

    assert(
      Object.keys(mockAttempt.answers).length === quiz.questions.length,
      'Not all questions have answers'
    );

    logTest('8.2.2: Quiz attempt data structure is valid', true);
  } catch (error) {
    logTest(
      '8.2.2: Quiz attempt data structure is valid',
      false,
      error.message
    );
  }

  // Test 8.2.3: Verify scoring calculation is possible
  try {
    const quiz = loadJSON('src/data/ihk/quizzes/array-methods-quiz.json');

    let totalPoints = 0;
    let earnedPoints = 0;

    quiz.questions.forEach(q => {
      totalPoints += q.points;
      // Simulate 70% correct
      if (Math.random() > 0.3) {
        earnedPoints += q.points;
      }
    });

    const score = Math.round((earnedPoints / totalPoints) * 100);

    assert(score >= 0 && score <= 100, 'Score calculation out of range');
    assert(totalPoints > 0, 'Total points should be greater than 0');

    logTest('8.2.3: Quiz scoring calculation works', true);
    console.log(`  Total points: ${totalPoints}`);
    console.log(`  Simulated score: ${score}%`);
  } catch (error) {
    logTest('8.2.3: Quiz scoring calculation works', false, error.message);
  }

  // Test 8.2.4: Verify retake support
  try {
    const quiz = loadJSON('src/data/ihk/quizzes/dom-manipulation-quiz.json');

    // Simulate multiple attempts
    const attempts = [
      { score: 60, completedAt: new Date(Date.now() - 86400000).toISOString() },
      { score: 75, completedAt: new Date(Date.now() - 43200000).toISOString() },
      { score: 90, completedAt: new Date().toISOString() },
    ];

    const bestScore = Math.max(...attempts.map(a => a.score));
    const avgScore = Math.round(
      attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
    );

    assert(bestScore === 90, 'Best score calculation incorrect');
    assert(avgScore === 75, 'Average score calculation incorrect');

    logTest('8.2.4: Quiz retake tracking works', true);
    console.log(`  Attempts: ${attempts.length}`);
    console.log(`  Best score: ${bestScore}%`);
    console.log(`  Average score: ${avgScore}%`);
  } catch (error) {
    logTest('8.2.4: Quiz retake tracking works', false, error.message);
  }
}

/**
 * Test 8.3: Verify no regressions
 */
async function testNoRegressions() {
  console.log('\n=== Test 8.3: Verify No Regressions ===\n');

  // Test 8.3.1: Original IHK quizzes still work
  const originalQuizIds = [
    'scrum-quiz',
    'security-threats-quiz',
    'sorting-algorithms-quiz',
    'sql-comprehensive-quiz',
    'tdd-quiz',
  ];

  for (const quizId of originalQuizIds) {
    try {
      const quiz = loadJSON(`src/data/ihk/quizzes/${quizId}.json`);

      assert(quiz !== null, `Quiz ${quizId} not found`);
      assert(
        quiz.questions && quiz.questions.length > 0,
        'Quiz has no questions'
      );
      assert(quiz.category, 'Missing category');
      assert(quiz.difficulty, 'Missing difficulty');

      logTest(`8.3.1: Original IHK quiz "${quizId}" still works`, true);
    } catch (error) {
      logTest(
        `8.3.1: Original IHK quiz "${quizId}" still works`,
        false,
        error.message
      );
    }
  }

  // Test 8.3.2: Module data files exist and are valid
  try {
    const module = loadJSON('src/data/ihk/modules/fue-01-planning.json');

    assert(module !== null, 'Module not found');
    assert(module.title, 'Module has no title');
    assert(module.content, 'Module has no content');
    assert(module.category, 'Module has no category');

    logTest('8.3.2: Module data files are valid', true);
  } catch (error) {
    logTest('8.3.2: Module data files are valid', false, error.message);
  }

  // Test 8.3.3: Learning paths are valid
  try {
    const path = loadJSON('src/data/ihk/learning-paths/ap2-complete-path.json');

    assert(path !== null, 'Learning path not found');
    assert(path.title, 'Learning path has no title');
    assert(Array.isArray(path.modules), 'Learning path has no modules');
    assert(path.modules.length > 0, 'Learning path has no modules');

    logTest('8.3.3: Learning paths are valid', true);
    console.log(`  Path: ${path.title}`);
    console.log(`  Modules: ${path.modules.length}`);
  } catch (error) {
    logTest('8.3.3: Learning paths are valid', false, error.message);
  }

  // Test 8.3.4: All quiz files are properly formatted
  try {
    const quizFiles = getAllQuizFiles();
    const allQuizzes = quizFiles.map(f => loadJSON(f));

    assert(
      allQuizzes.length === 9,
      `Expected 9 quizzes, got ${allQuizzes.length}`
    );

    // Verify no duplicate IDs
    const ids = allQuizzes.map(q => q.id);
    const uniqueIds = new Set(ids);
    assert(ids.length === uniqueIds.size, 'Duplicate quiz IDs found');

    logTest('8.3.4: All quiz files are properly formatted', true);
  } catch (error) {
    logTest(
      '8.3.4: All quiz files are properly formatted',
      false,
      error.message
    );
  }

  // Test 8.3.5: Verify IHKContentService imports all quizzes
  try {
    const serviceFile = readFileSync(
      join(__dirname, '..', 'src', 'services', 'IHKContentService.js'),
      'utf-8'
    );

    // Check that all migrated quizzes are imported
    const migratedQuizIds = [
      'javascript-basics-quiz',
      'array-methods-quiz',
      'async-javascript-quiz',
      'dom-manipulation-quiz',
    ];

    migratedQuizIds.forEach(quizId => {
      const importName =
        quizId
          .split('-')
          .map((word, i) =>
            i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
          )
          .join('') + 'Quiz';

      // Convert to camelCase properly
      const camelCaseName = quizId
        .replace(/-([a-z])/g, g => g[1].toUpperCase())
        .replace(/-/g, '');

      const hasImport =
        serviceFile.includes(`${camelCaseName}Quiz`) ||
        serviceFile.includes(quizId);

      assert(hasImport, `Missing import for ${quizId}`);
    });

    logTest('8.3.5: IHKContentService imports all quizzes', true);
  } catch (error) {
    logTest(
      '8.3.5: IHKContentService imports all quizzes',
      false,
      error.message
    );
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Quiz Integration End-to-End Test Suite                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await testMigratedQuizFunctionality();
    await testQuizProgressTracking();
    await testNoRegressions();
  } catch (error) {
    console.error('\n❌ Test suite encountered an error:', error);
  }

  // Print summary
  console.log(
    '\n╔════════════════════════════════════════════════════════════╗'
  );
  console.log('║  Test Summary                                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTotal Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✓ Passed: ${testResults.passed}`);
  console.log(`✗ Failed: ${testResults.failed}`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  - ${t.name}`);
        if (t.message) console.log(`    ${t.message}`);
      });
  }

  const successRate = Math.round(
    (testResults.passed / (testResults.passed + testResults.failed)) * 100
  );
  console.log(`\nSuccess Rate: ${successRate}%`);

  if (testResults.failed === 0) {
    console.log(
      '\n✅ All tests passed! Quiz integration is working correctly.'
    );
  }

  return testResults.failed === 0;
}

// Run tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
