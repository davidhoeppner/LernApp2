// @ts-nocheck
/* eslint-env node */
/**
 * Repairs automatically generated placeholder microquiz files that are missing required fields
 * (description, category, difficulty, question ids/types, etc.).
 */
const fs = require('fs');
const path = require('path');

const QUIZZES_DIR = path.join(process.cwd(), '..', 'src', 'data', 'ihk', 'quizzes');

function listQuizFiles() {
  return fs.readdirSync(QUIZZES_DIR).filter(f => f.endsWith('.json'));
}

function needsRepair(q) {
  if (!q.description || !q.category || !q.difficulty) return true;
  if (!Array.isArray(q.questions) || q.questions.length !== 3) return true;
  for (const qq of q.questions) {
    if (!qq.id || !qq.type || !qq.question || qq.points == null) return true;
    if (qq.type === 'single-choice' && (!qq.options || !qq.options.includes(qq.correctAnswer))) return true;
    if (qq.type === 'multiple-choice' && (!Array.isArray(qq.correctAnswer))) return true;
    if (qq.type === 'true-false' && typeof qq.correctAnswer !== 'boolean') return true;
  }
  return false;
}

function repairQuiz(q, file) {
  let changed = false;
  q.description = q.description || `Automatisch generiertes Microquiz (${q.id}).`;
  q.category = q.category || (q.moduleId && q.moduleId.startsWith('fue-') ? 'FÜ-01' : 'BP-01');
  q.difficulty = q.difficulty || 'beginner';
  q.timeLimit = q.timeLimit || 180;
  q.passingScore = q.passingScore || 60;
  if (!Array.isArray(q.questions)) {
    q.questions = [];
  }
  // Normalize to exactly 3 questions; if fewer, generate placeholders
  while (q.questions.length < 3) {
    const idx = q.questions.length + 1;
    q.questions.push({
      id: `q${idx}`,
      type: idx === 2 ? 'true-false' : (idx === 3 ? 'multiple-choice' : 'single-choice'),
      question: `Platzhalterfrage ${idx} für ${q.title || q.id}`,
      options: idx === 2 ? undefined : (idx === 3 ? ['A', 'B', 'C'] : ['A', 'B', 'C']),
      correctAnswer: idx === 2 ? true : (idx === 3 ? ['A'] : 'A'),
      explanation: 'Automatisch ergänzt.',
      points: 1
    });
  }
  q.questions = q.questions.slice(0,3).map((qq,i) => {
    const id = `q${i+1}`;
    if (qq.id !== id) { qq.id = id; changed = true; }
    if (!qq.type) { qq.type = i===0?'single-choice': i===1?'true-false':'multiple-choice'; changed = true; }
    if (!qq.points) { qq.points = 1; changed = true; }
    if (qq.type === 'single-choice') {
      if (!qq.options || qq.options.length < 2) { qq.options = ['Option 1','Option 2','Option 3']; changed = true; }
      if (!qq.correctAnswer || !qq.options.includes(qq.correctAnswer)) { qq.correctAnswer = qq.options[0]; changed = true; }
    } else if (qq.type === 'multiple-choice') {
      if (!qq.options || qq.options.length < 2) { qq.options = ['A','B','C']; changed = true; }
      if (!Array.isArray(qq.correctAnswer)) { qq.correctAnswer = [qq.options[0]]; changed = true; }
    } else if (qq.type === 'true-false') {
      if (typeof qq.correctAnswer !== 'boolean') { qq.correctAnswer = true; changed = true; }
    }
    if (!qq.explanation) { qq.explanation = 'Automatisch ergänzt.'; changed = true; }
    return qq;
  });
  return changed;
}

function main() {
  const files = listQuizFiles();
  let repaired = 0;
  files.forEach(f => {
    const full = path.join(QUIZZES_DIR, f);
    let json;
    try { json = JSON.parse(fs.readFileSync(full,'utf8')); } catch { return; }
    if (needsRepair(json)) {
      const changed = repairQuiz(json, f);
      if (changed) {
        fs.writeFileSync(full, JSON.stringify(json,null,2),'utf8');
        repaired++;
        console.log('Repaired', f);
      }
    }
  });
  console.log(`Repair complete. Repaired ${repaired} file(s).`);
}

if (require.main === module) main();
