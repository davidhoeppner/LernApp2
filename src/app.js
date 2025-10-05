/**
 * Application Bootstrap
 * Initializes all services, registers routes, and starts the application
 */

// Import services
import StorageService from './services/StorageService.js';
import StateManager from './services/StateManager.js';
import ThemeManager from './services/ThemeManager.js';
import Router from './services/Router.js';
import ModuleService from './services/ModuleService.js';
import QuizService from './services/QuizService.js';
import ProgressService from './services/ProgressService.js';
import IHKContentService from './services/IHKContentService.js';
import ExamProgressService from './services/ExamProgressService.js';

// Import utilities
import accessibilityHelper from './utils/AccessibilityHelper.js';

// Import error handling and UI components
import ErrorBoundary from './components/ErrorBoundary.js';
import toastNotification from './components/ToastNotification.js';

// Import views
import Navigation from './components/Navigation.js';
import HomeView from './components/HomeView.js';
import ModuleListView from './components/ModuleListView.js';
import ModuleDetailView from './components/ModuleDetailView.js';
import QuizListView from './components/QuizListView.js';
import QuizView from './components/QuizView.js';
import ProgressView from './components/ProgressView.js';
import NotFoundView from './components/NotFoundView.js';

// Note: IHK content is now integrated into regular views, no separate IHK views needed

// Import sample data
import modulesData from './data/modules.json';
import quizzesData from './data/quizzes.json';

/**
 * Main Application Class
 */
