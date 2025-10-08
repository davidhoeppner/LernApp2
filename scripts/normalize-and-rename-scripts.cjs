#!/usr/bin/env node
// @ts-nocheck
/* eslint-env node */

const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = path.join(process.cwd());
const files = fs.readdirSync(SCRIPTS_DIR).filter(f => f.endsWith('.js'));
let renamed = 0;
let normalized = 0;

for (const f of files) {
  const p = path.join(SCRIPTS_DIR, f);
  let raw = fs.readFileSync(p, 'utf8');
  // Normalize line endings to LF
  const lf = raw.replace(/\r\n/g, '\n');
  if (lf !== raw) {
    fs.writeFileSync(p, lf, 'utf8');
    normalized++;
  }

  // If file uses CommonJS patterns, rename to .cjs
  if (/\brequire\s*\(|\bmodule\.exports\b|\bexports\./.test(lf)) {
    const newName = f.replace(/\.js$/, '.cjs');
    const newPath = path.join(SCRIPTS_DIR, newName);
    if (!fs.existsSync(newPath)) {
      fs.renameSync(p, newPath);
      renamed++;
      console.log(`Renamed ${f} -> ${newName}`);
    }
  }
}

console.log(
  `Normalized line endings for ${normalized} files, renamed ${renamed} files.`
);
process.exit(0);
