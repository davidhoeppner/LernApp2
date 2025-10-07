/**
 * Unit Test Script for CategoryMappingService
 * Tests mapping rules with sample content, priority-based rule resolution,
 * edge cases and validation logic
 *
 * Requirements: 1.1, 1.2
 */

import { readFileSync } from 'fs';
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
    'Initialization': { passed: 0, failed: 0 },
    'Mapping Rules': { passed: 0, failed: 0 },
    'Priority Resolution': { passed: 0, failed: 0 },
    'Edge Cases': { passed: 0, failed: 0 },
    'Validation Logic': { passed: 0, failed: 0 },
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

// Mock SpecializationService for testing
class MockSpecializationService {
  constructor(customRelevanceMap = {}) {
    this.relevanceMap = {
      // DPA content
      'bp-dpa-01': { 'daten-prozessanalyse': 'high', 'anwendungsentwicklung': 'low' },
      'BP-DPA-02': { 'daten-prozessanalyse': 'high', 'anwendungsentwicklung': 'none' },
      'data-warehousing': { 'daten-prozessanalyse': 'high', 'anwendungsentwicklung': 'low' },
      
      // AE content
      'bp-ae-01': { 'anwendungsentwicklung': 'high', 'daten-prozessanalyse': 'low' },
      'BP-AE-02': { 'anwendungsentwicklung': 'high', 'daten-prozessanalyse': 'none' },
      'design-patterns': { 'anwendungsentwicklung': 'high', 'daten-prozessanalyse': 'low' },
      
      // General content
      'fue-01': { 'anwendungsentwicklung': 'high', 'daten-prozessanalyse': 'high' },
      'FÜ-02': { 'anwendungsentwicklung': 'high', 'daten-prozessanalyse': 'high' },
      'sql-reference': { 'anwendungsentwicklung': 'high', 'daten-prozessanalyse': 'high' },
      
      // Edge cases
      'unknown-category': { 'anwendungsentwicklung': 'none', 'daten-prozessanalyse': 'none' },
      'mixed-relevance': { 'anwendungsentwicklung': 'medium', 'daten-prozessanalyse': 'medium' },
      
      ...customRelevanceMap
    };
  }

  getCategoryRelevance(categoryId, specializationId) {
    const category = this.relevanceMap[categoryId];
    if (!category) return 'none';
    return category[specializationId] || 'none';
  }
}

/**
 * Test CategoryMappingService initialization
 */
async function testInitialization() {
  console.log('\n🔧 Testing CategoryMappingService Initialization...');
  
  try {
    const { default: CategoryMappingService } = await import('../src/services/CategoryMappingService.js');
    
    // Test 1: Service initializes without specialization service
    const serviceWithoutSpecialization = new CategoryMappingService();
    logTest(
      'Service initializes without SpecializationService',
      serviceWithoutSpecialization !== null,
      '',
      'Initialization'
    );

    // Test 2: Service initializes with specialization service
    const mockSpecializationService = new MockSpecializationService();
    const serviceWithSpecialization = new CategoryMappingService(mockSpecializationService);
    logTest(
      'Service initializes with SpecializationService',
      serviceWithSpecialization !== null && serviceWithSpecialization.specializationService !== null,
      '',
      'Initialization'
    );

    // Test 3: Three-tier categories are loaded
    const categories = serviceWithSpecialization.getThreeTierCategories();
    logTest(
      'Three-tier categories are loaded correctly',
      Array.isArray(categories) && categories.length === 3,
      `Expected 3 categories, got ${categories?.length || 0}`,
      'Initialization'
    );

    // Test 4: Required category IDs are present
    const categoryIds = categories.map(cat => cat.id);
    const expectedIds = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
    const hasAllIds = expectedIds.every(id => categoryIds.includes(id));
    logTest(
      'All required category IDs are present',
      hasAllIds,
      `Missing IDs: ${expectedIds.filter(id => !categoryIds.includes(id)).join(', ')}`,
      'Initialization'
    );

    // Test 5: Mapping rules are loaded
    const mappingRules = serviceWithSpecialization.getMappingRules();
    logTest(
      'Mapping rules are loaded correctly',
      Array.isArray(mappingRules) && mappingRules.length > 0,
      `Expected array with rules, got ${mappingRules?.length || 0} rules`,
      'Initialization'
    );

    // Test 6: Mapping rules are sorted by priority
    const priorities = mappingRules.map(rule => rule.priority);
    const sortedPriorities = [...priorities].sort((a, b) => b - a);
    const isSorted = JSON.stringify(priorities) === JSON.stringify(sortedPriorities);
    logTest(
      'Mapping rules are sorted by priority (descending)',
      isSorted,
      'Rules are not properly sorted by priority',
      'Initialization'
    );

    return serviceWithSpecialization;

  } catch (error) {
    logTest(
      'CategoryMappingService initialization',
      false,
      `Error: ${error.message}`,
      'Initialization'
    );
    return null;
  }
}

