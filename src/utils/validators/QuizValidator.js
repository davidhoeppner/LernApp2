/**
 * Quiz Validator
 * Validates IHK quiz data for correctness and completeness
 */

class QuizValidator {
  constructor() {
    this.validDifficulties = ['beginner', 'intermediate', 'advanced'];
    this.validRelevance = ['low', 'medium', 'high'];
    this.validQuestionTypes = [
      'single-choice',
      'multiple-choice',
      'true-false',
      'code',
    ];
  }

  /**
   * Validate a complete quiz
   */
  validate(quiz) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!quiz.id) errors.push('Missing required field: id');
    if (!quiz.title) errors.push('Missing required field: title');
    if (!quiz.description) errors.push('Missing required field: description');
    if (!quiz.category) errors.push('Missing required field: category');
    if (!quiz.difficulty) errors.push('Missing required field: difficulty');

    if (!quiz.questions || quiz.questions.length === 0) {
      errors.push('Quiz must have at least one question');
    }

    // Validate difficulty
    if (quiz.difficulty && !this.validDifficulties.includes(quiz.difficulty)) {
      errors.push(
        `Invalid difficulty: "${quiz.difficulty}". Must be one of: ${this.validDifficulties.join(', ')}`
      );
    }

    // Validate exam relevance
    if (
      quiz.examRelevance &&
      !this.validRelevance.includes(quiz.examRelevance)
    ) {
      errors.push(
        `Invalid examRelevance: "${quiz.examRelevance}". Must be one of: ${this.validRelevance.join(', ')}`
      );
    }

    // Validate passing score
    if (quiz.passingScore !== undefined) {
      if (quiz.passingScore < 0 || quiz.passingScore > 100) {
        errors.push('Passing score must be between 0 and 100');
      }
    } else {
      warnings.push('Missing passingScore field (recommended: 70)');
    }

    // Validate time limit
    if (quiz.timeLimit !== undefined && quiz.timeLimit < 0) {
      errors.push('Time limit must be positive');
    }

    // Validate category format
    if (quiz.category && !quiz.category.match(/^(FÜ|BP)-\d{2}$/)) {
      errors.push(
        `Invalid category format: "${quiz.category}". Expected format: FÜ-XX or BP-XX`
      );
    }

    // Validate tags
    if (quiz.tags && !Array.isArray(quiz.tags)) {
      errors.push('Tags must be an array');
    }

    // Validate questions
    if (quiz.questions && Array.isArray(quiz.questions)) {
      quiz.questions.forEach((question, index) => {
        const questionErrors = this.validateQuestion(question, index);
        errors.push(...questionErrors.errors);
        warnings.push(...questionErrors.warnings);
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single question
   */
  validateQuestion(question, index) {
    const errors = [];
    const warnings = [];
    const prefix = `Question ${index + 1}`;

    // Required fields
    if (!question.id) errors.push(`${prefix}: Missing id`);
    if (!question.type) errors.push(`${prefix}: Missing type`);
    if (!question.question) errors.push(`${prefix}: Missing question text`);
    if (
      question.correctAnswer === undefined ||
      question.correctAnswer === null
    ) {
      errors.push(`${prefix}: Missing correctAnswer`);
    }
    if (!question.explanation) {
      warnings.push(
        `${prefix}: Missing explanation (recommended for better learning)`
      );
    }

    // Validate question type
    if (question.type && !this.validQuestionTypes.includes(question.type)) {
      errors.push(
        `${prefix}: Invalid type "${question.type}". Must be one of: ${this.validQuestionTypes.join(', ')}`
      );
    }

    // Validate options for choice questions
    if (['single-choice', 'multiple-choice'].includes(question.type)) {
      if (!question.options || !Array.isArray(question.options)) {
        errors.push(`${prefix}: Missing or invalid options array`);
      } else if (question.options.length < 2) {
        errors.push(`${prefix}: Must have at least 2 options`);
      }

      // Verify correctAnswer is in options
      if (question.type === 'single-choice') {
        if (
          question.options &&
          !question.options.includes(question.correctAnswer)
        ) {
          errors.push(
            `${prefix}: correctAnswer "${question.correctAnswer}" not found in options`
          );
        }
      }

      if (question.type === 'multiple-choice') {
        if (!Array.isArray(question.correctAnswer)) {
          errors.push(
            `${prefix}: correctAnswer must be an array for multiple-choice questions`
          );
        } else {
          question.correctAnswer.forEach(answer => {
            if (question.options && !question.options.includes(answer)) {
              errors.push(
                `${prefix}: correctAnswer "${answer}" not found in options`
              );
            }
          });
        }
      }
    }

    // Validate true-false questions
    if (question.type === 'true-false') {
      const validAnswers = ['true', 'false', 'True', 'False', true, false];
      if (!validAnswers.includes(question.correctAnswer)) {
        errors.push(
          `${prefix}: correctAnswer must be true or false for true-false questions`
        );
      }

      // Check options format
      if (question.options) {
        const hasTrue = question.options.some(
          opt => opt === 'True' || opt === 'true' || opt === true
        );
        const hasFalse = question.options.some(
          opt => opt === 'False' || opt === 'false' || opt === false
        );

        if (!hasTrue || !hasFalse) {
          warnings.push(
            `${prefix}: True-false questions should have both True and False options`
          );
        }
      }
    }

    // Validate code questions
    if (question.type === 'code') {
      if (!question.code && !question.options) {
        warnings.push(
          `${prefix}: Code questions typically include a code block or code options`
        );
      }
      if (question.language && typeof question.language !== 'string') {
        errors.push(`${prefix}: language must be a string`);
      }
    }

    // Validate points
    if (question.points !== undefined) {
      if (typeof question.points !== 'number') {
        errors.push(`${prefix}: points must be a number`);
      } else if (question.points < 1 || question.points > 10) {
        warnings.push(
          `${prefix}: points should typically be between 1 and 10 (current: ${question.points})`
        );
      }
    } else {
      warnings.push(`${prefix}: Missing points field (recommended: 1)`);
    }

    // Validate category
    if (!question.category) {
      warnings.push(
        `${prefix}: Missing category field (helps organize questions)`
      );
    }

    return { errors, warnings };
  }

  /**
   * Validate multiple quizzes
   */
  validateMultiple(quizzes) {
    const results = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    quizzes.forEach((quiz, index) => {
      const validation = this.validate(quiz);
      results.push({
        quizId: quiz.id || `quiz-${index}`,
        title: quiz.title || 'Untitled',
        ...validation,
      });
      totalErrors += validation.errors.length;
      totalWarnings += validation.warnings.length;
    });

    return {
      summary: {
        totalQuizzes: quizzes.length,
        validQuizzes: results.filter(r => r.valid).length,
        invalidQuizzes: results.filter(r => !r.valid).length,
        totalErrors,
        totalWarnings,
      },
      results,
    };
  }
}

export default QuizValidator;
