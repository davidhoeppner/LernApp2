import StorageService from './StorageService.js';

// Import metadata
import categoriesData from '../data/ihk/metadata/categories.json' with { type: 'json' };
import examChangesData from '../data/ihk/metadata/exam-changes-2025.json' with { type: 'json' };

// Import learning paths
import ap2Path from '../data/ihk/learning-paths/ap2-complete-path.json' with { type: 'json' };
import sqlPath from '../data/ihk/learning-paths/sql-mastery-path.json' with { type: 'json' };
import newTopicsPath from '../data/ihk/learning-paths/new-topics-2025-path.json' with { type: 'json' };
import oopPath from '../data/ihk/learning-paths/oop-fundamentals-path.json' with { type: 'json' };

// Import all IHK modules directly
import fue01 from '../data/ihk/modules/fue-01-planning.json' with { type: 'json' };
import fue02dev from '../data/ihk/modules/fue-02-development.json' with { type: 'json' };
import fue02anom from '../data/ihk/modules/fue-02-anomalies-redundancies.json' with { type: 'json' };
import fue02ctrl from '../data/ihk/modules/fue-02-control-structures.json' with { type: 'json' };
import fue03 from '../data/ihk/modules/fue-03-quality.json' with { type: 'json' };
import fue03load from '../data/ihk/modules/fue-03-load-performance-tests.json' with { type: 'json' };
import fue04 from '../data/ihk/modules/fue-04-security.json' with { type: 'json' };
import fue04threats from '../data/ihk/modules/fue-04-security-threats.json' with { type: 'json' };
import bp01conc from '../data/ihk/modules/bp-01-conception.json' with { type: 'json' };
import bp01doc from '../data/ihk/modules/bp-01-documentation.json' with { type: 'json' };
import bp01kerb from '../data/ihk/modules/bp-01-kerberos.json' with { type: 'json' };
import bp01mon from '../data/ihk/modules/bp-01-monitoring.json' with { type: 'json' };
import bp02cloud from '../data/ihk/modules/bp-02-cloud-models.json' with { type: 'json' };
import bp02data from '../data/ihk/modules/bp-02-data-formats.json' with { type: 'json' };
import bp02nas from '../data/ihk/modules/bp-02-nas-san.json' with { type: 'json' };
import bp03cps from '../data/ihk/modules/bp-03-cps.json' with { type: 'json' };
import bp03rest from '../data/ihk/modules/bp-03-rest-api.json' with { type: 'json' };
import bp03sq from '../data/ihk/modules/bp-03-software-quality.json' with { type: 'json' };
import bp03tdd from '../data/ihk/modules/bp-03-tdd.json' with { type: 'json' };
import bp04arch from '../data/ihk/modules/bp-04-architecture-patterns.json' with { type: 'json' };
import bp04design from '../data/ihk/modules/bp-04-design-patterns.json' with { type: 'json' };
import bp04prog from '../data/ihk/modules/bp-04-programming-paradigms.json' with { type: 'json' };
import bp04scrum from '../data/ihk/modules/bp-04-scrum.json' with { type: 'json' };
import bp05data from '../data/ihk/modules/bp-05-data-structures.json' with { type: 'json' };
import bp05enc from '../data/ihk/modules/bp-05-encapsulation.json' with { type: 'json' };
import bp05sort from '../data/ihk/modules/bp-05-sorting.json' with { type: 'json' };
import bp05sql from '../data/ihk/modules/bp-05-sql-reference.json' with { type: 'json' };
import sqlDdl from '../data/ihk/modules/sql-ddl.json' with { type: 'json' };
import sqlDml from '../data/ihk/modules/sql-dml.json' with { type: 'json' };
import sqlDql from '../data/ihk/modules/sql-dql.json' with { type: 'json' };

// Import DPA-specific modules
import bpDpa01 from '../data/ihk/modules/bp-dpa-01-data-modeling.json' with { type: 'json' };
import bpDpa02 from '../data/ihk/modules/bp-dpa-02-etl-processes.json' with { type: 'json' };
import bpDpa03 from '../data/ihk/modules/bp-dpa-03-bpmn-modeling.json' with { type: 'json' };
import bpDpa04 from '../data/ihk/modules/bp-dpa-04-business-intelligence.json' with { type: 'json' };

// Import all IHK quizzes (including migrated ones)
import bp01ConceptionQuiz from '../data/ihk/quizzes/bp-01-conception-quiz.json' with { type: 'json' };
import bp01DocumentationQuiz from '../data/ihk/quizzes/bp-01-documentation-quiz.json' with { type: 'json' };
import bp01MonitoringQuiz from '../data/ihk/quizzes/bp-01-monitoring-quiz.json' with { type: 'json' };
import bp01OdbcQuiz from '../data/ihk/quizzes/bp-01-odbc-quiz.json' with { type: 'json' };
import bp02CloudModelsQuiz from '../data/ihk/quizzes/bp-02-cloud-models-quiz.json' with { type: 'json' };
import bp02DataFormatsQuiz from '../data/ihk/quizzes/bp-02-data-formats-quiz.json' with { type: 'json' };
import bp02NasSanQuiz from '../data/ihk/quizzes/bp-02-nas-san-quiz.json' with { type: 'json' };
import bp02QualityAssuranceQuiz from '../data/ihk/quizzes/bp-02-quality-assurance-quiz.json' with { type: 'json' };
import bp03CpsQuiz from '../data/ihk/quizzes/bp-03-cps-quiz.json' with { type: 'json' };
import bp03RestApiQuiz from '../data/ihk/quizzes/bp-03-rest-api-quiz.json' with { type: 'json' };
import bp03SoftwareQualityQuiz from '../data/ihk/quizzes/bp-03-software-quality-quiz.json' with { type: 'json' };
import bp03TddQuiz from '../data/ihk/quizzes/bp-03-tdd-quiz.json' with { type: 'json' };
import bp04ArchitecturePatternsQuiz from '../data/ihk/quizzes/bp-04-architecture-patterns-quiz.json' with { type: 'json' };
import bp04DesignPatternsQuiz from '../data/ihk/quizzes/bp-04-design-patterns-quiz.json' with { type: 'json' };
import bp04ProgrammingParadigmsQuiz from '../data/ihk/quizzes/bp-04-programming-paradigms-quiz.json' with { type: 'json' };
import bp04ScrumQuiz from '../data/ihk/quizzes/bp-04-scrum-quiz.json' with { type: 'json' };
import bp05DataStructuresQuiz from '../data/ihk/quizzes/bp-05-data-structures-quiz.json' with { type: 'json' };
import bp05EncapsulationQuiz from '../data/ihk/quizzes/bp-05-encapsulation-quiz.json' with { type: 'json' };
import bp05SortingQuiz from '../data/ihk/quizzes/bp-05-sorting-quiz.json' with { type: 'json' };
import bp05SqlReferenceQuiz from '../data/ihk/quizzes/bp-05-sql-reference-quiz.json' with { type: 'json' };
import fue01PlanningQuiz from '../data/ihk/quizzes/fue-01-planning-quiz.json' with { type: 'json' };
import fue02AnomaliesRedundanciesQuiz from '../data/ihk/quizzes/fue-02-anomalies-redundancies-quiz.json' with { type: 'json' };
import fue02ControlStructuresQuiz from '../data/ihk/quizzes/fue-02-control-structures-quiz.json' with { type: 'json' };
import fue02DevelopmentQuiz from '../data/ihk/quizzes/fue-02-development-quiz.json' with { type: 'json' };
import fue03LoadPerformanceTestsQuiz from '../data/ihk/quizzes/fue-03-load-performance-tests-quiz.json' with { type: 'json' };
import fue03QualityQuiz from '../data/ihk/quizzes/fue-03-quality-quiz.json' with { type: 'json' };
import fue04SecurityQuiz from '../data/ihk/quizzes/fue-04-security-quiz.json' with { type: 'json' };
import fue04SecurityThreatsQuiz from '../data/ihk/quizzes/fue-04-security-threats-quiz.json' with { type: 'json' };
import kerberosQuiz from '../data/ihk/quizzes/kerberos-quiz.json' with { type: 'json' };
import scrumQuiz from '../data/ihk/quizzes/scrum-quiz.json' with { type: 'json' };
import sortingAlgorithmsQuiz from '../data/ihk/quizzes/sorting-algorithms-quiz.json' with { type: 'json' };
import sqlComprehensiveQuiz from '../data/ihk/quizzes/sql-comprehensive-quiz.json' with { type: 'json' };
import sqlDdl2025Quiz from '../data/ihk/quizzes/sql-ddl-2025-quiz.json' with { type: 'json' };
import sqlDml2025Quiz from '../data/ihk/quizzes/sql-dml-2025-quiz.json' with { type: 'json' };
import tddQuiz from '../data/ihk/quizzes/tdd-quiz.json' with { type: 'json' };

// Import DPA-specific quizzes
import bpDpa01ErModelingQuiz from '../data/ihk/quizzes/bp-dpa-01-er-modeling-quiz.json' with { type: 'json' };
import bpDpa01NormalizationQuiz from '../data/ihk/quizzes/bp-dpa-01-normalization-quiz.json' with { type: 'json' };
import bpDpa02EtlQuiz from '../data/ihk/quizzes/bp-dpa-02-etl-quiz.json' with { type: 'json' };
import bpDpa03BpmnQuiz from '../data/ihk/quizzes/bp-dpa-03-bpmn-quiz.json' with { type: 'json' };
import bpDpa04BiQuiz from '../data/ihk/quizzes/bp-dpa-04-bi-quiz.json' with { type: 'json' };
import bpDpa05DataWarehousingQuiz from '../data/ihk/quizzes/bp-dpa-05-data-warehousing-quiz.json' with { type: 'json' };
import bpDpa06DataQualityQuiz from '../data/ihk/quizzes/bp-dpa-06-data-quality-quiz.json' with { type: 'json' };
import bpDpa07StatisticalAnalysisQuiz from '../data/ihk/quizzes/bp-dpa-07-statistical-analysis-quiz.json' with { type: 'json' };
import bpDpa08ProcessOptimizationQuiz from '../data/ihk/quizzes/bp-dpa-08-process-optimization-quiz.json' with { type: 'json' };
import bpDpa09AdvancedBiQuiz from '../data/ihk/quizzes/bp-dpa-09-advanced-bi-quiz.json' with { type: 'json' };