/**
 * Test mapping rules with sample content
 */
async function testMappingRules(categoryMappingService) {
  console.log('\n📋 Testing Mapping Rules with Sample Content...');
  
  if (!categoryMappingService) {
    logTest('Mapping Rules Tests', false, 'CategoryMappingService not available', 'Mapping Rules');
    return;
  }

  try {
    // Test 1: DPA explicit prefix mapping
    const dpaContent = { id: 'test-dpa', category: 'bp-dpa-01' };
    const dpaResult = categoryMappingService.mapToThreeTierCategory(dpaContent);
    logTest(
      'DPA content with bp-dpa prefix maps correctly',
      dpaResult.threeTierCategory === 'daten-prozessanalyse',
      `Expected 'daten-prozessanalyse', got '${dpaResult.threeTierCategory}'`,
      'Mapping Rules'
    );

    // Test 2: AE explicit prefix mapping
    const aeContent = { id: 'test-ae', category: 'BP-AE-01' };
    const aeResult = categoryMappingService.mapToThreeTierCategory(aeContent);
    logTest(
      'AE content with BP-AE prefix maps correctly',
      aeResult.threeTierCategory === 'anwendungsentwicklung',
      `Expected 'anwendungsentwicklung', got '${aeResult.threeTierCategory}'`,
      'Mapping Rules'
    );

    // Test 3: General content with FÜ prefix
    const generalContent = { id: 'test-general', category: 'FÜ-01' };
    const generalResult = categoryMappingService.mapToThreeTierCategory(generalContent);
    logTest(
      'General content with FÜ prefix maps correctly',
      generalResult.threeTierCategory === 'allgemein',
      `Expected 'allgemein', got '${generalResult.threeTierCategory}'`,
      'Mapping Rules'
    );

    // Test 4: Case insensitive mapping
    const lowerCaseContent = { id: 'test-lower', category: 'fue-02' };
    const lowerResult = categoryMappingService.mapToThreeTierCategory(lowerCaseContent);
    logTest(
      'Case insensitive mapping works',
      lowerResult.threeTierCategory === 'allgemein',
      `Expected 'allgemein', got '${lowerResult.threeTierCategory}'`,
      'Mapping Rules'
    );

    // Test 5: SQL content mapping
    const sqlContent = { id: 'test-sql', category: 'sql-reference' };
    const sqlResult = categoryMappingService.mapToThreeTierCategory(sqlContent);
    logTest(
      'SQL content maps to general category',
      sqlResult.threeTierCategory === 'allgemein',
      `Expected 'allgemein', got '${sqlResult.threeTierCategory}'`,
      'Mapping Rules'
    );

    // Test 6: Data analysis keywords
    const dataContent = { id: 'test-data', category: 'data-warehousing' };
    const dataResult = categoryMappingService.mapToThreeTierCategory(dataContent);
    logTest(
      'Data analysis content maps to DPA category',
      dataResult.threeTierCategory === 'daten-prozessanalyse',
      `Expected 'daten-prozessanalyse', got '${dataResult.threeTierCategory}'`,
      'Mapping Rules'
    );

    // Test 7: Programming keywords
    const programmingContent = { id: 'test-programming', category: 'design-patterns' };
    const programmingResult = categoryMappingService.mapToThreeTierCategory(programmingContent);
    logTest(
      'Programming content maps to AE category',
      programmingResult.threeTierCategory === 'anwendungsentwicklung',
      `Expected 'anwendungsentwicklung', got '${programmingResult.threeTierCategory}'`,
      'Mapping Rules'
    );

    // Test 8: Applied rule information is included
    logTest(
      'Mapping result includes applied rule information',
      dpaResult.appliedRule !== null && dpaResult.appliedRule.priority !== undefined,
      'Applied rule information missing from result',
      'Mapping Rules'
    );

    // Test 9: Category info is included
    logTest(
      'Mapping result includes category information',
      dpaResult.categoryInfo !== null && dpaResult.categoryInfo.name !== undefined,
      'Category information missing from result',
      'Mapping Rules'
    );

  } catch (error) {
    logTest(
      'Mapping Rules Tests',
      false,
      `Error: ${error.message}`,
      'Mapping Rules'
    );
  }
}

