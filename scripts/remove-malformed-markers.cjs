#!/usr/bin/env node
// @ts-nocheck
/* eslint-env node */

const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(
  process.cwd(),
  '..',
  'src',
  'data',
  'ihk',
  'modules'
);
const QUIZZES_DIR = path.join(
  process.cwd(),
  '..',
  'src',
  'data',
  'ihk',
  'quizzes'
);

let changed = 0;

function removeMarkerFromFile(p) {
  const raw = fs.readFileSync(p, 'utf8');
  const marker = '<!-- micro-quiz:[object Object] -->';
  if (raw.includes(marker)) {
    const updated = raw.split(marker).join('');
    try {
      fs.writeFileSync(p + '.bak', raw, 'utf8');
    } catch {}
    fs.writeFileSync(p, updated, 'utf8');
    console.log(`Cleaned marker in ${path.basename(p)}`);
    changed++;
  }
}

try {
  const mods = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith('.json'));
  for (const f of mods) {
    removeMarkerFromFile(path.join(MODULES_DIR, f));
  }
} catch {
  console.error('Error reading modules directory', e.message);
  process.exit(2);
}

// Remove stray quiz file named exactly '[object Object].json' if present
const malformedQuiz = path.join(QUIZZES_DIR, '[object Object].json');
if (fs.existsSync(malformedQuiz)) {
  try {
    fs.unlinkSync(malformedQuiz);
    console.log('Removed stray quiz file [object Object].json');
    changed++;
  } catch {
    console.error('Failed to remove malformed quiz file:', e.message);
  }
}

console.log(`Done. Files cleaned: ${changed}`);
process.exit(0);
