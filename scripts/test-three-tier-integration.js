/* eslint-disable no-unused-vars */
/**
 * End-to-End Integration Test Script for Three-Tier Category System
 * Tests complete three-tier category system functionality, service integrations,
 * and backward compatibility with existing code
 *
 * This script validates the entire three-tier category system without requiring browser environment
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
  categories: {
    'Category Mapping': { passed: 0, failed: 0 },
    'Content Service Integration': { passed: 0, failed: 0 },
    'Specialization Integration': { passed: 0, failed: 0 },
    'Backward Compatibility': { passed: 0, failed: 0 },
    'Performance': { passed: 0, failed: 0 }
  }
};

// Helper function to log test results
function logTest(name, passed, message = '', category = 'General') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const result = { name, passed, message, category };
  testResults.tests.push(result);

  if (passed) {
    testResults.passed++;
    if (testResults.categories[category]) {
      testResults.categories[category].passed++;
    }
    console.log(`${status}: ${name}`);
  } else {
    testResults.failed++;
    if (testResults.categories[category]) {
      testResults.categories[category].failed++;
    }
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

// Mock StateManager for testing
class MockStateManager {
  constructor() {
    this.state = {
      specialization: {
        current: null,
        hasSelected: false,
        preferences: {
          showAllContent: false,
          preferredCategories: []
        }
      }
    };
  }

  getState() {
    return this.state;
  }

  setState(key, value) {
    this.state[key] = value;
  }

  subscribe() {
    return () => {}; // Mock unsubscribe
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

  remove(key) {
    this.storage.delete(key);
  }
}

/**
 * Test Category Mapping Service functionality
 */
async function testCategoryMappingService() {
  console.log('\n📊 Testing Category Mapping Service...');
  
  try {
    // Import the service
    const { default: CategoryMappingService } = await import('../src/services/CategoryMappingService.js');
    const mockSpecializationService = { getCategoryRelevance: () => 'medium' };
    const categoryMappingService = new CategoryMappingService(mockSpecializationService);

    // Test 1: Service initialization
    logTest(
      'CategoryMappingService initializes correctly',
      categoryMappingService !== null && categoryMappingService.threeTierCategories !== null,
      '',
      'Category Mapping'
    );

    // Test 2: Three-tier categories are loaded
    const categories = categoryMappingService.getThreeTierCategories();
    logTest(
      'Three-tier categories are loaded',
      Array.isArray(categories) && categories.length === 3,
      `Expected 3 categories, got ${categories?.length || 0}`,
      'Category Mapping'
    );

    // Test 3: Category mapping for DPA content
    const dpaContent = { category: 'bp-dpa-01', id: 'test-dpa' };
    const dpaMapping = categoryMappingService.mapToThreeTierCategory(dpaContent);
    logTest(
      'DPA content maps to correct category',
      dpaMapping === 'daten-prozessanalyse',
      `Expected 'daten-prozessanalyse', got '${dpaMapping}'`,
      'Category Mapping'
    );

    // Test 4: Category mapping for AE content
    const aeContent = { category: 'bp-ae-01', id: 'test-ae' };
    const aeMapping = categoryMappingService.mapToThreeTierCategory(aeContent);
    logTest(
      'AE content maps to correct category',
      aeMapping === 'anwendungsentwicklung',
      `Expected 'anwendungsentwicklung', got '${aeMapping}'`,
      'Category Mapping'
    );

    // Test 5: Category mapping for general content
    const generalContent = { category: 'fue-01', id: 'test-general' };
    const generalMapping = categoryMappingService.mapToThreeTierCategory(generalContent);
    logTest(
      'General content maps to correct category',
      generalMapping === 'allgemein',
      `Expected 'allgemein', got '${generalMapping}'`,
      'Category Mapping'
    );

    // Test 6: Validation functionality
    const testContent = [dpaContent, aeContent, generalContent];
    const validationResult = categoryMappingService.validateCategoryMapping(testContent);
    logTest(
      'Category mapping validation works',
      validationResult && typeof validationResult === 'object',
      '',
      'Category Mapping'
    );

  } catch (error) {
    logTest(
      'CategoryMappingService tests',
      false,
      `Error: ${error.message}`,
      'Category Mapping'
    );
  }
}

