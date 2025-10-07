# Design Document: Quiz System Integration

## Overview

This design outlines the migration of all quizzes to the superior IHK quiz system, creating a unified quiz experience throughout the application. The IHK quiz system provides advanced features like code blocks, multiple question types, detailed explanations, breadcrumbs, and better UI/UX. This design also includes comprehensive data validation for all quiz and learning content to ensure data quality.

## Architecture

### Migration Strategy

**Three-Phase Approach**:

1. **Data Migration**: Convert regular quizzes to IHK format
2. **Component Migration**: Update routes and services to use IHK components
3. **Cleanup**: Remove old quiz system and deprecated code

### System Architecture

**Before (Dual System)**:

```
Regular Quizzes:
- QuizService → quizzes.json
- QuizView → Basic UI
- QuizListView → Simple list

IHK Quizzes:
- IHKContentService → ihk/quizzes/*.json
- IHKQuizView → Advanced UI
- IHKQuizListView → Rich list
```

**After (Unified System)**:

```
All Quizzes:
- IHKContentService → ihk/quizzes/*.json
- IHKQuizView → Advanced UI for all
- IHKQuizListView → Rich list for all
```

## Components and Interfaces

### 1. Quiz Data Migration Tool

**Purpose**: Convert regular quiz format to IHK format

**Input Format** (Regular Quiz):

```json
{
  "id": "quiz-1",
  "moduleId": "module-1",
  "title": "JavaScript Basics Quiz",
  "description": "Test your understanding...",
  "timeLimit": null,
  "questions": [
    {
      "id": "q1-1",
      "type": "multiple-choice",
      "question": "Which keyword...",
      "options": ["var", "let", "const", "constant"],
      "correctAnswer": "const",
      "explanation": "The 'const' keyword..."
    }
  ]
}
```

**Output Format** (IHK Quiz):

```json
{
  "id": "javascript-basics-quiz",
  "moduleId": "module-1",
  "title": "JavaScript Basics Quiz",
  "description": "Test your understanding of JavaScript fundamentals",
  "category": "FÜ-02",
  "difficulty": "beginner",
  "examRelevance": "high",
  "newIn2025": false,
  "timeLimit": 15,
  "passingScore": 70,
  "questions": [
    {
      "id": "js-q1",
      "type": "single-choice",
      "question": "Which keyword is used to declare a constant variable?",
      "options": ["var", "let", "const", "constant"],
      "correctAnswer": "const",
      "explanation": "The 'const' keyword is used to declare constants...",
      "points": 1,
      "category": "Variables"
    }
  ],
  "tags": ["JavaScript", "Basics", "Variables", "Functions"],
  "lastUpdated": "2025-01-10T00:00:00Z"
}
```

**Migration Script**:

```javascript
class QuizMigrationTool {
  constructor() {
    this.categoryMapping = {
      'module-1': 'FÜ-02',
      'module-2': 'FÜ-02',
      'module-3': 'FÜ-02',
      'module-4': 'BP-03',
    };
  }

  async migrateQuiz(regularQuiz) {
    return {
      id: this.generateIHKId(regularQuiz.id),
      moduleId: regularQuiz.moduleId,
      title: regularQuiz.title,
      description: regularQuiz.description,
      category: this.mapCategory(regularQuiz.moduleId),
      difficulty: this.inferDifficulty(regularQuiz),
      examRelevance: 'medium',
      newIn2025: false,
      timeLimit: this.calculateTimeLimit(regularQuiz.questions.length),
      passingScore: 70,
      questions: regularQuiz.questions.map(q => this.migrateQuestion(q)),
      tags: this.generateTags(regularQuiz),
      lastUpdated: new Date().toISOString(),
    };
  }

  migrateQuestion(question) {
    return {
      id: this.generateQuestionId(question.id),
      type: this.mapQuestionType(question.type),
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      points: 1,
      category: this.inferQuestionCategory(question.question),
    };
  }

  mapQuestionType(type) {
    const typeMap = {
      'multiple-choice': 'single-choice',
      'true-false': 'true-false',
    };
    return typeMap[type] || 'single-choice';
  }

  calculateTimeLimit(questionCount) {
    // 1.5 minutes per question
    return Math.ceil(questionCount * 1.5);
  }

  generateTags(quiz) {
    // Extract keywords from title and description
    // Return array of relevant tags
  }
}
```