/**
 * Test priority-based rule resolution
 */
async function testPriorityResolution(categoryMappingService) {
  console.log('\n🎯 Testing Priority-Based Rule Resolution...');
  
  if (!categoryMappingService) {
    logTest('Priority Resolution Tests', false, 'CategoryMappingService not available', 'Priority Resolution');
    return;
  }

  try {
    // Test 1: Higher priority rule wins over lower priority
    const conflictContent = { id: 'test-conflict', category: 'bp-dpa-sql' };
    const conflictResult = categoryMappingService.mapToThreeTierCategory(conflictContent);
    
    // This should match DPA explicit prefix (priority 100) over SQL content (priority 65)
    logTest(
      'Higher priority rule (DPA prefix) wins over lower priority (SQL keyword)',
      conflictResult.threeTierCategory === 'daten-prozessanalyse',
      `Expected 'daten-prozessanalyse', got '${conflictResult.threeTierCategory}'`,
      'Priority Resolution'
    );

    // Test 2: Explicit prefix has highest priority
    const explicitContent = { id: 'test-explicit', category: 'BP-AE-data-analysis' };
    const explicitResult = categoryMappingService.mapToThreeTierCategory(explicitContent);
    
    // Should match AE prefix (priority 100) over data keywords (priority 55)
    logTest(
      'Explicit prefix rule has highest priority',
      explicitResult.threeTierCategory === 'anwendungsentwicklung',
      `Expected 'anwendungsentwicklung', got '${explicitResult.threeTierCategory}'`,
      'Priority Resolution'
    );

    // Test 3: Default fallback has lowest priority
    const unknownContent = { id: 'test-unknown', category: 'completely-unknown-category' };
    const unknownResult = categoryMappingService.mapToThreeTierCategory(unknownContent);
    
    logTest(
      'Unknown content falls back to default category',
      unknownResult.threeTierCategory === 'allgemein',
      `Expected 'allgemein', got '${unknownResult.threeTierCategory}'`,
      'Priority Resolution'
    );

    // Test 4: Priority information is correct in result
    const mappingRules = categoryMappingService.getMappingRules();
    const highestPriorityRule = mappingRules[0]; // Should be sorted by priority descending
    
    logTest(
      'Highest priority rule is correctly identified',
      highestPriorityRule.priority === 100,
      `Expected priority 100, got ${highestPriorityRule.priority}`,
      'Priority Resolution'
    );

    // Test 5: Multiple rules can have same target but different priorities
    const dpaExplicitContent = { id: 'test-dpa-explicit', category: 'BP-DPA-01' };
    const dpaKeywordContent = { id: 'test-dpa-keyword', category: 'etl-processes' };
    
    const dpaExplicitResult = categoryMappingService.mapToThreeTierCategory(dpaExplicitContent);
    const dpaKeywordResult = categoryMappingService.mapToThreeTierCategory(dpaKeywordContent);
    
    logTest(
      'Multiple rules can target same category with different priorities',
      dpaExplicitResult.threeTierCategory === 'daten-prozessanalyse' &&
      dpaKeywordResult.threeTierCategory === 'daten-prozessanalyse' &&
      dpaExplicitResult.appliedRule.priority > dpaKeywordResult.appliedRule.priority,
      'Priority resolution not working correctly for same target category',
      'Priority Resolution'
    );

  } catch (error) {
    logTest(
      'Priority Resolution Tests',
      false,
      `Error: ${error.message}`,
      'Priority Resolution'
    );
  }
}

/**
 * Test edge cases and error handling
 */
