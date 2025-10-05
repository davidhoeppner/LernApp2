import StorageService from './StorageService.js';

// Import metadata
import categoriesData from '../data/ihk/metadata/categories.json';
import examChangesData from '../data/ihk/metadata/exam-changes-2025.json';

// Import learning paths
import ap2Path from '../data/ihk/learning-paths/ap2-complete-path.json';
import sqlPath from '../data/ihk/learning-paths/sql-mastery-path.json';
import newTopicsPath from '../data/ihk/learning-paths/new-topics-2025-path.json';
import oopPath from '../data/ihk/learning-paths/oop-fundamentals-path.json';

// Import all IHK modules directly
import fue01 from '../data/ihk/modules/fue-01-planning.json';
import fue02dev from '../data/ihk/modules/fue-02-development.json';
import fue02anom from '../data/ihk/modules/fue-02-anomalies-redundancies.json';
import fue02ctrl from '../data/ihk/modules/fue-02-control-structures.json';
import fue03 from '../data/ihk/modules/fue-03-quality.json';
import fue03load from '../data/ihk/modules/fue-03-load-performance-tests.json';
import fue04 from '../data/ihk/modules/fue-04-security.json';
import fue04threats from '../data/ihk/modules/fue-04-security-threats.json';
import bp01conc from '../data/ihk/modules/bp-01-conception.json';
import bp01doc from '../data/ihk/modules/bp-01-documentation.json';
import bp01kerb from '../data/ihk/modules/bp-01-kerberos.json';
import bp01mon from '../data/ihk/modules/bp-01-monitoring.json';
import bp02cloud from '../data/ihk/modules/bp-02-cloud-models.json';
import bp02data from '../data/ihk/modules/bp-02-data-formats.json';
import bp02nas from '../data/ihk/modules/bp-02-nas-san.json';
import bp02qa from '../data/ihk/modules/bp-02-quality-assurance.json';
import bp03cps from '../data/ihk/modules/bp-03-cps.json';
import bp03rest from '../data/ihk/modules/bp-03-rest-api.json';
import bp03sq from '../data/ihk/modules/bp-03-software-quality.json';
import bp03tdd from '../data/ihk/modules/bp-03-tdd.json';
import bp04arch from '../data/ihk/modules/bp-04-architecture-patterns.json';
import bp04design from '../data/ihk/modules/bp-04-design-patterns.json';
import bp04prog from '../data/ihk/modules/bp-04-programming-paradigms.json';
import bp04scrum from '../data/ihk/modules/bp-04-scrum.json';
import bp05data from '../data/ihk/modules/bp-05-data-structures.json';
import bp05enc from '../data/ihk/modules/bp-05-encapsulation.json';
import bp05sort from '../data/ihk/modules/bp-05-sorting.json';
import bp05sql from '../data/ihk/modules/bp-05-sql-reference.json';
import sqlDdl from '../data/ihk/modules/sql-ddl.json';
import sqlDml from '../data/ihk/modules/sql-dml.json';
import sqlDql from '../data/ihk/modules/sql-dql.json';

/**
 * IHKContentService - Manages IHK exam content (modules, quizzes, learning paths)
 * Handles loading, filtering, and searching of IHK-specific content
 */
