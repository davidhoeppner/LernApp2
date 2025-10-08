// @ts-nocheck
/* eslint-env node */
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const modulesDir = path.resolve('src/data/ihk/modules');

function getJsonFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.json'));
}

function syncFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');

  if (text.includes('"microQuizzes"')) return false; // already has camelCase
  if (!text.includes('"microquizzes"')) return false; // nothing to sync

  // Parse JSON, copy property
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error('Skipping (parse error):', filePath, err.message);
    return false;
  }

  if (data.microquizzes && !data.microQuizzes) {
    data.microQuizzes = data.microquizzes;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    return true;
  }

  return false;
}

function main() {
  const files = getJsonFiles(modulesDir);
  let changed = 0;
  for (const f of files) {
    const p = path.join(modulesDir, f);
    try {
      const ok = syncFile(p);
      if (ok) {
        console.log('Updated:', f);
        changed++;
      }
    } catch (err) {
      console.error('Error processing', f, err.message);
    }
  }

  console.log(`Done. Files changed: ${changed}`);
}

main();
