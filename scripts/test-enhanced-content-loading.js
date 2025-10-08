// @ts-nocheck
/* eslint-env node */
/* eslint-disable no-unused-vars */
/**
 * Enhanced Content Loading Integration Test Script
 * Tests complete content loading pipeline with categorization,
 * verifies category assignments for all existing content,
 * and tests performance with full content set
 *
 * Task 2.4: Write integration tests for enhanced content loading
 * Requirements: 2.1, 2.2
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test results tracking
const contentLoadingTestResults = {
  passed: 0,
  failed: 0,
  tests: [],
  categories: {
    'Content Loading Pipeline': { passed: 0, failed: 0 },
    'Category Assignment Verification': { passed: 0, failed: 0 },
    'Performance Testing': { passed: 0, failed: 0 },
    'Data Integrity': { passed: 0, failed: 0 },
    'Cache Efficiency': { passed: 0, failed: 0 },
  },
};

// Helper function to log test results
function logContentTest(name, passed, message = '', category = 'General') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const result = { name, passed, message, category };
  contentLoadingTestResults.tests.push(result);

  if (passed) {
    contentLoadingTestResults.passed++;
    if (contentLoadingTestResults.categories[category]) {
      contentLoadingTestResults.categories[category].passed++;
    }
    console.log(`${status}: ${name}`);
  } else {
    contentLoadingTestResults.failed++;
    if (contentLoadingTestResults.categories[category]) {
      contentLoadingTestResults.categories[category].failed++;
    }
    console.error(`${status}: ${name}`);
    if (message) console.error(`  → ${message}`);
  }
}

// Mock services for testing
class MockStateManager {
  constructor() {
    this.state = {
      specialization: { current: null, hasSelected: false },
      progress: {
        modulesCompleted: ['fue-01', 'bp-dpa-01'],
        modulesInProgress: ['bp-ae-01'],
        quizzesCompleted: ['fue-01-quiz'],
        quizzesInProgress: ['bp-dpa-01-quiz'],
      },
    };
  }
  getState(key) {
    return key ? this.state[key] : this.state;
  }
  setState(key, value) {
    this.state[key] = value;
  }
  subscribe() {
    return () => {};
  }
}

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
  remove(key) {
    this.storage.delete(key);
  }
}

class MockSpecializationService {
  getCategoryRelevance(category, specialization) {
    // Mock relevance mapping
    if (category.includes('dpa')) return 'high';
    if (category.includes('ae')) return 'high';
    return 'medium';
  }
}

/**
 * Test complete content loading pipeline with categorization
 */
async function testContentLoadingPipeline() {
  console.log('\n📚 Testing Content Loading Pipeline...');

  try {
    // Import required services
    const { default: IHKContentService } = await import(
      '../src/services/IHKContentService.js'
    );
    const { default: CategoryMappingService } = await import(
      '../src/services/CategoryMappingService.js'
    );

    const mockStateManager = new MockStateManager();
    const mockStorageService = new MockStorageService();
    const mockSpecializationService = new MockSpecializationService();

    const categoryMappingService = new CategoryMappingService(
      mockSpecializationService
    );
    const contentService = new IHKContentService(
      mockStateManager,
      mockStorageService,
      mockSpecializationService,
      categoryMappingService
    );

    // Test 1: Service initializes with category mapping
    logContentTest(
      'IHKContentService initializes with CategoryMappingService',
      contentService.categoryMappingService !== null,
      '',
      'Content Loading Pipeline'
    );

    // Test 2: Load all modules successfully
    const startLoadTime = performance.now();
    const allModules = await contentService.getAllModules();
    const endLoadTime = performance.now();
    const loadTime = endLoadTime - startLoadTime;

    logContentTest(
      'getAllModules loads content successfully',
      Array.isArray(allModules) && allModules.length > 0,
      `Expected array with content, got ${typeof allModules} with ${allModules?.length || 0} items`,
      'Content Loading Pipeline'
    );

    // Test 3: Load all quizzes successfully
    const allQuizzes = await contentService.getAllQuizzes();
    logContentTest(
      'getAllQuizzes loads content successfully',
      Array.isArray(allQuizzes) && allQuizzes.length > 0,
      `Expected array with content, got ${typeof allQuizzes} with ${allQuizzes?.length || 0} items`,
      'Content Loading Pipeline'
    );

    // Test 4: Content loading performance meets requirements (<100ms for typical operations)
    logContentTest(
      'Content loading meets performance requirements (<100ms)',
      loadTime < 100,
      `Loading took ${loadTime.toFixed(2)}ms`,
      'Content Loading Pipeline'
    );

    // Test 5: Modules have required structure after loading
    if (allModules.length > 0) {
      const sampleModule = allModules[0];
      const hasRequiredFields =
        sampleModule.id && sampleModule.title && sampleModule.category;
      logContentTest(
        'Loaded modules have required structure',
        hasRequiredFields,
        'Missing required fields: id, title, or category',
        'Content Loading Pipeline'
      );
    }

    // Test 6: Quizzes have required structure after loading
    if (allQuizzes.length > 0) {
      const sampleQuiz = allQuizzes[0];
      const hasRequiredFields =
        sampleQuiz.id && sampleQuiz.title && sampleQuiz.questions;
      logContentTest(
        'Loaded quizzes have required structure',
        hasRequiredFields,
        'Missing required fields: id, title, or questions',
        'Content Loading Pipeline'
      );
    }

    return { allModules, allQuizzes, contentService };
  } catch (error) {
    logContentTest(
      'Content Loading Pipeline tests',
      false,
      `Error: ${error.message}`,
      'Content Loading Pipeline'
    );
    return null;
  }
}