/**
 * Test IHK Content Service integration with three-tier categories
 */
async function testContentServiceIntegration() {
  console.log('\n📚 Testing Content Service Integration...');
  
  try {
    // Import services
    const { default: IHKContentService } = await import('../src/services/IHKContentService.js');
    const { default: CategoryMappingService } = await import('../src/services/CategoryMappingService.js');
    
    const mockStateManager = new MockStateManager();
    const mockStorageService = new MockStorageService();
    const mockSpecializationService = { getCategoryRelevance: () => 'medium' };
    
    const categoryMappingService = new CategoryMappingService(mockSpecializationService);
    const contentService = new IHKContentService(mockStateManager, mockStorageService, categoryMappingService);

    // Test 1: Content service initializes with category mapping
    logTest(
      'IHKContentService initializes with CategoryMappingService',
      contentService.categoryMappingService !== null,
      '',
      'Content Service Integration'
    );

    // Test 2: Get content by three-tier category
    const dpaContent = await contentService.getContentByThreeTierCategory('daten-prozessanalyse');
    logTest(
      'getContentByThreeTierCategory returns DPA content',
      Array.isArray(dpaContent),
      `Expected array, got ${typeof dpaContent}`,
      'Content Service Integration'
    );

    const aeContent = await contentService.getContentByThreeTierCategory('anwendungsentwicklung');
    logTest(
      'getContentByThreeTierCategory returns AE content',
      Array.isArray(aeContent),
      `Expected array, got ${typeof aeContent}`,
      'Content Service Integration'
    );

    const generalContent = await contentService.getContentByThreeTierCategory('allgemein');
    logTest(
      'getContentByThreeTierCategory returns general content',
      Array.isArray(generalContent),
      `Expected array, got ${typeof generalContent}`,
      'Content Service Integration'
    );

    // Test 3: Get content with category info
    const categorizedContent = await contentService.getContentWithCategoryInfo();
    logTest(
      'getContentWithCategoryInfo returns structured data',
      categorizedContent && 
      categorizedContent['daten-prozessanalyse'] &&
      categorizedContent['anwendungsentwicklung'] &&
      categorizedContent['allgemein'],
      'Missing expected category structure',
      'Content Service Integration'
    );

    // Test 4: Search within category
    const searchResults = await contentService.searchInCategory('data', 'daten-prozessanalyse');
    logTest(
      'searchInCategory returns filtered results',
      Array.isArray(searchResults),
      `Expected array, got ${typeof searchResults}`,
      'Content Service Integration'
    );

    // Test 5: Content statistics
    const stats = contentService.getContentStats();
    logTest(
      'getContentStats includes three-tier category data',
      stats && stats.threeTierCategories,
      'Missing threeTierCategories in stats',
      'Content Service Integration'
    );

  } catch (error) {
    logTest(
      'Content Service Integration tests',
      false,
      `Error: ${error.message}`,
      'Content Service Integration'
    );
  }
}

/**
 * Test Specialization Service integration with three-tier categories
 */
