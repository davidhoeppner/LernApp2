# Implementation Plan

- [-] 1. Set up project structure and configuration
  - Initialize Vite project with vanilla JavaScript template
  - Configure ESLint and Prettier for code quality
  - Create directory structure: src/components, src/services, src/styles, src/utils
  - Set up index.html with app container and basic meta tags
  - _Requirements: 4.5, 6.4_

- [ ] 2. Implement design system and base styles
  - Create CSS custom properties for colors, typography, spacing, and shadows
  - Implement light and dark theme variables
  - Write base styles for typography, buttons, cards, and form elements
  - Create utility classes for common patterns (flexbox, grid, spacing)
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 3. Build core infrastructure services
  - [ ] 3.1 Implement StorageService for localStorage operations
    - Write methods for get, set, remove, clear, and has
    - Add JSON serialization/deserialization with error handling
    - Implement storage quota error handling
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ] 3.2 Implement StateManager for application state
    - Create state object with modules, quizzes, progress properties
    - Write getState, setState methods with validation
    - Implement subscribe/unsubscribe for state changes
    - Add loadFromStorage and saveToStorage methods
    - _Requirements: 5.1, 5.2, 5.4_
  - [ ] 3.3 Implement ThemeManager for theme switching
    - Write setTheme, toggleTheme, getTheme methods
    - Implement theme persistence to localStorage
    - Add system preference detection
    - Apply theme by toggling CSS class on document root
    - _Requirements: 4.2, 4.6_
  - [ ] 3.4 Implement Router for navigation
    - Create route registration system with Map
    - Write navigate method to handle hash-based routing
    - Add hashchange event listener for browser back/forward
    - Implement route parameter parsing
    - Add 404 handling with redirect to home
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4. Create sample data and data services
  - [ ] 4.1 Create sample module data
    - Write JSON file with 5-6 sample learning modules
    - Include title, description, category, duration, prerequisites, content
    - Add markdown content with code examples for each module
    - _Requirements: 1.1, 1.4_
  - [ ] 4.2 Create sample quiz data
    - Write JSON file with 3-4 sample quizzes
    - Include multiple-choice and true/false questions
    - Add correct answers and explanations for each question
    - _Requirements: 2.1, 2.4, 2.6_
  - [ ] 4.3 Implement ModuleService
    - Write getModules method to fetch all modules
    - Write getModuleById method with error handling
    - Implement markModuleComplete to update progress
    - Add getModuleProgress method
    - _Requirements: 1.1, 1.2, 1.5_
  - [ ] 4.4 Implement QuizService
    - Write getQuizzes and getQuizById methods
    - Implement submitAnswer method with validation
    - Write calculateScore method for quiz completion
    - Add saveQuizAttempt to persist quiz results
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  - [ ] 4.5 Implement ProgressService
    - Write getOverallProgress to calculate completion percentage
    - Implement getModuleProgress for individual modules
    - Add getQuizHistory to retrieve past attempts
    - Write updateProgress method for all activity types
    - Implement exportProgress to generate JSON export
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.5_

- [ ] 5. Build UI components and views
  - [ ] 5.1 Create Navigation component
    - Build header with logo and navigation links
    - Add theme toggle button with icon
    - Implement active link highlighting based on current route
    - Make navigation responsive with mobile menu
    - _Requirements: 4.1, 4.2, 4.3, 6.3_
  - [ ] 5.2 Implement HomeView
    - Create hero section with welcome message
    - Build quick stats cards showing progress overview
    - Add quick action buttons (Start Learning, Take Quiz, View Progress)
    - Display recent activity list
    - _Requirements: 3.1, 4.1, 4.3_
  - [ ] 5.3 Implement ModuleListView
    - Create grid layout for module cards
    - Build module card component with title, description, duration
    - Add progress bar to each card
    - Implement completion badge display
    - Add filter buttons (All, Completed, In Progress, Not Started)
    - _Requirements: 1.1, 1.3, 3.4, 4.1, 4.3_
  - [ ] 5.4 Implement ModuleDetailView
    - Create markdown rendering with marked library
    - Add syntax highlighting with highlight.js
    - Build table of contents from headings
    - Add "Mark as Complete" button with state management
    - Display link to related quiz if available
    - Implement scroll progress indicator
    - _Requirements: 1.2, 1.5, 4.1, 4.3_
  - [ ] 5.5 Implement QuizView
    - Create quiz start screen with title and description
    - Build question display component with question text and options
    - Implement answer selection UI (radio buttons for single choice)
    - Add submit button with loading state
    - Create feedback display (correct/incorrect with explanation)
    - Build progress indicator (question X of Y)
    - Implement quiz completion screen with score and review option
    - Add navigation buttons (Next, Previous, Finish)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.3_
  - [ ] 5.6 Implement ProgressView
    - Create overall progress card with percentage and visual indicator
    - Build module completion list with status badges
    - Implement quiz history table with scores and dates
    - Add export progress button with download functionality
    - Display time-based statistics if available
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.3, 5.5_

- [ ] 6. Implement application bootstrap and integration
  - Write app.js to initialize all services (Router, State, Theme)
  - Register all routes with their corresponding view factories
  - Load initial data from storage or use defaults
  - Set up global error handling
  - Initialize theme based on saved preference or system default
  - Start router and navigate to initial route
  - _Requirements: 4.5, 5.1, 5.2, 6.1, 6.4_