class IHKContentService {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.storage = new StorageService('ihk-content');
    this.categories = null;
    this.examChanges = null;
    this.modules = new Map();
    this.quizzes = new Map();
    this.learningPaths = new Map();
  }

  /**
   * Load category taxonomy from metadata
   */
  async loadCategories() {
    if (!this.categories) {
      this.categories = categoriesData;
    }
    return this.categories;
  }

  /**
   * Load exam changes metadata
   */
  async loadExamChanges() {
    if (!this.examChanges) {
      this.examChanges = examChangesData;
    }
    return this.examChanges;
  }

  /**
   * Get all modules for a specific category
   */
  async getModulesByCategory(categoryId) {
    try {
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Invalid category ID');
      }

      // Ensure categories are loaded
      if (!this.categories) {
        await this.loadCategories();
      }

      // Load all modules if not already loaded
      await this._loadAllModules();

      // Filter modules by category
      const modules = Array.from(this.modules.values()).filter(
        module => module.category === categoryId
      );

      // Enrich with progress data
      return this._enrichModulesWithProgress(modules);
    } catch (error) {
      console.error(`Error getting modules for category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Get all new topics introduced in 2025
   */
  async getNewTopics2025() {
    try {
      // Load all modules if not already loaded
      await this._loadAllModules();

      // Filter modules marked as new in 2025
      const newModules = Array.from(this.modules.values()).filter(
        module => module.newIn2025 === true
      );

      // Sort by importance and exam relevance
      newModules.sort((a, b) => {
        // Important modules first
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;

        // Then by exam relevance
        const relevanceOrder = { high: 0, medium: 1, low: 2 };
        return (
          relevanceOrder[a.examRelevance] - relevanceOrder[b.examRelevance]
        );
      });

      // Enrich with progress data
      return this._enrichModulesWithProgress(newModules);
    } catch (error) {
      console.error('Error getting new topics 2025:', error);
      throw new Error('Failed to load new topics for 2025');
    }
  }

  /**
   * Get all topics removed in 2025
   */
  async getRemovedTopics2025() {
    try {
      // Ensure exam changes are loaded
      if (!this.examChanges) {
        await this.loadExamChanges();
      }

      // Return removed topics from metadata
      return this.examChanges.removedTopics || [];
    } catch (error) {
      console.error('Error getting removed topics 2025:', error);
      throw new Error('Failed to load removed topics for 2025');
    }
  }

  /**
   * Search content with filters
   */
  async searchContent(query, filters = {}) {
    try {
      // Load all modules if not already loaded
      await this._loadAllModules();

      let results = Array.from(this.modules.values());

      // Apply text search if query provided
      if (query && query.trim()) {
        const searchTerm = query.toLowerCase().trim();
        results = results.filter(module => {
          return (
            module.title.toLowerCase().includes(searchTerm) ||
            module.description.toLowerCase().includes(searchTerm) ||
            module.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            module.content.toLowerCase().includes(searchTerm)
          );
        });
      }

      // Apply filters
      if (filters.category) {
        results = results.filter(m => m.category === filters.category);
      }

      if (filters.difficulty) {
        results = results.filter(m => m.difficulty === filters.difficulty);
      }

      if (filters.examRelevance) {
        results = results.filter(
          m => m.examRelevance === filters.examRelevance
        );
      }

      if (filters.newIn2025 !== undefined) {
        results = results.filter(m => m.newIn2025 === filters.newIn2025);
      }

      if (filters.important !== undefined) {
        results = results.filter(m => m.important === filters.important);
      }

      // Apply learning status filter
      if (filters.learningStatus) {
        const progress = this.stateManager.getState('progress') || {};
        const completed = progress.modulesCompleted || [];
        const inProgress = progress.modulesInProgress || [];

        results = results.filter(module => {
          switch (filters.learningStatus) {
            case 'completed':
              return completed.includes(module.id);
            case 'in-progress':
              return inProgress.includes(module.id);
            case 'not-started':
              return (
                !completed.includes(module.id) &&
                !inProgress.includes(module.id)
              );
            default:
              return true;
          }
        });
      }

      // Enrich with progress data
      return this._enrichModulesWithProgress(results);
    } catch (error) {
      console.error('Error searching content:', error);
      throw new Error('Failed to search content');
    }
  }

  /**
   * Get a learning path by ID
   */
  async getLearningPath(pathId) {
    const paths = {
      'ap2-complete': ap2Path,
      'sql-mastery': sqlPath,
      'new-topics-2025': newTopicsPath,
      'oop-fundamentals': oopPath,
    };

    const path = paths[pathId];
    if (!path) {
      throw new Error(`Learning path "${pathId}" not found`);
    }

    return path;
  }

  /**
   * Get personalized recommendations based on user progress
   */
  async getRecommendations() {
    try {
      const progress = this.stateManager.getState('progress') || {};
      const completed = progress.modulesCompleted || [];
      const inProgress = progress.modulesInProgress || [];

      // Load all modules
      await this._loadAllModules();

      const recommendations = [];

      // 1. Continue in-progress modules
      const continueModules = Array.from(this.modules.values())
        .filter(m => inProgress.includes(m.id))
        .slice(0, 3);

      if (continueModules.length > 0) {
        recommendations.push({
          type: 'continue',
          title: 'Fortsetzen',
          modules: continueModules,
        });
      }

      // 2. High priority new topics 2025
      const newTopics = await this.getNewTopics2025();
      const uncompletedNewTopics = newTopics
        .filter(m => !completed.includes(m.id) && !inProgress.includes(m.id))
        .slice(0, 3);

      if (uncompletedNewTopics.length > 0) {
        recommendations.push({
          type: 'new-2025',
          title: 'Neue Themen 2025',
          modules: uncompletedNewTopics,
        });
      }

      // 3. High exam relevance modules
      const highRelevance = Array.from(this.modules.values())
        .filter(
          m =>
            m.examRelevance === 'high' &&
            !completed.includes(m.id) &&
            !inProgress.includes(m.id)
        )
        .slice(0, 3);

      if (highRelevance.length > 0) {
        recommendations.push({
          type: 'high-relevance',
          title: 'Hohe Prüfungsrelevanz',
          modules: highRelevance,
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Load all modules from the modules directory
   * @private
   */
  async _loadAllModules() {
    // If already loaded, return
    if (this.modules.size > 0) {
      return;
    }

    try {
      // Simple: just add all imported modules
      const allModules = [
        fue01,
        fue02dev,
        fue02anom,
        fue02ctrl,
        fue03,
        fue03load,
        fue04,
        fue04threats,
        bp01conc,
        bp01doc,
        bp01kerb,
        bp01mon,
        bp02cloud,
        bp02data,
        bp02nas,
        bp02qa,
        bp03cps,
        bp03rest,
        bp03sq,
        bp03tdd,
        bp04arch,
        bp04design,
        bp04prog,
        bp04scrum,
        bp05data,
        bp05enc,
        bp05sort,
        bp05sql,
        sqlDdl,
        sqlDml,
        sqlDql,
      ];

      allModules.forEach(module => {
        this.modules.set(module.id, module);
      });
    } catch (error) {
      console.error('Error loading modules:', error);
      throw new Error('Failed to load IHK modules');
    }
  }

  /**
   * Enrich modules with progress data
   * @private
   */
  _enrichModulesWithProgress(modules) {
    const progress = this.stateManager.getState('progress') || {};
    const completed = progress.modulesCompleted || [];
    const inProgress = progress.modulesInProgress || [];

    return modules.map(module => ({
      ...module,
      completed: completed.includes(module.id),
      inProgress: inProgress.includes(module.id),
      status: completed.includes(module.id)
        ? 'completed'
        : inProgress.includes(module.id)
          ? 'in-progress'
          : 'not-started',
    }));
  }

  /**
   * Get all categories
   */
  getCategories() {
    if (!this.categories) {
      return [];
    }
    return this.categories.categories || [];
  }

  /**
   * Get recommended learning paths
   */
  getRecommendedLearningPaths() {
    return [
      {
        id: 'ap2-complete',
        title: 'AP2 Komplett',
        description:
          'Vollständige Vorbereitung auf die Abschlussprüfung Teil 2',
        difficulty: 'intermediate',
        estimatedDuration: 120,
      },
      {
        id: 'sql-mastery',
        title: 'SQL Mastery',
        description: 'Alle SQL-Befehle aus dem Prüfungsbeiblatt meistern',
        difficulty: 'beginner',
        estimatedDuration: 20,
      },
      {
        id: 'new-topics-2025',
        title: 'Neue Themen 2025',
        description:
          'Alle neuen Themen ab 2025 (TDD, Scrum, Sortierverfahren, etc.)',
        difficulty: 'intermediate',
        estimatedDuration: 30,
      },
      {
        id: 'oop-fundamentals',
        title: 'OOP Fundamentals',
        description: 'Objektorientierte Programmierung von Grund auf',
        difficulty: 'beginner',
        estimatedDuration: 25,
      },
    ];
  }

  /**
   * Get a single module by ID
   */
  async getModuleById(moduleId) {
    // Load all modules if not already loaded
    await this._loadAllModules();

    // Get module from cache
    const module = this.modules.get(moduleId);
    if (!module) {
      return null;
    }

    // Enrich with progress data
    const enriched = this._enrichModulesWithProgress([module]);
    return enriched[0];
  }

  /**
   * Get a single quiz by ID
   */
  async getQuizById(quizId) {
    try {
      // Check cache first
      if (this.quizzes.has(quizId)) {
        return this.quizzes.get(quizId);
      }

      // Try to load from file using dynamic import
      const quizData = await import(`../data/ihk/quizzes/${quizId}.json`);
      const quiz = quizData.default;
      this.quizzes.set(quiz.id, quiz);

      return quiz;
    } catch (error) {
      console.error(`Error getting quiz ${quizId}:`, error);
      return null;
    }
  }

  /**
   * Get content statistics
   */
  getContentStats() {
    return {
      totalModules: this.modules.size,
      totalQuizzes: this.quizzes.size,
      totalLearningPaths: 4,
    };
  }

  /**
   * Check if cached data is still valid (24 hours)
   * @private
   */
  _isCacheValid(cached) {
    if (!cached || !cached.timestamp) {
      return false;
    }

    const ONE_DAY = 24 * 60 * 60 * 1000;
    return Date.now() - cached.timestamp < ONE_DAY;
  }
}

export default IHKContentService;
