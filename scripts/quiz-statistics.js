/**
 * Quiz Statistics Script
 * Generates statistics about all quizzes (question count, difficulty, etc.)
 * 
 * Usage: node scripts/quiz-statistics.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const quizzesDir = path.join(__dirname, '../src/data/ihk/quizzes');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

async function generateQuizStatistics() {
  console.log(`${colors.bold}${colors.cyan}=== Quiz Statistics Report ===${colors.reset}\n`);
  
  // Read all quiz files
  const files = fs.readdirSync(quizzesDir).filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    console.log(`${colors.yellow}No quiz files found in ${quizzesDir}${colors.reset}`);
    return;
  }
  
  console.log(`Analyzing ${files.length} quiz files...\n`);
  
  const statistics = {
    totalQuizzes: 0,
    totalQuestions: 0,
    questionCounts: [],
    difficulties: { beginner: 0, intermediate: 0, advanced: 0, unknown: 0 },
    examRelevance: { high: 0, medium: 0, low: 0, unknown: 0 },
    categories: {},
    questionTypes: { 'single-choice': 0, 'multiple-choice': 0, 'true-false': 0, 'code': 0, other: 0 },
    newIn2025: 0,
    quizzes: [],
  };
  
  // Analyze each quiz
  for (const file of files) {
    const filePath = path.join(quizzesDir, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const quiz = JSON.parse(content);
      
      const questionCount = quiz.questions ? quiz.questions.length : 0;
      
      statistics.totalQuizzes++;
      statistics.totalQuestions += questionCount;
      statistics.questionCounts.push(questionCount);
      
      // Difficulty
      if (quiz.difficulty) {
        statistics.difficulties[quiz.difficulty] = (statistics.difficulties[quiz.difficulty] || 0) + 1;
      } else {
        statistics.difficulties.unknown++;
      }
      
      // Exam relevance
      if (quiz.examRelevance) {
        statistics.examRelevance[quiz.examRelevance] = (statistics.examRelevance[quiz.examRelevance] || 0) + 1;
      } else {
        statistics.examRelevance.unknown++;
      }
      
      // Category
      if (quiz.category) {
        statistics.categories[quiz.category] = (statistics.categories[quiz.category] || 0) + 1;
      }
      
      // New in 2025
      if (quiz.newIn2025) {
        statistics.newIn2025++;
      }
      
      // Question types
      if (quiz.questions && Array.isArray(quiz.questions)) {
        quiz.questions.forEach(q => {
          if (q.type && statistics.questionTypes[q.type] !== undefined) {
            statistics.questionTypes[q.type]++;
          } else {
            statistics.questionTypes.other++;
          }
        });
      }
      
      // Store quiz info
      statistics.quizzes.push({
        file,
        id: quiz.id || 'unknown',
        title: quiz.title || 'Untitled',
        moduleId: quiz.moduleId || 'unknown',
        category: quiz.category || 'unknown',
        difficulty: quiz.difficulty || 'unknown',
        examRelevance: quiz.examRelevance || 'unknown',
        questionCount,
        newIn2025: quiz.newIn2025 || false,
        timeLimit: quiz.timeLimit || 'N/A',
        passingScore: quiz.passingScore || 'N/A',
      });
      
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} Error parsing ${file}: ${error.message}`);
    }
  }
  
  // Calculate statistics
  const avgQuestions = statistics.totalQuestions / statistics.totalQuizzes;
  const minQuestions = Math.min(...statistics.questionCounts);
  const maxQuestions = Math.max(...statistics.questionCounts);
  const medianQuestions = statistics.questionCounts.sort((a, b) => a - b)[Math.floor(statistics.questionCounts.length / 2)];
  
  // Print overview
  console.log(`${colors.bold}${colors.cyan}=== Overview ===${colors.reset}`);
  console.log(`Total Quizzes: ${colors.bold}${statistics.totalQuizzes}${colors.reset}`);
  console.log(`Total Questions: ${colors.bold}${statistics.totalQuestions}${colors.reset}`);
  console.log(`Average Questions per Quiz: ${colors.bold}${avgQuestions.toFixed(1)}${colors.reset}`);
  console.log(`Min Questions: ${colors.bold}${minQuestions}${colors.reset}`);
  console.log(`Max Questions: ${colors.bold}${maxQuestions}${colors.reset}`);
  console.log(`Median Questions: ${colors.bold}${medianQuestions}${colors.reset}`);
  
  // Print difficulty distribution
  console.log(`\n${colors.bold}${colors.cyan}=== Difficulty Distribution ===${colors.reset}`);
  console.log(`${colors.green}Beginner:${colors.reset} ${statistics.difficulties.beginner} (${((statistics.difficulties.beginner / statistics.totalQuizzes) * 100).toFixed(1)}%)`);
  console.log(`${colors.yellow}Intermediate:${colors.reset} ${statistics.difficulties.intermediate} (${((statistics.difficulties.intermediate / statistics.totalQuizzes) * 100).toFixed(1)}%)`);
  console.log(`${colors.red}Advanced:${colors.reset} ${statistics.difficulties.advanced} (${((statistics.difficulties.advanced / statistics.totalQuizzes) * 100).toFixed(1)}%)`);
  if (statistics.difficulties.unknown > 0) {
    console.log(`${colors.magenta}Unknown:${colors.reset} ${statistics.difficulties.unknown}`);
  }
  
  // Print exam relevance
  console.log(`\n${colors.bold}${colors.cyan}=== Exam Relevance ===${colors.reset}`);
  console.log(`${colors.red}High:${colors.reset} ${statistics.examRelevance.high} (${((statistics.examRelevance.high / statistics.totalQuizzes) * 100).toFixed(1)}%)`);
  console.log(`${colors.yellow}Medium:${colors.reset} ${statistics.examRelevance.medium} (${((statistics.examRelevance.medium / statistics.totalQuizzes) * 100).toFixed(1)}%)`);
  console.log(`${colors.green}Low:${colors.reset} ${statistics.examRelevance.low} (${((statistics.examRelevance.low / statistics.totalQuizzes) * 100).toFixed(1)}%)`);
  if (statistics.examRelevance.unknown > 0) {
    console.log(`${colors.magenta}Unknown:${colors.reset} ${statistics.examRelevance.unknown}`);
  }
  
  // Print category distribution
  console.log(`\n${colors.bold}${colors.cyan}=== Category Distribution ===${colors.reset}`);
  Object.entries(statistics.categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`${category}: ${count} (${((count / statistics.totalQuizzes) * 100).toFixed(1)}%)`);
    });
  
  // Print question type distribution
  console.log(`\n${colors.bold}${colors.cyan}=== Question Type Distribution ===${colors.reset}`);
  console.log(`Single-Choice: ${statistics.questionTypes['single-choice']} (${((statistics.questionTypes['single-choice'] / statistics.totalQuestions) * 100).toFixed(1)}%)`);
  console.log(`Multiple-Choice: ${statistics.questionTypes['multiple-choice']} (${((statistics.questionTypes['multiple-choice'] / statistics.totalQuestions) * 100).toFixed(1)}%)`);
  console.log(`True-False: ${statistics.questionTypes['true-false']} (${((statistics.questionTypes['true-false'] / statistics.totalQuestions) * 100).toFixed(1)}%)`);
  console.log(`Code: ${statistics.questionTypes['code']} (${((statistics.questionTypes['code'] / statistics.totalQuestions) * 100).toFixed(1)}%)`);
  if (statistics.questionTypes.other > 0) {
    console.log(`Other: ${statistics.questionTypes.other}`);
  }
  
  // Print new 2025 topics
  console.log(`\n${colors.bold}${colors.cyan}=== New 2025 Topics ===${colors.reset}`);
  console.log(`Quizzes marked as new in 2025: ${colors.bold}${statistics.newIn2025}${colors.reset}`);
  
  // Print quizzes needing attention (< 15 or > 20 questions)
  const needsAttention = statistics.quizzes.filter(q => q.questionCount < 15 || q.questionCount > 20);
  
  if (needsAttention.length > 0) {
    console.log(`\n${colors.bold}${colors.yellow}=== Quizzes Needing Attention ===${colors.reset}`);
    console.log(`${needsAttention.length} quiz(zes) have less than 15 or more than 20 questions:\n`);
    
    needsAttention
      .sort((a, b) => a.questionCount - b.questionCount)
      .forEach(quiz => {
        const color = quiz.questionCount < 15 ? colors.red : colors.yellow;
        console.log(`${color}${quiz.questionCount} questions${colors.reset} - ${quiz.title} (${quiz.file})`);
      });
  }
  
  // Print detailed quiz list
  console.log(`\n${colors.bold}${colors.cyan}=== Detailed Quiz List ===${colors.reset}`);
  console.log(`(Sorted by question count)\n`);
  
  statistics.quizzes
    .sort((a, b) => a.questionCount - b.questionCount)
    .forEach(quiz => {
      const questionColor = quiz.questionCount < 15 ? colors.red : 
                           quiz.questionCount > 20 ? colors.yellow : 
                           colors.green;
      
      const newBadge = quiz.newIn2025 ? `${colors.cyan}[NEW 2025]${colors.reset} ` : '';
      
      console.log(`${questionColor}${quiz.questionCount.toString().padStart(2)}${colors.reset} questions | ${newBadge}${quiz.title}`);
      console.log(`   ${colors.blue}${quiz.category}${colors.reset} | ${quiz.difficulty} | ${quiz.examRelevance} relevance | ${quiz.file}`);
    });
  
  // Save detailed report to file
  const reportPath = path.join(__dirname, '../QUIZ_STATISTICS_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalQuizzes: statistics.totalQuizzes,
      totalQuestions: statistics.totalQuestions,
      avgQuestions: parseFloat(avgQuestions.toFixed(1)),
      minQuestions,
      maxQuestions,
      medianQuestions,
    },
    difficulties: statistics.difficulties,
    examRelevance: statistics.examRelevance,
    categories: statistics.categories,
    questionTypes: statistics.questionTypes,
    newIn2025Count: statistics.newIn2025,
    quizzes: statistics.quizzes,
    needsAttention,
  }, null, 2));
  
  console.log(`\n${colors.cyan}Detailed report saved to: ${reportPath}${colors.reset}`);
  console.log(`\n${colors.green}Statistics generation complete!${colors.reset}`);
}

// Run statistics generation
generateQuizStatistics().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