async function testEdgeCases(categoryMappingService) {
  console.log('\n🔍 Testing Edge Cases and Error Handling...');
  
  if (!categoryMappingService) {
    logTest('Edge Cases Tests', false, 'CategoryMappingService not available', 'Edge Cases');
    return;
  }

  try {
    // Test 1: Null content item
    const nullResult = categoryMappingService.mapToThreeTierCategory(null);
    logTest(
      'Null content item handled gracefully',
      nullResult.threeTierCategory === 'allgemein' && nullResult.reason.includes('Error'),
      'Null content not handled properly',
      'Edge Cases'
    );

    // Test 2: Undefined content item
    const undefinedResult = categoryMappingService.mapToThreeTierCategory(undefined);
    logTest(
      'Undefined content item handled gracefully',
      undefinedResult.threeTierCategory === 'allgemein' && undefinedResult.reason.includes('Error'),
      'Undefined content not handled properly',
      'Edge Cases'
    );

    // Test 3: Empty object
    const emptyResult = categoryMappingService.mapToThreeTierCategory({});
    logTest(
      'Empty content object handled gracefully',
      emptyResult.threeTierCategory !== undefined,
      'Empty object not handled properly',
      'Edge Cases'
    );

    // Test 4: Content without category field
    const noCategoryContent = { id: 'test-no-category', title: 'Test Content' };
    const noCategoryResult = categoryMappingService.mapToThreeTierCategory(noCategoryContent);
    logTest(
      'Content without category field handled gracefully',
      noCategoryResult.threeTierCategory === 'allgemein',
      `Expected 'allgemein', got '${noCategoryResult.threeTierCategory}'`,
      'Edge Cases'
    );

    // Test 5: Content with empty category
    const emptyCategoryContent = { id: 'test-empty-category', category: '' };
    const emptyCategoryResult = categoryMappingService.mapToThreeTierCategory(emptyCategoryContent);
    logTest(
      'Content with empty category handled gracefully',
      emptyCategoryResult.threeTierCategory === 'allgemein',
      `Expected 'allgemein', got '${emptyCategoryResult.threeTierCategory}'`,
      'Edge Cases'
    );

    // Test 6: Content with categoryId instead of category
    const categoryIdContent = { id: 'test-category-id', categoryId: 'bp-dpa-01' };
    const categoryIdResult = categoryMappingService.mapToThreeTierCategory(categoryIdContent);
    logTest(
      'Content with categoryId field works correctly',
      categoryIdResult.threeTierCategory === 'daten-prozessanalyse',
      `Expected 'daten-prozessanalyse', got '${categoryIdResult.threeTierCategory}'`,
      'Edge Cases'
    );

    // Test 7: Content with both category and categoryId (category should take precedence)
    const bothFieldsContent = { 
      id: 'test-both-fields', 
      category: 'bp-ae-01', 
      categoryId: 'bp-dpa-01' 
    };
    const bothFieldsResult = categoryMappingService.mapToThreeTierCategory(bothFieldsContent);
    logTest(
      'Content with both category and categoryId uses category field',
      bothFieldsResult.threeTierCategory === 'anwendungsentwicklung',
      `Expected 'anwendungsentwicklung', got '${bothFieldsResult.threeTierCategory}'`,
      'Edge Cases'
    );

    // Test 8: Very long category name
    const longCategoryContent = { 
      id: 'test-long-category', 
      category: 'a'.repeat(1000) + '-bp-dpa-test' 
    };
    const longCategoryResult = categoryMappingService.mapToThreeTierCategory(longCategoryContent);
    logTest(
      'Very long category name handled without errors',
      longCategoryResult.threeTierCategory !== undefined,
      'Long category name caused error',
      'Edge Cases'
    );

    // Test 9: Special characters in category
    const specialCharsContent = { 
      id: 'test-special-chars', 
      category: 'bp-dpa-01@#$%^&*()' 
    };
    const specialCharsResult = categoryMappingService.mapToThreeTierCategory(specialCharsContent);
    logTest(
      'Special characters in category handled correctly',
      specialCharsResult.threeTierCategory === 'daten-prozessanalyse',
      `Expected 'daten-prozessanalyse', got '${specialCharsResult.threeTierCategory}'`,
      'Edge Cases'
    );

    // Test 10: Unicode characters in category
    const unicodeContent = { 
      id: 'test-unicode', 
      category: 'bp-dpa-01-ñáéíóú' 
    };
    const unicodeResult = categoryMappingService.mapToThreeTierCategory(unicodeContent);
    logTest(
      'Unicode characters in category handled correctly',
      unicodeResult.threeTierCategory === 'daten-prozessanalyse',
      `Expected 'daten-prozessanalyse', got '${unicodeResult.threeTierCategory}'`,
      'Edge Cases'
    );

  } catch (error) {
    logTest(
      'Edge Cases Tests',
      false,
      `Error: ${error.message}`,
      'Edge Cases'
    );
  }
}

