// @ts-nocheck
/* eslint-env node */
/**
 * Debug test to check console output
 */

console.log('Starting debug test...');
console.error('This is an error message');

try {
  console.log('Testing basic functionality...');

  // Test import
  const fs = await import('fs');
  console.log('✅ File system imported');

  // Test service import
  const { default: CategoryMappingService } = await import(
    '../src/services/CategoryMappingService.js'
  );
  console.log('✅ CategoryMappingService imported');

  console.log('Debug test completed successfully!');
} catch (error) {
  console.error('Debug test failed:', error.message);
  process.exit(1);
}
