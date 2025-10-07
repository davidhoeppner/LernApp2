import fs from 'fs';
import path from 'path';

const root = process.cwd();
const modulesDir = path.join(root, 'src', 'data', 'ihk', 'modules');
const quizzesDir = path.join(root, 'src', 'data', 'ihk', 'quizzes');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('Failed to parse', file, e.message);
    return null;
  }
}

// collect module ids
const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));
const moduleIdSet = new Set();
const moduleFileMap = new Map();
for (const f of moduleFiles) {
  const full = path.join(modulesDir, f);
  const j = readJson(full);
  if (!j) continue;
  // file might either be an object with id or contain { modules: [ ... ] }
  if (Array.isArray(j.modules)) {
    for (const m of j.modules) {
      if (m && m.id) moduleIdSet.add(m.id);
    }
    moduleFileMap.set(
      f.replace('.json', ''),
      j.modules.map(m => m.id)
    );
  } else if (j.id) {
    moduleIdSet.add(j.id);
    moduleFileMap.set(j.id, [j.id]);
  }
}

// scan quizzes
const quizFiles = fs.readdirSync(quizzesDir).filter(f => f.endsWith('.json'));
const changes = [];
for (const qf of quizFiles) {
  const qpath = path.join(quizzesDir, qf);
  const q = readJson(qpath);
  if (!q || !q.moduleId) continue;
  const orig = q.moduleId;
  if (moduleIdSet.has(orig)) continue; // ok

  let fixed = null;
  // if endsWith -2025, try stripping
  if (orig.endsWith('-2025')) {
    const alt = orig.replace(/-2025$/, '');
    if (moduleIdSet.has(alt)) fixed = alt;
  }

  // if not fixed, try find module file with same base name
  if (!fixed) {
    // quiz file name base (without -quiz)
    const base = qf.replace(/-quiz.json$/, '').replace(/\.json$/, '');
    // try module file with same base
    if (moduleFileMap.has(base)) {
      const candidates = moduleFileMap.get(base);
      if (candidates && candidates.length > 0) fixed = candidates[0];
    }
  }

  // fallback: try find any module id that startsWith same prefix before last dash
  if (!fixed) {
    const prefix = orig.split('-').slice(0, 3).join('-'); // e.g., bp-01-conception -> bp-01-conception
    for (const mid of moduleIdSet) {
      if (mid.startsWith(prefix)) {
        fixed = mid;
        break;
      }
    }
  }

  if (fixed) {
    q.moduleId = fixed;
    fs.writeFileSync(qpath, JSON.stringify(q, null, 2) + '\n', 'utf8');
    changes.push({ file: qf, from: orig, to: fixed });
  }
}

if (changes.length === 0) {
  console.log('No quiz moduleId fixes necessary');
  process.exit(0);
}

console.log('Applied fixes to quizzes:');
for (const c of changes) console.log(`${c.file}: ${c.from} -> ${c.to}`);
process.exit(0);