class App {
  constructor() {
    this.services = {};
    this.navigation = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize accessibility helper
      accessibilityHelper.init();

      // Set up global error handling
      this.setupErrorHandling();

      // Initialize core services
      this.initializeServices();

      // Load initial data
      await this.loadInitialData();

      // Initialize theme
      this.initializeTheme();

      // Create navigation
      this.createNavigation();

      // Register routes
      this.registerRoutes();

      // Start router
      this.services.router.init();

      // Announce app ready to screen readers
      accessibilityHelper.announce('Application loaded successfully');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.showFatalError(error);
    }
  }

  /**
   * Initialize all services
   */
  initializeServices() {
    // Get app container
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      throw new Error('App container not found');
    }

    // Create main content container for views
    const mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    mainContent.className = 'main-content';
    appContainer.appendChild(mainContent);

    // Storage service
    this.services.storageService = new StorageService();

    // State manager
    this.services.stateManager = new StateManager(this.services.storageService);

    // Theme manager
    this.services.themeManager = new ThemeManager(this.services.storageService);

    // Router (pass main content container)
    this.services.router = new Router(mainContent);

    // IHK Content service (initialize before ModuleService)
    this.services.ihkContentService = new IHKContentService(
      this.services.stateManager,
      this.services.storageService
    );

    // Module service (now includes IHK modules)
    this.services.moduleService = new ModuleService(
      this.services.stateManager,
      this.services.storageService,
      this.services.ihkContentService
    );

    // Quiz service (now includes IHK quizzes)
    this.services.quizService = new QuizService(
      this.services.stateManager,
      this.services.storageService,
      this.services.ihkContentService
    );

    // Progress service
    this.services.progressService = new ProgressService(
      this.services.stateManager,
      this.services.storageService
    );

    // Exam Progress service
    this.services.examProgressService = new ExamProgressService(
      this.services.stateManager,
      this.services.storageService
    );
  }

  /**
   * Load initial data from storage or use defaults
   */
  async loadInitialData() {
    // Try to load state from storage
    this.services.stateManager.loadFromStorage();

    // Check if we have modules data
    let modules = this.services.stateManager.getState('modules');
    if (!modules || modules.length === 0) {
      // Load default modules
      this.services.stateManager.setState('modules', modulesData);
    }

    // Check if we have quizzes data
    let quizzes = this.services.stateManager.getState('quizzes');
    if (!quizzes || quizzes.length === 0) {
      // Load default quizzes
      this.services.stateManager.setState('quizzes', quizzesData);
    }

    // Initialize progress if not exists
    let progress = this.services.stateManager.getState('progress');
    if (!progress) {
      this.services.stateManager.setState('progress', {
        modulesCompleted: [],
        modulesInProgress: [],
        quizAttempts: [],
        lastActivity: new Date().toISOString(),
      });
    }

    // Save initial state
    this.services.stateManager.saveToStorage();
  }

  /**
   * Initialize theme based on saved preference or system default
   */
  initializeTheme() {
    const savedTheme = this.services.themeManager.getTheme();
    if (savedTheme) {
      this.services.themeManager.setTheme(savedTheme);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      const theme = prefersDark ? 'dark' : 'light';
      this.services.themeManager.setTheme(theme);
    }
  }

  /**
   * Create navigation component
   */
  createNavigation() {
    this.navigation = new Navigation(
      this.services.themeManager,
      this.services.router
    );
    const appContainer = document.getElementById('app');
    const mainContent = document.getElementById('main-content');
    const navElement = this.navigation.render();

    // Insert navigation before main content
    appContainer.insertBefore(navElement, mainContent);
  }

  /**
   * Register all application routes
   */
  registerRoutes() {
    const router = this.services.router;

    // Wrap all routes with error boundary
    // Home route
    router.register(
      '/',
      ErrorBoundary.wrap(async () => {
        const view = new HomeView(this.services);
        return await view.render();
      })
    );

    // Modules list route
    router.register(
      '/modules',
      ErrorBoundary.wrap(async () => {
        const view = new ModuleListView(this.services);
        return await view.render();
      })
    );

    // Module detail route
    router.register(
      '/modules/:id',
      ErrorBoundary.wrap(async params => {
        const view = new ModuleDetailView(this.services, params);
        return await view.render();
      })
    );

    // Quizzes list route
    router.register(
      '/quizzes',
      ErrorBoundary.wrap(async () => {
        const view = new QuizListView(this.services);
        return await view.render();
      })
    );

    // Quiz detail route
    router.register(
      '/quizzes/:id',
      ErrorBoundary.wrap(async params => {
        const view = new QuizView(this.services, params);
        return await view.render();
      })
    );

    // Progress route
    router.register(
      '/progress',
      ErrorBoundary.wrap(async () => {
        const view = new ProgressView(this.services);
        return await view.render();
      })
    );

    // Note: IHK content is now seamlessly integrated into the regular modules and quizzes views
    // No separate IHK routes needed - all content is accessible through /modules and /quizzes

    // Register 404 handler
    router.registerNotFound(() => {
      const view = new NotFoundView(this.services);
      return view.render();
    });
  }

  /**
   * Set up global error handling
   */
  setupErrorHandling() {
    // Handle uncaught errors
    window.addEventListener('error', event => {
      console.error('Uncaught error:', event.error);
      toastNotification.error(
        'An unexpected error occurred. Please refresh the page.'
      );
      event.preventDefault();
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      console.error('Unhandled promise rejection:', event.reason);
      toastNotification.error(
        'An unexpected error occurred. Please try again or refresh the page.'
      );
      event.preventDefault();
    });

    // Handle storage quota errors globally
    window.addEventListener('storage', _event => {
      if (_event.key === null) {
        // Storage was cleared
        toastNotification.warning(
          'Storage was cleared. Your progress may be lost.'
        );
      }
    });

    // Handle storage quota warnings
    window.addEventListener('storage-quota-warning', _event => {
      toastNotification.warning(
        'Storage is almost full. Only essential progress was saved.',
        {
          duration: 10000,
          action: {
            label: 'Export Progress',
            onClick: () => {
              window.location.hash = '#/progress';
            },
          },
        }
      );
    });

    // Handle storage quota errors
    window.addEventListener('storage-quota-error', event => {
      toastNotification.handleStorageError(event.detail.error);
    });
  }

  /**
   * Show fatal error screen
   */
  showFatalError(error) {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 2rem;
        text-align: center;
      ">
        <h1 style="font-size: 2rem; margin-bottom: 1rem; color: #ef4444;">
          ⚠️ Application Error
        </h1>
        <p style="margin-bottom: 2rem; color: #6b7280;">
          We're sorry, but something went wrong. Please try refreshing the page.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            padding: 0.75rem 1.5rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
          "
        >
          Refresh Page
        </button>
        <details style="margin-top: 2rem; text-align: left; max-width: 600px;">
          <summary style="cursor: pointer; color: #6b7280;">Error Details</summary>
          <pre style="
            margin-top: 1rem;
            padding: 1rem;
            background: #f3f4f6;
            border-radius: 0.5rem;
            overflow: auto;
            font-size: 0.875rem;
          ">${error.stack || error.message}</pre>
        </details>
      </div>
    `;
  }
}

// Initialize and start the application
const app = new App();
app.init();

export default app;
