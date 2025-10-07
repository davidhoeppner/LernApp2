# Requirements Document

## Introduction

A simplified, modern learning application that helps users study through interactive modules and quizzes. The app focuses on core learning features with a clean, intuitive interface that works seamlessly across devices. Built with vanilla JavaScript for simplicity and performance, featuring a modern design system with dark mode support.

## Requirements

### Requirement 1: Learning Module System

**User Story:** As a learner, I want to browse and study learning modules organized by topics, so that I can learn in a structured way.

#### Acceptance Criteria

1. WHEN the user opens the app THEN the system SHALL display a list of available learning modules
2. WHEN the user clicks on a module THEN the system SHALL display the module content with formatted text and code examples
3. WHEN viewing a module THEN the system SHALL show progress indicators for that module
4. IF a module has prerequisites THEN the system SHALL indicate which modules should be completed first
5. WHEN the user completes reading a module THEN the system SHALL mark it as completed and update progress

### Requirement 2: Interactive Quiz System

**User Story:** As a learner, I want to take quizzes to test my knowledge, so that I can assess my understanding of the material.

#### Acceptance Criteria

1. WHEN the user selects a quiz THEN the system SHALL display questions one at a time
2. WHEN the user answers a question THEN the system SHALL provide immediate feedback on correctness
3. WHEN the user completes a quiz THEN the system SHALL display the final score and percentage
4. IF the user answers incorrectly THEN the system SHALL show the correct answer with explanation
5. WHEN viewing quiz results THEN the system SHALL allow the user to review all questions and answers
6. WHEN taking a quiz THEN the system SHALL support multiple choice and true/false question types

### Requirement 3: Progress Tracking

**User Story:** As a learner, I want to see my learning progress, so that I can track my improvement and stay motivated.

#### Acceptance Criteria

1. WHEN the user accesses the dashboard THEN the system SHALL display overall progress percentage
2. WHEN viewing progress THEN the system SHALL show completed modules and quiz scores
3. WHEN the user completes activities THEN the system SHALL automatically update progress metrics
4. WHEN viewing module list THEN the system SHALL indicate which modules are completed, in progress, or not started
5. WHEN the user views quiz history THEN the system SHALL display past quiz attempts with scores and dates

### Requirement 4: Modern Responsive UI

**User Story:** As a user, I want a clean, modern interface that works on any device, so that I can learn comfortably anywhere.

#### Acceptance Criteria

1. WHEN the user accesses the app on any device THEN the system SHALL display a responsive layout optimized for that screen size
2. WHEN the user toggles dark mode THEN the system SHALL switch between light and dark themes smoothly
3. WHEN navigating the app THEN the system SHALL provide smooth transitions and visual feedback
4. WHEN interacting with elements THEN the system SHALL show clear hover and active states
5. WHEN the app loads THEN the system SHALL use a consistent design system with modern typography and spacing
6. IF the user prefers reduced motion THEN the system SHALL respect that preference and minimize animations

### Requirement 5: Data Persistence

**User Story:** As a learner, I want my progress to be saved automatically, so that I can continue where I left off.

#### Acceptance Criteria

1. WHEN the user completes any activity THEN the system SHALL automatically save progress to local storage
2. WHEN the user returns to the app THEN the system SHALL restore their previous progress and state
3. WHEN the user clears browser data THEN the system SHALL handle missing data gracefully
4. WHEN saving data THEN the system SHALL validate data integrity before storage
5. WHEN the user views their data THEN the system SHALL provide an option to export progress as JSON

### Requirement 6: Navigation and Routing

**User Story:** As a user, I want intuitive navigation between different sections, so that I can easily find what I need.

#### Acceptance Criteria

1. WHEN the user navigates THEN the system SHALL use hash-based routing for bookmarkable URLs
2. WHEN the user clicks browser back/forward THEN the system SHALL navigate to the appropriate view
3. WHEN viewing any page THEN the system SHALL highlight the current section in the navigation
4. WHEN the user accesses an invalid route THEN the system SHALL redirect to the home page
5. WHEN navigating between views THEN the system SHALL maintain scroll position appropriately

### Requirement 7: Assessment Layer & Quiz Gating

// Additive requirements (EARS syntax). Previous sections may be clarified by cross-reference (Updated by 7.x) without alteration.

#### 7.1 Gating Core

1. WHEN a learner opens a locked final exam THEN the system SHALL display an unmet criteria list with reason codes (SECTION_UNREAD, MICRO_NOT_PASSED).
2. The system SHALL PREVENT starting a micro-quiz before its related section progress is ≥ 85% read OR explicitly marked as read.
3. IF feature.quizGating ENABLED THEN the system SHALL replace legacy quiz direct links with gating overlays for locked content.
4. The system SHALL represent final exam status as one of: LOCKED | READY | PASSED | OUTDATED | COOLDOWN.
5. WHEN final exam status is OUTDATED THEN the system SHALL display a revalidation prompt explaining newly required items.
6. The system SHALL PREVENT starting a final exam while status is LOCKED, OUTDATED, or COOLDOWN.