### 2. Data Validation System

**Purpose**: Validate all quiz and learning content for correctness

**Validation Rules**:

**Quiz Validation**:

```javascript
class QuizValidator {
  validate(quiz) {
    const errors = [];

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
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(quiz.difficulty)) {
      errors.push(`Invalid difficulty: ${quiz.difficulty}`);
    }

    // Validate exam relevance
    const validRelevance = ['low', 'medium', 'high'];
    if (quiz.examRelevance && !validRelevance.includes(quiz.examRelevance)) {
      errors.push(`Invalid examRelevance: ${quiz.examRelevance}`);
    }

    // Validate passing score
    if (quiz.passingScore < 0 || quiz.passingScore > 100) {
      errors.push('Passing score must be between 0 and 100');
    }

    // Validate questions
    quiz.questions.forEach((q, index) => {
      const questionErrors = this.validateQuestion(q, index);
      errors.push(...questionErrors);
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateQuestion(question, index) {
    const errors = [];
    const prefix = `Question ${index + 1}`;

    // Required fields
    if (!question.id) errors.push(`${prefix}: Missing id`);
    if (!question.type) errors.push(`${prefix}: Missing type`);
    if (!question.question) errors.push(`${prefix}: Missing question text`);
    if (!question.correctAnswer)
      errors.push(`${prefix}: Missing correctAnswer`);
    if (!question.explanation) errors.push(`${prefix}: Missing explanation`);

    // Validate question type
    const validTypes = [
      'single-choice',
      'multiple-choice',
      'true-false',
      'code',
    ];
    if (!validTypes.includes(question.type)) {
      errors.push(`${prefix}: Invalid type: ${question.type}`);
    }

    // Validate options for choice questions
    if (['single-choice', 'multiple-choice'].includes(question.type)) {
      if (!question.options || question.options.length < 2) {
        errors.push(`${prefix}: Must have at least 2 options`);
      }

      // Verify correctAnswer is in options
      if (question.type === 'single-choice') {
        if (!question.options.includes(question.correctAnswer)) {
          errors.push(
            `${prefix}: correctAnswer "${question.correctAnswer}" not in options`
          );
        }
      }

      if (question.type === 'multiple-choice') {
        if (!Array.isArray(question.correctAnswer)) {
          errors.push(
            `${prefix}: correctAnswer must be an array for multiple-choice`
          );
        } else {
          question.correctAnswer.forEach(answer => {
            if (!question.options.includes(answer)) {
              errors.push(
                `${prefix}: correctAnswer "${answer}" not in options`
              );
            }
          });
        }
      }
    }

    // Validate true-false questions
    if (question.type === 'true-false') {
      const validAnswers = ['true', 'false', true, false];
      if (!validAnswers.includes(question.correctAnswer)) {
        errors.push(`${prefix}: correctAnswer must be true or false`);
      }
    }

    // Validate points
    if (question.points && (question.points < 1 || question.points > 10)) {
      errors.push(`${prefix}: points must be between 1 and 10`);
    }

    return errors;
  }
}
```

**Module Validation**:

