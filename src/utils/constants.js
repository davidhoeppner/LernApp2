/**
 * Application-wide constants
 * Centralized location for magic numbers and strings
 */

// HTTP Status Codes
export const HTTP_STATUS = {
  NOT_FOUND: 404,
};

// Exam and Quiz Constants
export const EXAM = {
  YEAR_2025: 2025,
  PASSING_SCORE_PERCENTAGE: 70,
  GOOD_SCORE_PERCENTAGE: 85,
  EXCELLENT_SCORE_PERCENTAGE: 90,
};

// Progress Weights
export const PROGRESS_WEIGHTS = {
  MODULE_COMPLETION: 0.7,
  QUIZ_AVERAGE: 0.3,
};

// Time Constants (in milliseconds)
export const TIME = {
  ONE_SECOND: 1000,
  TWO_SECONDS: 2000,
  THREE_SECONDS: 3000,
  FIVE_SECONDS: 5000,
  SEVEN_SECONDS: 7000,
  TEN_SECONDS: 10000,
};

// Time Constants (in minutes/hours)
export const DURATION = {
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  MONTHS_PER_YEAR: 12,
};

// UI Constants
export const UI = {
  DEBOUNCE_DELAY_MS: 300,
  ANIMATION_DURATION_MS: 300,
  SEARCH_MIN_RESULTS: 20,
  PROGRESS_BAR_SEGMENTS: 50,
};

// Difficulty Thresholds
export const DIFFICULTY = {
  EASY_MAX_PERCENTAGE: 40,
  MEDIUM_MAX_PERCENTAGE: 60,
  HARD_MAX_PERCENTAGE: 80,
};

// Module Durations (in minutes)
export const MODULE_DURATION = {
  SHORT: 20,
  MEDIUM: 30,
  LONG: 120,
};

// Retry Configuration
export const RETRY = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2,
};

// Storage Keys
export const STORAGE_KEYS = {
  THEME: 'theme',
  PROGRESS: 'progress',
  EXAM_PROGRESS: 'exam-progress',
  IHK_CONTENT: 'ihk-content',
  IHK_CONTENT_FILTERS: 'ihk-content-filters',
};

// Theme Values
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
};

// Progress Status
export const PROGRESS_STATUS = {
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

// Question Types
export const QUESTION_TYPES = {
  SINGLE_CHOICE: 'single-choice',
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
};

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
};

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

// ARIA Roles
export const ARIA_ROLES = {
  MAIN: 'main',
  NAVIGATION: 'navigation',
  ALERT: 'alert',
  STATUS: 'status',
  SEARCH: 'search',
  REGION: 'region',
};

// CSS Class Names
export const CSS_CLASSES = {
  MAIN_CONTENT: 'main-content',
  LOADING_SPINNER: 'loading-spinner',
  ERROR_BOUNDARY: 'error-boundary',
  LIVE_REGION: 'live-region',
};

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_MODULE_ID: 'Invalid module ID',
  INVALID_QUIZ_ID: 'Invalid quiz ID',
  STORAGE_QUOTA_EXCEEDED: 'Storage quota exceeded. Unable to save data.',
  FAILED_TO_LOAD_MODULES: 'Failed to load modules',
  FAILED_TO_CALCULATE_PROGRESS: 'Failed to calculate overall progress',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  APPLICATION_LOADED: 'Application loaded successfully',
};

// Color Codes (CSS Custom Properties)
export const COLORS = {
  SUCCESS_GREEN: 'var(--color-success)',
  INFO_BLUE: 'var(--color-primary)',
  WARNING_YELLOW: 'var(--color-warning)',
  DANGER_RED: 'var(--color-error)',
};

// Date Format Options
export const DATE_FORMAT = {
  NUMERIC: 'numeric',
  LONG: 'long',
  SHORT: 'short',
  LOCALE_DE: 'de-DE',
};

// File Extensions
export const FILE_EXTENSIONS = {
  JSON: '.json',
};

// Module ID Prefixes
export const MODULE_PREFIXES = {
  FUE: 'FÜ',
  BP: 'BP',
};

// Category IDs
export const CATEGORY_IDS = {
  ALL: 'all',
};

export default {
  HTTP_STATUS,
  EXAM,
  PROGRESS_WEIGHTS,
  TIME,
  DURATION,
  UI,
  DIFFICULTY,
  MODULE_DURATION,
  RETRY,
  STORAGE_KEYS,
  THEME,
  PROGRESS_STATUS,
  QUESTION_TYPES,
  DIFFICULTY_LEVELS,
  PRIORITY_LEVELS,
  ARIA_ROLES,
  CSS_CLASSES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  COLORS,
  DATE_FORMAT,
  FILE_EXTENSIONS,
  MODULE_PREFIXES,
  CATEGORY_IDS,
};