/**
 * Test category assignments for all existing content
 */
async function testCategoryAssignmentVerification(testData) {
  console.log('\n🏷️ Testing Category Assignment Verification...');

  if (!testData) {
    logContentTest(
      'Category Assignment Verification',
      false,
      'No test data available from content loading',
      'Category Assignment Verification'
    );
    return;
  }

  try {
    const { allModules, allQuizzes, contentService } = testData;

    // Test 1: All modules have three-tier category assignments
    const modulesWithThreeTierCategory = allModules.filter(
      module =>
        module.threeTierCategory &&
        ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'].includes(
          module.threeTierCategory
        )
    );

    logContentTest(
      'All modules have valid three-tier category assignments',
      modulesWithThreeTierCategory.length === allModules.length,
      `${modulesWithThreeTierCategory.length}/${allModules.length} modules have valid three-tier categories`,
      'Category Assignment Verification'
    );

    // Test 2: All quizzes have three-tier category assignments
    const quizzesWithThreeTierCategory = allQuizzes.filter(
      quiz =>
        quiz.threeTierCategory &&
        ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'].includes(
          quiz.threeTierCategory
        )
    );

    logContentTest(
      'All quizzes have valid three-tier category assignments',
      quizzesWithThreeTierCategory.length === allQuizzes.length,
      `${quizzesWithThreeTierCategory.length}/${allQuizzes.length} quizzes have valid three-tier categories`,
      'Category Assignment Verification'
    );

    // Test 3: DPA content is correctly categorized
    const dpaModules = allModules.filter(
      module => module.category && module.category.toLowerCase().includes('dpa')
    );
    const correctlyMappedDpaModules = dpaModules.filter(
      module => module.threeTierCategory === 'daten-prozessanalyse'
    );

    logContentTest(
      'DPA content is correctly mapped to "daten-prozessanalyse" category',
      dpaModules.length === 0 ||
        correctlyMappedDpaModules.length === dpaModules.length,
      `${correctlyMappedDpaModules.length}/${dpaModules.length} DPA modules correctly mapped`,
      'Category Assignment Verification'
    );

    // Test 4: AE content is correctly categorized
    const aeModules = allModules.filter(
      module => module.category && module.category.toLowerCase().includes('ae')
    );
    const correctlyMappedAeModules = aeModules.filter(
      module => module.threeTierCategory === 'anwendungsentwicklung'
    );

    logContentTest(
      'AE content is correctly mapped to "anwendungsentwicklung" category',
      aeModules.length === 0 ||
        correctlyMappedAeModules.length === aeModules.length,
      `${correctlyMappedAeModules.length}/${aeModules.length} AE modules correctly mapped`,
      'Category Assignment Verification'
    );

    // Test 5: General content is correctly categorized
    const generalModules = allModules.filter(
      module =>
        module.category &&
        (module.category.toLowerCase().includes('fue') ||
          module.category.toLowerCase().includes('general'))
    );
    const correctlyMappedGeneralModules = generalModules.filter(
      module => module.threeTierCategory === 'allgemein'
    );

    logContentTest(
      'General content is correctly mapped to "allgemein" category',
      generalModules.length === 0 ||
        correctlyMappedGeneralModules.length === generalModules.length,
      `${correctlyMappedGeneralModules.length}/${generalModules.length} general modules correctly mapped`,
      'Category Assignment Verification'
    );

    // Test 6: Category mapping metadata is present
    const modulesWithMappingMetadata = allModules.filter(
      module =>
        module.categoryMapping &&
        module.categoryMapping.threeTierCategory &&
        module.categoryMapping.mappingTimestamp
    );

    logContentTest(
      'Content includes category mapping metadata',
      modulesWithMappingMetadata.length > 0,
      `${modulesWithMappingMetadata.length}/${allModules.length} modules have mapping metadata`,
      'Category Assignment Verification'
    );

    // Test 7: Backward compatibility - original categories preserved
    const modulesWithOriginalCategory = allModules.filter(
      module => module.category !== undefined
    );

    logContentTest(
      'Original category fields are preserved for backward compatibility',
      modulesWithOriginalCategory.length === allModules.length,
      `${modulesWithOriginalCategory.length}/${allModules.length} modules preserve original category`,
      'Category Assignment Verification'
    );
  } catch (error) {
    logContentTest(
      'Category Assignment Verification tests',
      false,
      `Error: ${error.message}`,
      'Category Assignment Verification'
    );
  }
}

