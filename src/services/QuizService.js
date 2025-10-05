import quizzesData from '../data/quizzes.json';
import StorageService from './StorageService.js';

// Import IHK quizzes
import scrumQuiz from '../data/ihk/quizzes/scrum-quiz.json';
import securityQuiz from '../data/ihk/quizzes/security-threats-quiz.json';
import sortingQuiz from '../data/ihk/quizzes/sorting-algorithms-quiz.json';
import sqlQuiz from '../data/ihk/quizzes/sql-comprehensive-quiz.json';
import tddQuiz from '../data/ihk/quizzes/tdd-quiz.json';

/**
 * QuizService - Manages quiz data and scoring
 * Now includes both regular and IHK quizzes
 */
class QuizService {
  constructor(stateManager, storageService, ihkContentService) {
    this.stateManager = stateManager;
    this.storage = storageService || new StorageService();
    this.ihkContentService = ihkContentService;
    this.quizzes = quizzesData;
  }

  /**
   * Get all quizzes (IHK quizzes only - the actual content you want)
   */
  async getQuizzes() {
    // Simple: return all imported IHK quizzes
    return [
      { ...scrumQuiz, source: 'ihk' },
      { ...securityQuiz, source: 'ihk' },
      { ...sortingQuiz, source: 'ihk' },
      { ...sqlQuiz, source: 'ihk' },
      { ...tddQuiz, source: 'ihk' },
    ];
  }

  /**
   * Get quiz by ID with error handling (IHK quizzes only)
   */
  async getQuizById(id) {
    const quizzes = await this.getQuizzes();
    const quiz = quizzes.find(q => q.id === id);

    if (!quiz) {
      throw new Error(`Quiz with ID "${id}" not found`);
    }

    return quiz;
  }

  /**
   * Submit answer with validation
   */
  async submitAnswer(quizId, questionId, answer) {
    try {
      if (!quizId || !questionId || answer === undefined) {
        throw new Error(
          'Invalid parameters: quizId, questionId, and answer are required'
        );
      }

      // Get the quiz
      const quiz = await this.getQuizById(quizId);

      // Find the question
      const question = quiz.questions.find(q => q.id === questionId);
      if (!question) {
        throw new Error(
          `Question with ID "${questionId}" not found in quiz "${quizId}"`
        );
      }

      // Validate answer is one of the options
      if (!question.options.includes(answer)) {
        throw new Error(
          'Invalid answer: answer must be one of the provided options'
        );
      }

      // Check if answer is correct
      const isCorrect = answer === question.correctAnswer;

      return {
        questionId,
        userAnswer: answer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      };
    } catch (error) {
      console.error(
        `Error submitting answer for quiz ${quizId}, question ${questionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Calculate score for quiz completion
   */
  async calculateScore(quizId, answers) {
    try {
      if (!quizId || !answers || !Array.isArray(answers)) {
        throw new Error(
          'Invalid parameters: quizId and answers array are required'
        );
      }

      // Get the quiz
      const quiz = await this.getQuizById(quizId);

      // Calculate correct answers
      let correctCount = 0;
      const results = [];

      for (const answer of answers) {
        const question = quiz.questions.find(q => q.id === answer.questionId);
        if (!question) {
          console.warn(
            `Question ${answer.questionId} not found in quiz ${quizId}`
          );
          continue;
        }

        const isCorrect = answer.userAnswer === question.correctAnswer;
        if (isCorrect) {
          correctCount++;
        }

        results.push({
          questionId: answer.questionId,
          userAnswer: answer.userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation,
        });
      }

      const totalQuestions = quiz.questions.length;
      const percentage =
        totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;

      return {
        quizId,
        totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: totalQuestions - correctCount,
        score: percentage,
        results,
      };
    } catch (error) {
      console.error(`Error calculating score for quiz ${quizId}:`, error);
      throw error;
    }
  }

  /**
   * Save quiz attempt to persist quiz results
   */
  async saveQuizAttempt(quizId, score, answers) {
    try {
      if (!quizId || score === undefined || !answers) {
        throw new Error(
          'Invalid parameters: quizId, score, and answers are required'
        );
      }

      // Get current progress
      const progress = this.stateManager.getState('progress') || {};
      const quizAttempts = progress.quizAttempts || [];

      // Create quiz attempt record
      const attempt = {
        quizId,
        score: score.score || score, // Handle both score object and number
        totalQuestions: score.totalQuestions || answers.length,
        correctAnswers: score.correctAnswers || 0,
        date: new Date().toISOString(),
        answers: answers.map(a => ({
          questionId: a.questionId,
          userAnswer: a.userAnswer,
          correct: a.isCorrect || false,
        })),
      };

      // Add to quiz attempts
      this.stateManager.setState('progress.quizAttempts', [
        ...quizAttempts,
        attempt,
      ]);

      // Update last activity
      this.stateManager.setState(
        'progress.lastActivity',
        new Date().toISOString()
      );

      return attempt;
    } catch (error) {
      console.error(`Error saving quiz attempt for ${quizId}:`, error);
      throw error;
    }
  }
}

export default QuizService;
