import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'bp-04-design-patterns.json',
  'bp-04-programming-paradigms.json',
  'bp-04-scrum.json',
  'bp-05-data-structures.json',
  'bp-05-sorting.json',
  'bp-05-sql-reference.json',
  'fue-04-security.json',
];

console.log('Validating fixed module files...\n');

let allValid = true;

files.forEach(f => {
  try {
    const content = fs.readFileSync(
      path.join(__dirname, '../src/data/ihk/modules', f),
      'utf8'
    );
    JSON.parse(content);
    console.log(`✅ ${f} - Valid JSON`);
  } catch (e) {
    console.log(`❌ ${f} - ${e.message}`);
    allValid = false;
  }
});

console.log(
  allValid ? '\n✅ All files are valid!' : '\n❌ Some files have errors'
);
process.exit(allValid ? 0 : 1);
