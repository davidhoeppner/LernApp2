# Requirements Document

## Introduction

This feature aims to migrate all quizzes to use the superior IHK quiz system, creating a unified quiz experience throughout the application. Currently, there are two separate quiz systems: the basic QuizView/QuizService for regular quizzes and the more advanced IHKQuizView/IHKContentService for IHK-specific quizzes. The IHK system is significantly better with features like code blocks, multiple question types, detailed explanations, breadcrumbs, and better UI/UX. The goal is to adopt the IHK quiz system as the standard for all quizzes, migrate existing quiz data, validate all learning content and quiz data for correctness, and deprecate the old quiz system.

## Requirements

### Requirement 1: Adopt IHK Quiz System as Standard

**User Story:** As a user, I want all quizzes to use the advanced IHK quiz interface, so that I can benefit from superior features like code blocks, detailed explanations, and better navigation.

#### Acceptance Criteria

1. WHEN a user accesses any quiz THEN they SHALL see the IHKQuizView component with all its features (code blocks, detailed explanations, progress indicators, breadcrumbs, metadata badges)
2. WHEN a user takes a quiz THEN the system SHALL support all IHK question types (single-choice, multiple-choice, true-false, code)
3. WHEN a user completes a quiz THEN the system SHALL display the IHK-style results screen with detailed answer breakdowns and explanations
4. WHEN a user navigates between questions THEN the system SHALL use the IHK navigation pattern with previous/next buttons and answer state preservation

### Requirement 2: Migrate Regular Quizzes to IHK Format

**User Story:** As a developer, I want all quiz data to follow the IHK quiz format, so that there's a single source of truth for quiz structure.

#### Acceptance Criteria

1. WHEN regular quiz data is migrated THEN it SHALL be converted to the IHK quiz JSON format with all required fields
2. WHEN quiz metadata is added THEN it SHALL include category, difficulty, examRelevance, timeLimit, passingScore, and tags
3. WHEN quiz questions are converted THEN they SHALL include proper question types, options, correctAnswer, explanation, and points
4. WHEN migration is complete THEN all quizzes SHALL be stored in the src/data/ihk/quizzes/ directory following IHK naming conventions

### Requirement 3: Update Quiz Routes and Services

**User Story:** As a user, I want to access all quizzes through the same navigation paths, so that the experience is seamless and consistent.

#### Acceptance Criteria

1. WHEN a user navigates to /quizzes THEN the system SHALL use IHKQuizListView to display all available quizzes
2. WHEN a user starts any quiz THEN the system SHALL use IHKQuizView component
3. WHEN quiz data is requested THEN IHKContentService SHALL be the primary service for loading all quizzes
4. WHEN quiz routes are accessed THEN they SHALL point to IHK quiz components and services

### Requirement 4: Quiz and Learning Content Data Validation

**User Story:** As a content maintainer, I want all quiz and learning content data to be validated for correctness, so that users don't encounter broken or malformed content.

#### Acceptance Criteria

1. WHEN quiz data is validated THEN the system SHALL check for required fields (id, title, description, category, difficulty, questions, correctAnswer, explanation)
2. WHEN question data is checked THEN it SHALL verify that correctAnswer exists in the options array for choice-based questions
3. WHEN module data is validated THEN it SHALL ensure all referenced IDs (moduleId, related modules) exist and are correct
4. WHEN formatting issues are found THEN they SHALL be documented with file path, issue type, and recommended fix
5. WHEN data validation is complete THEN a report SHALL be generated listing all issues found and fixes applied

### Requirement 5: Learning Content Data Validation

**User Story:** As a user, I want all learning modules and content to be properly formatted and error-free, so that my learning experience is smooth.

#### Acceptance Criteria

1. WHEN module JSON files are validated THEN they SHALL be checked for proper structure (id, title, description, content, category, difficulty)
2. WHEN markdown content is checked THEN it SHALL be validated for proper formatting and no broken syntax
3. WHEN learning paths are validated THEN they SHALL verify all referenced module IDs exist
4. WHEN tags and metadata are checked THEN they SHALL ensure consistency across related content
5. WHEN validation errors are found THEN they SHALL be fixed and documented

### Requirement 6: Deprecate Old Quiz System

**User Story:** As a developer, I want to remove the old quiz system components, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. WHEN the migration is complete THEN the old QuizView component SHALL be removed
2. WHEN the old QuizService is deprecated THEN all references SHALL be updated to use IHKContentService
3. WHEN old quiz data files are migrated THEN src/data/quizzes.json SHALL be removed
4. WHEN cleanup is complete THEN no unused quiz-related code SHALL remain in the codebase

### Requirement 7: Progress Data Migration

**User Story:** As a user with existing quiz progress, I want my previous quiz attempts to be migrated to the new system, so that I don't lose my learning history.

#### Acceptance Criteria

1. WHEN quiz progress is migrated THEN existing quiz attempts SHALL be mapped to new quiz IDs
2. WHEN a user views their progress THEN it SHALL display all historical quiz attempts correctly
3. WHEN quiz statistics are calculated THEN they SHALL include both old and migrated attempts
4. WHEN migration is complete THEN the old progress data format SHALL be converted to the IHK format