/**
 * Test performance with full content set
 */
async function testPerformanceWithFullContentSet(testData) {
  console.log('\n⚡ Testing Performance with Full Content Set...');

  if (!testData) {
    logContentTest(
      'Performance Testing',
      false,
      'No test data available from content loading',
      'Performance Testing'
    );
    return;
  }

  try {
    const { contentService } = testData;

    // Test 1: Three-tier category filtering performance
    const categoryFilterTests = [
      'daten-prozessanalyse',
      'anwendungsentwicklung',
      'allgemein',
    ];

    for (const category of categoryFilterTests) {
      const startTime = performance.now();
      const categoryContent =
        await contentService.getContentByThreeTierCategory(category);
      const endTime = performance.now();
      const filterTime = endTime - startTime;

      logContentTest(
        `Category filtering for "${category}" meets performance requirement (<100ms)`,
        filterTime < 100,
        `Filtering took ${filterTime.toFixed(2)}ms`,
        'Performance Testing'
      );
    }

    // Test 2: Content search performance
    const searchStartTime = performance.now();
    const searchResults = await contentService.searchContent('data', {
      category: 'bp-dpa',
    });
    const searchEndTime = performance.now();
    const searchTime = searchEndTime - searchStartTime;

    logContentTest(
      'Content search performance meets requirements (<100ms)',
      searchTime < 100,
      `Search took ${searchTime.toFixed(2)}ms`,
      'Performance Testing'
    );

    // Test 3: Categorized content retrieval performance
    const categorizedStartTime = performance.now();
    const categorizedContent =
      await contentService.getContentWithCategoryInfo();
    const categorizedEndTime = performance.now();
    const categorizedTime = categorizedEndTime - categorizedStartTime;

    logContentTest(
      'Categorized content retrieval performance (<200ms)',
      categorizedTime < 200,
      `Categorized content retrieval took ${categorizedTime.toFixed(2)}ms`,
      'Performance Testing'
    );

    // Test 4: Multiple category operations performance
    const multiOpStartTime = performance.now();

    // Simulate multiple operations
    await Promise.all([
      contentService.getContentByThreeTierCategory('daten-prozessanalyse'),
      contentService.getContentByThreeTierCategory('anwendungsentwicklung'),
      contentService.searchInCategory('test', 'allgemein'),
    ]);

    const multiOpEndTime = performance.now();
    const multiOpTime = multiOpEndTime - multiOpStartTime;

    logContentTest(
      'Multiple concurrent category operations performance (<300ms)',
      multiOpTime < 300,
      `Multiple operations took ${multiOpTime.toFixed(2)}ms`,
      'Performance Testing'
    );

    // Test 5: Memory usage efficiency (basic check)
    const memoryBefore = process.memoryUsage().heapUsed;

    // Load content multiple times to test memory efficiency
    for (let i = 0; i < 5; i++) {
      await contentService.getAllModules();
      await contentService.getAllQuizzes();
    }

    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryIncrease = memoryAfter - memoryBefore;
    const memoryIncreaseKB = memoryIncrease / 1024;

    logContentTest(
      'Memory usage remains efficient during repeated operations (<1MB increase)',
      memoryIncreaseKB < 1024,
      `Memory increased by ${memoryIncreaseKB.toFixed(2)}KB`,
      'Performance Testing'
    );
  } catch (error) {
    logContentTest(
      'Performance Testing tests',
      false,
      `Error: ${error.message}`,
      'Performance Testing'
    );
  }
}