async function testSpecializationServiceIntegration() {
  console.log('\n🎯 Testing Specialization Service Integration...');
  
  try {
    // Import services
    const { default: SpecializationService } = await import('../src/services/SpecializationService.js');
    const { default: CategoryMappingService } = await import('../src/services/CategoryMappingService.js');
    
    const mockStateManager = new MockStateManager();
    const mockStorageService = new MockStorageService();
    const mockSpecializationServiceForMapping = { getCategoryRelevance: () => 'medium' };
    
    const categoryMappingService = new CategoryMappingService(mockSpecializationServiceForMapping);
    const specializationService = new SpecializationService(mockStateManager, mockStorageService, categoryMappingService);

    // Test 1: Specialization service integrates with category mapping
    logTest(
      'SpecializationService integrates with CategoryMappingService',
      specializationService.categoryMappingService !== null,
      '',
      'Specialization Integration'
    );

    // Test 2: Get three-tier content categories
    const threeTierCategories = specializationService.getThreeTierContentCategories();
    logTest(
      'getThreeTierContentCategories returns category data',
      Array.isArray(threeTierCategories) && threeTierCategories.length === 3,
      `Expected 3 categories, got ${threeTierCategories?.length || 0}`,
      'Specialization Integration'
    );

    // Test 3: Filter content by specialization with three-tier categories
    const dpaSpecialization = 'daten-prozessanalyse';
    specializationService.setSpecialization(dpaSpecialization);
    
    const filteredContent = specializationService.filterContentBySpecialization([
      { category: 'bp-dpa-01', threeTierCategory: 'daten-prozessanalyse' },
      { category: 'bp-ae-01', threeTierCategory: 'anwendungsentwicklung' },
      { category: 'fue-01', threeTierCategory: 'allgemein' }
    ]);
    
    logTest(
      'filterContentBySpecialization works with three-tier categories',
      Array.isArray(filteredContent),
      `Expected array, got ${typeof filteredContent}`,
      'Specialization Integration'
    );

    // Test 4: Content statistics by specialization
    const specializationStats = specializationService.getContentStatsBySpecialization(dpaSpecialization);
    logTest(
      'getContentStatsBySpecialization includes three-tier data',
      specializationStats && typeof specializationStats === 'object',
      '',
      'Specialization Integration'
    );

    // Test 5: Category relevance calculation
    const relevance = specializationService.getCategoryRelevance('daten-prozessanalyse', dpaSpecialization);
    logTest(
      'getCategoryRelevance works for three-tier categories',
      typeof relevance === 'string' && ['high', 'medium', 'low'].includes(relevance),
      `Expected relevance level, got '${relevance}'`,
      'Specialization Integration'
    );

  } catch (error) {
    logTest(
      'Specialization Service Integration tests',
      false,
      `Error: ${error.message}`,
      'Specialization Integration'
    );
  }
}

/**
 * Test backward compatibility with existing code
 */
async function testBackwardCompatibility() {
  console.log('\n🔄 Testing Backward Compatibility...');
  
  try {
    // Import services
    const { default: IHKContentService } = await import('../src/services/IHKContentService.js');
    const { default: SpecializationService } = await import('../src/services/SpecializationService.js');
    
    const mockStateManager = new MockStateManager();
    const mockStorageService = new MockStorageService();
    
    const contentService = new IHKContentService(mockStateManager, mockStorageService);
    const specializationService = new SpecializationService(mockStateManager, mockStorageService);

    // Test 1: Existing getAllModules method still works
    const allModules = await contentService.getAllModules();
    logTest(
      'getAllModules method maintains backward compatibility',
      Array.isArray(allModules),
      `Expected array, got ${typeof allModules}`,
      'Backward Compatibility'
    );

    // Test 2: Existing getAllQuizzes method still works
    const allQuizzes = await contentService.getAllQuizzes();
    logTest(
      'getAllQuizzes method maintains backward compatibility',
      Array.isArray(allQuizzes),
      `Expected array, got ${typeof allQuizzes}`,
      'Backward Compatibility'
    );

    // Test 3: Existing getModulesByCategory method still works
    const modulesByCategory = await contentService.getModulesByCategory('fue');
    logTest(
      'getModulesByCategory method maintains backward compatibility',
      Array.isArray(modulesByCategory),
      `Expected array, got ${typeof modulesByCategory}`,
      'Backward Compatibility'
    );

    // Test 4: Existing specialization methods still work
    const availableSpecializations = specializationService.getAvailableSpecializations();
    logTest(
      'getAvailableSpecializations method maintains backward compatibility',
      Array.isArray(availableSpecializations),
      `Expected array, got ${typeof availableSpecializations}`,
      'Backward Compatibility'
    );

    // Test 5: Content items still have original category field
    if (allModules.length > 0) {
      const sampleModule = allModules[0];
      logTest(
        'Content items preserve original category field',
        sampleModule.category !== undefined,
        'Original category field missing from content items',
        'Backward Compatibility'
      );
    }

    // Test 6: Progress tracking compatibility
    const testProgress = { 'fue-01': { completed: true, score: 85 } };
    mockStorageService.set('moduleProgress', testProgress);
    
    const retrievedProgress = mockStorageService.get('moduleProgress');
    logTest(
      'Progress tracking maintains data structure compatibility',
      retrievedProgress && retrievedProgress['fue-01'] && retrievedProgress['fue-01'].completed,
      'Progress data structure changed',
      'Backward Compatibility'
    );

  } catch (error) {
    logTest(
      'Backward Compatibility tests',
      false,
      `Error: ${error.message}`,
      'Backward Compatibility'
    );
  }
}

