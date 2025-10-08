// @ts-nocheck
/* eslint-env node */
/* eslint-disable no-unused-vars */
/**
 * Migration and Validation Integration Test Script
 * Tests migration tools, progress migration, and validation services
 * for the three-tier category system
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const process.cwd() = dirname(__filename);

// Test results tracking
const migrationTestResults = {
  passed: 0,
  failed: 0,
  tests: [],
  categories: {
    'Progress Migration': { passed: 0, failed: 0 },
    'Category Validation': { passed: 0, failed: 0 },
    'Content Relationships': { passed: 0, failed: 0 },
    'Migration Monitoring': { passed: 0, failed: 0 },
  },
};

// Helper function to log test results
function logMigrationTest(name, passed, message = '', category = 'General') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const result = { name, passed, message, category };
  migrationTestResults.tests.push(result);

  if (passed) {
    migrationTestResults.passed++;
    if (migrationTestResults.categories[category]) {
      migrationTestResults.categories[category].passed++;
    }
    console.log(`${status}: ${name}`);
  } else {
    migrationTestResults.failed++;
    if (migrationTestResults.categories[category]) {
      migrationTestResults.categories[category].failed++;
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
      progress: { modules: {}, quizzes: {} },
    };
  }
  getState() {
    return this.state;
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

/**
 * Test Progress Migration Service
 */
async function testProgressMigrationService() {
  console.log('\n🔄 Testing Progress Migration Service...');

  try {
    const { default: ProgressMigrationService } = await import(
      '../src/services/ProgressMigrationService.js'
    );

    const mockStateManager = new MockStateManager();
    const mockStorageService = new MockStorageService();

    // Set up test progress data
    const testProgress = {
      modules: {
        'fue-01': { completed: true, score: 85, completedAt: '2024-01-01' },
        'bp-dpa-01': { completed: true, score: 92, completedAt: '2024-01-02' },
        'bp-ae-01': { completed: false, score: 0 },
      },
      quizzes: {
        'fue-01-quiz': { attempts: 2, bestScore: 80, completed: true },
        'bp-dpa-01-quiz': { attempts: 1, bestScore: 95, completed: true },
      },
    };

    mockStorageService.set('moduleProgress', testProgress.modules);
    mockStorageService.set('quizProgress', testProgress.quizzes);

    const migrationService = new ProgressMigrationService(
      mockStateManager,
      mockStorageService
    );

    // Test 1: Service initialization
    logMigrationTest(
      'ProgressMigrationService initializes correctly',
      migrationService !== null,
      '',
      'Progress Migration'
    );

    // Test 2: Migrate user progress to three-tier categories
    const migrationResult = await migrationService.migrateUserProgress();
    logMigrationTest(
      'migrateUserProgress completes successfully',
      migrationResult && migrationResult.success,
      migrationResult ? migrationResult.message : 'No result returned',
      'Progress Migration'
    );

    // Test 3: Verify progress preservation
    const migratedModuleProgress = mockStorageService.get('moduleProgress');
    logMigrationTest(
      'Module progress is preserved after migration',
      migratedModuleProgress &&
        migratedModuleProgress['fue-01'] &&
        migratedModuleProgress['fue-01'].completed,
      'Module progress data lost during migration',
      'Progress Migration'
    );

    // Test 4: Verify three-tier category mapping in progress
    const progressWithCategories =
      migrationService.getProgressWithThreeTierCategories();
    logMigrationTest(
      'Progress includes three-tier category information',
      progressWithCategories &&
        progressWithCategories['daten-prozessanalyse'] !== undefined,
      'Three-tier category information missing from progress',
      'Progress Migration'
    );

    // Test 5: Test rollback functionality
    const rollbackResult = await migrationService.rollbackMigration();
    logMigrationTest(
      'Migration rollback functionality works',
      rollbackResult && rollbackResult.success,
      rollbackResult ? rollbackResult.message : 'Rollback failed',
      'Progress Migration'
    );
  } catch (error) {
    logMigrationTest(
      'Progress Migration Service tests',
      false,
      `Error: ${error.message}`,
      'Progress Migration'
    );
  }
}

/**
 * Test Category Validation Service
 */
