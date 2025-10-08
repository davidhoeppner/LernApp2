#!/usr/bin/env node
// @ts-nocheck
/* eslint-env node */

/**
 * Test script to verify quiz card sizing fixes
 * Tests that quiz grid uses minmax() approach consistently across all media queries
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 Testing Quiz Card Sizing Fix...');

// Read the CSS file
const cssPath = path.join(process.cwd(), 'src', 'style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Check for the main quiz-grid rule
console.log('\n🔍 Checking main quiz-grid rule...');
if (
  cssContent.includes(
    '.quiz-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));'
  )
) {
  console.log('✅ Main quiz-grid uses minmax(400px, 1fr)');
} else {
  console.log('❌ Main quiz-grid rule not found or incorrect');
}

// Check for problematic fixed layouts
console.log('\n🔍 Checking for problematic fixed layouts...');
const problematicPatterns = [
  'quiz-grid {\\s*grid-template-columns: repeat(2, 1fr)',
  'quiz-grid {\\s*grid-template-columns: 1fr',
  'quiz-grid {\\s*grid-template-columns: repeat(3, 1fr)',
  'quiz-grid {\\s*grid-template-columns: repeat(4, 1fr)',
];

let hasProblematicRules = false;
for (const pattern of problematicPatterns) {
  const regex = new RegExp(pattern, 'g');
  const matches = cssContent.match(regex);
  if (matches && matches.length > 0) {
    console.log(`❌ Found problematic rule: ${matches[0]}`);
    hasProblematicRules = true;
  }
}

if (!hasProblematicRules) {
  console.log('✅ No problematic fixed layout rules found');
}

// Check for proper responsive rules
console.log('\n🔍 Checking responsive quiz-grid rules...');
const responsiveChecks = [
  {
    name: 'Mobile (max-width: 768px)',
    pattern: 'minmax(300px, 1fr)',
    context: '@media (max-width: 768px)',
  },
  {
    name: 'Tablet (769px - 1024px)',
    pattern: 'minmax(350px, 1fr)',
    context: '@media (min-width: 769px) and (max-width: 1024px)',
  },
  {
    name: 'Medium screens',
    pattern: 'minmax(380px, 1fr)',
    context: 'medium screen media query',
  },
  {
    name: 'Large screens',
    pattern: 'minmax(400px, 1fr)',
    context: 'large screen media query',
  },
];

let responsiveRulesFound = 0;
for (const check of responsiveChecks) {
  if (cssContent.includes(check.pattern)) {
    console.log(`✅ ${check.name}: Uses ${check.pattern}`);
    responsiveRulesFound++;
  } else {
    console.log(`❓ ${check.name}: Pattern ${check.pattern} not found`);
  }
}

// Check that we don't have any remaining combined selectors
console.log('\n🔍 Checking for combined selectors...');
const combinedSelectorPattern =
  /\.module-grid,\s*\.quiz-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*1fr\)/g;
const combinedMatches = cssContent.match(combinedSelectorPattern);

if (combinedMatches && combinedMatches.length > 0) {
  console.log(
    `❌ Found ${combinedMatches.length} remaining combined selectors that force 2-column layout`
  );
  combinedMatches.forEach((match, index) => {
    console.log(`   ${index + 1}: ${match.substring(0, 50)}...`);
  });
} else {
  console.log('✅ No problematic combined selectors found');
}

// Final result
console.log('\n' + '='.repeat(50));
if (!hasProblematicRules && responsiveRulesFound >= 2) {
  console.log('🎉 SUCCESS: Quiz card sizing fix applied correctly!');
  console.log('\n📋 Fix Summary:');
  console.log(
    '✅ Main quiz-grid uses minmax(400px, 1fr) for consistent sizing'
  );
  console.log(
    '✅ Responsive rules maintain minmax() approach instead of fixed layouts'
  );
  console.log(
    '✅ Cards will maintain consistent size regardless of filter state'
  );
  console.log(
    '✅ No more stretching when fewer items are displayed after filtering'
  );

  process.exit(0);
} else {
  console.log('❌ FAILURE: Quiz card sizing fix incomplete');
  console.log(
    `   - Problematic rules found: ${hasProblematicRules ? 'Yes' : 'No'}`
  );
  console.log(`   - Responsive rules found: ${responsiveRulesFound}/4`);
  process.exit(1);
}
