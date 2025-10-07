/**
 * Test script to check mapping rules and category assignments
 */

async function testMappingRules() {
  try {
    const { default: CategoryMappingService } = await import('../src/services/CategoryMappingService.js');
    const service = new CategoryMappingService();
    
    console.log('📋 Mapping Rules:');
    const rules = service.getMappingRules();
    rules.forEach(rule => {
      console.log(`Priority ${rule.priority}: ${rule.description}`);
      console.log(`  Pattern: ${rule.sourcePattern}`);
      console.log(`  Target: ${rule.targetCategory}`);
      console.log('');
    });
    
    // Test some sample categories
    console.log('🧪 Testing sample categories:');
    const testCategories = ['BP-01', 'BP-02', 'BP-03', 'BP-04', 'BP-05', 'bp-dpa-01', 'bp-ae-01', 'FÜ-01'];
    testCategories.forEach(category => {
      const result = service.mapToThreeTierCategory({ id: 'test', category });
      console.log(`${category} -> ${result.threeTierCategory} (rule: ${result.appliedRule?.description || 'none'})`);
    });
    
    // Check actual quiz categories
    console.log('\n📊 Checking actual quiz categories:');
    const { default: IHKContentService } = await import('../src/services/IHKContentService.js');
    const ihkService = new IHKContentService();
    const quizzes = await ihkService.getAllQuizzes();
    
    const categoryCount = {};
    quizzes.forEach(quiz => {
      const category = quiz.category || quiz.categoryId || 'unknown';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    console.log('Quiz categories found:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      const result = service.mapToThreeTierCategory({ id: 'test', category });
      console.log(`${category} (${count} quizzes) -> ${result.threeTierCategory}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testMappingRules();