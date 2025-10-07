/**
 * Simple test runner to verify integration
 */

console.log('🚀 Starting simple test runner...');

try {
  // Test individual test imports
  console.log('Testing individual imports...');
  
  const { runEnhancedContentLoadingTests } = await import('./test-enhanced-content-loading.js');
  console.log('✓ Enhanced content loading tests imported');
  
  // Run the test
  console.log('Running enhanced content loading tests...');
  const report = await runEnhancedContentLoadingTests();
  
  console.log(`✓ Tests completed: ${report.passed}/${report.totalTests} passed`);
  
  if (report.success) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed');
  }
  
} catch (error) {
  console.error('❌ Error in test runner:', error);
  console.error('Stack:', error.stack);
}