````javascript
class ModuleValidator {
  validate(module) {
    const errors = [];

    // Required fields
    if (!module.id) errors.push('Missing required field: id');
    if (!module.title) errors.push('Missing required field: title');
    if (!module.description) errors.push('Missing required field: description');
    if (!module.content) errors.push('Missing required field: content');
    if (!module.category) errors.push('Missing required field: category');
    if (!module.difficulty) errors.push('Missing required field: difficulty');

    // Validate category format
    if (module.category && !module.category.match(/^(FÜ|BP)-\d{2}$/)) {
      errors.push(`Invalid category format: ${module.category}`);
    }

    // Validate related modules exist
    if (module.relatedModules) {
      // Check if referenced modules exist
      // This would require access to all modules
    }

    // Validate markdown content
    if (module.content) {
      const contentErrors = this.validateMarkdown(module.content);
      errors.push(...contentErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateMarkdown(content) {
    const errors = [];

    // Check for unclosed code blocks
    const codeBlockCount = (content.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      errors.push('Unclosed code block in content');
    }

    // Check for broken links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[2];
      if (url.startsWith('#') && !url.match(/^#[a-z0-9-]+$/)) {
        errors.push(`Invalid anchor link: ${url}`);
      }
    }

    return errors;
  }
}
````

**Learning Path Validation**:

```javascript
class LearningPathValidator {
  constructor(allModules) {
    this.allModules = allModules;
  }

  validate(learningPath) {
    const errors = [];

    // Required fields
    if (!learningPath.id) errors.push('Missing required field: id');
    if (!learningPath.title) errors.push('Missing required field: title');
    if (!learningPath.modules || learningPath.modules.length === 0) {
      errors.push('Learning path must have at least one module');
    }

    // Validate all referenced modules exist
    if (learningPath.modules) {
      learningPath.modules.forEach((moduleId, index) => {
        if (!this.allModules.has(moduleId)) {
          errors.push(
            `Module ${index + 1}: Referenced module "${moduleId}" does not exist`
          );
        }
      });
    }

    // Validate estimated duration
    if (learningPath.estimatedDuration && learningPath.estimatedDuration < 0) {
      errors.push('Estimated duration must be positive');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

### 3. Route and Service Updates

**Router Changes** (in `src/app.js`):

```javascript
// Before
router.register('/quizzes', async () => {
  const view = new QuizListView(services);
  return await view.render();
});

router.register('/quizzes/:id', async params => {
  const view = new QuizView(services, params);
  return await view.render();
});

// After
router.register('/quizzes', async () => {
  const view = new IHKQuizListView(services);
  return await view.render();
});

router.register('/quizzes/:id', async params => {
  const view = new IHKQuizView(services, params);
  return await view.render();
});
```

**Service Consolidation**:

```javascript
// Update QuizService to use IHKContentService internally
class QuizService {
  constructor(stateManager, storageService, ihkContentService) {
    this.stateManager = stateManager;
    this.storage = storageService;
    this.ihkContentService = ihkContentService;
  }

  async getQuizzes() {
    // Delegate to IHKContentService
    return await this.ihkContentService.getAllQuizzes();
  }

  async getQuizById(id) {
    // Delegate to IHKContentService
    return await this.ihkContentService.getQuizById(id);
  }

  // Keep progress tracking methods
  async saveQuizAttempt(quizId, score, answers) {
    // Use ExamProgressService
    return await this.examProgressService.saveQuizAttempt(quizId, {
      answers,
      score,
      completedAt: new Date().toISOString(),
    });
  }
}
```

### 4. Progress Data Migration

**Purpose**: Migrate existing quiz progress to new format

**Migration Strategy**:

```javascript
class ProgressMigrator {
  async migrateQuizProgress() {
    const progress = this.stateManager.getState('progress') || {};
    const quizAttempts = progress.quizAttempts || [];

    const migratedAttempts = quizAttempts.map(attempt => {
      return {
        quizId: this.mapOldQuizIdToNew(attempt.quizId),
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        date: attempt.date,
        answers: attempt.answers.map(a => ({
          questionId: this.mapOldQuestionIdToNew(a.questionId),
          userAnswer: a.userAnswer,
          correct: a.correct,
        })),
      };
    });

    this.stateManager.setState('progress.quizAttempts', migratedAttempts);
    this.stateManager.saveToStorage();
  }

  mapOldQuizIdToNew(oldId) {
    const mapping = {
      'quiz-1': 'javascript-basics-quiz',
      'quiz-2': 'array-methods-quiz',
      'quiz-3': 'async-javascript-quiz',
      'quiz-4': 'dom-manipulation-quiz',
    };
    return mapping[oldId] || oldId;
  }
}
```

## Data Models

### Unified Quiz Format

```typescript
interface IHKQuiz {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  category: string; // e.g., "FÜ-02", "BP-03"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  examRelevance: 'low' | 'medium' | 'high';
  newIn2025: boolean;
  timeLimit: number; // minutes
  passingScore: number; // percentage
  questions: IHKQuestion[];
  tags: string[];
  lastUpdated: string; // ISO date
}

interface IHKQuestion {
  id: string;
  type: 'single-choice' | 'multiple-choice' | 'true-false' | 'code';
  question: string;
  code?: string; // For code questions
  language?: string; // For syntax highlighting
  options: string[];
  correctAnswer: string | string[] | boolean;
  explanation: string;
  points: number;
  category: string;
}
```

### Validation Report Format

```typescript
interface ValidationReport {
  timestamp: string;
  summary: {
    totalFiles: number;
    validFiles: number;
    invalidFiles: number;
    totalErrors: number;
    totalWarnings: number;
  };
  files: FileValidation[];
}

interface FileValidation {
  file: string;
  type: 'quiz' | 'module' | 'learning-path';
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}
```

## Error Handling

### Migration Errors

**Handling Strategy**:

- Log all migration errors
- Create backup of original data
- Allow partial migration (skip failed quizzes)
- Generate detailed error report

### Validation Errors

**Handling Strategy**:

- Non-blocking validation (app still works)
- Log validation errors to console
- Generate validation report
- Provide fix suggestions

### Backward Compatibility

**Fallback Strategy**:

- Keep old quiz data as backup
- Support both old and new quiz IDs temporarily
- Gradual migration with feature flags
- Rollback capability

## Testing Strategy

### Migration Testing

**Test Cases**:

1. Migrate single quiz successfully
2. Migrate all quizzes successfully
3. Handle missing fields gracefully
4. Preserve all question data
5. Generate correct IHK format

### Validation Testing

**Test Cases**:

1. Validate correct quiz data (should pass)
2. Detect missing required fields
3. Detect invalid correctAnswer
4. Detect malformed markdown
5. Detect broken module references

### Integration Testing

**Test Cases**:

1. Load migrated quizzes in IHKQuizView
2. Take quiz and submit answers
3. View quiz results
4. Check progress tracking
5. Verify all routes work

## Implementation Plan

### Phase 1: Data Migration

1. Create migration tool
2. Migrate quiz data to IHK format
3. Validate migrated data
4. Store in ihk/quizzes/ directory

### Phase 2: Data Validation

1. Create validation tools
2. Validate all quizzes
3. Validate all modules
4. Validate learning paths
5. Fix identified issues
6. Generate validation report

### Phase 3: Component Migration

1. Update routes to use IHK components
2. Update service references
3. Test all quiz functionality
4. Migrate progress data

### Phase 4: Cleanup

1. Remove old QuizView component
2. Remove old QuizListView component
3. Remove src/data/quizzes.json
4. Clean up unused imports
5. Update documentation

### Phase 5: Validation

1. Full regression testing
2. Verify all quizzes work
3. Verify progress tracking
4. Performance testing
5. Generate final report

## Success Metrics

**Quantitative**:

- 100% of quizzes migrated to IHK format
- 0 validation errors in quiz data
- 0 validation errors in module data
- All quiz progress preserved
- No broken routes or components

**Qualitative**:

- Unified quiz experience
- Better UI/UX for all quizzes
- Cleaner codebase
- Single source of truth for quizzes
- Improved data quality