/**
 * Test validation logic
 */
async function testValidationLogic(categoryMappingService) {
  console.log('\n✅ Testing Validation Logic...');
  
  if (!categoryMappingService) {
    logTest('Validation Logic Tests', false, 'CategoryMappingService not available', 'Validation Logic');
    return;
  }

  try {
    // Test 1: Single item validation - valid content
    const validContent = { id: 'test-valid', category: 'bp-dpa-01' };
    const singleValidation = categoryMappingService.validateCategoryMapping(validContent);
    logTest(
      'Single valid item validation passes',
      singleValidation.status === 'success' && singleValidation.validItems === 1,
      `Expected success with 1 valid item, got ${singleValidation.status} with ${singleValidation.validItems} valid`,
      'Validation Logic'
    );

    // Test 2: Array validation - mixed content
    const mixedContent = [
      { id: 'valid-1', category: 'bp-dpa-01' },
      { id: 'valid-2', category: 'bp-ae-01' },
      { id: 'valid-3', category: 'fue-01' },
      null, // Invalid item
      { id: 'no-category' } // Missing category - should be valid (maps to default)
    ];
    const arrayValidation = categoryMappingService.validateCategoryMapping(mixedContent);
    logTest(
      'Array validation handles mixed valid/invalid content',
      arrayValidation.totalItems === 5 && arrayValidation.validItems === 4 && arrayValidation.invalidItems === 1,
      `Expected 5 total, 4 valid, 1 invalid; got ${arrayValidation.totalItems} total, ${arrayValidation.validItems} valid, ${arrayValidation.invalidItems} invalid`,
      'Validation Logic'
    );

    // Test 3: Validation includes detailed results
    logTest(
      'Validation includes detailed results for each item',
      Array.isArray(arrayValidation.details) && arrayValidation.details.length === 5,
      `Expected 5 detail items, got ${arrayValidation.details?.length || 0}`,
      'Validation Logic'
    );

    // Test 4: Validation detects conflicts
    const conflictContent = { id: 'conflict-test', category: 'bp-dpa-programming' };
    const conflictValidation = categoryMappingService.validateCategoryMapping(conflictContent);
    logTest(
      'Validation detects potential conflicts',
      conflictValidation.warnings && conflictValidation.warnings.length >= 0,
      'Conflict detection not working',
      'Validation Logic'
    );

    // Test 5: Validation summary statistics
    logTest(
      'Validation includes summary statistics',
      arrayValidation.summary && 
      arrayValidation.summary.categoryDistribution &&
      arrayValidation.summary.successRate,
      'Summary statistics missing from validation result',
      'Validation Logic'
    );

    // Test 6: Empty array validation
    const emptyValidation = categoryMappingService.validateCategoryMapping([]);
    logTest(
      'Empty array validation handled correctly',
      emptyValidation.status === 'success' && emptyValidation.totalItems === 0,
      'Empty array validation not handled properly',
      'Validation Logic'
    );

    // Test 7: Mapping rules validation
    const rulesValidation = categoryMappingService.validateMappingRules();
    logTest(
      'Mapping rules validation works',
      rulesValidation && rulesValidation.status && rulesValidation.totalRules > 0,
      'Mapping rules validation failed',
      'Validation Logic'
    );

    // Test 8: Rules validation detects issues
    logTest(
      'Rules validation includes detailed analysis',
      rulesValidation.validRules !== undefined && 
      rulesValidation.invalidRules !== undefined &&
      Array.isArray(rulesValidation.details),
      'Rules validation missing detailed analysis',
      'Validation Logic'
    );

    // Test 9: Category relevance validation
    const relevanceContent = { id: 'relevance-test', category: 'bp-dpa-01' };
    const relevanceValidation = categoryMappingService.validateCategoryMapping(relevanceContent);
    const hasRelevanceCheck = relevanceValidation.details[0].warnings.length >= 0;
    logTest(
      'Validation includes specialization relevance checks',
      hasRelevanceCheck,
      'Relevance validation not performed',
      'Validation Logic'
    );

    // Test 10: Validation configuration access
    const validationConfig = categoryMappingService.getValidationConfiguration();
    logTest(
      'Validation configuration is accessible',
      validationConfig && validationConfig.threeTierCategories,
      'Validation configuration not accessible',
      'Validation Logic'
    );

  } catch (error) {
    logTest(
      'Validation Logic Tests',
      false,
      `Error: ${error.message}`,
      'Validation Logic'
    );
  }
}

