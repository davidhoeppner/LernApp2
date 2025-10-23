#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console */

/**
 * Compile SME-authored microquiz YAML drafts into JSON that matches
 * AssessmentService contracts and module metadata expectations.
 *
 * Responsibilities:
 *  - Discover YAML sources under content/microquizzes/drafts/**
 *  - Validate required metadata against microQuizFocus
 *  - Emit JSON files under src/data/ihk/quizzes with deterministic structure
 *  - Update module microQuizzes arrays when new quiz IDs are introduced
 *  - Produce a compilation report for downstream QA gates
 */

const fs = require('fs');
const path = require('path');
const process = require('process');
const yaml = require('yaml');

const ROOT = process.cwd();
const DRAFT_DIR = path.join(ROOT, 'content', 'microquizzes', 'drafts');
const TEMPLATE_DIR = path.join(ROOT, 'content', 'microquizzes', 'templates');
const MODULE_DIR = path.join(ROOT, 'src', 'data', 'ihk', 'modules');
const QUIZ_DIR = path.join(ROOT, 'src', 'data', 'ihk', 'quizzes');
const REPORT_PATH = path.join(ROOT, 'tmp', 'compile-microquizzes-report.json');

const REPORT = {
  generatedAt: new Date().toISOString(),
  processed: [],
  warnings: [],
  errors: [],
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadModuleCache() {
  const cache = new Map();
  for (const entry of fs.readdirSync(MODULE_DIR)) {
    if (!entry.endsWith('.json')) continue;
    const filePath = path.join(MODULE_DIR, entry);
    try {
      const mod = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (mod && mod.id) cache.set(mod.id, { filePath, data: mod });
    } catch (err) {
      REPORT.errors.push({
        scope: entry,
        message: `Failed to parse module JSON: ${err.message}`,
      });
    }
  }
  return cache;
}

function loadDraftFiles() {
  if (!fs.existsSync(DRAFT_DIR)) return [];
  const out = [];
  const walker = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walker(full);
      else if (entry.isFile() && entry.name.endsWith('.yaml')) out.push(full);
    }
  };
  walker(DRAFT_DIR);
  return out;
}

function readYaml(file) {
  try {
    return yaml.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    REPORT.errors.push({
      scope: file,
      message: `YAML parse error: ${err.message}`,
    });
    return null;
  }
}

function validateFocus(moduleData, quiz) {
  if (!moduleData.microQuizFocus)
    return { valid: false, reason: 'Module missing microQuizFocus block' };
  const focus = moduleData.microQuizFocus[quiz.id];
  if (!focus)
    return {
      valid: false,
      reason: `No microQuizFocus defined for quiz ${quiz.id}`,
    };
  return { valid: true, focus };
}

function normalizeQuestionIds(quiz) {
  const seen = new Set();
  for (const question of quiz.questions || []) {
    if (!question.id) question.id = `${quiz.id}-${seen.size + 1}`;
    if (seen.has(question.id)) {
      const base = `${question.id}-${Date.now()}`;
      question.id = base;
    }
    seen.add(question.id);
  }
}

function emitQuizJSON(moduleInfo, quiz) {
  ensureDir(QUIZ_DIR);
  const moduleSlug = quiz.id.split('-').slice(0, 3).join('-');
  const fileName = `${quiz.id}.json`;
  const outPath = path.join(QUIZ_DIR, fileName);
  fs.writeFileSync(outPath, JSON.stringify(quiz, null, 2), 'utf8');
  if (!moduleInfo.data.microQuizzes.includes(quiz.id)) {
    moduleInfo.data.microQuizzes.push(quiz.id);
    moduleInfo.data.microQuizzes = Array.from(
      new Set(moduleInfo.data.microQuizzes)
    ).sort();
    fs.writeFileSync(
      moduleInfo.filePath,
      JSON.stringify(moduleInfo.data, null, 2),
      'utf8'
    );
  }
  REPORT.processed.push({
    quizId: quiz.id,
    moduleId: quiz.moduleId,
    output: path.relative(ROOT, outPath),
  });
}

function compileAll() {
  ensureDir(path.join(ROOT, 'tmp'));
  const modules = loadModuleCache();
  const files = loadDraftFiles();
  if (files.length === 0) {
    REPORT.warnings.push({
      scope: 'compile-microquizzes',
      message: 'No drafts found; skipping compilation.',
    });
    return;
  }
  for (const file of files) {
    const quizDraft = readYaml(file);
    if (!quizDraft || !quizDraft.quiz) continue;
    const { quiz } = quizDraft;
    if (!quiz.id || !quiz.moduleId) {
      REPORT.errors.push({
        scope: file,
        message: 'Missing quiz.id or quiz.moduleId',
      });
      continue;
    }
    const moduleInfo = modules.get(quiz.moduleId);
    if (!moduleInfo) {
      REPORT.errors.push({
        scope: file,
        message: `Module ${quiz.moduleId} not found`,
      });
      continue;
    }
    const focusCheck = validateFocus(moduleInfo.data, quiz);
    if (!focusCheck.valid) {
      REPORT.errors.push({ scope: file, message: focusCheck.reason });
      continue;
    }
    normalizeQuestionIds(quiz);
    emitQuizJSON(moduleInfo, quiz);
  }
}

function writeReport() {
  fs.writeFileSync(REPORT_PATH, JSON.stringify(REPORT, null, 2));
  console.log(`microquiz compilation report written to ${REPORT_PATH}`);
  if (REPORT.errors.length > 0) {
    console.error('Compilation completed with errors.');
    process.exitCode = 1;
  }
}

function main() {
  try {
    compileAll();
  } catch (err) {
    REPORT.errors.push({ scope: 'compile-microquizzes', message: err.message });
    process.exitCode = 1;
  } finally {
    writeReport();
  }
}

main();
