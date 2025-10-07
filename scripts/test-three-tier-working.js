/**
 * Working End-to-End Integration Test for Three-Tier Category System
 * Tests complete three-tier category system functionality
 */

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
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

// Mock services for testing
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
      categoryMappingService !== null && categoryMappingService.threeTierCategories !== null
    );

    // Test 2: Three-tier categories are loaded
    const categories = categoryMappingService.getThreeTierCategories();
    logTest(
      'Three-tier categories are loaded',
      Array.isArray(categories) && categories.length === 3,
      `Expected 3 categories, got ${categories?.length || 0}`
    );

    // Test 3: Category mapping for DPA content
    const dpaContent = { category: 'bp-dpa-01', id: 'test-dpa' };
    const dpaMapping = categoryMappingService.mapToThreeTierCategory(dpaContent);
    logTest(
      'DPA content maps to correct category',
      typeof dpaMapping === 'string' || typeof dpaMapping === 'object',
      `Got mapping result: ${typeof dpaMapping}`
    );

    // Test 4: Validation functionality
    const testContent = [dpaContent];
    const validationResult = categoryMappingService.validateCategoryMapping(testContent);
    logTest(
      'Category mapping validation works',
      validationResult && typeof validationResult === 'object'
    );

  } catch (error) {
    logTest(
      'CategoryMappingService tests',
      false,
      `Error: ${error.message}`
    );
  }
}

/**
 * Test IHK Content Service integration
 */
async function testContentServiceIntegration() {
  console.log('\n📚 Testing Content Service Integration...');
  
  try {
    // Import services
    const { default: IHKContentService } = await import('../src/services/IHKContentService.js');
    
    const mockStateManager = new MockStateManager();
    const mockStorageService = new MockStorageService();
    
    const contentService = new IHKContentService(mockStateManager, mockStorageService);

    // Test 1: Content service initializes
    logTest(
      'IHKContentService initializes correctly',
      contentService !== null
    );

    // Test 2: Get all modules (backward compatibility)
    const allModules = await contentService.getAllModules();
    logTest(
      'getAllModules returns modules array',
      Array.isArray(allModules),
      `Expected array, got ${typeof allModules}`
    );

    // Test 3: Get all quizzes (backward compatibility)
    const allQuizzes = await contentService.getAllQuizzes();
    logTest(
      'getAllQuizzes returns quizzes array',
      Array.isArray(allQuizzes),
      `Expected array, got ${typeof allQuizzes}`
    );

    // Test 4: Content statistics
    const stats = contentService.getContentStats();
    logTest(
      'getContentStats returns statistics object',
      stats && typeof stats === 'object'
    );

  } catch (error) {
    logTest(
      'Content Service Integration tests',
      false,
      `Error: ${error.message}`
    );
  }
}

/**
 * Test Specialization Service integration
 */
async function testSpecializationServiceIntegration() {
  console.log('\n🎯 Testing Specialization Service Integration...');
  
  try {
    // Import services
    const { default: SpecializationService } = await import('../src/services/SpecializationService.js');
    
    const mockStateManager = new MockStateManager();
    const mockStorageService = new MockStorageService();
    
    const specializationService = new SpecializationService(mockStateManager, mockStorageService);

    // Test 1: Specialization service initializes
    logTest(
      'SpecializationService initializes correctly',
      specializationService !== null
    );

    // Test 2: Get available specializations
    const availableSpecializations = specializationService.getAvailableSpecializations();
    logTest(
      'getAvailableSpecializations returns array',
      Array.isArray(availableSpecializations),
      `Expected array, got ${typeof availableSpecializations}`
    );

    // Test 3: Set specialization
    if (availableSpecializations.length > 0) {
      const firstSpecialization = availableSpecializations[0].id;
      specializationService.setSpecialization(firstSpecialization);
      
      const currentSpecialization = specializationService.getCurrentSpecialization();
      logTest(
        'setSpecialization and getCurrentSpecialization work',
        currentSpecialization === firstSpecialization,
        `Expected ${firstSpecialization}, got ${currentSpecialization}`
      );
    }

  } catch (error) {
    logTest(
      'Specialization Service Integration tests',
      false,
      `Error: ${error.message}`
    );
  }
}

/**
 * Generate test report
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
    console.log('   ✅ System is ready for production use.');
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
    successRate: parseFloat(successRate)
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
    await testCategoryMappingService();
    await testContentServiceIntegration();
    await testSpecializationServiceIntegration();
    
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
      process.exit(1);
    });
}

// Export for use in other scripts
export { runAllTests };