async function testCategoryValidationService() {
  console.log('\n✅ Testing Category Validation Service...');

  try {
    const { default: CategoryValidationService } = await import(
      '../src/services/CategoryValidationService.js'
    );

    const validationService = new CategoryValidationService();

    // Test 1: Service initialization
    logMigrationTest(
      'CategoryValidationService initializes correctly',
      validationService !== null,
      '',
      'Category Validation'
    );

    // Test 2: Validate all content categorization
    const validationResult =
      await validationService.validateAllContentCategorization();
    logMigrationTest(
      'validateAllContentCategorization completes',
      validationResult && typeof validationResult === 'object',
      'Validation result is not an object',
      'Category Validation'
    );

    // Test 3: Check for category assignment conflicts
    const conflictCheck =
      await validationService.checkCategoryAssignmentConflicts();
    logMigrationTest(
      'checkCategoryAssignmentConflicts returns results',
      Array.isArray(conflictCheck),
      `Expected array, got ${typeof conflictCheck}`,
      'Category Validation'
    );

    // Test 4: Generate validation report
    const validationReport = await validationService.generateValidationReport();
    logMigrationTest(
      'generateValidationReport creates comprehensive report',
      validationReport && validationReport.summary && validationReport.details,
      'Validation report missing required sections',
      'Category Validation'
    );

    // Test 5: Validate specific content item
    const testContentItem = {
      id: 'test-item',
      category: 'bp-dpa-01',
      threeTierCategory: 'daten-prozessanalyse',
    };

    const itemValidation =
      validationService.validateContentItem(testContentItem);
    logMigrationTest(
      'validateContentItem works for individual items',
      itemValidation && typeof itemValidation.isValid === 'boolean',
      'Item validation result missing isValid property',
      'Category Validation'
    );
  } catch (error) {
    logMigrationTest(
      'Category Validation Service tests',
      false,
      `Error: ${error.message}`,
      'Category Validation'
    );
  }
}

/**
 * Test Content Relationship Service
 */
async function testContentRelationshipService() {
  console.log('\n🔗 Testing Content Relationship Service...');

  try {
    const { default: ContentRelationshipService } = await import(
      '../src/services/ContentRelationshipService.js'
    );

    const relationshipService = new ContentRelationshipService();

    // Test 1: Service initialization
    logMigrationTest(
      'ContentRelationshipService initializes correctly',
      relationshipService !== null,
      '',
      'Content Relationships'
    );

    // Test 2: Identify cross-category relationships
    const crossCategoryRelationships =
      await relationshipService.identifyCrossCategoryRelationships();
    logMigrationTest(
      'identifyCrossCategoryRelationships returns data',
      Array.isArray(crossCategoryRelationships),
      `Expected array, got ${typeof crossCategoryRelationships}`,
      'Content Relationships'
    );

    // Test 3: Get related content suggestions
    const testContentId = 'bp-dpa-01';
    const relatedContent =
      await relationshipService.getRelatedContent(testContentId);
    logMigrationTest(
      'getRelatedContent returns suggestions',
      Array.isArray(relatedContent),
      `Expected array, got ${typeof relatedContent}`,
      'Content Relationships'
    );

    // Test 4: Map prerequisite relationships
    const prerequisiteMap =
      await relationshipService.mapPrerequisiteRelationships();
    logMigrationTest(
      'mapPrerequisiteRelationships creates relationship map',
      prerequisiteMap && typeof prerequisiteMap === 'object',
      'Prerequisite map is not an object',
      'Content Relationships'
    );

    // Test 5: Generate relationship statistics
    const relationshipStats =
      relationshipService.generateRelationshipStatistics();
    logMigrationTest(
      'generateRelationshipStatistics provides metrics',
      relationshipStats &&
        typeof relationshipStats.totalRelationships === 'number',
      'Relationship statistics missing required metrics',
      'Content Relationships'
    );
  } catch (error) {
    logMigrationTest(
      'Content Relationship Service tests',
      false,
      `Error: ${error.message}`,
      'Content Relationships'
    );
  }
}

/**
 * Test Migration Monitoring Service
 */
async function testMigrationMonitoringService() {
  console.log('\n📊 Testing Migration Monitoring Service...');

  try {
    const { default: MigrationMonitoringService } = await import(
      '../src/services/MigrationMonitoringService.js'
    );

    const monitoringService = new MigrationMonitoringService();

    // Test 1: Service initialization
    logMigrationTest(
      'MigrationMonitoringService initializes correctly',
      monitoringService !== null,
      '',
      'Migration Monitoring'
    );

    // Test 2: Track migration status
    const migrationStatus = await monitoringService.getMigrationStatus();
    logMigrationTest(
      'getMigrationStatus returns status information',
      migrationStatus && typeof migrationStatus === 'object',
      'Migration status is not an object',
      'Migration Monitoring'
    );

    // Test 3: Generate migration report
    const migrationReport = await monitoringService.generateMigrationReport();
    logMigrationTest(
      'generateMigrationReport creates detailed report',
      migrationReport && migrationReport.summary && migrationReport.details,
      'Migration report missing required sections',
      'Migration Monitoring'
    );

    // Test 4: Validate post-migration state
    const postMigrationValidation =
      await monitoringService.validatePostMigrationState();
    logMigrationTest(
      'validatePostMigrationState checks system integrity',
      postMigrationValidation &&
        typeof postMigrationValidation.isValid === 'boolean',
      'Post-migration validation missing isValid property',
      'Migration Monitoring'
    );

    // Test 5: Performance metrics collection
    const performanceMetrics = monitoringService.collectPerformanceMetrics();
    logMigrationTest(
      'collectPerformanceMetrics gathers system metrics',
      performanceMetrics && typeof performanceMetrics.responseTime === 'number',
      'Performance metrics missing required data',
      'Migration Monitoring'
    );
  } catch (error) {
    logMigrationTest(
      'Migration Monitoring Service tests',
      false,
      `Error: ${error.message}`,
      'Migration Monitoring'
    );
  }
}