/**
 * IHKContentService - Manages IHK exam content (modules, quizzes, learning paths)
 * Handles loading, filtering, and searching of IHK-specific content
 */
class IHKContentService {
  constructor(stateManager, storageService, specializationService, categoryMappingService, performanceOptimizationService, performanceMonitoringService) {
    this.stateManager = stateManager;
    this.storage = storageService || new StorageService('ihk-content');
    this.specializationService = specializationService;
    this.categoryMappingService = categoryMappingService;
    this.performanceOptimizationService = performanceOptimizationService;
    this.performanceMonitoringService = performanceMonitoringService;
    this.categories = null;
    this.examChanges = null;
    this.modules = new Map();
    this.quizzes = new Map();
    this.learningPaths = new Map();
    // Cache for categorized content
    this.categorizedContentCache = new Map();
    this.categoryIndexCache = new Map();
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
   * Get personalized module recommendations based on user progress
   * Returns up to 3 recommendation groups:
   * 1. Continue in-progress modules
   * 2. New topics introduced in 2025
   * 3. High exam relevance modules not yet started
   * @returns {Promise<Array>} Array of recommendation groups with type, title, and modules
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
   * Load all IHK modules into memory cache
   * Modules are statically imported at the top of this file for optimal bundling
   * Enhanced to apply three-tier category mapping during load
   * @private
   */
  async _loadAllModules() {
    // If already loaded, return cached modules
    if (this.modules.size > 0) {
      return;
    }

    try {
      // Add all statically imported modules to the cache
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
        // DPA-specific modules
        bpDpa01,
        bpDpa02,
        bpDpa03,
        bpDpa04,
      ];

      // Flatten modules - some files contain { modules: [...] } structure
      const flattenedModules = [];
      allModules.forEach(moduleData => {
        if (moduleData.modules && Array.isArray(moduleData.modules)) {
          // File contains { modules: [...] } structure
          flattenedModules.push(...moduleData.modules);
        } else if (moduleData.id) {
          // Direct module object
          flattenedModules.push(moduleData);
        } else {
          console.warn('Invalid module structure:', moduleData);
        }
      });

      // Apply three-tier category mapping to each module
      flattenedModules.forEach(module => {
        // Preserve original category for backward compatibility
        const originalCategory = module.category || module.categoryId;
        
        // Apply three-tier category mapping if service is available
        if (this.categoryMappingService) {
          try {
            const mappingResult = this.categoryMappingService.mapToThreeTierCategory(module);
            
            // Add three-tier category information while preserving original
            const enhancedModule = {
              ...module,
              // Preserve original category fields for backward compatibility
              category: originalCategory,
              categoryId: originalCategory,
              // Add new three-tier category information
              threeTierCategory: mappingResult.threeTierCategory,
              categoryMapping: {
                threeTierCategory: mappingResult.threeTierCategory,
                categoryInfo: mappingResult.categoryInfo,
                mappingRule: mappingResult.appliedRule,
                mappingReason: mappingResult.reason,
                mappingTimestamp: mappingResult.timestamp
              }
            };
            
            this.modules.set(module.id, enhancedModule);
          } catch (mappingError) {
            console.warn(`Failed to map module ${module.id} to three-tier category:`, mappingError);
            // Fallback: store module with original category only
            this.modules.set(module.id, {
              ...module,
              category: originalCategory,
              categoryId: originalCategory,
              threeTierCategory: 'allgemein', // Default fallback
              categoryMapping: {
                threeTierCategory: 'allgemein',
                mappingRule: null,
                mappingReason: 'Mapping failed, using default',
                mappingTimestamp: new Date().toISOString()
              }
            });
          }
        } else {
          // No category mapping service available - preserve original structure
          this.modules.set(module.id, {
            ...module,
            category: originalCategory,
            categoryId: originalCategory
          });
        }
      });

      // Clear categorized content cache since modules have been reloaded
      this.clearCategorizedContentCache();

    } catch (error) {
      console.error('Error loading modules:', error);
      throw new Error('Failed to load IHK modules');
    }
  }

  /**
   * Enrich modules with user progress data (completion status)
   * Adds completed, inProgress, and status fields to each module
   * @private
   * @param {Array} modules - Array of module objects to enrich
   * @returns {Array} Enriched modules with progress information
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
   * Get all modules
   */
  async getAllModules() {
    // Load all modules if not already loaded
    await this._loadAllModules();
    return Array.from(this.modules.values());
  }

  /**
   * Get all quizzes
   */
  async getAllQuizzes() {
    // Load all quizzes if not already loaded
    if (this.quizzes.size === 0) {
      await this._loadAllQuizzes();
    }

    return Array.from(this.quizzes.values());
  }

