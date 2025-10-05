/* eslint-disable no-console */
/**
 * Quiz Template Generator
 * Generates quiz templates for modules that don't have quizzes yet
 *
 * Usage: node scripts/generate-quiz-templates.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modulesDir = path.join(__dirname, '..', 'src', 'data', 'ihk', 'modules');
const quizzesDir = path.join(__dirname, '..', 'src', 'data', 'ihk', 'quizzes');

// Get all modules
const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));

// Get existing quizzes
const existingQuizzes = fs
  .readdirSync(quizzesDir)
  .filter(f => f.endsWith('.json'))
  .map(f => {
    const quiz = JSON.parse(fs.readFileSync(path.join(quizzesDir, f), 'utf-8'));
    return quiz.moduleId;
  });

console.log('📚 Quiz Template Generator\n');
console.log(`Found ${moduleFiles.length} modules`);
console.log(`Found ${existingQuizzes.length} existing quizzes\n`);

let generated = 0;

moduleFiles.forEach(file => {
  const modulePath = path.join(modulesDir, file);
  const module = JSON.parse(fs.readFileSync(modulePath, 'utf-8'));

  // Check if quiz already exists
  if (existingQuizzes.includes(module.id)) {
    console.log(`⏭️  Skipping ${module.id} - quiz already exists`);
    return;
  }

  // Generate quiz template
  const quizTemplate = {
    id: `${module.id}-quiz`,
    moduleId: module.id,
    title: `${module.title} Quiz`,
    description: `Teste dein Wissen über ${module.title}`,
    category: module.category,
    difficulty: module.difficulty || 'intermediate',
    examRelevance: module.examRelevance || 'medium',
    timeLimit: 10,
    passingScore: 70,
    questions: [
      {
        id: 'q1',
        type: 'single-choice',
        question: `Was ist ${module.title}?`,
        options: [
          'Richtige Antwort hier einfügen',
          'Falsche Option 1',
          'Falsche Option 2',
          'Falsche Option 3',
        ],
        correctAnswer: 'Richtige Antwort hier einfügen',
        explanation: 'Erklärung hier einfügen',
        points: 1,
        category: 'Grundlagen',
      },
      {
        id: 'q2',
        type: 'single-choice',
        question: 'Frage 2 hier einfügen',
        options: [
          'Richtige Antwort',
          'Falsche Option 1',
          'Falsche Option 2',
          'Falsche Option 3',
        ],
        correctAnswer: 'Richtige Antwort',
        explanation: 'Erklärung hier einfügen',
        points: 1,
        category: 'Konzepte',
      },
      {
        id: 'q3',
        type: 'multiple-choice',
        question: 'Welche Aussagen sind korrekt? (Mehrere Antworten möglich)',
        options: [
          'Richtige Aussage 1',
          'Richtige Aussage 2',
          'Falsche Aussage 1',
          'Falsche Aussage 2',
        ],
        correctAnswer: ['Richtige Aussage 1', 'Richtige Aussage 2'],
        explanation: 'Erklärung hier einfügen',
        points: 2,
        category: 'Anwendung',
      },
      {
        id: 'q4',
        type: 'single-choice',
        question: 'Frage 4 hier einfügen',
        options: [
          'Richtige Antwort',
          'Falsche Option 1',
          'Falsche Option 2',
          'Falsche Option 3',
        ],
        correctAnswer: 'Richtige Antwort',
        explanation: 'Erklärung hier einfügen',
        points: 1,
        category: 'Praxis',
      },
      {
        id: 'q5',
        type: 'single-choice',
        question: 'Frage 5 hier einfügen',
        options: [
          'Richtige Antwort',
          'Falsche Option 1',
          'Falsche Option 2',
          'Falsche Option 3',
        ],
        correctAnswer: 'Richtige Antwort',
        explanation: 'Erklärung hier einfügen',
        points: 1,
        category: 'Vertiefung',
      },
    ],
    tags: module.tags || [],
  };

  // Write quiz template
  const quizPath = path.join(quizzesDir, `${module.id}-quiz.json`);
  fs.writeFileSync(quizPath, JSON.stringify(quizTemplate, null, 2));

  console.log(`✅ Generated template for ${module.id}`);
  generated++;
});

console.log(`\n📊 Summary:`);
console.log(`   Generated: ${generated} quiz templates`);
console.log(`   Existing: ${existingQuizzes.length} quizzes`);
console.log(`   Total: ${generated + existingQuizzes.length} quizzes`);
console.log(
  `\n💡 Next steps: Edit the generated quiz files to add proper questions and answers`
);