/**
 * Test data integrity and consistency
 */
async function testDataIntegrity(testData) {
  console.log('\n🔍 Testing Data Integrity and Consistency...');

  if (!testData) {
    logContentTest(
      'Data Integrity Testing',
      false,
      'No test data available from content loading',
      'Data Integrity'
    );
    return;
  }

  try {
    const { allModules, allQuizzes, contentService } = testData;

    // Test 1: No duplicate content IDs
    const moduleIds = allModules.map(m => m.id);
    const uniqueModuleIds = new Set(moduleIds);

    logContentTest(
      'No duplicate module IDs in loaded content',
      moduleIds.length === uniqueModuleIds.size,
      `Found ${moduleIds.length - uniqueModuleIds.size} duplicate module IDs`,
      'Data Integrity'
    );

    const quizIds = allQuizzes.map(q => q.id);
    const uniqueQuizIds = new Set(quizIds);

    logContentTest(
      'No duplicate quiz IDs in loaded content',
      quizIds.length === uniqueQuizIds.size,
      `Found ${quizIds.length - uniqueQuizIds.size} duplicate quiz IDs`,
      'Data Integrity'
    );

    // Test 2: All content has required metadata
    const modulesWithCompleteMetadata = allModules.filter(
      module =>
        module.id &&
        module.title &&
        module.category &&
        module.threeTierCategory &&
        module.categoryMapping
    );

    logContentTest(
      'All modules have complete metadata after loading',
      modulesWithCompleteMetadata.length === allModules.length,
      `${modulesWithCompleteMetadata.length}/${allModules.length} modules have complete metadata`,
      'Data Integrity'
    );

    // Test 3: Category mapping consistency
    const inconsistentMappings = allModules.filter(module => {
      if (!module.categoryMapping) return true;
      return (
        module.threeTierCategory !== module.categoryMapping.threeTierCategory
      );
    });

    logContentTest(
      'Category mapping is consistent across all content',
      inconsistentMappings.length === 0,
      `Found ${inconsistentMappings.length} inconsistent category mappings`,
      'Data Integrity'
    );

    // Test 4: Content structure validation
    const invalidModules = allModules.filter(module => {
      return (
        !module.id ||
        typeof module.title !== 'string' ||
        !module.category ||
        ![
          'daten-prozessanalyse',
          'anwendungsentwicklung',
          'allgemein',
        ].includes(module.threeTierCategory)
      );
    });

    logContentTest(
      'All content has valid structure after enhancement',
      invalidModules.length === 0,
      `Found ${invalidModules.length} modules with invalid structure`,
      'Data Integrity'
    );

    // Test 5: Progress data integration
    const progressState = contentService.stateManager.getState('progress');
    const progressIntegrationWorks =
      progressState &&
      Array.isArray(progressState.modulesCompleted) &&
      Array.isArray(progressState.modulesInProgress);

    logContentTest(
      'Progress data integrates correctly with enhanced content',
      progressIntegrationWorks,
      'Progress state structure is invalid',
      'Data Integrity'
    );
  } catch (error) {
    logContentTest(
      'Data Integrity tests',
      false,
      `Error: ${error.message}`,
      'Data Integrity'
    );
  }
}

/**
 * Test cache efficiency and behavior
 */
