#!/usr/bin/env node
// @ts-nocheck
/* eslint-env node */


/**
 * Test CategoryMappingService integration in IHKQuizListView
 * Verifies that the service is properly integrated and category detection works
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const process.cwd() = dirname(__filename);
const projectRoot = join(process.cwd(), '..');

// Mock services for testing
class MockSpecializationService {
  getCategoryRelevance(categoryId, specializationId) {
    // Simple mock implementation
    if (categoryId.includes('dpa') || categoryId.includes('DPA')) {
      return specializationId === 'daten-prozessanalyse' ? 'high' : 'low';
    }
    if (categoryId.includes('ae') || categoryId.includes('AE')) {
      return specializationId === 'anwendungsentwicklung' ? 'high' : 'low';
    }
    return 'medium';
  }
}

class MockStateManager {
  getState(key) {
    if (key === 'progress') {
      return {
        quizAttempts: [
          { quizId: 'test-quiz-1', score: 85 },
          { quizId: 'test-quiz-2', score: 65 },
        ],
      };
    }
    return {};
  }
}

class MockIHKContentService {
  async getAllQuizzes() {
    return [
      {
        id: 'test-quiz-1',
        title: 'DPA Test Quiz',
        description: 'Test quiz for DPA',
        category: 'BP-DPA-01',
        questions: [{ id: 1, text: 'Test question' }],
        difficulty: 'intermediate',
      },
      {
        id: 'test-quiz-2',
        title: 'AE Test Quiz',
        description: 'Test quiz for AE',
        categoryId: 'BP-01',
        questions: [{ id: 1, text: 'Test question' }],
        difficulty: 'beginner',
      },
      {
        id: 'test-quiz-3',
        title: 'General Quiz',
        description: 'General test quiz',
        threeTierCategory: 'allgemein',
        questions: [{ id: 1, text: 'Test question' }],
        difficulty: 'advanced',
      },
    ];
  }
}

async function testCategoryMappingIntegration() {
  console.log(
    '🧪 Testing CategoryMappingService Integration in IHKQuizListView\n'
  );

  try {
    // Import required modules using file URLs for Windows compatibility
    const { default: CategoryMappingService } = await import(
      `file:///${join(projectRoot, 'src/services/CategoryMappingService.js').replace(/\\/g, '/')}`
    );
    const { default: IHKQuizListView } = await import(
      `file:///${join(projectRoot, 'src/components/IHKQuizListView.js').replace(/\\/g, '/')}`
    );

    // Create mock services
    const mockSpecializationService = new MockSpecializationService();
    const categoryMappingService = new CategoryMappingService(
      mockSpecializationService
    );

    const services = {
      categoryMappingService,
      specializationService: mockSpecializationService,
      stateManager: new MockStateManager(),
      ihkContentService: new MockIHKContentService(),
      router: { navigate: () => {} },
    };

    // Create IHKQuizListView instance
    const quizListView = new IHKQuizListView(services);

    console.log(
      '✅ Successfully created IHKQuizListView with CategoryMappingService'
    );

    // Test that categoryMappingService is accessible
    if (!quizListView.categoryMappingService) {
      throw new Error(
        'CategoryMappingService not accessible in IHKQuizListView'
      );
    }
    console.log('✅ CategoryMappingService is accessible in constructor');

    // Load test quizzes
    await quizListView.loadQuizzes();
    console.log(`✅ Loaded ${quizListView.quizzes.length} test quizzes`);

    // Test category indicator generation for each quiz
    console.log('\n📊 Testing category indicator generation:');

    for (const quiz of quizListView.quizzes) {
      try {
        const categoryIndicator = quizListView._getCategoryIndicator(quiz);

        console.log(`  Quiz: ${quiz.title}`);
        console.log(
          `    Original category: ${quiz.category || quiz.categoryId || quiz.threeTierCategory || 'none'}`
        );
        console.log(`    Mapped to: ${categoryIndicator.category}`);
        console.log(`    Display name: ${categoryIndicator.displayName}`);
        console.log(`    Icon: ${categoryIndicator.icon}`);
        console.log('');

        // Verify required properties exist
        if (
          !categoryIndicator.category ||
          !categoryIndicator.displayName ||
          !categoryIndicator.icon
        ) {
          throw new Error(`Invalid category indicator for quiz ${quiz.id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing quiz ${quiz.id}:`, error.message);
        throw error;
      }
    }

    // Test error handling with invalid quiz data
    console.log('🛡️ Testing error handling:');

    const invalidQuiz = { id: 'invalid-quiz' }; // Missing category data
    const fallbackIndicator = quizListView._getCategoryIndicator(invalidQuiz);

    if (fallbackIndicator.category !== 'allgemein') {
      throw new Error('Error handling failed - should fallback to allgemein');
    }
    console.log('✅ Error handling works correctly - falls back to allgemein');

    // Test with null/undefined quiz
    const nullQuizIndicator = quizListView._getCategoryIndicator(null);
    if (nullQuizIndicator.category !== 'allgemein') {
      throw new Error('Null quiz handling failed');
    }
    console.log('✅ Null quiz handling works correctly');

    console.log('\n🎉 All CategoryMappingService integration tests passed!');
    return true;
  } catch (error) {
    console.error(
      '\n❌ CategoryMappingService integration test failed:',
      error
    );
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Test CategoryMappingService directly
async function testCategoryMappingService() {
  console.log('\n🔧 Testing CategoryMappingService directly:\n');

  try {
    const { default: CategoryMappingService } = await import(
      `file:///${join(projectRoot, 'src/services/CategoryMappingService.js').replace(/\\/g, '/')}`
    );

    const mockSpecializationService = new MockSpecializationService();
    const service = new CategoryMappingService(mockSpecializationService);

    // Test various quiz formats
    const testQuizzes = [
      { id: 'quiz-1', category: 'BP-DPA-01', title: 'DPA Quiz' },
      { id: 'quiz-2', categoryId: 'BP-01', title: 'AE Quiz' },
      { id: 'quiz-3', threeTierCategory: 'allgemein', title: 'General Quiz' },
      { id: 'quiz-4', title: 'No Category Quiz' },
      { id: 'quiz-5', category: 'FÜ-01', title: 'General Content' },
    ];

    for (const quiz of testQuizzes) {
      const result = service.mapToThreeTierCategory(quiz);
      console.log(`Quiz: ${quiz.title}`);
      console.log(
        `  Input: ${quiz.category || quiz.categoryId || quiz.threeTierCategory || 'none'}`
      );
      console.log(`  Mapped to: ${result.threeTierCategory}`);
      console.log(
        `  Rule applied: ${result.appliedRule?.description || 'none'}`
      );
      console.log(`  Reason: ${result.reason}`);
      console.log('');
    }

    console.log('✅ CategoryMappingService direct tests passed!');
    return true;
  } catch (error) {
    console.error('❌ CategoryMappingService direct test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting CategoryMappingService Integration Tests\n');

  const serviceTest = await testCategoryMappingService();
  const integrationTest = await testCategoryMappingIntegration();

  if (serviceTest && integrationTest) {
    console.log('\n🎉 All tests passed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
