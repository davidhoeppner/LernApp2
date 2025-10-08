import fs from 'fs';
import path from 'path';

const root = process.cwd();
const modulesDir = path.join(root, 'src', 'data', 'ihk', 'modules');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null; // swallow JSON parse errors
  }
}

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));
let updated = [];
for (const f of files) {
  const p = path.join(modulesDir, f);
  const j = readJson(p);
  if (!j) continue;
  // module object may be directly the module or the file may contain module only
  const mod = j; // after split we created per-module files
  if (
    mod.learningObjectives &&
    Array.isArray(mod.learningObjectives) &&
    mod.learningObjectives.length > 0
  )
    continue;

  let objectives = null;
  if (Array.isArray(mod.keyTakeaways) && mod.keyTakeaways.length > 0) {
    objectives = mod.keyTakeaways.slice(0, 5);
  }

  if (!objectives && typeof mod.content === 'string') {
    const content = mod.content;
    // try to find Prüfunsgrelevante section (German)
    // const _re = /Pr\w*fungsrelevante[\s\S]{0,1000}?\n([\s\S]*)/i; // retained for potential future refinement
    const match = content.match(/Pr\w*fungsrelevante[^\n]*\n([\s\S]+)/i);
    if (match) {
      // take first few lines that look like bullets
      const after = match[1];
      const lines = after
        .split(/\n/)
        .map(l => l.trim())
        .filter(Boolean);
      const bullets = lines.filter(
        l =>
          l.startsWith('-') ||
          l.startsWith('*') ||
          l.startsWith('•') ||
          l.match(/^[0-9]+\./)
      );
      if (bullets.length > 0) {
        objectives = bullets
          .map(b => b.replace(/^[-*•\s0-9.]+/, '').trim())
          .slice(0, 5);
      }
    }
  }

  if (!objectives && Array.isArray(mod.tags) && mod.tags.length > 0) {
    objectives = mod.tags.slice(0, 5).map(t => `Understand ${t}`);
  }

  if (!objectives)
    objectives = [
      'TODO: add learning objectives - please update this module with exam-relevant learning objectives.',
    ];

  mod.learningObjectives = objectives;
  writeJson(p, mod);
  updated.push({ file: f, objectivesCount: objectives.length });
}

if (updated.length === 0) {
  console.warn('No modules updated');
  process.exit(0);
}
console.warn('Updated modules:', updated.map(u => u.file).join(', '));
process.exit(0);