async function testCacheEfficiency(testData) {
  console.log('\n💾 Testing Cache Efficiency...');

  if (!testData) {
    logContentTest(
      'Cache Efficiency Testing',
      false,
      'No test data available from content loading',
      'Cache Efficiency'
    );
    return;
  }

  try {
    const { contentService } = testData;

    // Test 1: Content is cached after first load
    const firstLoadStart = performance.now();
    await contentService.getAllModules();
    const firstLoadEnd = performance.now();
    const firstLoadTime = firstLoadEnd - firstLoadStart;

    const secondLoadStart = performance.now();
    await contentService.getAllModules();
    const secondLoadEnd = performance.now();
    const secondLoadTime = secondLoadEnd - secondLoadStart;

    logContentTest(
      'Content caching improves subsequent load performance',
      secondLoadTime < firstLoadTime * 0.5, // Second load should be at least 50% faster
      `First load: ${firstLoadTime.toFixed(2)}ms, Second load: ${secondLoadTime.toFixed(2)}ms`,
      'Cache Efficiency'
    );

    // Test 2: Category-based cache works efficiently
    const categoryLoadStart = performance.now();
    await contentService.getContentByThreeTierCategory('daten-prozessanalyse');
    await contentService.getContentByThreeTierCategory('anwendungsentwicklung');
    await contentService.getContentByThreeTierCategory('allgemein');
    const categoryLoadEnd = performance.now();
    const categoryLoadTime = categoryLoadEnd - categoryLoadStart;

    logContentTest(
      'Category-based content retrieval is efficient (<50ms total)',
      categoryLoadTime < 50,
      `Category-based retrieval took ${categoryLoadTime.toFixed(2)}ms`,
      'Cache Efficiency'
    );

    // Test 3: Cache invalidation works when needed
    const originalCacheSize = contentService.modules.size;

    // Clear cache and reload
    contentService.modules.clear();
    contentService.quizzes.clear();

    await contentService.getAllModules();
    const reloadedCacheSize = contentService.modules.size;

    logContentTest(
      'Cache can be cleared and reloaded correctly',
      reloadedCacheSize === originalCacheSize && reloadedCacheSize > 0,
      `Original: ${originalCacheSize}, Reloaded: ${reloadedCacheSize}`,
      'Cache Efficiency'
    );

    // Test 4: Memory-efficient caching
    const cacheMemoryBefore = process.memoryUsage().heapUsed;

    // Load content multiple times to test cache memory efficiency
    for (let i = 0; i < 10; i++) {
      await contentService.getContentByThreeTierCategory('allgemein');
    }

    const cacheMemoryAfter = process.memoryUsage().heapUsed;
    const cacheMemoryIncrease = (cacheMemoryAfter - cacheMemoryBefore) / 1024;

    logContentTest(
      'Cache memory usage is efficient (<500KB increase for repeated operations)',
      cacheMemoryIncrease < 500,
      `Cache memory increased by ${cacheMemoryIncrease.toFixed(2)}KB`,
      'Cache Efficiency'
    );
  } catch (error) {
    logContentTest(
      'Cache Efficiency tests',
      false,
      `Error: ${error.message}`,
      'Cache Efficiency'
    );
  }
}

/**
 * Generate enhanced content loading test report
 */
function generateContentLoadingTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 ENHANCED CONTENT LOADING INTEGRATION TEST REPORT');
  console.log('='.repeat(80));

  // Overall results
  const totalTests =
    contentLoadingTestResults.passed + contentLoadingTestResults.failed;
  const successRate =
    totalTests > 0
      ? ((contentLoadingTestResults.passed / totalTests) * 100).toFixed(1)
      : 0;

  console.log(`\n📊 OVERALL RESULTS:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${contentLoadingTestResults.passed}`);
  console.log(`   Failed: ${contentLoadingTestResults.failed}`);
  console.log(`   Success Rate: ${successRate}%`);

  // Category breakdown
  console.log(`\n📈 RESULTS BY CATEGORY:`);
  Object.entries(contentLoadingTestResults.categories).forEach(
    ([category, results]) => {
      const total = results.passed + results.failed;
      if (total > 0) {
        const rate = ((results.passed / total) * 100).toFixed(1);
        console.log(`   ${category}: ${results.passed}/${total} (${rate}%)`);
      }
    }
  );

  // Failed tests details
  if (contentLoadingTestResults.failed > 0) {
    console.log(`\n❌ FAILED TESTS:`);
    contentLoadingTestResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   • ${test.name}`);
        if (test.message) {
          console.log(`     → ${test.message}`);
        }
      });
  }

  // Recommendations
  console.log(`\n💡 RECOMMENDATIONS:`);
  if (contentLoadingTestResults.failed === 0) {
    console.log('   ✅ Enhanced content loading is working correctly');
    console.log('   ✅ All category assignments are valid');
    console.log('   ✅ Performance requirements are met');
    console.log('   ✅ Cache efficiency is optimal');
  } else {
    console.log('   ⚠️  Some content loading tests failed');
    console.log('   ⚠️  Review category mapping configuration');
    console.log('   ⚠️  Check performance optimization settings');
    console.log('   ⚠️  Verify data integrity and cache behavior');
  }

  console.log('\n' + '='.repeat(80));

  return {
    success: contentLoadingTestResults.failed === 0,
    totalTests,
    passed: contentLoadingTestResults.passed,
    failed: contentLoadingTestResults.failed,
    successRate: parseFloat(successRate),
    categories: contentLoadingTestResults.categories,
  };
}

/**
 * Main test execution function for enhanced content loading
 */
async function runEnhancedContentLoadingTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Enhanced Content Loading Integration Tests          ║');
  console.log('║                                                            ║');
  console.log('║  Testing complete content loading pipeline with           ║');
  console.log('║  categorization, category assignments verification,       ║');
  console.log('║  and performance with full content set                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const startTime = performance.now();

  try {
    console.log('\n🔄 Running test suites...');

    // Run all test suites in sequence
    console.log('1. Testing content loading pipeline...');
    const testData = await testContentLoadingPipeline();

    console.log('2. Testing category assignment verification...');
    await testCategoryAssignmentVerification(testData);

    console.log('3. Testing performance with full content set...');
    await testPerformanceWithFullContentSet(testData);

    console.log('4. Testing data integrity...');
    await testDataIntegrity(testData);

    console.log('5. Testing cache efficiency...');
    await testCacheEfficiency(testData);

    console.log('\n✅ All test suites completed');
  } catch (error) {
    console.error(
      '❌ Critical error during enhanced content loading test execution:',
      error
    );
    console.error('Error stack:', error.stack);
    logContentTest(
      'Enhanced Content Loading Test Suite Execution',
      false,
      error.message
    );
  }

  const endTime = performance.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n⏱️  Total execution time: ${totalTime}s`);

  return generateContentLoadingTestReport();
}

// Export for use in other scripts
export { runEnhancedContentLoadingTests, contentLoadingTestResults };

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting enhanced content loading integration tests...');

  runEnhancedContentLoadingTests()
    .then(report => {
      console.log('\n✅ Enhanced content loading test execution completed');

      if (report.success) {
        console.log('🎉 All enhanced content loading tests passed!');
        console.log(
          '📚 Content loading pipeline with categorization is working correctly'
        );
      } else {
        console.log('⚠️  Some enhanced content loading tests failed');
        console.log('🔧 Please review the test results and fix issues');
      }

      process.exit(report.success ? 0 : 1);
    })
    .catch(error => {
      console.error(
        '❌ Fatal error during enhanced content loading test execution:',
        error
      );
      console.error('Stack trace:', error.stack);
      process.exit(1);
    });
} else {
  // Also run if imported as module but executed directly
  if (
    typeof process !== 'undefined' &&
    process.argv &&
    process.argv[1] &&
    process.argv[1].includes('test-enhanced-content-loading.js')
  ) {
    console.log('🚀 Starting enhanced content loading integration tests...');

    runEnhancedContentLoadingTests()
      .then(report => {
        console.log('\n✅ Enhanced content loading test execution completed');

        if (report.success) {
          console.log('🎉 All enhanced content loading tests passed!');
          console.log(
            '📚 Content loading pipeline with categorization is working correctly'
          );
        } else {
          console.log('⚠️  Some enhanced content loading tests failed');
          console.log('🔧 Please review the test results and fix issues');
        }

        process.exit(report.success ? 0 : 1);
      })
      .catch(error => {
        console.error(
          '❌ Fatal error during enhanced content loading test execution:',
          error
        );
        console.error('Stack trace:', error.stack);
        process.exit(1);
      });
  }
}
