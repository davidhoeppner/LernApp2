// @ts-nocheck
/* eslint-env node */
/**
 * Update IHKContentService with all quiz imports
 * Automatically adds import statements for all quizzes
 *
 * Usage: node scripts/update-quiz-imports.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const quizzesDir = path.join(__dirname, '..', 'src', 'data', 'ihk', 'quizzes');
const serviceFile = path.join(
  __dirname,
  '..',
  'src',
  'services',
  'IHKContentService.js'
);

// Get all quiz files
const quizFiles = fs
  .readdirSync(quizzesDir)
  .filter(f => f.endsWith('.json'))
  .sort();

console.log(`📚 Found ${quizFiles.length} quiz files\n`);

// Generate import statements
const imports = quizFiles.map(file => {
  const quizName = file.replace('.json', '');
  const camelCase = quizName
    .split('-')
    .map((word, i) =>
      i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');

  return `import ${camelCase} from '../data/ihk/quizzes/${file}';`;
});

console.log('Generated imports:');
imports.forEach(imp => console.log(imp));

// Read current service file
let serviceContent = fs.readFileSync(serviceFile, 'utf-8');

// Find the quiz imports section
const quizImportStart = serviceContent.indexOf('// Import all IHK quizzes');
const quizImportEnd = serviceContent.indexOf('\n\n', quizImportStart + 1);

if (quizImportStart === -1) {
  console.error('❌ Could not find quiz import section');
  process.exit(1);
}

// Replace quiz imports
const newQuizSection = `// Import all IHK quizzes (including migrated ones)\n${imports.join('\n')}`;

serviceContent =
  serviceContent.substring(0, quizImportStart) +
  newQuizSection +
  serviceContent.substring(quizImportEnd);

// Update the _loadAllQuizzes method
const quizArray = quizFiles.map(file => {
  const quizName = file.replace('.json', '');
  const camelCase = quizName
    .split('-')
    .map((word, i) =>
      i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
  return `      ${camelCase},`;
});

// Find and replace the quiz array in _loadAllQuizzes
const loadQuizzesStart = serviceContent.indexOf('_loadAllQuizzes() {');
const loadQuizzesEnd = serviceContent.indexOf('];', loadQuizzesStart);

if (loadQuizzesStart !== -1 && loadQuizzesEnd !== -1) {
  const beforeArray = serviceContent.substring(0, loadQuizzesStart);
  const afterArray = serviceContent.substring(loadQuizzesEnd + 2);

  const newLoadQuizzes = `_loadAllQuizzes() {
    return [
${quizArray.join('\n')}
    ];`;

  serviceContent = beforeArray + newLoadQuizzes + afterArray;
}

// Write updated service file
fs.writeFileSync(serviceFile, serviceContent);

console.log(
  `\n✅ Updated IHKContentService.js with ${quizFiles.length} quiz imports`
);
console.log('💡 All quizzes are now available in the application');
