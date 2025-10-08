// @ts-nocheck
/* eslint-env node */
#!/usr/bin/env node

/**
 * Test script to verify the nested grid fix
 * Tests that quiz grid refresh doesn't create nested grids
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 Testing Nested Grid Fix...');

// Read the IHKQuizListView file
const filePath = path.join(
  process.cwd(),
  'src',
  'components',
  'IHKQuizListView.js'
);
const fileContent = fs.readFileSync(filePath, 'utf8');

// Check that the problematic pattern is fixed
console.log('\n🔍 Checking for nested grid creation...');

// Look for the old problematic pattern
const oldPattern = /quizGridContainer\.appendChild\(newQuizGrid\)/;
const hasOldPattern = oldPattern.test(fileContent);

if (hasOldPattern) {
  console.log('❌ Still using old pattern that creates nested grids');
} else {
  console.log('✅ Old nested grid pattern removed');
}

// Check for the new correct pattern
const newPatterns = [
  "quizGridContainer.innerHTML = '';",
  'filteredQuizzes.forEach(quiz => {',
  'const card = this.renderQuizCard(quiz);',
  'quizGridContainer.appendChild(card);',
];

let correctPatternsFound = 0;
for (const pattern of newPatterns) {
  if (fileContent.includes(pattern)) {
    correctPatternsFound++;
  }
}

console.log(
  `✅ Found ${correctPatternsFound}/${newPatterns.length} correct patterns`
);

// Check that renderQuizGrid is not called in refresh
const renderQuizGridInRefresh =
  /const newQuizGrid = this\.renderQuizGrid\(\)/.test(fileContent);
if (renderQuizGridInRefresh) {
  console.log(
    '❌ Still calling renderQuizGrid() in refresh (creates nested grid)'
  );
} else {
  console.log('✅ No longer calling renderQuizGrid() in refresh');
}

// Check for direct content manipulation
const directContentManipulation = fileContent.includes(
  'quizGridContainer.appendChild(card)'
);
if (directContentManipulation) {
  console.log('✅ Using direct content manipulation (no nesting)');
} else {
  console.log('❌ Not using direct content manipulation');
}

// Final result
console.log('\n' + '='.repeat(50));
if (
  !hasOldPattern &&
  correctPatternsFound >= 3 &&
  !renderQuizGridInRefresh &&
  directContentManipulation
) {
  console.log('🎉 SUCCESS: Nested grid fix applied correctly!');
  console.log('\n📋 Fix Summary:');
  console.log('✅ Removed nested quiz grid creation');
  console.log(
    '✅ Quiz cards are now added directly to existing grid container'
  );
  console.log('✅ No more quiz-grid inside quiz-grid structure');
  console.log('✅ Cards should now display at proper size after filtering');

  process.exit(0);
} else {
  console.log('❌ FAILURE: Nested grid fix incomplete');
  console.log(`   - Old pattern removed: ${!hasOldPattern ? 'Yes' : 'No'}`);
  console.log(
    `   - Correct patterns found: ${correctPatternsFound}/${newPatterns.length}`
  );
  console.log(
    `   - renderQuizGrid removed from refresh: ${!renderQuizGridInRefresh ? 'Yes' : 'No'}`
  );
  console.log(
    `   - Direct content manipulation: ${directContentManipulation ? 'Yes' : 'No'}`
  );
  process.exit(1);
}
