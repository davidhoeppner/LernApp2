import fs from 'fs';
import path from 'path';

const root = process.cwd();
const modulesDir = path.join(root, 'src', 'data', 'ihk', 'modules');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('Failed to parse', file, e.message);
    return null;
  }
}

const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));
let created = 0;
for (const f of files) {
  const full = path.join(modulesDir, f);
  const j = readJson(full);
  if (!j) continue;
  if (Array.isArray(j.modules)) {
    // create individual files
    for (const m of j.modules) {
      if (!m || !m.id) continue;
      const outPath = path.join(modulesDir, `${m.id}.json`);
      if (fs.existsSync(outPath)) {
        console.log('Skipping existing', outPath);
        continue;
      }
      fs.writeFileSync(outPath, JSON.stringify(m, null, 2) + '\n', 'utf8');
      console.log('Created', outPath);
      created++;
    }
    // optionally rename original to backup
    const backup = full + '.bak';
    fs.renameSync(full, backup);
    console.log('Backed up', full, '->', backup);
  }
}
console.log('Done. Created', created, 'module files.');
process.exit(0);