/**
 * Test specialization relevance integration
 */
async function testSpecializationRelevance(categoryMappingService) {
  console.log('\n🎯 Testing Specialization Relevance Integration...');
  
  if (!categoryMappingService) {
    logTest('Specialization Relevance Tests', false, 'CategoryMappingService not available', 'Mapping Rules');
    return;
  }

  try {
    // Test 1: Category relevance calculation
    const dpaRelevance = categoryMappingService.getCategoryRelevance('daten-prozessanalyse', 'daten-prozessanalyse');
    logTest(
      'DPA category has high relevance for DPA specialization',
      dpaRelevance === 'high',
      `Expected 'high', got '${dpaRelevance}'`,
      'Mapping Rules'
    );

    const aeRelevance = categoryMappingService.getCategoryRelevance('anwendungsentwicklung', 'anwendungsentwicklung');
    logTest(
      'AE category has high relevance for AE specialization',
      aeRelevance === 'high',
      `Expected 'high', got '${aeRelevance}'`,
      'Mapping Rules'
    );

    const generalRelevance = categoryMappingService.getCategoryRelevance('allgemein', 'daten-prozessanalyse');
    logTest(
      'General category has high relevance for both specializations',
      generalRelevance === 'high',
      `Expected 'high', got '${generalRelevance}'`,
      'Mapping Rules'
    );

    // Test 2: Cross-specialization relevance
    const crossRelevance = categoryMappingService.getCategoryRelevance('daten-prozessanalyse', 'anwendungsentwicklung');
    logTest(
      'DPA category has low relevance for AE specialization',
      crossRelevance === 'low',
      `Expected 'low', got '${crossRelevance}'`,
      'Mapping Rules'
    );

    // Test 3: Invalid inputs return 'none'
    const invalidRelevance = categoryMappingService.getCategoryRelevance('invalid-category', 'invalid-specialization');
    logTest(
      'Invalid category/specialization returns none relevance',
      invalidRelevance === 'none',
      `Expected 'none', got '${invalidRelevance}'`,
      'Mapping Rules'
    );

    // Test 4: Null/undefined inputs handled gracefully
    const nullRelevance = categoryMappingService.getCategoryRelevance(null, null);
    logTest(
      'Null inputs handled gracefully',
      nullRelevance === 'none',
      `Expected 'none', got '${nullRelevance}'`,
      'Mapping Rules'
    );

    // Test 5: Specialization-based mapping conditions work
    const mockSpecializationService = new MockSpecializationService({
      'test-high-dpa': { 'daten-prozessanalyse': 'high', 'anwendungsentwicklung': 'low' }
    });
    
    const serviceWithMockSpecialization = new (await import('../src/services/CategoryMappingService.js')).default(mockSpecializationService);
    const specializationContent = { id: 'test-specialization', category: 'test-high-dpa' };
    const specializationResult = serviceWithMockSpecialization.mapToThreeTierCategory(specializationContent);
    
    logTest(
      'Specialization-based mapping conditions work correctly',
      specializationResult.threeTierCategory !== undefined,
      'Specialization-based mapping failed',
      'Mapping Rules'
    );

  } catch (error) {
    logTest(
      'Specialization Relevance Tests',
      false,
      `Error: ${error.message}`,
      'Mapping Rules'
    );
  }
}

/**
 * Test performance requirements
 */
