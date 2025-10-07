import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const ihkDir = path.join(root, 'src', 'data', 'ihk');

function safeParse(content, file) {
  try {
    return JSON.parse(content);
  } catch (err) {
    return { __parseError: err.message, __file: file };
  }
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return safeParse(content, filePath);
}

async function main() {
  const report = { modules: [], quizzes: [], errors: [] };

  // Load metadata
  const categories = await readJson(
    path.join(ihkDir, 'metadata', 'categories.json')
  );
  const examChanges = await readJson(
    path.join(ihkDir, 'metadata', 'exam-changes-2025.json')
  );

  // Gather module files
  const modulesDir = path.join(ihkDir, 'modules');
  const moduleFiles = await fs.readdir(modulesDir);
  const modules = {};
  for (const f of moduleFiles) {
    if (!f.endsWith('.json')) continue;
    const full = path.join(modulesDir, f);
    const data = await readJson(full);
    if (data.__parseError) {
      report.errors.push({ file: full, error: data.__parseError });
      continue;
    }
    modules[data.id || f] = { data, file: full };
  }

  // Gather quizzes
  const quizzesDir = path.join(ihkDir, 'quizzes');
  const quizFiles = await fs.readdir(quizzesDir);
  const quizzes = {};
  for (const f of quizFiles) {
    if (!f.endsWith('.json')) continue;
    const full = path.join(quizzesDir, f);
    const data = await readJson(full);
    if (data.__parseError) {
      report.errors.push({ file: full, error: data.__parseError });
      continue;
    }
    quizzes[data.id || f] = { data, file: full };
  }

  // Validate modules
  for (const [key, m] of Object.entries(modules)) {
    const issues = [];
    const d = m.data;
    const req = [
      'id',
      'title',
      'description',
      'category',
      'difficulty',
      'examRelevance',
      'learningObjectives',
      'lastUpdated',
    ];
    for (const r of req) if (!d[r]) issues.push(`missing:${r}`);
    // category must be present in categories metadata (if available)
    if (
      d.category &&
      Array.isArray(categories) &&
      !categories.includes(d.category)
    ) {
      issues.push(`invalid:category:${d.category}`);
    }
    // relatedQuizzes existence
    if (Array.isArray(d.relatedQuizzes)) {
      for (const qid of d.relatedQuizzes) {
        if (!quizzes[qid]) issues.push(`missing:relatedQuiz:${qid}`);
      }
    }
    // If module flagged newIn2025 but not present in examChanges newTopics, warn
    if (d.newIn2025 && examChanges && Array.isArray(examChanges.newTopics)) {
      if (
        !examChanges.newTopics.includes(d.id) &&
        !examChanges.newTopics.includes(d.title)
      ) {
        issues.push('newIn2025:not-listed-in-exam-changes');
      }
    }
    if (issues.length)
      report.modules.push({ id: d.id || key, file: m.file, issues });
  }

  // Validate quizzes
  for (const [key, q] of Object.entries(quizzes)) {
    const issues = [];
    const d = q.data;
    const req = ['id', 'moduleId', 'title', 'questions'];
    for (const r of req) if (!d[r]) issues.push(`missing:${r}`);
    // moduleId should exist
    if (d.moduleId && !modules[d.moduleId])
      issues.push(`missing:module:${d.moduleId}`);
    // validate questions
    if (Array.isArray(d.questions)) {
      for (const qq of d.questions) {
        if (!qq.id) issues.push(`question:missing:id`);
        if (!qq.type) issues.push(`question:missing:type:${qq.id || '?'}`);
        if (!qq.question)
          issues.push(`question:missing:question:${qq.id || '?'}`);
        if (qq.type && qq.type.includes('choice')) {
          if (!Array.isArray(qq.options) || qq.options.length < 2)
            issues.push(`question:bad:options:${qq.id || '?'}`);
          if (qq.correctAnswer === undefined || qq.correctAnswer === null)
            issues.push(`question:missing:correctAnswer:${qq.id || '?'}`);
        }
      }
    }
    if (issues.length)
      report.quizzes.push({ id: d.id || key, file: q.file, issues });
  }

  // Find orphan quizzes / modules
  for (const [qid, qobj] of Object.entries(quizzes)) {
    const modId = qobj.data.moduleId;
    if (!modId) continue;
    if (!modules[modId])
      report.errors.push({
        type: 'orphanQuiz',
        quiz: qid,
        moduleId: modId,
        file: qobj.file,
      });
  }

  // Print report
  console.log('IHK Content Validation Report');
  console.log('Modules with issues:', report.modules.length);
  for (const m of report.modules)
    console.log('-', m.id, m.issues.join(', '), m.file);
  console.log('\nQuizzes with issues:', report.quizzes.length);
  for (const q of report.quizzes)
    console.log('-', q.id, q.issues.join(', '), q.file);
  console.log('\nOther errors:', report.errors.length);
  for (const e of report.errors) console.log('-', e);

  // Exit code non-zero if issues found
  const totalProblems =
    report.modules.length + report.quizzes.length + report.errors.length;
  if (totalProblems > 0) process.exit(2);
}

main().catch(err => {
  console.error('Validator failed:', err);
  process.exit(3);
});