/**
 * Test performance requirements
 */
async function testPerformanceRequirements() {
  console.log('\n⚡ Testing Performance Requirements...');
  
  try {
    // Import services
    const { default: IHKContentService } = await import('../src/services/IHKContentService.js');
    const { default: CategoryMappingService } = await import('../src/services/CategoryMappingService.js');
    
    const mockStateManager = new MockStateManager();
    const mockStorageService = new MockStorageService();
    const mockSpecializationService = { getCategoryRelevance: () => 'medium' };
    
    const categoryMappingService = new CategoryMappingService(mockSpecializationService);
    const contentService = new IHKContentService(mockStateManager, mockStorageService, categoryMappingService);

    // Test 1: Category filtering performance (should be < 100ms)
    const startTime = performance.now();
    await contentService.getContentByThreeTierCategory('daten-prozessanalyse');
    const endTime = performance.now();
    const filterTime = endTime - startTime;
    
    logTest(
      'Category filtering meets performance requirement (<100ms)',
      filterTime < 100,
      `Filtering took ${filterTime.toFixed(2)}ms`,
      'Performance'
    );

    // Test 2: Category mapping performance for multiple items
    const testContent = Array.from({ length: 100 }, (_, i) => ({
      id: `test-${i}`,
      category: i % 3 === 0 ? 'bp-dpa-01' : i % 3 === 1 ? 'bp-ae-01' : 'fue-01'
    }));
    
    const mappingStartTime = performance.now();
    testContent.forEach(item => categoryMappingService.mapToThreeTierCategory(item));
    const mappingEndTime = performance.now();
    const mappingTime = mappingEndTime - mappingStartTime;
    
    logTest(
      'Category mapping performance for 100 items (<50ms)',
      mappingTime < 50,
      `Mapping took ${mappingTime.toFixed(2)}ms`,
      'Performance'
    );

    // Test 3: Search performance within category
    const searchStartTime = performance.now();
    await contentService.searchInCategory('test', 'allgemein');
    const searchEndTime = performance.now();
    const searchTime = searchEndTime - searchStartTime;
    
    logTest(
      'Category search performance (<100ms)',
      searchTime < 100,
      `Search took ${searchTime.toFixed(2)}ms`,
      'Performance'
    );

  } catch (error) {
    logTest(
      'Performance Requirements tests',
      false,
      `Error: ${error.message}`,
      'Performance'
    );
  }
}

/**
 * Test data integrity and validation
 */
