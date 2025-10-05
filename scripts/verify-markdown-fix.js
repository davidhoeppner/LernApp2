#!/usr/bin/env node

/**
 * Verify Markdown Fix is Applied
 * Checks if the IHKModuleView.js file has the correct markdown rendering fix
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔍 Verifying Markdown Rendering Fix...\n');

const filePath = path.join(rootDir, 'src/components/IHKModuleView.js');

if (!fs.existsSync(filePath)) {
  console.log('❌ ERROR: IHKModuleView.js not found!');
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');

// Check for the critical fix: converting escaped newlines
const hasNewlineConversion = content.includes("html.replace(/\\\\n/g, '\\n')");

// Check for the markdownToHtml method
const hasMarkdownMethod = content.includes('markdownToHtml(markdown)');

console.log('Checking for required code patterns:\n');

if (hasMarkdownMethod) {
  console.log('✅ markdownToHtml method exists');
} else {
  console.log('❌ markdownToHtml method NOT FOUND');
}

if (hasNewlineConversion) {
  console.log('✅ Escaped newline conversion code exists');
  console.log("   Pattern: html.replace(/\\\\n/g, '\\n')");
} else {
  console.log('❌ Escaped newline conversion code NOT FOUND');
  console.log('   This is the critical fix!');
}

console.log('\n' + '═'.repeat(80));

if (hasMarkdownMethod && hasNewlineConversion) {
  console.log('✅ VERIFICATION PASSED');
  console.log('\nThe markdown rendering fix is correctly applied.');
  console.log("\nIf you're still seeing issues in the browser:");
  console.log('1. Hard refresh the browser (Ctrl+Shift+R or Ctrl+F5)');
  console.log('2. Clear browser cache');
  console.log('3. Restart the dev server (npm run dev)');
  console.log('4. Check browser console for JavaScript errors');
} else {
  console.log('❌ VERIFICATION FAILED');
  console.log('\nThe markdown rendering fix is NOT properly applied.');
  console.log('Please re-apply the fix to src/components/IHKModuleView.js');
  process.exit(1);
}

console.log('═'.repeat(80));
