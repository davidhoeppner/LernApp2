// @ts-nocheck
/* eslint-env node */
/**
 * Test script to verify quiz filtering fix
 * Tests that quizzes get proper three-tier category mapping
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock StateManager for testing
class MockStateManager {
  constructor() {
    this.state = {};
  }

  getState(key) {
    return this.state[key];
  }

  setState(key, value) {
    this.state[key] = value;
  }
}

// Mock StorageService for testing
class MockStorageService {
  constructor() {
    this.storage = new Map();
  }

  get(key) {
    return this.storage.get(key);
  }

  set(key, value) {
    this.storage.set(key, value);
  }
}

// Mock SpecializationService for testing
class MockSpecializationService {
  getCategoryRelevance(categoryId, specializationId) {
    // Mock relevance mapping
    if (categoryId && categoryId.includes('dpa')) {
      return specializationId === 'daten-prozessanalyse' ? 'high' : 'low';
    }
    if (categoryId && categoryId.includes('ae')) {
      return specializationId === 'anwendungsentwicklung' ? 'high' : 'low';
    }
    return 'medium';
  }
}

async function testQuizCategoryMapping() {
  console.log('🧪 Testing Quiz Category Mapping Integration...');

  try {
    // Import services
    const { default: CategoryMappingService } = await import(
      '../src/services/CategoryMappingService.js'
    );
    const { default: IHKContentService } = await import(
      '../src/services/IHKContentService.js'
    );

    // Create mock services
    const mockStateManager = new MockStateManager();
    const mockStorageService = new MockStorageService();
    const mockSpecializationService = new MockSpecializationService();

    // Create CategoryMappingService
    const categoryMappingService = new CategoryMappingService(
      mockSpecializationService
    );

    // Create IHKContentService with CategoryMappingService
    const ihkContentService = new IHKContentService(
      mockStateManager,
      mockStorageService,
      mockSpecializationService,
      categoryMappingService
    );

    console.log('✅ Services created successfully');

    // Load quizzes
    const quizzes = await ihkContentService.getAllQuizzes();
    console.log(`📊 Loaded ${quizzes.length} quizzes`);

    // Check if quizzes have three-tier category mapping
    const quizzesWithThreeTier = quizzes.filter(q => q.threeTierCategory);
    console.log(
      `🎯 Quizzes with threeTierCategory: ${quizzesWithThreeTier.length}`
    );

    if (quizzesWithThreeTier.length > 0) {
      console.log(
        '✅ SUCCESS: Quizzes are getting three-tier category mapping!'
      );

      // Show sample quiz structure
      const sampleQuiz = quizzesWithThreeTier[0];
      console.log('\n📋 Sample quiz with three-tier mapping:');
      console.log(`  ID: ${sampleQuiz.id}`);
      console.log(`  Title: ${sampleQuiz.title}`);
      console.log(
        `  Original Category: ${sampleQuiz.category || sampleQuiz.categoryId}`
      );
      console.log(`  Three-Tier Category: ${sampleQuiz.threeTierCategory}`);
      console.log(
        `  Category Info: ${sampleQuiz.categoryMapping?.categoryInfo?.name || 'N/A'}`
      );

      // Test category distribution
      const categoryDistribution = {};
      quizzesWithThreeTier.forEach(quiz => {
        const category = quiz.threeTierCategory;
        categoryDistribution[category] =
          (categoryDistribution[category] || 0) + 1;
      });

      console.log('\n📈 Category Distribution:');
      Object.entries(categoryDistribution).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} quizzes`);
      });

      // Test filtering functionality
      console.log('\n🔍 Testing filtering functionality...');

      const dpaQuizzes = quizzes.filter(
        quiz => quiz.threeTierCategory === 'daten-prozessanalyse'
      );
      const aeQuizzes = quizzes.filter(
        quiz => quiz.threeTierCategory === 'anwendungsentwicklung'
      );
      const generalQuizzes = quizzes.filter(
        quiz => quiz.threeTierCategory === 'allgemein'
      );

      console.log(`  DPA Quizzes: ${dpaQuizzes.length}`);
      console.log(`  AE Quizzes: ${aeQuizzes.length}`);
      console.log(`  General Quizzes: ${generalQuizzes.length}`);

      if (
        dpaQuizzes.length > 0 &&
        aeQuizzes.length > 0 &&
        generalQuizzes.length > 0
      ) {
        console.log(
          '✅ SUCCESS: All three categories have quizzes - filtering should work!'
        );
      } else {
        console.log(
          '⚠️  WARNING: Some categories are empty - check mapping rules'
        );
      }
    } else {
      console.log('❌ FAILURE: No quizzes have three-tier category mapping');
      console.log(
        '   This means the CategoryMappingService is not being applied correctly'
      );

      // Show sample quiz without mapping
      if (quizzes.length > 0) {
        const sampleQuiz = quizzes[0];
        console.log('\n📋 Sample quiz without three-tier mapping:');
        console.log(`  ID: ${sampleQuiz.id}`);
        console.log(`  Title: ${sampleQuiz.title}`);
        console.log(
          `  Category: ${sampleQuiz.category || sampleQuiz.categoryId || 'N/A'}`
        );
        console.log(
          `  Has threeTierCategory: ${!!sampleQuiz.threeTierCategory}`
        );
        console.log(`  Has categoryMapping: ${!!sampleQuiz.categoryMapping}`);
      }
    }
  } catch (error) {
    console.error('❌ Error during test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
console.log('🚀 Starting Quiz Category Mapping Test...');
testQuizCategoryMapping()
  .then(() => {
    console.log('\n✅ Test completed');
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