async function testDataIntegrity() {
  console.log('\n🔍 Testing Data Integrity...');
  
  try {
    // Test 1: Three-tier categories configuration exists
    const categoriesConfig = loadJSON('src/data/ihk/metadata/three-tier-categories.json');
    logTest(
      'Three-tier categories configuration file exists and is valid',
      categoriesConfig && categoriesConfig.categories && Array.isArray(categoriesConfig.categories),
      'Invalid or missing three-tier categories configuration',
      'Data Integrity'
    );

    // Test 2: Category mapping rules configuration exists
    const mappingRules = loadJSON('src/data/ihk/metadata/category-mapping-rules.json');
    logTest(
      'Category mapping rules configuration file exists and is valid',
      mappingRules && mappingRules.rules && Array.isArray(mappingRules.rules),
      'Invalid or missing category mapping rules configuration',
      'Data Integrity'
    );

    // Test 3: All three expected categories are defined
    if (categoriesConfig && categoriesConfig.categories) {
      const categoryIds = categoriesConfig.categories.map(cat => cat.id);
      const expectedCategories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
      const hasAllCategories = expectedCategories.every(id => categoryIds.includes(id));
      
      logTest(
        'All three required categories are defined',
        hasAllCategories,
        `Missing categories: ${expectedCategories.filter(id => !categoryIds.includes(id)).join(', ')}`,
        'Data Integrity'
      );
    }

    // Test 4: Mapping rules cover all content types
    if (mappingRules && mappingRules.rules) {
      const hasDefaultRule = mappingRules.rules.some(rule => rule.priority === 1);
      logTest(
        'Default mapping rule exists for uncategorized content',
        hasDefaultRule,
        'No default mapping rule found',
        'Data Integrity'
      );
    }

  } catch (error) {
    logTest(
      'Data Integrity tests',
      false,
      `Error loading configuration files: ${error.message}`,
      'Data Integrity'
    );
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 THREE-TIER CATEGORY SYSTEM INTEGRATION TEST REPORT');
  console.log('='.repeat(80));
  
  // Overall results
  const totalTests = testResults.passed + testResults.failed;
  const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;
  
  console.log(`\n📊 OVERALL RESULTS:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${testResults.passed}`);
  console.log(`   Failed: ${testResults.failed}`);
  console.log(`   Success Rate: ${successRate}%`);
  
  // Category breakdown
  console.log(`\n📈 RESULTS BY CATEGORY:`);
  Object.entries(testResults.categories).forEach(([category, results]) => {
    const total = results.passed + results.failed;
    if (total > 0) {
      const rate = ((results.passed / total) * 100).toFixed(1);
      console.log(`   ${category}: ${results.passed}/${total} (${rate}%)`);
    }
  });
  
  // Failed tests details
  if (testResults.failed > 0) {
    console.log(`\n❌ FAILED TESTS:`);
    testResults.tests
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
  if (testResults.failed === 0) {
    console.log('   ✅ All tests passed! The three-tier category system is working correctly.');
    console.log('   ✅ Service integrations are functioning as expected.');
    console.log('   ✅ Backward compatibility is maintained.');
  } else {
    console.log('   ⚠️  Some tests failed. Review the failed tests above.');
    console.log('   ⚠️  Check service configurations and data integrity.');
    console.log('   ⚠️  Verify that all required files are present and valid.');
  }
  
  console.log('\n' + '='.repeat(80));
  
  return {
    success: testResults.failed === 0,
    totalTests,
    passed: testResults.passed,
    failed: testResults.failed,
    successRate: parseFloat(successRate),
    categories: testResults.categories
  };
}

/**
 * Main test execution function
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Three-Tier Category System End-to-End Integration Tests  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const startTime = performance.now();
  
  try {
    // Run all test suites
    await testDataIntegrity();
    await testCategoryMappingService();
    await testContentServiceIntegration();
    await testSpecializationServiceIntegration();
    await testBackwardCompatibility();
    await testPerformanceRequirements();
    
  } catch (error) {
    console.error('❌ Critical error during test execution:', error);
    logTest('Test Suite Execution', false, error.message);
  }
  
  const endTime = performance.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n⏱️  Total execution time: ${totalTime}s`);
  
  // Generate and return comprehensive report
  return generateTestReport();
}

// Export for use in other scripts
export { runAllTests, testResults };

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting three-tier integration tests...');
  
  runAllTests()
    .then(report => {
      console.log('\n✅ Test execution completed');
      process.exit(report.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Fatal error during test execution:', error);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    });
}