import fs from 'fs';
import path from 'path';

const modulesDir = path.resolve('src/data/ihk/modules');
const quizzesDir = path.resolve('src/data/ihk/quizzes');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));

const report = [];

for (const mf of moduleFiles) {
  const mpath = path.join(modulesDir, mf);
  let m;
  try {
    m = readJson(mpath);
  } catch (e) {
    continue;
  }

  const ids = new Set();
  if (Array.isArray(m.microQuizzes)) m.microQuizzes.forEach(id => ids.add(id));
  if (Array.isArray(m.microquizzes)) m.microquizzes.forEach(id => ids.add(id));
  if (Array.isArray(m.relatedQuizzes))
    m.relatedQuizzes.forEach(id => ids.add(id));

  if (ids.size === 0) continue;

  const content = typeof m.content === 'string' ? m.content : '';
  const missingFiles = [];
  const missingMarkers = [];

  for (const id of ids) {
    const quizPath = path.join(quizzesDir, `${id}.json`);
    if (!fs.existsSync(quizPath)) missingFiles.push(id);
    const marker = `<!-- micro-quiz:${id} -->`;
    if (!content.includes(marker)) missingMarkers.push(id);
  }

  if (missingFiles.length || missingMarkers.length) {
    report.push({ module: mf, moduleId: m.id, missingFiles, missingMarkers });
  }
}

console.log(JSON.stringify(report, null, 2));
