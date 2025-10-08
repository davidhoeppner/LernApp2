// @ts-nocheck
/* eslint-env node */
/**
 * Fix Global Comments Script
 *
 * Removes setTimeout/clearTimeout global comments that conflict with ESLint config
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const filesToFix = [
  'src/services/Router.js',
  'src/components/IHKModuleListView.js',
  'src/components/IHKOverviewView.js',
  'src/components/IHKProgressView.js',
  'src/components/ModuleDetailView.js',
  'src/components/NotFoundView.js',
  'src/components/ProgressView.js',
  'src/components/WheelView.js',
  'src/components/ToastNotification.js',
  'src/components/SearchComponent.js',
];

async function fixGlobalComments() {
  console.log('🔧 Fixing global comments...');

  for (const filePath of filesToFix) {
    try {
      const content = await readFile(filePath, 'utf-8');

      // Remove various global comment patterns
      let fixedContent = content
        .replace(/\/\* global setTimeout \*\/\n/g, '')
        .replace(/\/\* global setTimeout, clearTimeout \*\/\n/g, '')
        .replace(/\/\* global setTimeout \*\//g, '')
        .replace(/\/\* global setTimeout, clearTimeout \*\//g, '');

      if (content !== fixedContent) {
        await writeFile(filePath, fixedContent);
        console.log(`✅ Fixed: ${filePath}`);
      } else {
        console.log(`ℹ️  No changes needed: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
  }

  console.log('🎉 Global comments fix complete!');
}

fixGlobalComments().catch(console.error);
