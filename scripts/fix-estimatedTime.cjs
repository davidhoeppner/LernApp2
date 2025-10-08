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

const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith('.json'));
let changed = 0;

function parseEstimatedTimeString(str) {
  if (!str || typeof str !== 'string') return null;
  // Normalize
  let s = str.trim().toLowerCase();
  // Replace comma decimals with dot
  s = s.replace(/,\s*(?=\d)/g, '.');

  // Capture a number and optional unit
  const re = /([\d]+(?:\.\d+)?)\s*(stunden?|h|std|mins?|minuten|minute|m)?/i;
  const m = s.match(re);
  if (!m) return null;
  let num = Number(m[1]);
  if (Number.isNaN(num)) return null;
  const unit = (m[2] || '').toLowerCase();
  // If unit looks like hour, convert to minutes
  if (unit.startsWith('st') || unit === 'h') {
    return Math.round(num * 60);
  }
  // default/minute
  return Math.round(num);
}

files.forEach(f => {
  const p = path.join(MODULES_DIR, f);
  const raw = fs.readFileSync(p, 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    return;
  }

  if (
    json.hasOwnProperty('estimatedTime') &&
    typeof json.estimatedTime === 'string'
  ) {
    const parsed = parseEstimatedTimeString(json.estimatedTime);
    if (parsed !== null) {
      // Backup original
      try {
        fs.writeFileSync(p + '.bak', raw, 'utf8');
      } catch {}
      json.estimatedTime = parsed;
      fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n', 'utf8');
      console.log(
        `Fixed estimatedTime in ${f}: "${json.estimatedTime}" -> ${parsed}`
      );
      changed++;
    }
  }
});

console.log(`Done. Files changed: ${changed}`);
process.exit(0);
