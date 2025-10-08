// @ts-nocheck
/* eslint-env node */
const fs = require('fs');
const path = require('path');

const modulePath = path.resolve(
  process.cwd(),
  '../src/data/ihk/modules/bp-01-networks-basics.json'
);
const raw = fs.readFileSync(modulePath, 'utf8');
try {
  const mod = JSON.parse(raw);
  let content = mod.content || '';
  // normalize literal \n sequences
  content = content.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');

  const replaced = String(content).replace(
    /<!--\s*micro-quiz:([a-zA-Z0-9-_]+)\s*-->/g,
    (m, id) => {
      return `<div class="micro-quiz-inline" data-quiz-id="${id}"></div>`;
    }
  );

  // Print a small snippet around each converted host
  const parts = replaced.split(
    /(<div class=\"micro-quiz-inline\"[^>]*>\s*<\/div>)/g
  );
  console.log('--- Snippet around micro-quiz hosts ---');
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] && parts[i].includes('micro-quiz-inline')) {
      const before = parts[i - 1] ? parts[i - 1].slice(-120) : '';
      const after = parts[i + 1] ? parts[i + 1].slice(0, 120) : '';
      console.log('\n...' + before + '\n' + parts[i] + '\n' + after + '\n');
    }
  }

  // Also print full replaced content length and a count of hosts
  const hostCount = (replaced.match(/micro-quiz-inline/g) || []).length;
  console.log('Total hosts converted:', hostCount);
  // Optionally write to temp html file
  const outPath = path.resolve(process.cwd(), '../tmp/debug-module-content.html');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, replaced, 'utf8');
  console.log('Wrote debug HTML to', outPath);
} catch {
  console.error('Failed to parse module JSON:', e);
  process.exit(1);
}
