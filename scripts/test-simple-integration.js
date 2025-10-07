/**
 * Simple Integration Test for Three-Tier Category System
 * Basic test to verify core functionality works
 */

console.log('🚀 Starting Simple Integration Test...');

async function runSimpleTest() {
  try {
    console.log('📊 Testing CategoryMappingService import...');

    // Test basic import
    const { default: CategoryMappingService } = await import(
      '../src/services/CategoryMappingService.js'
    );
    console.log('✅ CategoryMappingService imported successfully');

    // Test service creation
    const mockSpecializationService = {
      getCategoryRelevance: () => 'medium',
    };

    const categoryMappingService = new CategoryMappingService(
      mockSpecializationService
    );
    console.log('✅ CategoryMappingService created successfully');

    // Test basic functionality
    const categories = categoryMappingService.getThreeTierCategories();
    console.log(
      `✅ Retrieved ${categories?.length || 0} three-tier categories`
    );

    // Test mapping
    const testContent = { category: 'bp-dpa-01', id: 'test' };
    const mapping = categoryMappingService.mapToThreeTierCategory(testContent);
    console.log(`✅ Mapped test content to: ${mapping}`);

    console.log('\n🎉 Simple integration test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Simple integration test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
runSimpleTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
