// @ts-nocheck
/* eslint-env node */
/**
 * Applies micro-quiz integration to all modules.
 */
const fs = require('fs');
const path = require('path');
const { generateStatus } = require('./generate-modules-status.cjs');

const MODULES_DIR = path.join(process.cwd(), '..', 'src', 'data', 'ihk', 'modules');
const QUIZZES_DIR = path.join(process.cwd(), '..', 'src', 'data', 'ihk', 'quizzes');

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
  if (fs.existsSync(quizPath)) return false;
  const safeTitle = sectionTitle.split(/[:\n]/)[0].trim();
  const quiz = {
    id: quizId,
    moduleId: moduleJson.id,
    title: `${safeTitle} — Microquiz 1`,
    description: `Automatisch generiertes Microquiz für den Abschnitt "${safeTitle}" im Modul "${moduleJson.title}".`,
    category: moduleJson.category || 'BP-01',
    difficulty: moduleJson.difficulty || 'beginner',
    timeLimit: 180,
    passingScore: 60,
    questions: [
      {
        id: 'q1',
        type: 'single-choice',
        question: `Was ist der Kernpunkt des Abschnitts "${safeTitle}"?`,
        options: [
          `Zentrales Konzept von "${safeTitle}" im Kontext des Moduls`,
          'Ein irrelevanter Aspekt ohne Bezug',
          'Nur dekorative Formatierung'
        ],
        correctAnswer: `Zentrales Konzept von "${safeTitle}" im Kontext des Moduls`,
        explanation: 'Der Abschnitt vermittelt ein zentrales Teilthema des Moduls.',
        points: 1
      },
      {
        id: 'q2',
        type: 'true-false',
        question: `Der Abschnitt "${safeTitle}" gehört thematisch zum Modulziel.`,
        correctAnswer: true,
        explanation: 'Die Gliederung der H2 Abschnitte bildet die Modulstruktur ab.',
        points: 1
      },
      {
        id: 'q3',
        type: 'multiple-choice',
        question: `Welche Aussagen treffen auf "${safeTitle}" zu?`,
        options: [
          'Beschreibt ein relevantes Teilthema',
          'Ist völlig unabhängig vom Modulkontext',
          'Kann zur Prüfungsvorbereitung dienen'
        ],
        correctAnswer: [
          'Beschreibt ein relevantes Teilthema',
            'Kann zur Prüfungsvorbereitung dienen'
        ],
        explanation: 'Abschnitte adressieren relevante Lerninhalte und unterstützen Prüfungsvorbereitung.',
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
  try { json = JSON.parse(raw); } catch {
    console.error('Skipping invalid JSON', modPath, e.message);
    return { moduleId: path.basename(modPath), skipped: true, reason: 'Invalid JSON' };
  }
  const content = json.content || '';
  const lines = content.split(/\n/);
  const sections = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+)/);
    if (m) sections.push({ title: m[1].trim(), index: i });
  }
  if (sections.length === 0) {
    return { moduleId: json.id, skipped: true, reason: 'No H2 sections' };
  }
  let modified = false;
  const beforeRemoval = lines.join('\n');
  const afterRemoval = beforeRemoval.replace(/<!--\s*micro-quiz:\[object Object]\s*-->/g, '');
  if (afterRemoval !== beforeRemoval) modified = true;
  let workingContent = afterRemoval;
  let workingLines = workingContent.split(/\n/);
  const existingMarkers = [...workingContent.matchAll(/<!--\s*micro-quiz:([^>]+?)\s*-->/g)].map(m => m[1].trim());
  const createdQuizzes = [];
  const insertedMarkers = [];
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
    const slug = slugify(sec.title);
    const expectedId = `${json.id}-${slug}-micro-1`;
    if (existingMarkers.includes(expectedId)) continue;
    const nextSectionIndex = (sIdx + 1 < sections.length) ? sections[sIdx + 1].index : workingLines.length;
    const insertionLine = nextSectionIndex;
    if (insertionLine > 0 && workingLines[insertionLine - 1].trim() !== '') {
      workingLines.splice(insertionLine, 0, '');
    }
    workingLines.splice(insertionLine, 0, `<!-- micro-quiz:${expectedId} -->`);
    modified = true;
    insertedMarkers.push(expectedId);
    existingMarkers.push(expectedId);
    const delta = 1 + (workingLines[insertionLine - 1] === '' ? 1 : 0);
    for (let j = sIdx + 1; j < sections.length; j++) sections[j].index += delta;
    if (createQuizFile(json, sec.title, expectedId)) createdQuizzes.push(expectedId);
  }
  if (!modified) {
    return { moduleId: json.id, modified: false, insertedMarkers, createdQuizzes };
  }
  json.content = workingLines.join('\n');
  const orderedMarkers = [...json.content.matchAll(/<!--\s*micro-quiz:([^>]+?)\s*-->/g)].map(m => m[1].trim());
  const microList = orderedMarkers.filter(id => id.startsWith(json.id + '-'));
  json.microQuizzes = microList;
  if (json.microquizzes) delete json.microquizzes;
  const backupPath = modPath + '.bak';
  if (!fs.existsSync(backupPath)) fs.writeFileSync(backupPath, raw, 'utf8');
  fs.writeFileSync(modPath, JSON.stringify(json, null, 2), 'utf8');
  generateStatus();
  return { moduleId: json.id, modified: true, insertedMarkers, createdQuizzes };
}

function main() {
  const files = fs.readdirSync(MODULES_DIR).filter(f => f.endsWith('.json'));
  const results = [];
  files.forEach(f => {
    const res = integrateModule(path.join(MODULES_DIR, f));
    results.push(res);
    if (res.modified) console.log(`Updated ${res.moduleId}: +${res.insertedMarkers.length} markers, +${res.createdQuizzes.length} quizzes.`);
  });
  const modifiedCount = results.filter(r => r.modified).length;
  console.log(`Integration complete. Modules modified: ${modifiedCount}/${files.length}`);
}

if (require.main === module) main();

module.exports = { integrateModule };