  /**
   * Get a single quiz by ID
   */
  async getQuizById(quizId) {
    try {
      // Load all quizzes if not already loaded
      if (this.quizzes.size === 0) {
        await this._loadAllQuizzes();
      }

      // Check cache
      if (this.quizzes.has(quizId)) {
        return this.quizzes.get(quizId);
      }

      // Try dynamic import as fallback
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
   * Get quizzes related to a module
   */
  getRelatedQuizzes(moduleId) {
    const allQuizzes = Array.from(this.quizzes.values());
    return allQuizzes.filter(quiz => quiz.moduleId === moduleId);
  }

  /**
   * Load all IHK quizzes into memory cache
   * Quizzes are statically imported at the top of this file for optimal bundling
   * Enhanced to apply three-tier category mapping during load
   * @private
   */
  async _loadAllQuizzes() {
    const allQuizzes = [
      bp01ConceptionQuiz,
      bp01DocumentationQuiz,
      bp01MonitoringQuiz,
      bp01OdbcQuiz,
      bp02CloudModelsQuiz,
      bp02DataFormatsQuiz,
      bp02NasSanQuiz,
      bp02QualityAssuranceQuiz,
      bp03CpsQuiz,
      bp03RestApiQuiz,
      bp03SoftwareQualityQuiz,
      bp03TddQuiz,
      bp04ArchitecturePatternsQuiz,
      bp04DesignPatternsQuiz,
      bp04ProgrammingParadigmsQuiz,
      bp04ScrumQuiz,
      bp05DataStructuresQuiz,
      bp05EncapsulationQuiz,
      bp05SortingQuiz,
      bp05SqlReferenceQuiz,
      fue01PlanningQuiz,
      fue02AnomaliesRedundanciesQuiz,
      fue02ControlStructuresQuiz,
      fue02DevelopmentQuiz,
      fue03LoadPerformanceTestsQuiz,
      fue03QualityQuiz,
      fue04SecurityQuiz,
      fue04SecurityThreatsQuiz,
      kerberosQuiz,
      scrumQuiz,
      sortingAlgorithmsQuiz,
      sqlComprehensiveQuiz,
      sqlDdl2025Quiz,
      sqlDml2025Quiz,
      tddQuiz,
      // DPA-specific quizzes
      bpDpa01ErModelingQuiz,
      bpDpa01NormalizationQuiz,
      bpDpa02EtlQuiz,
      bpDpa03BpmnQuiz,
      bpDpa04BiQuiz,
      bpDpa05DataWarehousingQuiz,
      bpDpa06DataQualityQuiz,
      bpDpa07StatisticalAnalysisQuiz,
      bpDpa08ProcessOptimizationQuiz,
      bpDpa09AdvancedBiQuiz,
    ];

    // Apply three-tier category mapping to each quiz
    allQuizzes.forEach(quiz => {
      // Preserve original category for backward compatibility
      const originalCategory = quiz.category || quiz.categoryId;
      
      // Apply three-tier category mapping if service is available
      if (this.categoryMappingService) {
        try {
          const mappingResult = this.categoryMappingService.mapToThreeTierCategory(quiz);
          
          // Add three-tier category information while preserving original
          const enhancedQuiz = {
            ...quiz,
            // Preserve original category fields for backward compatibility
            category: originalCategory,
            categoryId: originalCategory,
            // Add new three-tier category information
            threeTierCategory: mappingResult.threeTierCategory,
            categoryMapping: {
              threeTierCategory: mappingResult.threeTierCategory,
              categoryInfo: mappingResult.categoryInfo,
              mappingRule: mappingResult.appliedRule,
              mappingReason: mappingResult.reason,
              mappingTimestamp: mappingResult.timestamp
            }
          };
          
          this.quizzes.set(quiz.id, enhancedQuiz);
        } catch (mappingError) {
          console.warn(`Failed to map quiz ${quiz.id} to three-tier category:`, mappingError);
          // Fallback: store quiz with original category only
          this.quizzes.set(quiz.id, {
            ...quiz,
            category: originalCategory,
            categoryId: originalCategory,
            threeTierCategory: 'allgemein', // Default fallback
            categoryMapping: {
              threeTierCategory: 'allgemein',
              mappingRule: null,
              mappingReason: 'Mapping failed, using default',
              mappingTimestamp: new Date().toISOString()
            }
          });
        }
      } else {
        // No category mapping service available - preserve original structure
        this.quizzes.set(quiz.id, {
          ...quiz,
          category: originalCategory,
          categoryId: originalCategory
        });
      }
    });

    // Clear categorized content cache since quizzes have been reloaded
    this.clearCategorizedContentCache();
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
   * Get comprehensive statistics for three-tier categories
   * @param {Object} options - Options for statistics calculation
   * @returns {Promise<Object>} Detailed statistics for each three-tier category
   */
  async getThreeTierCategoryStats(options = {}) {
    try {
      const {
        includeSpecializationRelevance = true,
        includeDifficultyDistribution = true,
        includeContentTypes = true,
        includeProgressStats = false,
        specializationId = null
      } = options;

      // Ensure all content is loaded
      await this._loadAllModules();
      await this._loadAllQuizzes();

      const allModules = Array.from(this.modules.values());
      const allQuizzes = Array.from(this.quizzes.values());
      const allContent = [...allModules, ...allQuizzes];

      const stats = {
        overview: {
          totalContent: allContent.length,
          totalModules: allModules.length,
          totalQuizzes: allQuizzes.length,
          generatedAt: new Date().toISOString()
        },
        categories: {}
      };

      // Calculate stats for each three-tier category
      const categories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
      
      for (const categoryId of categories) {
        const categoryContent = allContent.filter(item => 
          item.threeTierCategory === categoryId
        );

        const categoryModules = categoryContent.filter(item => 
          item.type === 'module' || !item.questions
        );

        const categoryQuizzes = categoryContent.filter(item => 
          item.type === 'quiz' || item.questions
        );

        const categoryStats = {
          metadata: this._getCategoryMetadata(categoryId),
          contentCounts: {
            total: categoryContent.length,
            modules: categoryModules.length,
            quizzes: categoryQuizzes.length,
            percentage: allContent.length > 0 ? 
              Math.round((categoryContent.length / allContent.length) * 100) : 0
          }
        };

        // Add difficulty distribution if requested
        if (includeDifficultyDistribution) {
          categoryStats.difficultyDistribution = this._calculateDifficultyDistribution(categoryContent);
        }

        // Add content type breakdown if requested
        if (includeContentTypes) {
          categoryStats.contentTypes = this._calculateContentTypeBreakdown(categoryContent);
        }

        // Add specialization relevance if requested
        if (includeSpecializationRelevance) {
          categoryStats.specializationRelevance = this._calculateSpecializationRelevance(
            categoryContent, 
            specializationId
          );
        }

        // Add progress statistics if requested and specialization provided
        if (includeProgressStats && specializationId) {
          categoryStats.progressStats = await this._calculateProgressStats(
            categoryContent, 
            specializationId
          );
        }

        stats.categories[categoryId] = categoryStats;
      }

      // Add cross-category insights
      stats.insights = this._generateCategoryInsights(stats.categories);

      return stats;

    } catch (error) {
      console.error('Error calculating three-tier category stats:', error);
      throw error;
    }
  }

  /**
   * Get category statistics for a specific specialization
   * @param {string} specializationId - Specialization ID
   * @returns {Promise<Object>} Category statistics tailored for specialization
   */
  async getCategoryStatsForSpecialization(specializationId) {
    try {
      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      const stats = await this.getThreeTierCategoryStats({
        includeSpecializationRelevance: true,
        includeDifficultyDistribution: true,
        includeContentTypes: true,
        includeProgressStats: true,
        specializationId: specializationId
      });

      // Add specialization-specific insights
      stats.specializationInsights = this._generateSpecializationInsights(
        stats.categories, 
        specializationId
      );

      // Rank categories by relevance for this specialization
      stats.categoryRanking = this._rankCategoriesByRelevance(
        stats.categories, 
        specializationId
      );

      return stats;

    } catch (error) {
      console.error('Error calculating specialization category stats:', error);
      throw error;
    }
  }

  /**
   * Get modules filtered by specialization
   * @param {string} specializationId - The specialization ID to filter for
   * @param {Object} options - Filtering options
   * @returns {Promise<Array>} Filtered modules array
   */
  async getModulesBySpecialization(specializationId, options = {}) {
    try {
      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      // Load all modules
      await this._loadAllModules();
      const allModules = Array.from(this.modules.values());

      // If no specialization service available, return all modules
      if (!this.specializationService) {
        console.warn('SpecializationService not available, returning all modules');
        return this._enrichModulesWithProgress(allModules);
      }

      // Filter modules by specialization
      const filteredModules = this.specializationService.filterContentBySpecialization(
        allModules,
        specializationId,
        {
          minRelevance: options.minRelevance || 'low',
          includeGeneral: options.includeGeneral !== false
        }
      );

      return this._enrichModulesWithProgress(filteredModules);
    } catch (error) {
      console.error(`Error getting modules by specialization ${specializationId}:`, error);
      throw error;
    }
  }

  /**
   * Get quizzes filtered by specialization
   * @param {string} specializationId - The specialization ID to filter for
   * @param {Object} options - Filtering options
   * @returns {Promise<Array>} Filtered quizzes array
   */
  async getQuizzesBySpecialization(specializationId, options = {}) {
    try {
      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      // Load all quizzes
      await this._loadAllQuizzes();
      const allQuizzes = Array.from(this.quizzes.values());

      // If no specialization service available, return all quizzes
      if (!this.specializationService) {
        console.warn('SpecializationService not available, returning all quizzes');
        return allQuizzes;
      }

      // Filter quizzes by specialization
      const filteredQuizzes = this.specializationService.filterContentBySpecialization(
        allQuizzes,
        specializationId,
        {
          minRelevance: options.minRelevance || 'low',
          includeGeneral: options.includeGeneral !== false
        }
      );

      return filteredQuizzes;
    } catch (error) {
      console.error(`Error getting quizzes by specialization ${specializationId}:`, error);
      throw error;
    }
  }

  /**
   * Get content statistics by specialization
   * @param {string} specializationId - The specialization ID
   * @returns {Promise<Object>} Statistics object with counts by category and relevance
   */
  async getContentStatsBySpecialization(specializationId) {
    try {
      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      // Load all content
      await this._loadAllModules();
      await this._loadAllQuizzes();

      const allModules = Array.from(this.modules.values());
      const allQuizzes = Array.from(this.quizzes.values());

      const stats = {
        specialization: specializationId,
        modules: {
          total: allModules.length,
          byRelevance: { high: 0, medium: 0, low: 0, none: 0 },
          byCategory: {}
        },
        quizzes: {
          total: allQuizzes.length,
          byRelevance: { high: 0, medium: 0, low: 0, none: 0 },
          byCategory: {}
        }
      };

      if (!this.specializationService) {
        console.warn('SpecializationService not available, returning basic statistics');
        return stats;
      }

      // Calculate module statistics
      allModules.forEach(module => {
        const categoryId = module.category || module.categoryId;
        if (categoryId) {
          const relevance = this.specializationService.getCategoryRelevance(categoryId, specializationId);
          
          // Count by relevance
          if (stats.modules.byRelevance[relevance] !== undefined) {
            stats.modules.byRelevance[relevance]++;
          }

          // Count by category
          if (!stats.modules.byCategory[categoryId]) {
            stats.modules.byCategory[categoryId] = { count: 0, relevance: relevance };
          }
          stats.modules.byCategory[categoryId].count++;
        } else {
          stats.modules.byRelevance.none++;
        }
      });

      // Calculate quiz statistics
      allQuizzes.forEach(quiz => {
        const categoryId = quiz.category || quiz.categoryId;
        if (categoryId) {
          const relevance = this.specializationService.getCategoryRelevance(categoryId, specializationId);
          
          // Count by relevance
          if (stats.quizzes.byRelevance[relevance] !== undefined) {
            stats.quizzes.byRelevance[relevance]++;
          }

          // Count by category
          if (!stats.quizzes.byCategory[categoryId]) {
            stats.quizzes.byCategory[categoryId] = { count: 0, relevance: relevance };
          }
          stats.quizzes.byCategory[categoryId].count++;
        } else {
          stats.quizzes.byRelevance.none++;
        }
      });

      return stats;
    } catch (error) {
      console.error(`Error getting content statistics for specialization ${specializationId}:`, error);
      throw error;
    }
  }

  /**
   * Get content organized by specialization relevance
   * @param {string} specializationId - The specialization ID
   * @returns {Promise<Object>} Object with content organized by relevance levels
   */
  async getContentByRelevance(specializationId) {
    try {
      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      // Load all content
      await this._loadAllModules();
      await this._loadAllQuizzes();

      const allModules = Array.from(this.modules.values());
      const allQuizzes = Array.from(this.quizzes.values());

      const result = {
        high: { modules: [], quizzes: [] },
        medium: { modules: [], quizzes: [] },
        low: { modules: [], quizzes: [] }
      };

      if (!this.specializationService) {
        console.warn('SpecializationService not available');
        return result;
      }

      // Organize modules by relevance
      allModules.forEach(module => {
        const categoryId = module.category || module.categoryId;
        if (categoryId) {
          const relevance = this.specializationService.getCategoryRelevance(categoryId, specializationId);
          if (result[relevance]) {
            result[relevance].modules.push(module);
          }
        }
      });

      // Organize quizzes by relevance
      allQuizzes.forEach(quiz => {
        const categoryId = quiz.category || quiz.categoryId;
        if (categoryId) {
          const relevance = this.specializationService.getCategoryRelevance(categoryId, specializationId);
          if (result[relevance]) {
            result[relevance].quizzes.push(quiz);
          }
        }
      });

      // Enrich modules with progress data
      Object.keys(result).forEach(relevance => {
        result[relevance].modules = this._enrichModulesWithProgress(result[relevance].modules);
      });

      return result;
    } catch (error) {
      console.error(`Error getting content by relevance for specialization ${specializationId}:`, error);
      throw error;
    }
  }

  /**
   * Get content filtered by three-tier category
   * @param {string} categoryId - Three-tier category ID ('daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein')
   * @returns {Promise<Array>} Array of content items in the specified category
   */
  async getContentByThreeTierCategory(categoryId) {
    try {
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Invalid three-tier category ID');
      }

      const validCategories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
      if (!validCategories.includes(categoryId)) {
        throw new Error(`Invalid three-tier category: ${categoryId}. Must be one of: ${validCategories.join(', ')}`);
      }

      // Check cache first
      const cacheKey = `three-tier-${categoryId}`;
      if (this.categorizedContentCache.has(cacheKey)) {
        return this.categorizedContentCache.get(cacheKey);
      }

      // Load all content
      await this._loadAllModules();
      await this._loadAllQuizzes();

      // Use optimized category indexes if available
      const contentIds = this._getCategoryContentIds(categoryId, 'content');
      let categorizedContent = [];

      if (contentIds.size > 0) {
        // Use indexed approach for better performance
        contentIds.forEach(contentId => {
          const module = this.modules.get(contentId);
          const quiz = this.quizzes.get(contentId);
          
          if (module && module.threeTierCategory === categoryId) {
            categorizedContent.push({ ...module, contentType: 'module' });
          } else if (quiz && quiz.threeTierCategory === categoryId) {
            categorizedContent.push({ ...quiz, contentType: 'quiz' });
          }
        });
      } else {
        // Fallback to full scan if indexes not available or category mapping service missing
        if (!this.categoryMappingService) {
          console.warn('CategoryMappingService not available, returning empty array');
          return [];
        }

        const allContent = [
          ...Array.from(this.modules.values()),
          ...Array.from(this.quizzes.values())
        ];

        // Filter content by three-tier category
        categorizedContent = allContent.filter(item => {
          // Use pre-computed three-tier category if available
          if (item.threeTierCategory) {
            return item.threeTierCategory === categoryId;
          }
          
          // Fallback to mapping service
          const mappingResult = this.categoryMappingService.mapToThreeTierCategory(item);
          return mappingResult.threeTierCategory === categoryId;
        }).map(item => ({
          ...item,
          contentType: (item.content || item.sections) ? 'module' : 'quiz'
        }));
      }

      // Enrich modules with progress data
      const enrichedContent = categorizedContent.map(item => {
        if (item.contentType === 'module') {
          const enriched = this._enrichModulesWithProgress([item]);
          return enriched[0];
        } else {
          return item;
        }
      });

      // Cache the result
      this.categorizedContentCache.set(cacheKey, enrichedContent);

      return enrichedContent;
    } catch (error) {
      console.error(`Error getting content by three-tier category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Get content organized by three-tier categories with metadata
   * @param {string} specializationId - Optional specialization ID for relevance calculation
   * @returns {Promise<Object>} Object with content organized by three-tier categories
   */
  async getContentWithCategoryInfo(specializationId) {
    try {
      // Load all content
      await this._loadAllModules();
      await this._loadAllQuizzes();

      if (!this.categoryMappingService) {
        console.warn('CategoryMappingService not available, returning empty structure');
        return this._getEmptyCategorizedContent();
      }

      const allModules = Array.from(this.modules.values());
      const allQuizzes = Array.from(this.quizzes.values());

      // Initialize result structure
      const result = {
        'daten-prozessanalyse': {
          modules: [],
          quizzes: [],
          relevance: 'none',
          metadata: null
        },
        'anwendungsentwicklung': {
          modules: [],
          quizzes: [],
          relevance: 'none',
          metadata: null
        },
        'allgemein': {
          modules: [],
          quizzes: [],
          relevance: 'none',
          metadata: null
        }
      };

      // Get category metadata
      const threeTierCategories = this.categoryMappingService.getThreeTierCategories();
      threeTierCategories.forEach(category => {
        if (result[category.id]) {
          result[category.id].metadata = category;
          
          // Calculate relevance for specialization if provided
          if (specializationId && this.categoryMappingService) {
            result[category.id].relevance = this.categoryMappingService.getCategoryRelevance(
              category.id, 
              specializationId
            );
          }
        }
      });

      // Categorize modules
      allModules.forEach(module => {
        const mappingResult = this.categoryMappingService.mapToThreeTierCategory(module);
        const categoryId = mappingResult.threeTierCategory;
        
        if (result[categoryId]) {
          result[categoryId].modules.push({
            ...module,
            threeTierCategory: categoryId,
            mappingInfo: mappingResult
          });
        }
      });

      // Categorize quizzes
      allQuizzes.forEach(quiz => {
        const mappingResult = this.categoryMappingService.mapToThreeTierCategory(quiz);
        const categoryId = mappingResult.threeTierCategory;
        
        if (result[categoryId]) {
          result[categoryId].quizzes.push({
            ...quiz,
            threeTierCategory: categoryId,
            mappingInfo: mappingResult
          });
        }
      });

      // Enrich modules with progress data
      Object.keys(result).forEach(categoryId => {
        result[categoryId].modules = this._enrichModulesWithProgress(result[categoryId].modules);
      });

      return result;
    } catch (error) {
      console.error('Error getting content with category info:', error);
      throw error;
    }
  }

  /**
   * Search content within a specific three-tier category
   * @param {string} query - Search query string
   * @param {string} categoryId - Three-tier category ID to search within
   * @returns {Promise<Array>} Array of matching content items
   */
  async searchInCategory(query, categoryId) {
    try {
      if (!query || typeof query !== 'string') {
        throw new Error('Invalid search query');
      }

      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Invalid category ID');
      }

      const validCategories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
      if (!validCategories.includes(categoryId)) {
        throw new Error(`Invalid three-tier category: ${categoryId}`);
      }

      // Get all content in the specified category
      const categoryContent = await this.getContentByThreeTierCategory(categoryId);

      // Apply text search
      const searchTerm = query.toLowerCase().trim();
      const results = categoryContent.filter(item => {
        // Search in title
        if (item.title && item.title.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // Search in description
        if (item.description && item.description.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // Search in tags
        if (item.tags && Array.isArray(item.tags)) {
          if (item.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
            return true;
          }
        }

        // Search in content (for modules)
        if (item.content && item.content.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // Search in questions (for quizzes)
        if (item.questions && Array.isArray(item.questions)) {
          return item.questions.some(question => 
            question.question && question.question.toLowerCase().includes(searchTerm)
          );
        }

        return false;
      });

      // Add search relevance score
      return results.map(item => ({
        ...item,
        searchRelevance: this._calculateSearchRelevance(item, searchTerm)
      })).sort((a, b) => b.searchRelevance - a.searchRelevance);

    } catch (error) {
      console.error(`Error searching in category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Enhanced search with category filtering and advanced options
   * @param {string} query - Search query string
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results grouped by categories with metadata
   */
  async searchWithCategoryFiltering(query, options = {}) {
    try {
      const {
        categories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'],
        contentTypes = ['module', 'quiz'],
        maxResultsPerCategory = 10,
        minRelevanceScore = 1,
        includeMetadata = true,
        sortBy = 'relevance', // 'relevance', 'title', 'difficulty'
        specializationId = null
      } = options;

      if (!query || typeof query !== 'string') {
        throw new Error('Invalid search query');
      }

      const searchTerm = query.toLowerCase().trim();
      const results = {
        query: query,
        totalResults: 0,
        categories: {},
        suggestions: []
      };

      // Search in each requested category
      for (const categoryId of categories) {
        try {
          const categoryResults = await this.searchInCategory(query, categoryId);
          
          // Filter by content type
          let filteredResults = categoryResults.filter(item => {
            const itemType = item.type || (item.questions ? 'quiz' : 'module');
            return contentTypes.includes(itemType);
          });

          // Filter by minimum relevance score
          filteredResults = filteredResults.filter(item => 
            (item.searchRelevance || 0) >= minRelevanceScore
          );

          // Apply specialization relevance boost if specified
          if (specializationId) {
            filteredResults = filteredResults.map(item => ({
              ...item,
              searchRelevance: this._boostRelevanceForSpecialization(item, specializationId)
            }));
          }

          // Sort results
          filteredResults = this._sortSearchResults(filteredResults, sortBy);

          // Limit results per category
          filteredResults = filteredResults.slice(0, maxResultsPerCategory);

          // Add category metadata if requested
          const categoryData = {
            results: filteredResults,
            totalFound: filteredResults.length
          };

          if (includeMetadata) {
            categoryData.metadata = this._getCategoryMetadata(categoryId);
          }

          results.categories[categoryId] = categoryData;
          results.totalResults += filteredResults.length;

        } catch (categoryError) {
          console.warn(`Error searching in category ${categoryId}:`, categoryError);
          results.categories[categoryId] = {
            results: [],
            totalFound: 0,
            error: categoryError.message
          };
        }
      }

      // Generate search suggestions if no results found
      if (results.totalResults === 0) {
        results.suggestions = await this._generateSearchSuggestions(query);
      }

      return results;

    } catch (error) {
      console.error('Error in enhanced search:', error);
      throw error;
    }
  }

  /**
   * Search across all categories with result grouping
   * @param {string} query - Search query string
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Unified search results with category grouping
   */
  async searchAllCategories(query, options = {}) {
    try {
      const {
        maxResults = 20,
        groupByCategory = true,
        includeEmptyCategories = false
      } = options;

      const searchResults = await this.searchWithCategoryFiltering(query, {
        ...options,
        maxResultsPerCategory: Math.ceil(maxResults / 3) // Distribute across categories
      });

      if (!groupByCategory) {
        // Return flat array of all results
        const allResults = [];
        Object.values(searchResults.categories).forEach(categoryData => {
          allResults.push(...categoryData.results);
        });

        // Sort all results by relevance and limit
        return allResults
          .sort((a, b) => (b.searchRelevance || 0) - (a.searchRelevance || 0))
          .slice(0, maxResults);
      }

      // Return grouped results
      const groupedResults = [];
      const categoryOrder = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];

      for (const categoryId of categoryOrder) {
        const categoryData = searchResults.categories[categoryId];
        
        if (!categoryData || (!includeEmptyCategories && categoryData.totalFound === 0)) {
          continue;
        }

        groupedResults.push({
          category: categoryId,
          categoryName: this._getCategoryMetadata(categoryId).name,
          results: categoryData.results || [],
          totalFound: categoryData.totalFound || 0
        });
      }

      return groupedResults;

    } catch (error) {
      console.error('Error in searchAllCategories:', error);
      return [];
    }
  }

  /**
   * Get search suggestions based on content and user behavior
   * @param {string} query - Original search query
   * @returns {Promise<Array>} Array of search suggestions
   */
  async _generateSearchSuggestions(query) {
    try {
      const suggestions = [];
      const searchTerm = query.toLowerCase().trim();

      // Load all content for analysis
      await this._loadAllModules();
      await this._loadAllQuizzes();

      const allContent = [
        ...Array.from(this.modules.values()),
        ...Array.from(this.quizzes.values())
      ];

      // Find similar terms in titles and descriptions
      const similarTerms = new Set();
      
      allContent.forEach(item => {
        // Extract words from title and description
        const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
        const words = text.split(/\s+/).filter(word => word.length > 2);
        
        words.forEach(word => {
          // Find words that are similar to search term
          if (word.includes(searchTerm) || searchTerm.includes(word)) {
            similarTerms.add(word);
          }
          
          // Find words that start with search term
          if (word.startsWith(searchTerm) && word !== searchTerm) {
            similarTerms.add(word);
          }
        });
      });

      // Convert to suggestions array
      Array.from(similarTerms)
        .slice(0, 5)
        .forEach(term => {
          suggestions.push({
            text: term,
            type: 'similar_term'
          });
        });

      // Add category-based suggestions
      const categories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
      categories.forEach(categoryId => {
        const metadata = this._getCategoryMetadata(categoryId);
        suggestions.push({
          text: `${query} in ${metadata.name}`,
          type: 'category_filter',
          categoryId: categoryId
        });
      });

      return suggestions.slice(0, 8); // Limit total suggestions

    } catch (error) {
      console.error('Error generating search suggestions:', error);
      return [];
    }
  }

  /**
   * Calculate search relevance score for an item
   * @private
   * @param {Object} item - Content item
   * @param {string} searchTerm - Search term
   * @returns {number} Relevance score (higher is more relevant)
   */
  _calculateSearchRelevance(item, searchTerm) {
    let score = 0;

    // Title matches get highest score
    if (item.title && item.title.toLowerCase().includes(searchTerm)) {
      score += 10;
      // Exact title match gets bonus
      if (item.title.toLowerCase() === searchTerm) {
        score += 5;
      }
    }

    // Description matches get medium score
    if (item.description && item.description.toLowerCase().includes(searchTerm)) {
      score += 5;
    }

    // Tag matches get medium score
    if (item.tags && Array.isArray(item.tags)) {
      const tagMatches = item.tags.filter(tag => tag.toLowerCase().includes(searchTerm)).length;
      score += tagMatches * 3;
    }

    // Content matches get lower score
    if (item.content && item.content.toLowerCase().includes(searchTerm)) {
      score += 2;
    }

    // Question matches for quizzes
    if (item.questions && Array.isArray(item.questions)) {
      const questionMatches = item.questions.filter(q => 
        q.question && q.question.toLowerCase().includes(searchTerm)
      ).length;
      score += questionMatches * 2;
    }

    return score;
  }

  /**
   * Boost relevance score based on specialization
   * @private
   * @param {Object} item - Content item
   * @param {string} specializationId - Specialization ID
   * @returns {number} Boosted relevance score
   */
  _boostRelevanceForSpecialization(item, specializationId) {
    let boostedScore = item.searchRelevance || 0;

    if (item.specializationRelevance && item.specializationRelevance[specializationId]) {
      const relevance = item.specializationRelevance[specializationId];
      const boost = relevance === 'high' ? 5 : relevance === 'medium' ? 3 : 1;
      boostedScore += boost;
    }

    return boostedScore;
  }

  /**
   * Sort search results by specified criteria
   * @private
   * @param {Array} results - Search results
   * @param {string} sortBy - Sort criteria
   * @returns {Array} Sorted results
   */
  _sortSearchResults(results, sortBy) {
    switch (sortBy) {
      case 'title':
        return results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      
      case 'difficulty':
        const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        return results.sort((a, b) => {
          const aDiff = difficultyOrder[a.difficulty] || 2;
          const bDiff = difficultyOrder[b.difficulty] || 2;
          return aDiff - bDiff;
        });
      
      case 'relevance':
      default:
        return results.sort((a, b) => (b.searchRelevance || 0) - (a.searchRelevance || 0));
    }
  }

  /**
   * Get metadata for a three-tier category
   * @private
   * @param {string} categoryId - Category ID
   * @returns {Object} Category metadata
   */
  _getCategoryMetadata(categoryId) {
    const metadata = {
      'daten-prozessanalyse': {
        id: 'daten-prozessanalyse',
        name: 'Daten und Prozessanalyse',
        description: 'Inhalte mit hoher Relevanz für die Fachrichtung Daten- und Prozessanalyse',
        color: '#3b82f6',
        icon: '📊'
      },
      'anwendungsentwicklung': {
        id: 'anwendungsentwicklung',
        name: 'Anwendungsentwicklung',
        description: 'Inhalte mit hoher Relevanz für die Fachrichtung Anwendungsentwicklung',
        color: '#10b981',
        icon: '💻'
      },
      'allgemein': {
        id: 'allgemein',
        name: 'Allgemein',
        description: 'Allgemeine Inhalte relevant für beide Fachrichtungen',
        color: '#6b7280',
        icon: '📚'
      }
    };

    return metadata[categoryId] || metadata['allgemein'];
  }

  /**
   * Calculate difficulty distribution for content
   * @private
   * @param {Array} content - Array of content items
   * @returns {Object} Difficulty distribution
   */
  _calculateDifficultyDistribution(content) {
    const distribution = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      unknown: 0
    };

    content.forEach(item => {
      const difficulty = item.difficulty || 'unknown';
      if (distribution.hasOwnProperty(difficulty)) {
        distribution[difficulty]++;
      } else {
        distribution.unknown++;
      }
    });

    // Calculate percentages
    const total = content.length;
    const percentages = {};
    Object.keys(distribution).forEach(level => {
      percentages[level] = total > 0 ? Math.round((distribution[level] / total) * 100) : 0;
    });

    return {
      counts: distribution,
      percentages: percentages,
      total: total
    };
  }

  /**
   * Calculate content type breakdown
   * @private
   * @param {Array} content - Array of content items
   * @returns {Object} Content type breakdown
   */
  _calculateContentTypeBreakdown(content) {
    const breakdown = {
      modules: 0,
      quizzes: 0,
      other: 0
    };

    content.forEach(item => {
      if (item.type === 'module' || (!item.questions && !item.type)) {
        breakdown.modules++;
      } else if (item.type === 'quiz' || item.questions) {
        breakdown.quizzes++;
      } else {
        breakdown.other++;
      }
    });

    const total = content.length;
    const percentages = {};
    Object.keys(breakdown).forEach(type => {
      percentages[type] = total > 0 ? Math.round((breakdown[type] / total) * 100) : 0;
    });

    return {
      counts: breakdown,
      percentages: percentages,
      total: total
    };
  }

  /**
   * Calculate specialization relevance for content
   * @private
   * @param {Array} content - Array of content items
   * @param {string} specializationId - Specialization ID (optional)
   * @returns {Object} Specialization relevance breakdown
   */
  _calculateSpecializationRelevance(content, specializationId = null) {
    const relevanceBreakdown = {
      'anwendungsentwicklung': { high: 0, medium: 0, low: 0, none: 0 },
      'daten-prozessanalyse': { high: 0, medium: 0, low: 0, none: 0 }
    };

    content.forEach(item => {
      if (item.specializationRelevance) {
        Object.keys(relevanceBreakdown).forEach(specId => {
          const relevance = item.specializationRelevance[specId] || 'none';
          if (relevanceBreakdown[specId][relevance] !== undefined) {
            relevanceBreakdown[specId][relevance]++;
          } else {
            relevanceBreakdown[specId].none++;
          }
        });
      } else {
        // No relevance data - count as none
        Object.keys(relevanceBreakdown).forEach(specId => {
          relevanceBreakdown[specId].none++;
        });
      }
    });

    // Calculate percentages and add metadata
    const result = {};
    Object.keys(relevanceBreakdown).forEach(specId => {
      const counts = relevanceBreakdown[specId];
      const total = content.length;
      
      const percentages = {};
      Object.keys(counts).forEach(level => {
        percentages[level] = total > 0 ? Math.round((counts[level] / total) * 100) : 0;
      });

      result[specId] = {
        counts: counts,
        percentages: percentages,
        total: total,
        isCurrentSpecialization: specId === specializationId
      };
    });

    return result;
  }

  /**
   * Calculate progress statistics for content
   * @private
   * @param {Array} content - Array of content items
   * @param {string} specializationId - Specialization ID
   * @returns {Promise<Object>} Progress statistics
   */
  async _calculateProgressStats(content, specializationId) {
    try {
      // Get user progress from state manager
      const progress = this.stateManager.getState('progress') || {};
      const completedModules = progress.completedModules || [];
      const quizAttempts = progress.quizAttempts || {};

      const stats = {
        modules: {
          total: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0
        },
        quizzes: {
          total: 0,
          attempted: 0,
          passed: 0,
          notAttempted: 0
        }
      };

      content.forEach(item => {
        if (item.type === 'module' || (!item.questions && !item.type)) {
          stats.modules.total++;
          if (completedModules.includes(item.id)) {
            stats.modules.completed++;
          } else {
            // For now, we don't track in-progress modules separately
            stats.modules.notStarted++;
          }
        } else if (item.type === 'quiz' || item.questions) {
          stats.quizzes.total++;
          if (quizAttempts[item.id]) {
            stats.quizzes.attempted++;
            // Check if passed (assuming 70% is passing)
            const attempts = quizAttempts[item.id];
            const bestScore = Math.max(...attempts.map(a => a.score || 0));
            const totalQuestions = item.questions ? item.questions.length : 1;
            const percentage = (bestScore / totalQuestions) * 100;
            if (percentage >= 70) {
              stats.quizzes.passed++;
            }
          } else {
            stats.quizzes.notAttempted++;
          }
        }
      });

      // Calculate percentages
      const moduleTotal = stats.modules.total;
      const quizTotal = stats.quizzes.total;

      stats.modules.percentages = {
        completed: moduleTotal > 0 ? Math.round((stats.modules.completed / moduleTotal) * 100) : 0,
        inProgress: moduleTotal > 0 ? Math.round((stats.modules.inProgress / moduleTotal) * 100) : 0,
        notStarted: moduleTotal > 0 ? Math.round((stats.modules.notStarted / moduleTotal) * 100) : 0
      };

      stats.quizzes.percentages = {
        attempted: quizTotal > 0 ? Math.round((stats.quizzes.attempted / quizTotal) * 100) : 0,
        passed: quizTotal > 0 ? Math.round((stats.quizzes.passed / quizTotal) * 100) : 0,
        notAttempted: quizTotal > 0 ? Math.round((stats.quizzes.notAttempted / quizTotal) * 100) : 0
      };

      return stats;

    } catch (error) {
      console.error('Error calculating progress stats:', error);
      return {
        modules: { total: 0, completed: 0, inProgress: 0, notStarted: 0, percentages: {} },
        quizzes: { total: 0, attempted: 0, passed: 0, notAttempted: 0, percentages: {} }
      };
    }
  }

  /**
   * Generate insights across categories
   * @private
   * @param {Object} categories - Category statistics
   * @returns {Object} Cross-category insights
   */
  _generateCategoryInsights(categories) {
    const insights = {
      mostPopulousCategory: null,
      mostDiverseCategory: null,
      recommendedStartingCategory: null,
      categoryBalance: 'balanced' // balanced, skewed, heavily_skewed
    };

    // Find most populous category
    let maxContent = 0;
    Object.keys(categories).forEach(categoryId => {
      const count = categories[categoryId].contentCounts.total;
      if (count > maxContent) {
        maxContent = count;
        insights.mostPopulousCategory = {
          id: categoryId,
          name: categories[categoryId].metadata.name,
          count: count
        };
      }
    });

    // Calculate category balance
    const counts = Object.values(categories).map(cat => cat.contentCounts.total);
    const total = counts.reduce((sum, count) => sum + count, 0);
    const average = total / counts.length;
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / counts.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = average > 0 ? standardDeviation / average : 0;

    if (coefficientOfVariation < 0.2) {
      insights.categoryBalance = 'balanced';
    } else if (coefficientOfVariation < 0.5) {
      insights.categoryBalance = 'skewed';
    } else {
      insights.categoryBalance = 'heavily_skewed';
    }

    // Find most diverse category (most even difficulty distribution)
    let mostDiverse = null;
    let lowestVariance = Infinity;
    
    Object.keys(categories).forEach(categoryId => {
      const category = categories[categoryId];
      if (category.difficultyDistribution) {
        const diffCounts = Object.values(category.difficultyDistribution.counts);
        const diffTotal = diffCounts.reduce((sum, count) => sum + count, 0);
        if (diffTotal > 0) {
          const diffAverage = diffTotal / diffCounts.length;
          const diffVariance = diffCounts.reduce((sum, count) => 
            sum + Math.pow(count - diffAverage, 2), 0) / diffCounts.length;
          
          if (diffVariance < lowestVariance) {
            lowestVariance = diffVariance;
            mostDiverse = {
              id: categoryId,
              name: category.metadata.name,
              variance: diffVariance
            };
          }
        }
      }
    });

    insights.mostDiverseCategory = mostDiverse;

    // Recommend starting category (most beginner content)
    let maxBeginnerPercentage = 0;
    Object.keys(categories).forEach(categoryId => {
      const category = categories[categoryId];
      if (category.difficultyDistribution) {
        const beginnerPercentage = category.difficultyDistribution.percentages.beginner || 0;
        if (beginnerPercentage > maxBeginnerPercentage) {
          maxBeginnerPercentage = beginnerPercentage;
          insights.recommendedStartingCategory = {
            id: categoryId,
            name: category.metadata.name,
            beginnerPercentage: beginnerPercentage
          };
        }
      }
    });

    return insights;
  }

  /**
   * Generate specialization-specific insights
   * @private
   * @param {Object} categories - Category statistics
   * @param {string} specializationId - Specialization ID
   * @returns {Object} Specialization insights
   */
  _generateSpecializationInsights(categories, specializationId) {
    const insights = {
      primaryCategory: null,
      secondaryCategories: [],
      contentDistribution: {},
      recommendedFocus: []
    };

    // Calculate relevance scores for each category
    const categoryScores = {};
    Object.keys(categories).forEach(categoryId => {
      const category = categories[categoryId];
      let score = 0;
      
      if (category.specializationRelevance && category.specializationRelevance[specializationId]) {
        const relevance = category.specializationRelevance[specializationId];
        score = (relevance.counts.high * 3) + (relevance.counts.medium * 2) + (relevance.counts.low * 1);
      }
      
      categoryScores[categoryId] = {
        score: score,
        name: category.metadata.name,
        totalContent: category.contentCounts.total
      };
    });

    // Sort categories by relevance score
    const sortedCategories = Object.keys(categoryScores)
      .sort((a, b) => categoryScores[b].score - categoryScores[a].score);

    if (sortedCategories.length > 0) {
      insights.primaryCategory = {
        id: sortedCategories[0],
        ...categoryScores[sortedCategories[0]]
      };

      insights.secondaryCategories = sortedCategories.slice(1).map(categoryId => ({
        id: categoryId,
        ...categoryScores[categoryId]
      }));
    }

    // Generate content distribution insights
    const totalContent = Object.values(categoryScores).reduce((sum, cat) => sum + cat.totalContent, 0);
    Object.keys(categoryScores).forEach(categoryId => {
      const category = categoryScores[categoryId];
      insights.contentDistribution[categoryId] = {
        percentage: totalContent > 0 ? Math.round((category.totalContent / totalContent) * 100) : 0,
        relevanceScore: category.score,
        name: category.name
      };
    });

    // Generate focus recommendations
    if (insights.primaryCategory && insights.primaryCategory.score > 0) {
      insights.recommendedFocus.push({
        category: insights.primaryCategory.id,
        reason: 'Highest relevance for your specialization',
        priority: 'high'
      });
    }

    insights.secondaryCategories.forEach((category, index) => {
      if (category.score > 0 && index < 2) { // Top 2 secondary categories
        insights.recommendedFocus.push({
          category: category.id,
          reason: 'Complementary content for your specialization',
          priority: index === 0 ? 'medium' : 'low'
        });
      }
    });

    return insights;
  }

  /**
   * Rank categories by relevance for specialization
   * @private
   * @param {Object} categories - Category statistics
   * @param {string} specializationId - Specialization ID
   * @returns {Array} Ranked categories
   */
  _rankCategoriesByRelevance(categories, specializationId) {
    const ranking = [];

    Object.keys(categories).forEach(categoryId => {
      const category = categories[categoryId];
      let relevanceScore = 0;
      let highRelevanceCount = 0;

      if (category.specializationRelevance && category.specializationRelevance[specializationId]) {
        const relevance = category.specializationRelevance[specializationId];
        relevanceScore = (relevance.counts.high * 3) + (relevance.counts.medium * 2) + (relevance.counts.low * 1);
        highRelevanceCount = relevance.counts.high;
      }

      ranking.push({
        categoryId: categoryId,
        categoryName: category.metadata.name,
        relevanceScore: relevanceScore,
        highRelevanceCount: highRelevanceCount,
        totalContent: category.contentCounts.total,
        relevancePercentage: category.contentCounts.total > 0 ? 
          Math.round((relevanceScore / (category.contentCounts.total * 3)) * 100) : 0
      });
    });

    // Sort by relevance score (descending)
    return ranking.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get empty categorized content structure
   * @private
   * @returns {Object} Empty categorized content structure
   */
  _getEmptyCategorizedContent() {
    return {
      'daten-prozessanalyse': {
        modules: [],
        quizzes: [],
        relevance: 'none',
        metadata: {
          id: 'daten-prozessanalyse',
          name: 'Daten und Prozessanalyse',
          description: 'Inhalte mit hoher Relevanz für die Fachrichtung Daten- und Prozessanalyse',
          color: '#3b82f6',
          icon: '📊'
        }
      },
      'anwendungsentwicklung': {
        modules: [],
        quizzes: [],
        relevance: 'none',
        metadata: {
          id: 'anwendungsentwicklung',
          name: 'Anwendungsentwicklung',
          description: 'Inhalte mit hoher Relevanz für die Fachrichtung Anwendungsentwicklung',
          color: '#10b981',
          icon: '💻'
        }
      },
      'allgemein': {
        modules: [],
        quizzes: [],
        relevance: 'none',
        metadata: {
          id: 'allgemein',
          name: 'Allgemein',
          description: 'Fachrichtungsübergreifende Inhalte und Grundlagen für beide Spezialisierungen',
          color: '#6b7280',
          icon: '📚'
        }
      }
    };
  }

  /**
   * Clear categorized content cache
   * Used when category mappings change or content is updated
   */
  clearCategorizedContentCache() {
    this.categorizedContentCache.clear();
    this.categoryIndexCache.clear();
  }

  /**
   * Build category-based indexes for efficient content retrieval
   * @private
   */
  _buildCategoryIndexes() {
    if (this.categoryIndexCache.size > 0) {
      return; // Already built
    }

    try {
      // Initialize indexes for each three-tier category
      const categoryIndexes = {
        'daten-prozessanalyse': { modules: new Set(), quizzes: new Set() },
        'anwendungsentwicklung': { modules: new Set(), quizzes: new Set() },
        'allgemein': { modules: new Set(), quizzes: new Set() }
      };

      // Index modules by three-tier category
      this.modules.forEach((module, moduleId) => {
        const threeTierCategory = module.threeTierCategory || 'allgemein';
        if (categoryIndexes[threeTierCategory]) {
          categoryIndexes[threeTierCategory].modules.add(moduleId);
        }
      });

      // Index quizzes by three-tier category
      this.quizzes.forEach((quiz, quizId) => {
        const threeTierCategory = quiz.threeTierCategory || 'allgemein';
        if (categoryIndexes[threeTierCategory]) {
          categoryIndexes[threeTierCategory].quizzes.add(quizId);
        }
      });

      // Store indexes in cache
      Object.keys(categoryIndexes).forEach(categoryId => {
        this.categoryIndexCache.set(`modules-${categoryId}`, categoryIndexes[categoryId].modules);
        this.categoryIndexCache.set(`quizzes-${categoryId}`, categoryIndexes[categoryId].quizzes);
      });

      // Store combined content indexes
      Object.keys(categoryIndexes).forEach(categoryId => {
        const combinedIds = new Set([
          ...categoryIndexes[categoryId].modules,
          ...categoryIndexes[categoryId].quizzes
        ]);
        this.categoryIndexCache.set(`content-${categoryId}`, combinedIds);
      });

    } catch (error) {
      console.error('Error building category indexes:', error);
    }
  }

  /**
   * Get content IDs for a specific three-tier category using cached indexes
   * @private
   * @param {string} categoryId - Three-tier category ID
   * @param {string} contentType - 'modules', 'quizzes', or 'content' (both)
   * @returns {Set} Set of content IDs
   */
  _getCategoryContentIds(categoryId, contentType = 'content') {
    this._buildCategoryIndexes();
    
    const cacheKey = `${contentType}-${categoryId}`;
    return this.categoryIndexCache.get(cacheKey) || new Set();
  }

  /**
   * Invalidate cache for specific category
   * @param {string} categoryId - Three-tier category ID to invalidate
   */
  invalidateCategoryCache(categoryId) {
    if (categoryId) {
      // Remove specific category caches
      this.categorizedContentCache.delete(`three-tier-${categoryId}`);
      this.categoryIndexCache.delete(`modules-${categoryId}`);
      this.categoryIndexCache.delete(`quizzes-${categoryId}`);
      this.categoryIndexCache.delete(`content-${categoryId}`);
    } else {
      // Clear all caches
      this.clearCategorizedContentCache();
    }
  }

  /**
   * Preload and cache content for all three-tier categories
   * Optimizes performance for category-based operations
   */
  async preloadCategorizedContent() {
    try {
      // Ensure all content is loaded
      await this._loadAllModules();
      await this._loadAllQuizzes();

      // Build category indexes
      this._buildCategoryIndexes();

      // Preload content for each category
      const categories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
      
      for (const categoryId of categories) {
        // This will populate the cache
        await this.getContentByThreeTierCategory(categoryId);
      }

      console.log('Categorized content preloaded successfully');
    } catch (error) {
      console.error('Error preloading categorized content:', error);
    }
  }

  /**
   * Get cache statistics for monitoring and debugging
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      modules: {
        total: this.modules.size,
        cached: this.modules.size
      },
      quizzes: {
        total: this.quizzes.size,
        cached: this.quizzes.size
      },
      categorizedContent: {
        cacheSize: this.categorizedContentCache.size,
        cachedCategories: Array.from(this.categorizedContentCache.keys())
      },
      categoryIndexes: {
        indexCount: this.categoryIndexCache.size,
        indexes: Array.from(this.categoryIndexCache.keys())
      },
      memoryUsage: {
        // Rough estimation of memory usage
        modulesMemory: this._estimateMapMemoryUsage(this.modules),
        quizzesMemory: this._estimateMapMemoryUsage(this.quizzes),
        categorizedCacheMemory: this._estimateMapMemoryUsage(this.categorizedContentCache),
        indexCacheMemory: this._estimateMapMemoryUsage(this.categoryIndexCache)
      }
    };
  }

  /**
   * Estimate memory usage of a Map
   * @private
   * @param {Map} map - Map to estimate
   * @returns {string} Memory usage estimate
   */
  _estimateMapMemoryUsage(map) {
    try {
      const jsonString = JSON.stringify(Array.from(map.entries()));
      const bytes = new Blob([jsonString]).size;
      
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Optimize cache by removing unused entries and rebuilding indexes
   */
  optimizeCache() {
    try {
      // Clear and rebuild category indexes
      this.categoryIndexCache.clear();
      this._buildCategoryIndexes();

      // Remove stale categorized content cache entries
      const validCacheKeys = [
        'three-tier-daten-prozessanalyse',
        'three-tier-anwendungsentwicklung', 
        'three-tier-allgemein'
      ];

      const currentKeys = Array.from(this.categorizedContentCache.keys());
      currentKeys.forEach(key => {
        if (!validCacheKeys.includes(key)) {
          this.categorizedContentCache.delete(key);
        }
      });

      console.log('Cache optimization completed');
    } catch (error) {
      console.error('Error optimizing cache:', error);
    }
  }

  // ========================================
  // THREE-TIER CATEGORY API METHODS
  // ========================================
  // These methods provide the new three-tier category functionality
  // while maintaining backward compatibility with existing interfaces

  /**
   * Get all available three-tier categories with metadata
   * @returns {Promise<Array>} Array of three-tier category objects
   */
  async getThreeTierCategories() {
    try {
      if (!this.categoryMappingService) {
        console.warn('CategoryMappingService not available, returning default categories');
        return this._getDefaultThreeTierCategories();
      }

      return this.categoryMappingService.getThreeTierCategories();
    } catch (error) {
      console.error('Error getting three-tier categories:', error);
      return this._getDefaultThreeTierCategories();
    }
  }

  /**
   * Get modules filtered by three-tier category
   * @param {string} categoryId - Three-tier category ID
   * @returns {Promise<Array>} Array of modules in the specified category
   */
  async getModulesByThreeTierCategory(categoryId) {
    try {
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Invalid three-tier category ID');
      }

      const validCategories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
      if (!validCategories.includes(categoryId)) {
        throw new Error(`Invalid three-tier category: ${categoryId}. Must be one of: ${validCategories.join(', ')}`);
      }

      // Get all content in category and filter for modules only
      const categoryContent = await this.getContentByThreeTierCategory(categoryId);
      const modules = categoryContent.filter(item => 
        item.contentType === 'module' || 
        (item.content || item.sections) // Modules have content/sections, quizzes have questions
      );

      return modules;
    } catch (error) {
      console.error(`Error getting modules by three-tier category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Get quizzes filtered by three-tier category
   * @param {string} categoryId - Three-tier category ID
   * @returns {Promise<Array>} Array of quizzes in the specified category
   */
  async getQuizzesByThreeTierCategory(categoryId) {
    try {
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Invalid three-tier category ID');
      }

      const validCategories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
      if (!validCategories.includes(categoryId)) {
        throw new Error(`Invalid three-tier category: ${categoryId}. Must be one of: ${validCategories.join(', ')}`);
      }

      // Get all content in category and filter for quizzes only
      const categoryContent = await this.getContentByThreeTierCategory(categoryId);
      const quizzes = categoryContent.filter(item => 
        item.contentType === 'quiz' || 
        item.questions // Quizzes have questions array
      );

      return quizzes;
    } catch (error) {
      console.error(`Error getting quizzes by three-tier category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Get content statistics for three-tier categories
   * @param {Object} options - Options for statistics calculation
   * @returns {Promise<Object>} Comprehensive statistics for three-tier categories
   */
  async getThreeTierCategoryStatistics(options = {}) {
    try {
      // Delegate to existing comprehensive method
      return await this.getThreeTierCategoryStats(options);
    } catch (error) {
      console.error('Error getting three-tier category statistics:', error);
      throw error;
    }
  }

  /**
   * Get category metadata for a specific three-tier category
   * @param {string} categoryId - Three-tier category ID
   * @returns {Promise<Object>} Category metadata object
   */
  async getThreeTierCategoryMetadata(categoryId) {
    try {
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Invalid three-tier category ID');
      }

      const validCategories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
      if (!validCategories.includes(categoryId)) {
        throw new Error(`Invalid three-tier category: ${categoryId}`);
      }

      if (!this.categoryMappingService) {
        console.warn('CategoryMappingService not available, returning default metadata');
        return this._getDefaultCategoryMetadata(categoryId);
      }

      const categories = this.categoryMappingService.getThreeTierCategories();
      const category = categories.find(cat => cat.id === categoryId);
      
      if (!category) {
        throw new Error(`Category metadata not found for: ${categoryId}`);
      }

      // Enhance with content statistics
      const contentStats = await this.getThreeTierCategoryStats({
        includeSpecializationRelevance: true,
        includeDifficultyDistribution: true,
        includeContentTypes: true
      });

      return {
        ...category,
        statistics: contentStats.categories[categoryId] || null,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting three-tier category metadata for ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Search content within three-tier categories with advanced filtering
   * @param {string} query - Search query
   * @param {Object} options - Search options including category filters
   * @returns {Promise<Object>} Search results organized by three-tier categories
   */
  async searchThreeTierCategories(query, options = {}) {
    try {
      const {
        categories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'],
        ...searchOptions
      } = options;

      // Validate categories
      const validCategories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
      const filteredCategories = categories.filter(cat => validCategories.includes(cat));

      if (filteredCategories.length === 0) {
        throw new Error('No valid three-tier categories specified for search');
      }

      // Use existing enhanced search with category filtering
      return await this.searchWithCategoryFiltering(query, {
        categories: filteredCategories,
        ...searchOptions
      });
    } catch (error) {
      console.error('Error searching three-tier categories:', error);
      throw error;
    }
  }

  /**
   * Get related content across three-tier categories
   * @param {string} contentId - ID of the content item to find relations for
   * @param {Object} options - Options for relationship discovery
   * @returns {Promise<Object>} Related content organized by categories
   */
  async getRelatedContentAcrossCategories(contentId, options = {}) {
    try {
      if (!contentId || typeof contentId !== 'string') {
        throw new Error('Invalid content ID');
      }

      const {
        maxRelatedPerCategory = 3,
        includeAllCategories = true,
        relationshipTypes = ['prerequisite', 'related', 'advanced']
      } = options;

      // Get the source content item
      const sourceModule = this.modules.get(contentId);
      const sourceQuiz = this.quizzes.get(contentId);
      const sourceContent = sourceModule || sourceQuiz;

      if (!sourceContent) {
        throw new Error(`Content not found: ${contentId}`);
      }

      // Use ContentRelationshipService if available
      if (this.contentRelationshipService) {
        return await this.contentRelationshipService.getRelatedContentAcrossCategories(
          contentId, 
          options
        );
      }

      // Fallback implementation
      console.warn('ContentRelationshipService not available, using basic relationship detection');
      
      const result = {
        sourceContent: sourceContent,
        relatedContent: {
          'daten-prozessanalyse': [],
          'anwendungsentwicklung': [],
          'allgemein': []
        },
        relationshipSummary: {
          totalRelated: 0,
          byType: {},
          byCategory: {}
        }
      };

      // Basic relationship detection based on tags and categories
      const allContent = [
        ...Array.from(this.modules.values()),
        ...Array.from(this.quizzes.values())
      ];

      const sourceTags = sourceContent.tags || [];
      const sourceCategory = sourceContent.threeTierCategory || 'allgemein';

      allContent.forEach(item => {
        if (item.id === contentId) return; // Skip self

        const itemCategory = item.threeTierCategory || 'allgemein';
        const itemTags = item.tags || [];
        
        // Calculate relationship score based on tag overlap
        const commonTags = sourceTags.filter(tag => itemTags.includes(tag));
        const relationshipScore = commonTags.length;

        if (relationshipScore > 0 && result.relatedContent[itemCategory].length < maxRelatedPerCategory) {
          result.relatedContent[itemCategory].push({
            ...item,
            relationshipScore: relationshipScore,
            relationshipType: 'related',
            commonTags: commonTags
          });
        }
      });

      // Sort by relationship score
      Object.keys(result.relatedContent).forEach(categoryId => {
        result.relatedContent[categoryId].sort((a, b) => b.relationshipScore - a.relationshipScore);
      });

      // Calculate summary statistics
      Object.keys(result.relatedContent).forEach(categoryId => {
        const categoryRelated = result.relatedContent[categoryId];
        result.relationshipSummary.totalRelated += categoryRelated.length;
        result.relationshipSummary.byCategory[categoryId] = categoryRelated.length;
      });

      return result;
    } catch (error) {
      console.error(`Error getting related content for ${contentId}:`, error);
      throw error;
    }
  }

  // ========================================
  // BACKWARD COMPATIBILITY METHODS
  // ========================================
  // These methods maintain compatibility with existing code while
  // providing deprecation warnings for methods that will be replaced

  /**
   * @deprecated Use getModulesByThreeTierCategory() instead
   * Get modules by legacy category - maintained for backward compatibility
   */
  async getModulesByLegacyCategory(categoryId) {
    console.warn('getModulesByLegacyCategory() is deprecated. Use getModulesByThreeTierCategory() instead.');
    
    try {
      // Map legacy category to three-tier category if possible
      if (this.categoryMappingService) {
        const mappingResult = this.categoryMappingService.mapLegacyCategoryToThreeTier(categoryId);
        if (mappingResult) {
          return await this.getModulesByThreeTierCategory(mappingResult.threeTierCategory);
        }
      }

      // Fallback to existing method
      return await this.getModulesByCategory(categoryId);
    } catch (error) {
      console.error(`Error in legacy category method for ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * @deprecated Use searchThreeTierCategories() instead
   * Legacy search method - maintained for backward compatibility
   */
  async searchContentLegacy(query, filters = {}) {
    console.warn('searchContentLegacy() is deprecated. Use searchThreeTierCategories() instead.');
    
    try {
      // Convert legacy filters to new format if possible
      const newOptions = {};
      
      if (filters.category) {
        // Try to map legacy category to three-tier
        if (this.categoryMappingService) {
          const mappingResult = this.categoryMappingService.mapLegacyCategoryToThreeTier(filters.category);
          if (mappingResult) {
            newOptions.categories = [mappingResult.threeTierCategory];
          }
        }
      }

      // Use new search method if mapping successful, otherwise fallback
      if (newOptions.categories) {
        return await this.searchThreeTierCategories(query, newOptions);
      } else {
        return await this.searchContent(query, filters);
      }
    } catch (error) {
      console.error('Error in legacy search method:', error);
      throw error;
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS FOR THREE-TIER CATEGORIES
  // ========================================

  /**
   * Get default three-tier categories when CategoryMappingService is not available
   * @private
   * @returns {Array} Default three-tier categories
   */
  _getDefaultThreeTierCategories() {
    return [
      {
        id: 'daten-prozessanalyse',
        name: 'Daten und Prozessanalyse',
        description: 'Inhalte mit hoher Relevanz für die DPA-Spezialisierung',
        color: '#2563eb',
        icon: 'database'
      },
      {
        id: 'anwendungsentwicklung',
        name: 'Anwendungsentwicklung',
        description: 'Inhalte mit hoher Relevanz für die AE-Spezialisierung',
        color: '#dc2626',
        icon: 'code'
      },
      {
        id: 'allgemein',
        name: 'Allgemein',
        description: 'Allgemeine IT-Inhalte für beide Spezialisierungen',
        color: '#059669',
        icon: 'book'
      }
    ];
  }

  /**
   * Get default category metadata when CategoryMappingService is not available
   * @private
   * @param {string} categoryId - Category ID
   * @returns {Object} Default category metadata
   */
  _getDefaultCategoryMetadata(categoryId) {
    const defaultCategories = this._getDefaultThreeTierCategories();
    const category = defaultCategories.find(cat => cat.id === categoryId);
    
    return category || {
      id: categoryId,
      name: categoryId,
      description: 'Category metadata not available',
      color: '#6b7280',
      icon: 'folder'
    };
  }

  /**
   * Get content by three-tier category with performance optimization
   * @param {string} categoryId - Three-tier category ID
   * @param {Object} options - Filtering and pagination options
   * @returns {Promise<Array>} Filtered content items
   */
  async getContentByThreeTierCategoryOptimized(categoryId, options = {}) {
    const startTime = performance.now();
    
    try {
      // Use performance optimization service if available
      if (this.performanceOptimizationService) {
        const result = await this.performanceOptimizationService.getContentByThreeTierCategory(categoryId, options);
        
        // Record performance metrics
        if (this.performanceMonitoringService) {
          this.performanceMonitoringService.recordMetric('categoryFilter', {
            duration: performance.now() - startTime,
            parameters: { categoryId, ...options },
            resultCount: result.length,
            cacheHit: true // Optimization service uses caching
          });
        }
        
        return result;
      }
      
      // Fallback to original implementation
      return this.getContentByThreeTierCategory(categoryId, options);
      
    } catch (error) {
      // Record error metrics
      if (this.performanceMonitoringService) {
        this.performanceMonitoringService.recordMetric('categoryFilter', {
          duration: performance.now() - startTime,
          parameters: { categoryId, ...options },
          resultCount: 0,
          error: true,
          errorMessage: error.message
        });
      }
      
      console.error('Error in optimized category filtering:', error);
      throw error;
    }
  }

  /**
   * Search within specific three-tier category with performance optimization
   * @param {string} query - Search query
   * @param {string} categoryId - Three-tier category ID
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchInCategoryOptimized(query, categoryId, options = {}) {
    const startTime = performance.now();
    
    try {
      // Use performance optimization service if available
      if (this.performanceOptimizationService) {
        const result = await this.performanceOptimizationService.searchInCategory(query, categoryId, options);
        
        // Record performance metrics
        if (this.performanceMonitoringService) {
          this.performanceMonitoringService.recordMetric('categorySearch', {
            duration: performance.now() - startTime,
            parameters: { query: query?.substring(0, 50), categoryId, ...options },
            resultCount: result.length,
            cacheHit: true // Optimization service uses caching
          });
        }
        
        return result;
      }
      
      // Fallback to original implementation
      return this.searchInCategory(query, categoryId, options);
      
    } catch (error) {
      // Record error metrics
      if (this.performanceMonitoringService) {
        this.performanceMonitoringService.recordMetric('categorySearch', {
          duration: performance.now() - startTime,
          parameters: { query: query?.substring(0, 50), categoryId, ...options },
          resultCount: 0,
          error: true,
          errorMessage: error.message
        });
      }
      
      console.error('Error in optimized category search:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics for category operations
   * @returns {Object} Performance metrics and dashboard data
   */
  getPerformanceMetrics() {
    if (this.performanceMonitoringService) {
      return this.performanceMonitoringService.getDashboardData();
    }
    
    return {
      message: 'Performance monitoring not available',
      optimizationService: !!this.performanceOptimizationService,
      monitoringService: !!this.performanceMonitoringService
    };
  }

  /**
   * Get detailed performance report
   * @param {Object} options - Report options
   * @returns {Object} Detailed performance report
   */
  getPerformanceReport(options = {}) {
    if (this.performanceMonitoringService) {
      return this.performanceMonitoringService.getPerformanceReport(options);
    }
    
    return {
      message: 'Performance monitoring not available',
      generatedAt: Date.now(),
      options
    };
  }

  /**
   * Invalidate performance caches and rebuild indexes
   */
  async invalidatePerformanceCache() {
    if (this.performanceOptimizationService) {
      await this.performanceOptimizationService.invalidateCache();
    }
    
    // Also clear local caches
    this.clearCategorizedContentCache();
  }

  /**
   * Configure performance optimization settings
   * @param {Object} config - Configuration options
   */
  configurePerformanceOptimization(config) {
    if (this.performanceOptimizationService) {
      this.performanceOptimizationService.configure(config);
    }
    
    if (this.performanceMonitoringService && config.monitoring) {
      this.performanceMonitoringService.configureMonitoring(config.monitoring);
    }
    
    if (config.thresholds && this.performanceMonitoringService) {
      this.performanceMonitoringService.updateThresholds(config.thresholds);
    }
  }
}

export default IHKContentService;
