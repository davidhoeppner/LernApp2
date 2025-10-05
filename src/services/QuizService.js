import StorageService from './StorageService.js';

/**
 * QuizService - Quiz Business Logic Facade
 *
 * This service acts as a facade that delegates quiz data loading to IHKContentService
 * while providing quiz-specific business logic for:
 * - Answer validation and submission
 * - Score calculation
 * - Quiz attempt tracking and persistence
 *
 * This separation maintains clean architecture by keeping content loading
 * (handled by IHKContentService) separate from quiz-specific operations
 * (handled by this service).
 *
 * Architecture Pattern: Facade + Delegation
 * - Quiz data loading → Delegates to IHKContentService
 * - Quiz business logic → Implemented here
 */
class QuizService {
  constructor(stateManager, storageService, ihkContentService) {
    this.stateManager = stateManager;
    this.storage = storageService || new StorageService();
    this.ihkContentService = ihkContentService;
  }

  /**
   * Get all quizzes (delegates to IHKContentService)
   */
  async getQuizzes() {
    // Delegate to IHKContentService for unified quiz loading
    return await this.ihkContentService.getAllQuizzes();
  }

  /**
   * Get quiz by ID (delegates to IHKContentService)
   */
  async getQuizById(id) {
    // Delegate to IHKContentService
    const quiz = await this.ihkContentService.getQuizById(id);

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
