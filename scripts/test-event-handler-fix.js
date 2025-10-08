#!/usr/bin/env node
// @ts-nocheck
/* eslint-env node */

/**
 * Test script to verify the event handler fix
 * Tests that event handlers use currentTarget instead of target
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 Testing Event Handler Fix...');

// Read the IHKQuizListView file
const filePath = path.join(
  process.cwd(),
  'src',
  'components',
  'IHKQuizListView.js'
);
const fileContent = fs.readFileSync(filePath, 'utf8');

// Check for the fixed event handlers
const checks = [
  {
    name: 'Status filter uses currentTarget',
    pattern: 'e.currentTarget.dataset.status',
    oldPattern: 'e.target.dataset.status',
  },
  {
    name: 'Category filter uses currentTarget',
    pattern: 'e.currentTarget.dataset.category',
    oldPattern: 'e.target.dataset.category',
  },
];

let allFixed = true;

console.log('\n🔍 Checking event handler fixes...');

for (const check of checks) {
  const hasNewPattern = fileContent.includes(check.pattern);
  const hasOldPattern = fileContent.includes(check.oldPattern);

  if (hasNewPattern && !hasOldPattern) {
    console.log(`✅ ${check.name} - Fixed`);
  } else if (hasOldPattern) {
    console.log(`❌ ${check.name} - Still using old pattern`);
    allFixed = false;
  } else {
    console.log(`❓ ${check.name} - Pattern not found`);
    allFixed = false;
  }
}

// Check CSS fix for quiz card size
console.log('\n🔍 Checking quiz card size fix...');
const cssPath = path.join(process.cwd(), 'src', 'style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

if (cssContent.includes('minmax(400px, 1fr)')) {
  console.log('✅ Quiz card size increased to 400px minimum');
} else if (cssContent.includes('minmax(320px, 1fr)')) {
  console.log('❌ Quiz cards still using old 320px minimum size');
  allFixed = false;
} else {
  console.log('❓ Quiz grid sizing not found');
  allFixed = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allFixed) {
  console.log('🎉 SUCCESS: All fixes applied correctly!');
  console.log('\n📋 Fix Summary:');
  console.log(
    '✅ Event handlers use currentTarget (prevents undefined category/status)'
  );
  console.log('✅ Quiz cards increased to 400px minimum width (bigger cards)');
  console.log(
    '✅ No more "Invalid category parameter: undefined" errors expected'
  );

  process.exit(0);
} else {
  console.log('❌ FAILURE: Some fixes are missing or incomplete');
  process.exit(1);
}
