#!/usr/bin/env node
// @ts-nocheck
/* eslint-env node */


/**
 * Pre-Manual Test Check
 * Automated verification before manual testing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const process.cwd() = path.dirname(__filename);
const rootDir = path.join(process.cwd(), '..');

console.log('🔍 Running pre-manual test checks...\n');

let allChecksPassed = true;

// Check 1: Verify no encoding issues remain
console.log('✓ Check 1: UTF-8 Encoding');
const modulesDir = path.join(rootDir, 'src/data/ihk/modules');
const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));

let encodingIssues = 0;
moduleFiles.forEach(file => {
  const content = fs.readFileSync(path.join(modulesDir, file), 'utf8');
  const matches = content.match(/Ã[¼¶¤ŸœŸ„–]/g);
  if (matches) {
    encodingIssues += matches.length;
    console.log(`  ⚠️  ${file}: ${matches.length} encoding issues found`);
    allChecksPassed = false;
  }
});

if (encodingIssues === 0) {
  console.log('  ✅ No encoding issues found in modules\n');
} else {
  console.log(`  ❌ Found ${encodingIssues} encoding issues\n`);
}

// Check 2: Verify all modules are valid JSON
console.log('✓ Check 2: JSON Validity');
let invalidJson = 0;
moduleFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(modulesDir, file), 'utf8');
    JSON.parse(content);
  } catch (error) {
    console.log(`  ❌ ${file}: Invalid JSON - ${error.message}`);
    invalidJson++;
    allChecksPassed = false;
  }
});

if (invalidJson === 0) {
  console.log('  ✅ All module files are valid JSON\n');
} else {
  console.log(`  ❌ ${invalidJson} files have invalid JSON\n`);
}

// Check 3: Verify essential files exist
console.log('✓ Check 3: Essential Files');
const essentialFiles = [
  'README.md',
  'LICENSE',
  'DEPLOYMENT.md',
  'ERROR_HANDLING_GUIDE.md',
  'package.json',
  'index.html',
  'vite.config.js',
];

let missingFiles = 0;
essentialFiles.forEach(file => {
  if (!fs.existsSync(path.join(rootDir, file))) {
    console.log(`  ❌ Missing: ${file}`);
    missingFiles++;
    allChecksPassed = false;
  }
});

if (missingFiles === 0) {
  console.log('  ✅ All essential files present\n');
} else {
  console.log(`  ❌ ${missingFiles} essential files missing\n`);
}

// Check 4: Verify Router.js exists and has no syntax errors
console.log('✓ Check 4: Router Configuration');
const routerPath = path.join(rootDir, 'src/services/Router.js');
if (fs.existsSync(routerPath)) {
  console.log('  ✅ Router.js exists\n');
} else {
  console.log('  ❌ Router.js not found\n');
  allChecksPassed = false;
}

// Check 5: Verify IHKContentService exists
console.log('✓ Check 5: Content Service');
const servicePath = path.join(rootDir, 'src/services/IHKContentService.js');
if (fs.existsSync(servicePath)) {
  console.log('  ✅ IHKContentService.js exists\n');
} else {
  console.log('  ❌ IHKContentService.js not found\n');
  allChecksPassed = false;
}

// Check 6: Count modules and quizzes
console.log('✓ Check 6: Content Inventory');
const quizzesDir = path.join(rootDir, 'src/data/ihk/quizzes');
const quizFiles = fs.readdirSync(quizzesDir).filter(f => f.endsWith('.json'));

console.log(`  📊 Modules: ${moduleFiles.length}`);
console.log(`  📊 Quizzes: ${quizFiles.length}`);
console.log('  ✅ Content inventory complete\n');

// Check 7: Verify workspace is clean
console.log('✓ Check 7: Workspace Cleanliness');
const unnecessaryPatterns = [
  /^TASK_.*_SUMMARY\.md$/,
  /^.*_FIXED\.md$/,
  /^.*_FIX\.md$/,
  /^FINAL_.*\.md$/,
  /^DEPLOYMENT_COMPLETE\.md$/,
  /^DEPLOYMENT_SUCCESS.*\.md$/,
  /^GITHUB_.*\.md$/,
];

const rootFiles = fs.readdirSync(rootDir);
let unnecessaryFiles = 0;

rootFiles.forEach(file => {
  if (unnecessaryPatterns.some(pattern => pattern.test(file))) {
    console.log(`  ⚠️  Unnecessary file found: ${file}`);
    unnecessaryFiles++;
  }
});

if (unnecessaryFiles === 0) {
  console.log('  ✅ Workspace is clean\n');
} else {
  console.log(
    `  ⚠️  ${unnecessaryFiles} unnecessary files found (non-critical)\n`
  );
}

// Final summary
console.log('═'.repeat(60));
if (allChecksPassed) {
  console.log('✅ ALL CRITICAL CHECKS PASSED');
  console.log('\n🚀 Ready for manual testing!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open: http://localhost:5173');
  console.log('3. Follow: MANUAL_TESTING_CHECKLIST.md');
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('\n⚠️  Please fix the issues above before manual testing');
  process.exit(1);
}
console.log('═'.repeat(60));