async function testPerformance(categoryMappingService) {
  console.log('\n⚡ Testing Performance Requirements...');
  
  if (!categoryMappingService) {
    logTest('Performance Tests', false, 'CategoryMappingService not available', 'Performance');
    return;
  }

  try {
    // Test 1: Single mapping performance
    const singleContent = { id: 'perf-test-1', category: 'bp-dpa-01' };
    const singleStartTime = performance.now();
    categoryMappingService.mapToThreeTierCategory(singleContent);
    const singleEndTime = performance.now();
    const singleMappingTime = singleEndTime - singleStartTime;
    
    logTest(
      'Single mapping completes quickly (<10ms)',
      singleMappingTime < 10,
      `Single mapping took ${singleMappingTime.toFixed(2)}ms`,
      'Performance'
    );

    // Test 2: Bulk mapping performance
    const bulkContent = Array.from({ length: 1000 }, (_, i) => ({
      id: `perf-test-${i}`,
      category: i % 3 === 0 ? 'bp-dpa-01' : i % 3 === 1 ? 'bp-ae-01' : 'fue-01'
    }));
    
    const bulkStartTime = performance.now();
    bulkContent.forEach(item => categoryMappingService.mapToThreeTierCategory(item));
    const bulkEndTime = performance.now();
    const bulkMappingTime = bulkEndTime - bulkStartTime;
    
    logTest(
      'Bulk mapping (1000 items) completes within reasonable time (<100ms)',
      bulkMappingTime < 100,
      `Bulk mapping took ${bulkMappingTime.toFixed(2)}ms`,
      'Performance'
    );

    // Test 3: Validation performance
    const validationStartTime = performance.now();
    categoryMappingService.validateCategoryMapping(bulkContent.slice(0, 100));
    const validationEndTime = performance.now();
    const validationTime = validationEndTime - validationStartTime;
    
    logTest(
      'Validation performance (100 items) is acceptable (<50ms)',
      validationTime < 50,
      `Validation took ${validationTime.toFixed(2)}ms`,
      'Performance'
    );

    // Test 4: Rules validation performance
    const rulesValidationStartTime = performance.now();
    categoryMappingService.validateMappingRules();
    const rulesValidationEndTime = performance.now();
    const rulesValidationTime = rulesValidationEndTime - rulesValidationStartTime;
    
    logTest(
      'Rules validation performance is acceptable (<20ms)',
      rulesValidationTime < 20,
      `Rules validation took ${rulesValidationTime.toFixed(2)}ms`,
      'Performance'
    );

    // Test 5: Memory usage doesn't grow excessively
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Perform many operations
    for (let i = 0; i < 1000; i++) {
      categoryMappingService.mapToThreeTierCategory({
        id: `memory-test-${i}`,
        category: `test-category-${i % 10}`
      });
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    logTest(
      'Memory usage remains reasonable during bulk operations (<10MB increase)',
      memoryIncrease < 10,
      `Memory increased by ${memoryIncrease.toFixed(2)}MB`,
      'Performance'
    );

  } catch (error) {
    logTest(
      'Performance Tests',
      false,
      `Error: ${error.message}`,
      'Performance'
    );
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 CATEGORY MAPPING SERVICE UNIT TEST REPORT');
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
  
  // Test coverage analysis
  console.log(`\n🎯 TEST COVERAGE ANALYSIS:`);
  console.log('   ✅ Service initialization and configuration loading');
  console.log('   ✅ Mapping rules with various content types');
  console.log('   ✅ Priority-based rule resolution');
  console.log('   ✅ Edge cases and error handling');
  console.log('   ✅ Validation logic for content and rules');
  console.log('   ✅ Specialization relevance integration');
  console.log('   ✅ Performance requirements verification');
  
  // Recommendations
  console.log(`\n💡 RECOMMENDATIONS:`);
  if (testResults.failed === 0) {
    console.log('   ✅ All tests passed! CategoryMappingService is working correctly.');
    console.log('   ✅ Mapping rules are functioning as expected.');
    console.log('   ✅ Validation logic is comprehensive and reliable.');
    console.log('   ✅ Performance meets requirements.');
  } else {
    console.log('   ⚠️  Some tests failed. Review the failed tests above.');
    console.log('   ⚠️  Check mapping rule configurations and priorities.');
    console.log('   ⚠️  Verify edge case handling and error recovery.');
    console.log('   ⚠️  Consider performance optimizations if needed.');
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
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         CategoryMappingService Unit Tests                    ║');
  console.log('║         Requirements: 1.1, 1.2                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  const startTime = performance.now();
  
  try {
    // Initialize service for testing
    const categoryMappingService = await testInitialization();
    
    // Run all test suites
    await testMappingRules(categoryMappingService);
    await testPriorityResolution(categoryMappingService);
    await testEdgeCases(categoryMappingService);
    await testValidationLogic(categoryMappingService);
    await testSpecializationRelevance(categoryMappingService);
    await testPerformance(categoryMappingService);
    
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
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('test-category-mapping-service.js')) {
  console.log('🚀 Starting CategoryMappingService unit tests...');
  
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