#### 7.2 Micro-Quiz Interaction

1. WHEN a micro-quiz is submitted THEN the system SHALL compute score and display pass/fail plus rationales for incorrect responses only after submission.
2. The system SHALL limit micro-quiz length to ≤ 5 questions.
3. The system SHALL target a median completion time ≤ 2 minutes (informational metric recorded; not enforced hard stop).
4. The system SHALL PREVENT navigation away during active submission processing (disable submit until resolved).
5. WHEN micro-quiz results are displayed THEN the system SHALL provide a retry button only if not yet passed.

#### 7.3 Final Exam Unlocking

1. WHEN all required micro-quizzes are passed AND all required sections are read THEN the system SHALL unlock the final exam (status READY).
2. WHILE a module structure changes after a final exam pass THEN the system SHALL mark final exam status OUTDATED until new mandatory items satisfied.
3. WHEN final exam status transitions to READY THEN the system SHALL emit event quiz.final.ready with moduleId.
4. The system SHALL PREVENT unlocking if any micro-quiz is pending evaluation.

#### 7.4 Attempts & Retention

1. The system SHALL store at most the last 20 attempts per quiz and SHALL prune older attempts FIFO beyond this limit.
2. IF an attempt submission fails due to simulated network failure THEN the system SHALL retry up to 3 times with exponential backoff (1s, 3s, 7s) before marking status PENDING_SYNC.
3. WHILE an attempt is PENDING_SYNC THEN the system SHALL PREVENT a new submission for the same quiz unless user cancels sync.
4. The system SHALL log pruning activity via analytics event quiz.attempt.pruned.

#### 7.5 Scoring & Partial Credit

1. The system SHALL implement multi-select partial credit formula: partial = max(0, (CorrectSelected / TotalCorrect) − (IncorrectSelected / TotalOptionsNonCorrect)).
2. The system SHALL clamp partial credit between 0 and 1 prior to weighting.
3. The system SHALL compute totalQuestionScore = partial _ weight _ 100% (capped at 100%).
4. The system SHALL round total quiz score to 1 decimal place using half-up rounding.
5. The system SHALL derive aggregate score on demand from raw answers (no trusting client-stored aggregates) (Integrity – see 7.10).
6. The system SHALL support ordering question scoring: ScoreFraction = (#items in correct relative position) / totalItems (method documented in design) (future extension placeholder).

#### 7.6 Accessibility

1. WHEN a quiz result becomes available THEN the system SHALL move keyboard focus to a results heading announced via a polite live region.
2. The system SHALL ensure each question group uses <fieldset><legend> for semantic grouping.
3. The system SHALL provide ARIA attributes for expandable/collapsible quiz panels reflecting expanded state.
4. The system SHALL provide a "Skip to Final Exam Status" anchor link when exam is locked.

#### 7.7 Analytics

1. WHEN quiz lifecycle events occur (quiz.view, quiz.start, quiz.submit, quiz.locked.view, progression.module.status) THEN the system SHALL record them through emitEvent(eventName, payload).
2. The system SHALL include timestamp (ISO8601 UTC) and UUID in each event envelope (version 1 schema).
3. The system SHALL batch (in-memory) events for optional future flush (currently console log in dev, noop in prod).

#### 7.8 Internationalization (i18n)

1. The system SHALL externalize all learner-facing quiz gating strings into i18n/assessment.<locale>.json.
2. IF a string key is missing in current locale THEN the system SHALL fallback to en locale.
3. IF key missing in en THEN the system SHALL display the key identifier and emit analytics warning event i18n.missing.

#### 7.9 Performance

1. The system SHALL lazy-load final exam questions only when the learner explicitly opens the unlocked exam view.
2. The system SHALL keep incremental DOM re-render time per answered question under 50ms on baseline hardware (logged metric).
3. The system SHALL measure panel expand (micro-quiz open) using performance.now() and record metric quiz.ui.expand.
4. Bundle size increase from assessment layer SHALL be ≤ +15KB gzip (excluding content JSON).

#### 7.10 Security / Integrity

1. The system SHALL PREVENT exposure of correct answers before submission.
2. The system SHALL recompute scores deterministically from raw answers each view render.
3. The system SHALL PREVENT tampering by ignoring client-modified aggregates (only raw attempts persisted).
4. The system SHALL obscure (not store) rationales in localStorage prior to submission.

#### 7.11 Feature Flag

1. IF feature.quizGating DISABLED THEN the system SHALL display legacy quiz entry points without gating overlays.
2. IF feature.quizGating DISABLED THEN the system SHALL bypass gating evaluators (direct access) while still recording attempts.
3. WHEN feature.quizGating toggled from false to true THEN the system SHALL recompute gating status for the currently viewed module.

// End Section 7
