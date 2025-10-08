/**
 * Applies micro-quiz integration to all modules:
 *  - Removes malformed markers <!-- micro-quiz:[object Object] -->
 *  - Ensures one micro-quiz marker per H2 section with deterministic ID
 *  - Updates microQuizzes array in JSON
 *  - Creates quiz JSON files if missing (minimal placeholder content)
 *  - Creates .bak backup before modifying module
 *  - Re-generates modules.md after each module update to persist progress
 */
const fs = require('fs');
const path = require('path');
const { generateStatus } = require('./generate-modules-status');

const MODULES_DIR = path.join(__dirname, '..', 'src', 'data', 'ihk', 'modules');
const QUIZZES_DIR = path.join(__dirname, '..', 'src', 'data', 'ihk', 'quizzes');

function slugify(str) {
  if (!str) return '';
  return str
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function createQuizFile(moduleJson, sectionTitle, quizId) {
  ensureDir(QUIZZES_DIR);
  const quizPath = path.join(QUIZZES_DIR, `${quizId}.json`);
  if (fs.existsSync(quizPath)) return false; // don't overwrite existing
  const safeTitle = sectionTitle.split(/[:\n]/)[0].trim();
  const quiz = {
    id: quizId,
    moduleId: moduleJson.id,
    title: `${safeTitle} — Microquiz 1`,
    questions: [
      {
        question: `Was ist der Kernpunkt des Abschnitts "${safeTitle}" im Modul "${moduleJson.title}"?`,
        options: [
          `Zentrales Konzept von "${safeTitle}" im Kontext von "${moduleJson.title}"`,
          'Ein irrelevanter Aspekt ohne Bezug',
          'Nur dekorative Formatierung'
        ],
        correctAnswer: `Zentrales Konzept von "${safeTitle}" im Kontext von "${moduleJson.title}"`,
        explanation: 'Der Abschnitt fokussiert auf das zentrale Konzept, nicht auf irrelevante oder dekorative Aspekte.',
        points: 1
      },
      {
        question: `Der Abschnitt "${safeTitle}" gehört thematisch zum Modul "${moduleJson.title}".`,
        options: ['Richtig', 'Falsch'],
        correctAnswer: 'Richtig',
        explanation: 'Die Struktur folgt den H2 Abschnitten des Moduls.',
        points: 1
      },
      {
        question: `Wähle zutreffende Aussagen zu "${safeTitle}" (mehrere möglich).`,
        options: [
          'Beschreibt ein relevantes Teilthema',
          'Ist völlig unabhängig vom Modulkontext',
          'Kann zur Prüfungsvorbereitung dienen'
        ],
        correctAnswer: [
          'Beschreibt ein relevantes Teilthema',
          'Kann zur Prüfungsvorbereitung dienen'
        ],
        explanation: 'Abschnitte sind relevante Teilthemen und unterstützen beim Lernen.',
        points: 1
      }
    ]
  };
  fs.writeFileSync(quizPath, JSON.stringify(quiz, null, 2), 'utf8');
  return true;
}

function integrateModule(modPath) {
  const raw = fs.readFileSync(modPath, 'utf8');
  let json;
  try { json = JSON.parse(raw); } catch (e) {
    console.error('Skipping invalid JSON', modPath, e.message);
    return { moduleId: path.basename(modPath), skipped: true, reason: 'Invalid JSON' };
  }
  const content = json.content || '';
  const lines = content.split(/\n/);
  // Identify H2 headings
  const sections = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+)/);
    if (m) sections.push({ title: m[1].trim(), index: i });
  }
  if (sections.length === 0) {
    return { moduleId: json.id, skipped: true, reason: 'No H2 sections' };
  }
  let modified = false;

  // Remove malformed markers
  const beforeRemoval = lines.join('\n');
  const afterRemoval = beforeRemoval.replace(/<!--\s*micro-quiz:\[object Object]\s*-->/g, '');
  if (afterRemoval !== beforeRemoval) {
    modified = true;
  }
  let workingContent = afterRemoval;
  let workingLines = workingContent.split(/\n/);

  // Collect existing markers
  const existingMarkers = [...workingContent.matchAll(/<!--\s*micro-quiz:([^>]+?)\s*-->/g)].map(m => m[1].trim());

  const createdQuizzes = [];
  const insertedMarkers = [];

  // Insert markers for each section if missing
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
    const slug = slugify(sec.title);
    const expectedId = `${json.id}-${slug}-micro-1`;
    if (existingMarkers.includes(expectedId)) continue; // already present

    // Determine insertion point: last line before next H2 or end of file
    const nextSectionIndex = (sIdx + 1 < sections.length) ? sections[sIdx + 1].index : workingLines.length;
    // Search upward from nextSectionIndex - 1 for first non-empty line? Rule says insert before next H2 (i.e., at end of section) -> we append marker with a blank line before if not present.
    // We'll insert a blank line + marker just before the line of next H2.
    const insertionLine = nextSectionIndex; // insert before this index
    // Ensure previous line blank separation
    if (insertionLine > 0 && workingLines[insertionLine - 1].trim() !== '') {
      workingLines.splice(insertionLine, 0, '');
    }
    workingLines.splice(insertionLine + 0, 0, `<!-- micro-quiz:${expectedId} -->`);
    modified = true;
    insertedMarkers.push(expectedId);
    existingMarkers.push(expectedId);
    // Recompute sections indices offset after insertion
    const delta = 1 + (workingLines[insertionLine - 1] === '' ? 1 : 0);
    for (let j = sIdx + 1; j < sections.length; j++) {
      sections[j].index += delta; // shift following sections
    }
    // Create quiz file if missing
    if (createQuizFile(json, sec.title, expectedId)) {
      createdQuizzes.push(expectedId);
    }
  }

  if (!modified) {
    return { moduleId: json.id, modified: false, insertedMarkers, createdQuizzes };
  }

  // Update content & microQuizzes array
  json.content = workingLines.join('\n');
  // Order markers as they appear in content
  const orderedMarkers = [...json.content.matchAll(/<!--\s*micro-quiz:([^>]+?)\s*-->/g)].map(m => m[1].trim());
  // Filter to only those matching naming convention for this module
  const microList = orderedMarkers.filter(id => id.startsWith(json.id + '-'));
  json.microQuizzes = microList;
  // Remove legacy field forms if present
  if (json.microquizzes) delete json.microquizzes;
  if (json.relatedQuizzes && json.relatedQuizzes.length === 0) {
    // keep but it's fine, not harmful; spec suggests canonical field. We'll leave untouched unless empty array.
  }

  // Backup
  const backupPath = modPath + '.bak';
  if (!fs.existsSync(backupPath)) fs.writeFileSync(backupPath, raw, 'utf8');
  fs.writeFileSync(modPath, JSON.stringify(json, null, 2), 'utf8');

  // Refresh modules.md status
  generateStatus();

  return { moduleId: json.id, modified: true, insertedMarkers, createdQuizzes };
}

function main() {
  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith('.json'));
  const results = [];
  files.forEach((f, idx) => {
    const res = integrateModule(path.join(MODULES_DIR, f));
    results.push(res);
    if (res.modified) {
      console.log(`Updated ${res.moduleId}: +${res.insertedMarkers.length} markers, +${res.createdQuizzes.length} quizzes.`);
    }
    // After each module we already refreshed modules.md
  });
  // Final status generation
  const status = generateStatus();
  console.log('Integration complete. Summary:');
  const modifiedCount = results.filter(r => r.modified).length;
  console.log(`Modules modified: ${modifiedCount}/${files.length}`);
}

if (require.main === module) {
  main();
}