/**
 * Test integration between migration services
 */
async function testMigrationServicesIntegration() {
  console.log('\n🔄 Testing Migration Services Integration...');

  try {
    // Import all migration services
    const { default: ProgressMigrationService } = await import(
      '../src/services/ProgressMigrationService.js'
    );
    const { default: CategoryValidationService } = await import(
      '../src/services/CategoryValidationService.js'
    );
    const { default: MigrationMonitoringService } = await import(
      '../src/services/MigrationMonitoringService.js'
    );

    const mockStateManager = new MockStateManager();
    const mockStorageService = new MockStorageService();

    const progressMigration = new ProgressMigrationService(
      mockStateManager,
      mockStorageService
    );
    const categoryValidation = new CategoryValidationService();
    const migrationMonitoring = new MigrationMonitoringService();

    // Test 1: Services can work together
    logMigrationTest(
      'Migration services can be instantiated together',
      progressMigration && categoryValidation && migrationMonitoring,
      'One or more migration services failed to instantiate',
      'Migration Integration'
    );

    // Test 2: End-to-end migration workflow
    try {
      // Step 1: Validate before migration
      const preValidation =
        await categoryValidation.validateAllContentCategorization();

      // Step 2: Perform migration
      const migrationResult = await progressMigration.migrateUserProgress();

      // Step 3: Monitor migration
      const migrationStatus = await migrationMonitoring.getMigrationStatus();

      // Step 4: Validate after migration
      const postValidation =
        await migrationMonitoring.validatePostMigrationState();

      logMigrationTest(
        'End-to-end migration workflow completes successfully',
        preValidation && migrationResult && migrationStatus && postValidation,
        'One or more steps in migration workflow failed',
        'Migration Integration'
      );
    } catch (workflowError) {
      logMigrationTest(
        'End-to-end migration workflow',
        false,
        `Workflow error: ${workflowError.message}`,
        'Migration Integration'
      );
    }
  } catch (error) {
    logMigrationTest(
      'Migration Services Integration tests',
      false,
      `Error: ${error.message}`,
      'Migration Integration'
    );
  }
}

/**
 * Generate migration test report
 */
function generateMigrationTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 MIGRATION AND VALIDATION INTEGRATION TEST REPORT');
  console.log('='.repeat(80));

  // Overall results
  const totalTests = migrationTestResults.passed + migrationTestResults.failed;
  const successRate =
    totalTests > 0
      ? ((migrationTestResults.passed / totalTests) * 100).toFixed(1)
      : 0;

  console.log(`\n📊 OVERALL RESULTS:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${migrationTestResults.passed}`);
  console.log(`   Failed: ${migrationTestResults.failed}`);
  console.log(`   Success Rate: ${successRate}%`);

  // Category breakdown
  console.log(`\n📈 RESULTS BY CATEGORY:`);
  Object.entries(migrationTestResults.categories).forEach(
    ([category, results]) => {
      const total = results.passed + results.failed;
      if (total > 0) {
        const rate = ((results.passed / total) * 100).toFixed(1);
        console.log(`   ${category}: ${results.passed}/${total} (${rate}%)`);
      }
    }
  );

  // Failed tests details
  if (migrationTestResults.failed > 0) {
    console.log(`\n❌ FAILED TESTS:`);
    migrationTestResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   • ${test.name}`);
        if (test.message) {
          console.log(`     → ${test.message}`);
        }
      });
  }

  console.log('\n' + '='.repeat(80));

  return {
    success: migrationTestResults.failed === 0,
    totalTests,
    passed: migrationTestResults.passed,
    failed: migrationTestResults.failed,
    successRate: parseFloat(successRate),
  };
}

/**
 * Main migration test execution function
 */
async function runMigrationTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Migration and Validation Integration Tests             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const startTime = performance.now();

  try {
    await testProgressMigrationService();
    await testCategoryValidationService();
    await testContentRelationshipService();
    await testMigrationMonitoringService();
    await testMigrationServicesIntegration();
  } catch (error) {
    console.error('❌ Critical error during migration test execution:', error);
    logMigrationTest('Migration Test Suite Execution', false, error.message);
  }

  const endTime = performance.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n⏱️  Total execution time: ${totalTime}s`);

  return generateMigrationTestReport();
}

// Export for use in other scripts
export { runMigrationTests, migrationTestResults };

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrationTests()
    .then(report => {
      process.exit(report.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
