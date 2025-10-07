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
  constructor(
    stateManager,
    storageService,
    ihkContentService,
    specializationService
  ) {
    this.stateManager = stateManager;
    this.storage = storageService || new StorageService();
    this.ihkContentService = ihkContentService;
    this.specializationService = specializationService;
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

  /**
   * Get quizzes filtered by specialization
   * @param {string} specializationId - The specialization ID to filter for
   * @param {Object} options - Filtering options
   * @param {string} options.minRelevance - Minimum relevance level ('high', 'medium', 'low')
   * @param {boolean} options.includeGeneral - Whether to include general content
   * @returns {Promise<Array>} Filtered quizzes array
   */
  async getQuizzesBySpecialization(specializationId, options = {}) {
    try {
      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      // Get all quizzes first
      const allQuizzes = await this.getQuizzes();

      // If no specialization service available, return all quizzes
      if (!this.specializationService) {
        console.warn(
          'SpecializationService not available, returning all quizzes'
        );
        return allQuizzes;
      }

      // Filter quizzes by specialization
      const filteredQuizzes =
        this.specializationService.filterContentBySpecialization(
          allQuizzes,
          specializationId,
          {
            minRelevance: options.minRelevance || 'low',
            includeGeneral: options.includeGeneral !== false, // default to true
          }
        );

      return filteredQuizzes;
    } catch (error) {
      console.error(
        `Error getting quizzes by specialization ${specializationId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get quizzes organized by category for a specific specialization
   * @param {string} specializationId - The specialization ID
   * @returns {Promise<Object>} Object with categories as keys and quiz arrays as values
   */
  async getCategorizedQuizzes(specializationId) {
    try {
      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      // Get all quizzes
      const allQuizzes = await this.getQuizzes();

      // If no specialization service available, return quizzes under 'all' category
      if (!this.specializationService) {
        console.warn(
          'SpecializationService not available, returning uncategorized quizzes'
        );
        return { all: allQuizzes };
      }

      // Get content categories for this specialization
      const categories =
        this.specializationService.getContentCategories(specializationId);
      const categorizedQuizzes = {};

      // Initialize categories
      categories.forEach(category => {
        categorizedQuizzes[category.id] = [];
      });

      // Add an 'all' category for convenience
      categorizedQuizzes.all = allQuizzes;

      // Categorize quizzes
      allQuizzes.forEach(quiz => {
        const categoryId = quiz.category || quiz.categoryId;

        if (categoryId) {
          // Get relevance for this category and specialization
          const relevance = this.specializationService.getCategoryRelevance(
            categoryId,
            specializationId
          );

          // Add to appropriate category based on relevance
          if (relevance === 'high' || relevance === 'medium') {
            // Find the category this quiz belongs to
            const category = categories.find(cat => cat.id === categoryId);
            if (category) {
              categorizedQuizzes[category.id].push(quiz);
            } else {
              // Check if it's general content
              if (this._isGeneralContent(categoryId)) {
                if (!categorizedQuizzes.general) {
                  categorizedQuizzes.general = [];
                }
                categorizedQuizzes.general.push(quiz);
              }
            }
          }
        } else {
          // Quiz without category - add to general if it exists
          if (categorizedQuizzes.general) {
            categorizedQuizzes.general.push(quiz);
          }
        }
      });

      return categorizedQuizzes;
    } catch (error) {
      console.error(
        `Error getting categorized quizzes for specialization ${specializationId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get quizzes by category for a specific specialization
   * @param {string} categoryId - The category ID to filter by
   * @param {string} specializationId - The specialization ID
   * @returns {Promise<Array>} Quizzes in the specified category
   */
  async getQuizzesByCategory(categoryId, specializationId) {
    try {
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Invalid category ID');
      }

      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      // Get all quizzes
      const allQuizzes = await this.getQuizzes();

      // Filter quizzes by category
      const categoryQuizzes = allQuizzes.filter(quiz => {
        const quizCategoryId = quiz.category || quiz.categoryId;
        return quizCategoryId === categoryId;
      });

      // If no specialization service available, return category quizzes as-is
      if (!this.specializationService) {
        console.warn(
          'SpecializationService not available, returning unfiltered category quizzes'
        );
        return categoryQuizzes;
      }

      // Further filter by specialization relevance
      const filteredQuizzes =
        this.specializationService.filterContentBySpecialization(
          categoryQuizzes,
          specializationId,
          {
            minRelevance: 'low',
            includeGeneral: true,
          }
        );

      return filteredQuizzes;
    } catch (error) {
      console.error(
        `Error getting quizzes by category ${categoryId} for specialization ${specializationId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Check if content is general (applies to all specializations)
   * @private
   * @param {string} categoryId - The category ID to check
   * @returns {boolean} True if content is general
   */
  _isGeneralContent(categoryId) {
    if (!this.specializationService) {
      return false;
    }

    // Delegate to SpecializationService
    return this.specializationService._isGeneralContent(categoryId);
  }

  /**
   * Get current user's specialization-filtered quizzes
   * Convenience method that uses the current user's specialization
   * @param {Object} options - Filtering options
   * @returns {Promise<Array>} Filtered quizzes for current specialization
   */
  async getCurrentSpecializationQuizzes(options = {}) {
    try {
      if (!this.specializationService) {
        console.warn(
          'SpecializationService not available, returning all quizzes'
        );
        return await this.getQuizzes();
      }

      const currentSpecialization =
        this.specializationService.getCurrentSpecialization();

      if (!currentSpecialization) {
        // No specialization selected, return all quizzes
        return await this.getQuizzes();
      }

      return await this.getQuizzesBySpecialization(
        currentSpecialization,
        options
      );
    } catch (error) {
      console.error('Error getting current specialization quizzes:', error);
      throw error;
    }
  }

  /**
   * Get quiz statistics by specialization
   * @param {string} specializationId - The specialization ID
   * @returns {Promise<Object>} Statistics object with counts by category and relevance
   */
  async getQuizStatistics(specializationId) {
    try {
      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      const allQuizzes = await this.getQuizzes();
      const stats = {
        total: allQuizzes.length,
        byRelevance: {
          high: 0,
          medium: 0,
          low: 0,
          none: 0,
        },
        byCategory: {},
        specialization: specializationId,
      };

      if (!this.specializationService) {
        console.warn(
          'SpecializationService not available, returning basic statistics'
        );
        return stats;
      }

      // Calculate statistics
      allQuizzes.forEach(quiz => {
        const categoryId = quiz.category || quiz.categoryId;

        if (categoryId) {
          const relevance = this.specializationService.getCategoryRelevance(
            categoryId,
            specializationId
          );

          // Count by relevance
          if (stats.byRelevance[relevance] !== undefined) {
            stats.byRelevance[relevance]++;
          }

          // Count by category
          if (!stats.byCategory[categoryId]) {
            stats.byCategory[categoryId] = {
              count: 0,
              relevance: relevance,
            };
          }
          stats.byCategory[categoryId].count++;
        } else {
          // Quiz without category
          stats.byRelevance.none++;
        }
      });

      return stats;
    } catch (error) {
      console.error(
        `Error getting quiz statistics for specialization ${specializationId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get quiz attempts filtered by specialization
   * @param {string} specializationId - The specialization ID
   * @returns {Promise<Array>} Quiz attempts for the specified specialization
   */
  async getQuizAttemptsBySpecialization(specializationId) {
    try {
      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      // Get all quiz attempts from progress
      const progress = this.stateManager.getState('progress') || {};
      const allAttempts = progress.quizAttempts || [];

      if (!this.specializationService) {
        console.warn(
          'SpecializationService not available, returning all quiz attempts'
        );
        return allAttempts;
      }

      // Get all quizzes to check their categories
      const allQuizzes = await this.getQuizzes();
      const quizCategoryMap = {};

      // Build a map of quiz ID to category
      allQuizzes.forEach(quiz => {
        quizCategoryMap[quiz.id] = quiz.category || quiz.categoryId;
      });

      // Filter attempts by specialization relevance
      const filteredAttempts = allAttempts.filter(attempt => {
        const categoryId = quizCategoryMap[attempt.quizId];

        if (!categoryId) {
          return true; // Include attempts for quizzes without category
        }

        const relevance = this.specializationService.getCategoryRelevance(
          categoryId,
          specializationId
        );

        // Include if relevant or general content
        return (
          relevance !== 'none' ||
          this.specializationService._isGeneralContent(categoryId)
        );
      });

      return filteredAttempts;
    } catch (error) {
      console.error(
        `Error getting quiz attempts by specialization ${specializationId}:`,
        error
      );
      throw error;
    }
  }
}

export default QuizService;
