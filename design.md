# Design Document

## Overview

The Simple Learning App is a single-page application (SPA) built with vanilla JavaScript, featuring a component-based architecture with clean separation of concerns. The app uses modern CSS with custom properties for theming, hash-based routing for navigation, and localStorage for data persistence. The design emphasizes simplicity, performance, and maintainability while providing a polished user experience.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     index.html                          │
│                  (App Container)                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      app.js                             │
│              (Application Bootstrap)                    │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Router     │  │    State     │  │    Theme     │
│   Manager    │  │   Manager    │  │   Manager    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
        ┌─────────────────────────────────────┐
        │         View Components             │
        ├─────────────────────────────────────┤
        │  • HomeView                         │
        │  • ModuleListView                   │
        │  • ModuleDetailView                 │
        │  • QuizView                         │
        │  • ProgressView                     │
        └─────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Module     │  │     Quiz     │  │   Progress   │
│   Service    │  │   Service    │  │   Service    │
└──────────────┘  └──────────────┘  └──────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │  Storage Service │
                │  (localStorage)  │
                └──────────────────┘
```

### Technology Stack

- **Core:** Vanilla JavaScript (ES6+)
- **Build Tool:** Vite (for development and production builds)
- **Styling:** CSS3 with Custom Properties
- **Storage:** localStorage API
- **Module System:** ES6 modules

## Components and Interfaces

### 1. Core Services

#### Router Manager
**Purpose:** Handle navigation and view rendering

```javascript
class Router {
  constructor() {
    this.routes = new Map();
    this.currentView = null;
  }
  
  register(path, viewFactory);
  navigate(path, params);
  init();
}
```

**Responsibilities:**
- Register route handlers
- Parse hash-based URLs
- Render appropriate views
- Handle browser back/forward
- Update navigation UI

#### State Manager
**Purpose:** Centralized application state management

```javascript
class StateManager {
  constructor() {
    this.state = {
      modules: [],
      quizzes: [],
      progress: {},
      currentUser: null
    };
    this.listeners = new Map();
  }
  
  getState(key);
  setState(key, value);
  subscribe(key, callback);
  loadFromStorage();
  saveToStorage();
}
```

**Responsibilities:**
- Maintain application state
- Notify subscribers of changes
- Persist state to storage
- Restore state on load

#### Theme Manager
**Purpose:** Handle theme switching and preferences

```javascript
class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
  }
  
  setTheme(theme);
  toggleTheme();
  getTheme();
  applyTheme();
}
```

**Responsibilities:**
- Apply theme CSS classes
- Save theme preference
- Detect system preference
- Provide theme toggle UI

### 2. View Components

#### HomeView
**Purpose:** Landing page with overview and quick actions

**Features:**
- Welcome message
- Quick stats (modules completed, quiz scores)
- Recent activity
- Call-to-action buttons

**Template Structure:**
```html
<div class="home-view">
  <header class="hero">
    <h1>Welcome to Learning App</h1>
    <p>Your progress: X% complete</p>
  </header>
  <section class="quick-stats">
    <!-- Stats cards -->
  </section>
  <section class="quick-actions">
    <!-- Action buttons -->
  </section>