- [ ] 7. Add responsive design and mobile optimization
  - Implement mobile-first CSS media queries
  - Optimize touch targets for mobile (minimum 44x44px)
  - Add mobile navigation menu (hamburger)
  - Test and adjust layouts for tablet and desktop breakpoints
  - Ensure all interactive elements work with touch
  - _Requirements: 4.1, 4.3, 4.4_

- [ ] 8. Implement accessibility features
  - Add ARIA labels and roles to all interactive elements
  - Implement keyboard navigation for all views
  - Add focus management for modals and navigation
  - Ensure proper heading hierarchy (h1, h2, h3)
  - Add skip links for keyboard users
  - Test with screen reader and fix issues
  - Implement focus visible styles
  - Add reduced motion support
  - _Requirements: 4.4, 4.6_

- [ ] 9. Add error handling and loading states
  - Create error boundary component for graceful error display
  - Implement loading spinners for async operations
  - Add toast notification system for user feedback
  - Handle storage quota errors with user messaging
  - Implement retry logic for failed operations
  - Add empty states for lists with no data
  - _Requirements: 5.3, 5.4_

- [ ] 10. Polish and final touches
  - Add smooth transitions between views
  - Implement scroll-to-top on navigation
  - Add favicon and app icons
  - Create 404 page for invalid routes
  - Add meta tags for SEO and social sharing
  - Optimize bundle size and lazy load heavy dependencies
  - Test all user flows end-to-end
  - Fix any visual inconsistencies
  - _Requirements: 4.3, 4.5, 6.4, 6.5_

- [ ]\* 11. Testing and quality assurance
  - [ ]\* 11.1 Write unit tests for services
    - Test StorageService methods
    - Test StateManager state updates and subscriptions
    - Test ModuleService, QuizService, ProgressService methods
    - Test Router navigation and parameter parsing
    - _Requirements: All_
  - [ ]\* 11.2 Write integration tests
    - Test complete user flow: browse modules → study → take quiz → view results
    - Test state persistence across page reloads
    - Test theme switching and persistence
    - Test navigation with browser back/forward
    - _Requirements: All_
  - [ ]\* 11.3 Manual testing checklist
    - Test on Chrome, Firefox, Safari, Edge
    - Test on mobile devices (iOS and Android)
    - Test keyboard navigation throughout app
    - Test with screen reader (NVDA or VoiceOver)
    - Test all error scenarios
    - Verify responsive design at all breakpoints
    - _Requirements: 4.1, 4.4, 4.6_

- [ ] 12. Build and deployment setup
  - Configure Vite build settings for production
  - Set up build script in package.json
  - Create deployment configuration for static hosting
  - Test production build locally
  - Deploy to hosting platform (Netlify/Vercel/GitHub Pages)
  - Verify deployed app works correctly
  - _Requirements: 4.5_

---

### 13. Assessment Layer Implementation

- [ ] 13.1 Extend Data Models (Req 7.1, 7.3, 7.4, 7.5)
  - Add FinalExamStatus union & MicroQuizState structure
  - Implement AttemptRetentionPolicy & pruning logic
  - Add gating progress persistence structure
  - Introduce signature hashing for module structure

- [ ] 13.2 Gating Evaluators + Tests (Req 7.1, 7.3, 7.4)
  - implement evaluateSectionReadable
  - implement evaluateMicroQuizStart
  - implement deriveUnmetCriteria & evaluateFinalExamUnlock
  - Vitest unit tests for baseline, unlock, outdated, cooldown placeholder

- [ ] 13.3 MicroQuizPanel (Req 7.2, 7.5, 7.6, 7.7, 7.8)
  - Inline micro-quiz UI with fieldset/legend semantics
  - Submit handling + partial credit scoring integration
  - Live region result focus management
  - Analytics events quiz.view / quiz.submit
  - i18n string usage

- [ ] 13.4 FinalExamGate (Req 7.1, 7.3, 7.6, 7.9)
  - Locked overlay with unmet criteria list
  - Lazy load exam content when READY
  - Status transitions & event emission quiz.final.ready
  - Skip link anchor for accessibility

- [ ] 13.5 Attempt Lifecycle + Retention (Req 7.4, 7.10)
  - Attempt storage with FIFO pruning >20
  - Submission retry w/ backoff & PENDING_SYNC state
  - Idempotent submit guard
  - Draft auto-save every 5s

- [ ] 13.6 Partial Credit Engine (Req 7.5)
  - Utility functions (multi-select, ordering placeholder, gap fill weighting)
  - roundHalfUp utility (1 decimal)
  - Ensure clamping rules & weight application

- [ ] 13.7 Accessibility Sweep (Req 7.6)
  - Axe scan & remediate
  - Focus order validation
  - Live region & ARIA attributes review

- [ ] 13.8 i18n Externalization (Req 7.8)
  - Create assessment.en.json & assessment.de.json
  - Implement fallback chain & missing key analytics

- [ ] 13.9 Analytics Dispatcher (Req 7.7, 7.10)
  - EventBus implementation
  - emitEvent wrapper returns envelope
  - Console flush in dev, noop in prod

- [ ] 13.10 Performance Measurements & Optimization (Req 7.9)
  - Instrument performance.now() timings
  - Bundle size delta report (pre/post)
  - Optimize re-render hotspots

- [ ] 13.11 Documentation & DoD Validation (Req 7._, 4._, 5.\*)
  - Update design.md extended assessment layer section
  - Update notes (phases 3–10) & retrospective
  - Verify feature flag on/off paths
  - Validate all quality gates & finalize
