#!/usr/bin/env node
// @ts-nocheck
/* eslint-env node */

import fs from 'fs';
import path from 'path';

const modulesDir = path.resolve('src/data/ihk/modules');

function getJsonFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.json'));
}

function processFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error('Parse error', filePath, err.message);
    return false;
  }

  if (
    (!data.microQuizzes || data.microQuizzes.length === 0) &&
    Array.isArray(data.relatedQuizzes) &&
    data.relatedQuizzes.length > 0
  ) {
    data.microQuizzes = data.relatedQuizzes;
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
      if (processFile(p)) {
        console.log('Updated:', f);
        changed++;
      }
    } catch (err) {
      console.error('Error', f, err.message);
    }
  }
  console.log(`Done. Files changed: ${changed}`);
}

main();
