import fs from 'fs';
import path from 'path';

const modulesDir = path.resolve('src/data/ihk/modules');
const quizzesDir = path.resolve('src/data/ihk/quizzes');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(quizzesDir);

const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));
let created = 0;
let markersAppended = 0;

for (const mf of moduleFiles) {
  const mpath = path.join(modulesDir, mf);
  let m;
  try {
    m = readJson(mpath);
  } catch (e) {
    console.error('skip parse', mf);
    continue;
  }

  const ids = new Set();
  if (Array.isArray(m.microQuizzes)) m.microQuizzes.forEach(id => ids.add(id));
  if (Array.isArray(m.microquizzes)) m.microquizzes.forEach(id => ids.add(id));
  if (Array.isArray(m.relatedQuizzes))
    m.relatedQuizzes.forEach(id => ids.add(id));

  if (ids.size === 0) continue;

  let content = typeof m.content === 'string' ? m.content : '';
  let updatedModule = false;

  for (const id of ids) {
    const quizPath = path.join(quizzesDir, `${id}.json`);
    if (!fs.existsSync(quizPath)) {
      // create a simple 3-question quiz
      const quiz = {
        id,
        moduleId: m.id || mf.replace(/\.json$/, ''),
        title: `${m.title || quiz ? m.title + ' — ' : ''}Mini-Quiz`,
        description: `Automatisch generiertes Micro-Quiz für ${m.title || id}`,
        category: m.category || 'BP-01',
        difficulty: m.difficulty || 'beginner',
        timeLimit: 300,
        passingScore: 60,
        questions: [
          {
            id: 'q1',
            type: 'single-choice',
            question: 'Kurze Verständnisfrage 1',
            options: ['Option A', 'Option B', 'Option C'],
            correctAnswer: 'Option A',
            explanation: 'Kurzbegründung',
            points: 1,
          },
          {
            id: 'q2',
            type: 'true-false',
            question: 'Kurze Wahr/Falsch-Frage',
            correctAnswer: true,
            explanation: 'Kurzbegründung',
            points: 1,
          },
          {
            id: 'q3',
            type: 'multiple-choice',
            question: 'Mehrfachauswahl: wähle alle zutreffenden',
            options: ['A', 'B', 'C'],
            correctAnswer: ['A', 'B'],
            explanation: 'Kurzbegründung',
            points: 1,
          },
        ],
      };

      fs.writeFileSync(quizPath, JSON.stringify(quiz, null, 2) + '\n', 'utf8');
      created++;
      console.log('Created quiz:', quizPath);
    }

    const marker = `<!-- micro-quiz:${id} -->`;
    if (!content.includes(marker)) {
      // Append marker to content
      content = content + '\n\n' + marker;
      updatedModule = true;
      markersAppended++;
      console.log(`Appended marker for ${id} in ${mf}`);
    }
  }

  if (updatedModule) {
    m.content = content;
    // ensure module references list microQuizzes and relatedQuizzes
    if (!m.microQuizzes) m.microQuizzes = Array.from(ids);
    if (!Array.isArray(m.relatedQuizzes)) m.relatedQuizzes = Array.from(ids);
    fs.writeFileSync(mpath, JSON.stringify(m, null, 2) + '\n', 'utf8');
  }
}

console.log(
  `Done. Created quizzes: ${created}. Appended markers: ${markersAppended}`
);