</div>
```

#### ModuleListView
**Purpose:** Display all available learning modules

**Features:**
- Grid/list of module cards
- Progress indicators per module
- Filter by status (all, completed, in-progress)
- Search functionality

**Module Card:**
- Title and description
- Duration estimate
- Progress bar
- Completion badge
- Prerequisites indicator

#### ModuleDetailView
**Purpose:** Display module content

**Features:**
- Markdown-rendered content
- Code syntax highlighting
- Table of contents
- Progress tracking
- "Mark as complete" button
- Navigation to related quiz

**Content Rendering:**
- Use `marked` library for markdown parsing
- Use `highlight.js` for code syntax highlighting
- Sanitize HTML to prevent XSS

#### QuizView
**Purpose:** Interactive quiz interface

**Features:**
- Question display (one at a time)
- Answer options (radio buttons for single choice)
- Submit button
- Immediate feedback
- Progress indicator (question X of Y)
- Score display on completion
- Review mode

**Quiz Flow:**
1. Display question
2. User selects answer
3. Submit answer
4. Show feedback (correct/incorrect)
5. Display explanation
6. Next question button
7. Repeat until complete
8. Show final results

#### ProgressView
**Purpose:** Comprehensive progress dashboard

**Features:**
- Overall progress percentage
- Module completion list
- Quiz history with scores
- Visual progress charts
- Export data button

### 3. Service Layer

#### ModuleService
**Purpose:** Manage learning module data and operations

```javascript
class ModuleService {
  async getModules();
  async getModuleById(id);
  async markModuleComplete(id);
  async getModuleProgress(id);
}
```

**Data Structure:**
```javascript
{
  id: 'module-1',
  title: 'Introduction to JavaScript',
  description: 'Learn the basics...',
  category: 'Programming',
  duration: 30, // minutes
  prerequisites: [],
  content: '# Module Content\n...',
  completed: false
}
```

#### QuizService
**Purpose:** Manage quiz data and scoring

```javascript
class QuizService {
  async getQuizzes();
  async getQuizById(id);
  async submitAnswer(quizId, questionId, answer);
  async calculateScore(quizId, answers);
  async saveQuizAttempt(quizId, score, answers);
}
```

**Data Structure:**
```javascript
{
  id: 'quiz-1',
  moduleId: 'module-1',
  title: 'JavaScript Basics Quiz',
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'What is a variable?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      explanation: 'Variables store data...'
    }
  ]
}
```

#### ProgressService
**Purpose:** Track and calculate user progress

```javascript
class ProgressService {
  getOverallProgress();
  getModuleProgress(moduleId);
  getQuizHistory();
  updateProgress(type, id, data);
  exportProgress();
}
```

**Progress Data:**
```javascript
{
  modulesCompleted: 5,
  totalModules: 10,
  quizzesTaken: 3,
  averageScore: 85,
  lastActivity: '2025-01-15T10:30:00Z',
  quizHistory: [
    {
      quizId: 'quiz-1',
      score: 90,
      date: '2025-01-15T10:30:00Z',
      answers: []
    }
  ]
}
```

#### StorageService
**Purpose:** Abstract localStorage operations

```javascript
class StorageService {
  get(key);
  set(key, value);
  remove(key);
  clear();
  has(key);
}
```

**Responsibilities:**
- JSON serialization/deserialization
- Error handling for storage quota
- Data validation
- Migration support

## Data Models

### Module
```javascript
{
  id: string,
  title: string,
  description: string,
  category: string,
  duration: number,
  prerequisites: string[],
  content: string,
  completed: boolean,
  lastAccessed: Date
}
```

### Quiz
```javascript
{
  id: string,
  moduleId: string,
  title: string,
  description: string,
  timeLimit: number,
  questions: Question[]
}
```

### Question
```javascript
{
  id: string,
  type: 'multiple-choice' | 'true-false',
  question: string,
  options: string[],
  correctAnswer: string | string[],
  explanation: string
}
```

### Progress
```javascript
{
  userId: string,
  modulesCompleted: string[],
  modulesInProgress: string[],
  quizAttempts: QuizAttempt[],
  totalTimeSpent: number,
  lastActivity: Date
}
```

### QuizAttempt
```javascript
{
  quizId: string,
  score: number,
  totalQuestions: number,
  correctAnswers: number,
  date: Date,
  answers: {
    questionId: string,
    userAnswer: string,
    correct: boolean
  }[]
}
```

## Design System

### Color Palette

**Light Theme:**
```css
--color-primary: #3b82f6;      /* Blue */
--color-primary-dark: #2563eb;
--color-primary-light: #60a5fa;

--color-success: #10b981;      /* Green */
--color-warning: #f59e0b;      /* Orange */
--color-error: #ef4444;        /* Red */

--color-bg: #ffffff;
--color-bg-secondary: #f3f4f6;
--color-bg-tertiary: #e5e7eb;

--color-text: #111827;
--color-text-secondary: #6b7280;
--color-text-tertiary: #9ca3af;

--color-border: #d1d5db;
```

**Dark Theme:**
```css
--color-primary: #60a5fa;
--color-primary-dark: #3b82f6;
--color-primary-light: #93c5fd;

--color-success: #34d399;
--color-warning: #fbbf24;
--color-error: #f87171;

--color-bg: #111827;
--color-bg-secondary: #1f2937;
--color-bg-tertiary: #374151;

--color-text: #f9fafb;
--color-text-secondary: #d1d5db;
--color-text-tertiary: #9ca3af;

--color-border: #4b5563;
```

### Typography

```css
--font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-mono: 'Fira Code', 'Courier New', monospace;

--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */

--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Spacing

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
--spacing-3xl: 4rem;     /* 64px */
```

### Border Radius

```css
--radius-sm: 0.25rem;    /* 4px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Transitions

```css
--transition-fast: 150ms ease-in-out;
--transition-base: 250ms ease-in-out;
--transition-slow: 350ms ease-in-out;
```

## User Interface Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                      Header                             │
│  [Logo]  [Nav Links]              [Theme] [Profile]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│                    Main Content                         │
│                    (View Area)                          │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                      Footer                             │
│              © 2025 Learning App                        │
└─────────────────────────────────────────────────────────┘
```

### Component Patterns

#### Button Styles
- **Primary:** Solid background, white text
- **Secondary:** Outlined, colored text
- **Ghost:** Transparent, colored text on hover
- **Danger:** Red color for destructive actions

#### Card Component
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Title</h3>
  </div>
  <div class="card-body">
    Content
  </div>
  <div class="card-footer">
    Actions
  </div>
</div>
```

#### Progress Bar
```html
<div class="progress-bar">
  <div class="progress-fill" style="width: 75%"></div>
  <span class="progress-text">75%</span>
</div>
```

#### Badge
```html
<span class="badge badge-success">Completed</span>
<span class="badge badge-warning">In Progress</span>
<span class="badge badge-default">Not Started</span>
```

## Error Handling

### Error Types

1. **Network Errors:** Failed to load data
2. **Storage Errors:** localStorage quota exceeded
3. **Validation Errors:** Invalid user input
4. **Not Found Errors:** Module/quiz doesn't exist

### Error Handling Strategy

```javascript
class ErrorHandler {
  static handle(error, context) {
    console.error(`Error in ${context}:`, error);
    
    // Show user-friendly message
    this.showNotification({
      type: 'error',
      message: this.getUserMessage(error),
      duration: 5000
    });
    
    // Log for debugging
    this.logError(error, context);
  }
  
  static getUserMessage(error) {
    const messages = {
      'NetworkError': 'Unable to load data. Please check your connection.',
      'StorageError': 'Unable to save progress. Storage may be full.',
      'ValidationError': 'Please check your input and try again.',
      'NotFoundError': 'The requested content was not found.'
    };
    
    return messages[error.name] || 'An unexpected error occurred.';
  }
}
```

### Graceful Degradation

- If localStorage is unavailable, use in-memory storage
- If content fails to load, show cached version
- If theme preference can't be saved, default to light theme
- Always provide fallback UI states

## Testing Strategy

### Unit Tests

**Test Coverage:**
- Service layer methods
- State management logic
- Data validation functions
- Utility functions

**Tools:** Vitest

**Example Tests:**
```javascript
describe('ModuleService', () => {
  test('getModuleById returns correct module', async () => {
    const module = await moduleService.getModuleById('module-1');
    expect(module.id).toBe('module-1');
  });
  
  test('markModuleComplete updates progress', async () => {
    await moduleService.markModuleComplete('module-1');
    const progress = await progressService.getModuleProgress('module-1');
    expect(progress.completed).toBe(true);
  });
});
```

### Integration Tests

**Test Scenarios:**
- Complete user flow: browse → study → quiz → results
- Navigation between views
- State persistence across page reloads
- Theme switching

### Manual Testing Checklist

- [ ] All routes navigate correctly
- [ ] Module content renders properly
- [ ] Quiz flow works end-to-end
- [ ] Progress updates correctly
- [ ] Theme toggle works
- [ ] Responsive on mobile/tablet/desktop
- [ ] Keyboard navigation works
- [ ] Data persists after refresh

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading:** Load module content on demand
2. **Code Splitting:** Separate vendor and app bundles
3. **Caching:** Cache module content and quiz data
4. **Debouncing:** Debounce search and filter inputs
5. **Virtual Scrolling:** For long lists (if needed)
6. **Image Optimization:** Use appropriate formats and sizes

### Performance Metrics

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Lighthouse Score:** > 90

## Accessibility

### WCAG 2.1 AA Compliance

- **Keyboard Navigation:** All interactive elements accessible via keyboard
- **Screen Reader Support:** Proper ARIA labels and roles
- **Color Contrast:** Minimum 4.5:1 for normal text
- **Focus Indicators:** Visible focus states
- **Alt Text:** Descriptive alt text for images
- **Semantic HTML:** Use proper heading hierarchy

### Accessibility Features

```javascript
// Focus management
class FocusManager {
  static trapFocus(element);
  static restoreFocus();
  static setFocusToFirstElement(container);
}

// Announcements for screen readers
class A11yAnnouncer {
  static announce(message, priority = 'polite');
}
```

## Security Considerations

### XSS Prevention

- Sanitize all user input
- Use textContent instead of innerHTML where possible
- Sanitize markdown-rendered content
- Validate data before storage

### Data Privacy

- All data stored locally (no server)
- No tracking or analytics
- User can export/delete their data
- No personal information collected

## Deployment

### Build Configuration

**Vite Config:**
```javascript
export default {
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['marked', 'highlight.js']
        }
      }
    }
  }
}
```

### Hosting

- Static hosting (Netlify, Vercel, GitHub Pages)
- No server-side requirements
- CDN for assets
- HTTPS required

## Future Enhancements

While not part of the initial implementation, these features could be added later:

- User accounts and cloud sync
- Social features (sharing progress)
- More quiz question types
- Spaced repetition system
- Mobile app (PWA install)
- Offline support with service workers
- Advanced analytics
- Content creation tools

## Summary

This design provides a solid foundation for a modern, performant learning application. The architecture is simple yet extensible, the UI is clean and accessible, and the user experience is smooth and intuitive. The component-based structure makes it easy to maintain and add features incrementally.
