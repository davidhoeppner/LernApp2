import categoriesData from '../data/ihk/metadata/categories.json' with { type: 'json' };

/**
 * SpecializationService - Manages user specialization preferences and content filtering
 * Handles specialization selection, content categorization, and filtering logic
 */
class SpecializationService {
  constructor(stateManager, storageService, categoryMappingService = null) {
    this.stateManager = stateManager;
    this.storage = storageService;
    this.categoryMappingService = categoryMappingService;
    this.categoriesData = categoriesData;
    
    // Initialize specialization state if not exists
    this._initializeSpecializationState();
  }

  /**
   * Initialize specialization state in StateManager
   * @private
   */
  _initializeSpecializationState() {
    const currentState = this.stateManager.getState();
    
    if (!currentState.specialization) {
      this.stateManager.setState('specialization', {
        current: null,
        hasSelected: false,
        preferences: {
          showAllContent: false,
          preferredCategories: []
        }
      });
    }
  }

  /**
   * Get all available specializations from categories data
   * @returns {Array} Array of specialization objects
   */
  getAvailableSpecializations() {
    const supportedSpecializations = this.categoriesData.supportedSpecializations || [];
    
    return supportedSpecializations.map(specializationId => {
      // Find specialization config from categories
      const config = this._getSpecializationConfigFromCategories(specializationId);
      
      return {
        id: specializationId,
        name: config.name,
        shortName: config.shortName,
        description: config.description,
        color: config.color,
        icon: config.icon,
        examCode: config.examCode
      };
    });
  }

  /**
   * Get specialization configuration from categories data
   * @private
   * @param {string} specializationId - The specialization ID
   * @returns {Object} Specialization configuration
   */
  _getSpecializationConfigFromCategories(specializationId) {
    // Default configurations based on the design document
    const defaultConfigs = {
      'anwendungsentwicklung': {
        name: 'Anwendungsentwicklung',
        shortName: 'AE',
        description: 'Fachinformatiker für Anwendungsentwicklung',
        color: '#10b981',
        icon: '💻',
        examCode: 'AP2-AE'
      },
      'daten-prozessanalyse': {
        name: 'Daten- und Prozessanalyse',
        shortName: 'DPA',
        description: 'Fachinformatiker für Daten- und Prozessanalyse',
        color: '#3b82f6',
        icon: '📊',
        examCode: 'AP2-DPA'
      }
    };

    return defaultConfigs[specializationId] || {
      name: specializationId,
      shortName: specializationId.toUpperCase(),
      description: `Fachinformatiker für ${specializationId}`,
      color: '#6b7280',
      icon: '⚙️',
      examCode: 'AP2'
    };
  }

  /**
   * Get current user's specialization
   * @returns {string|null} Current specialization ID or null if not set
   */
  getCurrentSpecialization() {
    const specializationState = this.stateManager.getState('specialization');
    return specializationState?.current || null;
  }

  /**
   * Check if user has selected a specialization
   * @returns {boolean} True if user has made a specialization selection
   */
  hasSelectedSpecialization() {
    const specializationState = this.stateManager.getState('specialization');
    return specializationState?.hasSelected || false;
  }

  /**
   * Set user's specialization preference
   * @param {string} specializationId - The specialization ID to set
   * @param {Object} options - Additional options
   * @param {boolean} options.preserveProgress - Whether to preserve progress (default: true)
   * @returns {boolean} True if successful
   */
  setSpecialization(specializationId, options = {}) {
    try {
      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      const { preserveProgress = true } = options;

      // Validate that the specialization is supported
      const availableSpecializations = this.getAvailableSpecializations();
      const isValid = availableSpecializations.some(spec => spec.id === specializationId);
      
      if (!isValid) {
        throw new Error(`Unsupported specialization: ${specializationId}`);
      }

      const previousSpecialization = this.getCurrentSpecialization();

      // Preserve progress across specialization changes
      if (preserveProgress && previousSpecialization && previousSpecialization !== specializationId) {
        this._preserveProgressAcrossSpecializations(previousSpecialization, specializationId);
      }

      // Update state
      this.stateManager.setState('specialization.current', specializationId);
      this.stateManager.setState('specialization.hasSelected', true);

      // Update last activity
      this.stateManager.setState('progress.lastActivity', new Date().toISOString());

      // Log specialization change for analytics
      this._logSpecializationChange(previousSpecialization, specializationId);

      return true;
    } catch (error) {
      console.error('Error setting specialization:', error);
      return false;
    }
  }

  /**
   * Preserve progress when switching between specializations
   * @private
   * @param {string} fromSpecialization - Previous specialization
   * @param {string} toSpecialization - New specialization
   */
  _preserveProgressAcrossSpecializations(fromSpecialization, toSpecialization) {
    try {
      const currentProgress = this.stateManager.getState('progress') || {};
      
      // Create specialization-specific progress tracking if it doesn't exist
      if (!currentProgress.specializationProgress) {
        currentProgress.specializationProgress = {};
      }

      // Create three-tier category progress tracking if it doesn't exist
      if (!currentProgress.threeTierCategoryProgress) {
        currentProgress.threeTierCategoryProgress = {};
      }

      // Save current progress under the previous specialization
      if (fromSpecialization) {
        const progressSnapshot = {
          modulesCompleted: [...(currentProgress.modulesCompleted || [])],
          modulesInProgress: [...(currentProgress.modulesInProgress || [])],
          quizAttempts: [...(currentProgress.quizAttempts || [])],
          lastActivity: currentProgress.lastActivity,
          savedAt: new Date().toISOString(),
          // Add three-tier category breakdown
          threeTierBreakdown: this._categorizeProgressByThreeTier(currentProgress)
        };

        currentProgress.specializationProgress[fromSpecialization] = progressSnapshot;
      }

      // Restore progress for the new specialization if it exists
      if (currentProgress.specializationProgress[toSpecialization]) {
        const savedProgress = currentProgress.specializationProgress[toSpecialization];
        
        // Merge saved progress with current general progress
        const generalModules = this._getGeneralModules(currentProgress.modulesCompleted || []);
        const generalInProgress = this._getGeneralModules(currentProgress.modulesInProgress || []);
        const generalQuizzes = this._getGeneralQuizAttempts(currentProgress.quizAttempts || []);

        currentProgress.modulesCompleted = [
          ...generalModules,
          ...savedProgress.modulesCompleted.filter(id => !generalModules.includes(id))
        ];
        
        currentProgress.modulesInProgress = [
          ...generalInProgress,
          ...savedProgress.modulesInProgress.filter(id => !generalInProgress.includes(id))
        ];
        
        currentProgress.quizAttempts = [
          ...generalQuizzes,
          ...savedProgress.quizAttempts.filter(attempt => 
            !generalQuizzes.some(general => general.quizId === attempt.quizId)
          )
        ];

        // Restore three-tier category progress if available
        if (savedProgress.threeTierBreakdown) {
          this._restoreThreeTierProgress(currentProgress, savedProgress.threeTierBreakdown);
        }
      }

      // Update the progress state
      this.stateManager.setState('progress', currentProgress);

    } catch (error) {
      console.error('Error preserving progress across specializations:', error);
    }
  }

  /**
   * Categorize progress by three-tier categories
   * @private
   * @param {Object} progressData - Progress data to categorize
   * @returns {Object} Progress categorized by three-tier system
   */
  _categorizeProgressByThreeTier(progressData) {
    const breakdown = {
      'daten-prozessanalyse': { modules: [], quizzes: [] },
      'anwendungsentwicklung': { modules: [], quizzes: [] },
      'allgemein': { modules: [], quizzes: [] }
    };

    // Categorize completed modules
    (progressData.modulesCompleted || []).forEach(moduleId => {
      const category = this._inferThreeTierCategoryFromId(moduleId);
      breakdown[category].modules.push(moduleId);
    });

    // Categorize in-progress modules
    (progressData.modulesInProgress || []).forEach(moduleId => {
      const category = this._inferThreeTierCategoryFromId(moduleId);
      if (!breakdown[category].modules.includes(moduleId)) {
        breakdown[category].modules.push(moduleId);
      }
    });

    // Categorize quiz attempts
    (progressData.quizAttempts || []).forEach(attempt => {
      const category = this._inferThreeTierCategoryFromId(attempt.quizId);
      breakdown[category].quizzes.push(attempt);
    });

    return breakdown;
  }

  /**
   * Infer three-tier category from content ID
   * @private
   * @param {string} contentId - Content ID to categorize
   * @returns {string} Three-tier category
   */
  _inferThreeTierCategoryFromId(contentId) {
    if (!contentId) return 'allgemein';

    const idLower = contentId.toLowerCase();
    
    if (idLower.includes('bp-dpa-') || idLower.includes('dpa-')) {
      return 'daten-prozessanalyse';
    }
    
    if (idLower.includes('bp-ae-') || idLower.includes('ae-')) {
      return 'anwendungsentwicklung';
    }
    
    return 'allgemein';
  }

  /**
   * Restore three-tier category progress
   * @private
   * @param {Object} currentProgress - Current progress object to update
   * @param {Object} threeTierBreakdown - Three-tier progress breakdown to restore
   */
  _restoreThreeTierProgress(currentProgress, threeTierBreakdown) {
    if (!currentProgress.threeTierCategoryProgress) {
      currentProgress.threeTierCategoryProgress = {};
    }

    // Store the breakdown for future reference
    Object.keys(threeTierBreakdown).forEach(category => {
      currentProgress.threeTierCategoryProgress[category] = {
        ...threeTierBreakdown[category],
        lastUpdated: new Date().toISOString()
      };
    });
  }

  /**
   * Get general modules from a list of module IDs
   * @private
   * @param {Array} moduleIds - Array of module IDs
   * @returns {Array} Array of general module IDs
   */
  _getGeneralModules(moduleIds) {
    return moduleIds.filter(moduleId => {
      // General modules typically don't have specialization prefixes
      // or are marked as general in categories
      return !moduleId.includes('bp-ae-') && !moduleId.includes('bp-dpa-') || 
             moduleId.includes('fue-') || moduleId.includes('general-');
    });
  }

  /**
   * Get general quiz attempts from a list of quiz attempts
   * @private
   * @param {Array} quizAttempts - Array of quiz attempts
   * @returns {Array} Array of general quiz attempts
   */
  _getGeneralQuizAttempts(quizAttempts) {
    return quizAttempts.filter(attempt => {
      // General quizzes typically don't have specialization prefixes
      return !attempt.quizId.includes('bp-ae-') && !attempt.quizId.includes('bp-dpa-') ||
             attempt.quizId.includes('fue-') || attempt.quizId.includes('general-');
    });
  }

  /**
   * Log specialization change for analytics
   * @private
   * @param {string} fromSpecialization - Previous specialization
   * @param {string} toSpecialization - New specialization
   */
  _logSpecializationChange(fromSpecialization, toSpecialization) {
    try {
      const changeLog = {
        timestamp: new Date().toISOString(),
        from: fromSpecialization,
        to: toSpecialization,
        userAgent: navigator.userAgent,
        sessionId: this._getSessionId()
      };

      // Store in analytics log (could be sent to analytics service)
      const currentLogs = this.stateManager.getState('analytics.specializationChanges') || [];
      currentLogs.push(changeLog);
      
      // Keep only last 10 changes to avoid storage bloat
      if (currentLogs.length > 10) {
        currentLogs.splice(0, currentLogs.length - 10);
      }
      
      this.stateManager.setState('analytics.specializationChanges', currentLogs);
      
    } catch (error) {
      console.error('Error logging specialization change:', error);
    }
  }

  /**
   * Get or create session ID for analytics
   * @private
   * @returns {string} Session ID
   */
  _getSessionId() {
    let sessionId = this.stateManager.getState('session.id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
      this.stateManager.setState('session.id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get specialization configuration by ID
   * @param {string} specializationId - The specialization ID
   * @returns {Object|null} Specialization configuration or null if not found
   */
  getSpecializationConfig(specializationId) {
    const availableSpecializations = this.getAvailableSpecializations();
    return availableSpecializations.find(spec => spec.id === specializationId) || null;
  }

  /**
   * Get category relevance for a specific specialization
   * @param {string} categoryId - The category ID
   * @param {string} specializationId - The specialization ID
   * @param {Object} options - Options for relevance calculation
   * @param {boolean} options.useThreeTierCategories - Whether to use three-tier category system
   * @returns {string} Relevance level: 'high', 'medium', 'low', 'none'
   */
  getCategoryRelevance(categoryId, specializationId, options = {}) {
    if (!categoryId || !specializationId) {
      return 'none';
    }

    const { useThreeTierCategories = false } = options;

    // Use three-tier category relevance if requested and available
    if (useThreeTierCategories || this._isThreeTierCategory(categoryId)) {
      return this._getThreeTierCategoryRelevance(categoryId, specializationId);
    }

    // Use CategoryMappingService if available for enhanced relevance calculation
    if (this.categoryMappingService) {
      const threeTierRelevance = this.categoryMappingService.getCategoryRelevance(categoryId, specializationId);
      if (threeTierRelevance !== 'none') {
        return threeTierRelevance;
      }
    }

    // Fallback to original category system
    const category = this._findCategoryById(categoryId);
    
    if (!category || !category.relevance) {
      // Try to infer relevance from category naming patterns
      return this._inferRelevanceFromCategoryName(categoryId, specializationId);
    }

    return category.relevance[specializationId] || 'none';
  }

  /**
   * Check if a category ID belongs to the three-tier system
   * @private
   * @param {string} categoryId - Category ID to check
   * @returns {boolean} True if it's a three-tier category
   */
  _isThreeTierCategory(categoryId) {
    const threeTierCategories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
    return threeTierCategories.includes(categoryId);
  }

  /**
   * Infer relevance from category naming patterns
   * @private
   * @param {string} categoryId - Category ID
   * @param {string} specializationId - Specialization ID
   * @returns {string} Inferred relevance level
   */
  _inferRelevanceFromCategoryName(categoryId, specializationId) {
    const categoryLower = categoryId.toLowerCase();

    // High relevance patterns
    if (specializationId === 'daten-prozessanalyse') {
      if (categoryLower.includes('dpa') || categoryLower.includes('data') || 
          categoryLower.includes('process') || categoryLower.includes('bi') ||
          categoryLower.includes('etl') || categoryLower.includes('warehouse')) {
        return 'high';
      }
    }

    if (specializationId === 'anwendungsentwicklung') {
      if (categoryLower.includes('ae') || categoryLower.includes('app') || 
          categoryLower.includes('dev') || categoryLower.includes('programming') ||
          categoryLower.includes('software') || categoryLower.includes('code')) {
        return 'high';
      }
    }

    // Medium relevance for general IT topics
    if (categoryLower.includes('fue') || categoryLower.includes('general') ||
        categoryLower.includes('grundlagen') || categoryLower.includes('basic')) {
      return 'medium';
    }

    // Low relevance for cross-cutting concerns
    if (categoryLower.includes('security') || categoryLower.includes('network') ||
        categoryLower.includes('system') || categoryLower.includes('project')) {
      return 'low';
    }

    return 'none';
  }

  /**
   * Get enhanced category relevance with detailed scoring
   * @param {string} categoryId - The category ID
   * @param {string} specializationId - The specialization ID
   * @param {Object} options - Options for enhanced calculation
   * @param {boolean} options.includeScore - Whether to include numerical score
   * @param {boolean} options.includeReason - Whether to include reasoning
   * @returns {Object|string} Enhanced relevance result or simple string
   */
  getEnhancedCategoryRelevance(categoryId, specializationId, options = {}) {
    const { includeScore = false, includeReason = false } = options;

    if (!includeScore && !includeReason) {
      return this.getCategoryRelevance(categoryId, specializationId);
    }

    const relevance = this.getCategoryRelevance(categoryId, specializationId);
    const result = { relevance };

    if (includeScore) {
      const scoreMap = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
      result.score = scoreMap[relevance] || 0;
    }

    if (includeReason) {
      result.reason = this._getRelevanceReason(categoryId, specializationId, relevance);
    }

    return result;
  }

  /**
   * Get reason for relevance assignment
   * @private
   * @param {string} categoryId - Category ID
   * @param {string} specializationId - Specialization ID
   * @param {string} relevance - Assigned relevance level
   * @returns {string} Reason for relevance assignment
   */
  _getRelevanceReason(categoryId, specializationId, relevance) {
    if (this._isThreeTierCategory(categoryId)) {
      if (categoryId === specializationId) {
        return 'Direct specialization match in three-tier system';
      }
      if (categoryId === 'allgemein') {
        return 'General content relevant to all specializations';
      }
      return 'Cross-specialization content in three-tier system';
    }

    if (this.categoryMappingService) {
      return 'Calculated using category mapping service';
    }

    const category = this._findCategoryById(categoryId);
    if (category && category.relevance && category.relevance[specializationId]) {
      return 'Defined in category metadata';
    }

    return 'Inferred from category naming patterns';
  }

  /**
   * Calculate category-to-specialization relevance mapping for multiple categories
   * @param {Array} categoryIds - Array of category IDs
   * @param {Array} specializationIds - Array of specialization IDs
   * @param {Object} options - Calculation options
   * @param {boolean} options.useThreeTierCategories - Whether to use three-tier system
   * @param {boolean} options.includeScores - Whether to include numerical scores
   * @returns {Object} Relevance mapping matrix
   */
  calculateRelevanceMapping(categoryIds, specializationIds, options = {}) {
    const { useThreeTierCategories = false, includeScores = false } = options;
    const mapping = {};

    categoryIds.forEach(categoryId => {
      mapping[categoryId] = {};
      
      specializationIds.forEach(specializationId => {
        const relevanceOptions = { useThreeTierCategories };
        const relevance = this.getCategoryRelevance(categoryId, specializationId, relevanceOptions);
        
        if (includeScores) {
          const scoreMap = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
          mapping[categoryId][specializationId] = {
            relevance,
            score: scoreMap[relevance] || 0
          };
        } else {
          mapping[categoryId][specializationId] = relevance;
        }
      });
    });

    return mapping;
  }

  /**
   * Ensure consistent relevance scoring across category systems
   * @param {Object} contentItem - Content item to validate
   * @param {Array} specializationIds - Specializations to check consistency for
   * @returns {Object} Consistency validation result
   */
  validateRelevanceConsistency(contentItem, specializationIds) {
    const result = {
      isConsistent: true,
      inconsistencies: [],
      recommendations: []
    };

    if (!contentItem) {
      result.isConsistent = false;
      result.inconsistencies.push('No content item provided');
      return result;
    }

    const originalCategory = contentItem.category || contentItem.categoryId;
    const threeTierCategory = contentItem.threeTierCategory || this._inferThreeTierCategory(contentItem);

    specializationIds.forEach(specializationId => {
      const originalRelevance = originalCategory 
        ? this.getCategoryRelevance(originalCategory, specializationId)
        : 'none';
      
      const threeTierRelevance = this._getThreeTierCategoryRelevance(threeTierCategory, specializationId);

      // Check for major inconsistencies (high vs low, etc.)
      const relevanceScores = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
      const originalScore = relevanceScores[originalRelevance] || 0;
      const threeTierScore = relevanceScores[threeTierRelevance] || 0;
      const scoreDifference = Math.abs(originalScore - threeTierScore);

      if (scoreDifference > 1) {
        result.isConsistent = false;
        result.inconsistencies.push({
          specializationId,
          originalCategory,
          originalRelevance,
          threeTierCategory,
          threeTierRelevance,
          scoreDifference
        });

        // Provide recommendations
        if (originalScore > threeTierScore) {
          result.recommendations.push(
            `Consider reviewing three-tier mapping for ${contentItem.id}: original relevance (${originalRelevance}) higher than three-tier (${threeTierRelevance})`
          );
        } else {
          result.recommendations.push(
            `Consider reviewing original category for ${contentItem.id}: three-tier relevance (${threeTierRelevance}) higher than original (${originalRelevance})`
          );
        }
      }
    });

    return result;
  }

  /**
   * Find category by ID in the categories data
   * @private
   * @param {string} categoryId - The category ID to find
   * @returns {Object|null} Category object or null if not found
   */
  _findCategoryById(categoryId) {
    // Search in main categories
    for (const category of this.categoriesData.categories) {
      if (category.id === categoryId) {
        return category;
      }
      
      // Search in subcategories
      if (category.subcategories) {
        for (const subcategory of category.subcategories) {
          if (subcategory.id === categoryId) {
            return subcategory;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Filter content array based on specialization and category relevance
   * @param {Array} content - Array of content items (modules, quizzes, etc.)
   * @param {string} specializationId - The specialization ID to filter for
   * @param {Object} options - Filtering options
   * @param {string} options.minRelevance - Minimum relevance level ('high', 'medium', 'low')
   * @param {boolean} options.includeGeneral - Whether to include general content
   * @param {boolean} options.useThreeTierCategories - Whether to use three-tier category system
   * @returns {Array} Filtered content array
   */
  filterContentBySpecialization(content, specializationId, options = {}) {
    if (!Array.isArray(content) || !specializationId) {
      return content || [];
    }

    const {
      minRelevance = 'low',
      includeGeneral = true,
      useThreeTierCategories = false
    } = options;

    const relevanceLevels = {
      'high': 3,
      'medium': 2,
      'low': 1,
      'none': 0
    };

    const minRelevanceScore = relevanceLevels[minRelevance] || 1;

    return content.filter(item => {
      // If item doesn't have category information, include it by default
      if (!item.category && !item.categoryId && !item.threeTierCategory) {
        return true;
      }

      let relevance;
      let categoryId;

      if (useThreeTierCategories && item.threeTierCategory) {
        // Use three-tier category system
        categoryId = item.threeTierCategory;
        relevance = this.categoryMappingService 
          ? this.categoryMappingService.getCategoryRelevance(categoryId, specializationId)
          : this._getThreeTierCategoryRelevance(categoryId, specializationId);
      } else {
        // Use original category system
        categoryId = item.category || item.categoryId;
        relevance = this.getCategoryRelevance(categoryId, specializationId);
      }

      const relevanceScore = relevanceLevels[relevance] || 0;

      // Include if relevance meets minimum threshold
      if (relevanceScore >= minRelevanceScore) {
        return true;
      }

      // Include general content if option is enabled
      if (includeGeneral && this._isGeneralContent(categoryId, useThreeTierCategories)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Filter content array using three-tier categories
   * @param {Array} content - Array of content items (modules, quizzes, etc.)
   * @param {string} specializationId - The specialization ID to filter for
   * @param {Object} options - Filtering options
   * @param {string} options.minRelevance - Minimum relevance level ('high', 'medium', 'low')
   * @param {boolean} options.includeGeneral - Whether to include general content
   * @param {string} options.threeTierCategory - Specific three-tier category to filter by
   * @returns {Array} Filtered content array
   */
  filterContentByThreeTierCategory(content, specializationId, options = {}) {
    if (!Array.isArray(content) || !specializationId) {
      return content || [];
    }

    const {
      minRelevance = 'low',
      includeGeneral = true,
      threeTierCategory = null
    } = options;

    // If specific category is requested, filter by that category
    if (threeTierCategory) {
      return content.filter(item => {
        const itemCategory = item.threeTierCategory || this._inferThreeTierCategory(item);
        return itemCategory === threeTierCategory;
      });
    }

    // Otherwise use general three-tier filtering
    return this.filterContentBySpecialization(content, specializationId, {
      ...options,
      useThreeTierCategories: true
    });
  }

  /**
   * Infer three-tier category from content item if not explicitly set
   * @private
   * @param {Object} item - Content item
   * @returns {string} Inferred three-tier category
   */
  _inferThreeTierCategory(item) {
    if (this.categoryMappingService) {
      const mappingResult = this.categoryMappingService.mapToThreeTierCategory(item);
      return mappingResult.threeTierCategory;
    }

    // Fallback inference based on category patterns
    const category = item.category || item.categoryId || '';
    
    if (/^(BP-DPA-|bp-dpa-)/i.test(category)) {
      return 'daten-prozessanalyse';
    }
    
    if (/^(BP-AE-|bp-ae-)/i.test(category)) {
      return 'anwendungsentwicklung';
    }
    
    return 'allgemein';
  }

  /**
   * Check if content is general (applies to all specializations)
   * @private
   * @param {string} categoryId - The category ID to check
   * @param {boolean} useThreeTierCategories - Whether to use three-tier category logic
   * @returns {boolean} True if content is general
   */
  _isGeneralContent(categoryId, useThreeTierCategories = false) {
    if (useThreeTierCategories) {
      // In three-tier system, 'allgemein' category is general content
      return categoryId === 'allgemein';
    }

    const category = this._findCategoryById(categoryId);
    
    if (!category) {
      return false;
    }

    // Check if category has high relevance for all supported specializations
    const supportedSpecializations = this.categoriesData.supportedSpecializations || [];
    
    return supportedSpecializations.every(specializationId => {
      const relevance = category.relevance?.[specializationId];
      return relevance === 'high' || relevance === 'medium';
    });
  }

  /**
   * Get content statistics by specialization for three-tier categories
   * @param {Array} content - Array of content items
   * @param {string} specializationId - The specialization ID
   * @param {Object} options - Options for statistics calculation
   * @param {boolean} options.useThreeTierCategories - Whether to use three-tier categories
   * @param {boolean} options.includeProgress - Whether to include progress information
   * @returns {Object} Content statistics object
   */
  getContentStatsBySpecialization(content, specializationId, options = {}) {
    if (!Array.isArray(content) || !specializationId) {
      return {
        totalItems: 0,
        categories: {},
        relevanceDistribution: {},
        contentTypes: {}
      };
    }

    const {
      useThreeTierCategories = false,
      includeProgress = false
    } = options;

    const stats = {
      totalItems: content.length,
      categories: {},
      relevanceDistribution: {
        high: 0,
        medium: 0,
        low: 0,
        none: 0
      },
      contentTypes: {
        modules: 0,
        quizzes: 0,
        other: 0
      }
    };

    // Get progress data if requested
    let progressData = null;
    if (includeProgress) {
      progressData = this.stateManager.getState('progress') || {};
    }

    content.forEach(item => {
      // Determine category and relevance
      let categoryId, relevance;
      
      if (useThreeTierCategories) {
        categoryId = item.threeTierCategory || this._inferThreeTierCategory(item);
        relevance = this.categoryMappingService 
          ? this.categoryMappingService.getCategoryRelevance(categoryId, specializationId)
          : this._getThreeTierCategoryRelevance(categoryId, specializationId);
      } else {
        categoryId = item.category || item.categoryId || 'unknown';
        relevance = this.getCategoryRelevance(categoryId, specializationId);
      }

      // Count by category
      if (!stats.categories[categoryId]) {
        stats.categories[categoryId] = {
          count: 0,
          relevance: relevance,
          items: []
        };
      }
      stats.categories[categoryId].count++;
      stats.categories[categoryId].items.push(item.id || 'unknown');

      // Count by relevance
      stats.relevanceDistribution[relevance] = (stats.relevanceDistribution[relevance] || 0) + 1;

      // Count by content type
      const contentType = this._inferContentType(item);
      stats.contentTypes[contentType] = (stats.contentTypes[contentType] || 0) + 1;

      // Add progress information if requested
      if (includeProgress && progressData) {
        if (!stats.categories[categoryId].progress) {
          stats.categories[categoryId].progress = {
            completed: 0,
            inProgress: 0,
            notStarted: 0
          };
        }

        const itemId = item.id;
        if (progressData.modulesCompleted?.includes(itemId)) {
          stats.categories[categoryId].progress.completed++;
        } else if (progressData.modulesInProgress?.includes(itemId)) {
          stats.categories[categoryId].progress.inProgress++;
        } else {
          stats.categories[categoryId].progress.notStarted++;
        }
      }
    });

    // Calculate additional metrics
    stats.specializationRelevance = {
      highRelevancePercentage: ((stats.relevanceDistribution.high / stats.totalItems) * 100).toFixed(1),
      mediumRelevancePercentage: ((stats.relevanceDistribution.medium / stats.totalItems) * 100).toFixed(1),
      lowRelevancePercentage: ((stats.relevanceDistribution.low / stats.totalItems) * 100).toFixed(1)
    };

    // Add category metadata if using three-tier system
    if (useThreeTierCategories) {
      stats.categoryMetadata = this._getThreeTierCategoryMetadata(specializationId);
    }

    return stats;
  }

  /**
   * Get metadata for three-tier categories
   * @private
   * @param {string} specializationId - The specialization ID
   * @returns {Object} Category metadata object
   */
  _getThreeTierCategoryMetadata(specializationId) {
    const categories = this.getThreeTierContentCategories(specializationId);
    const metadata = {};

    categories.forEach(category => {
      metadata[category.id] = {
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        relevance: category.relevance,
        isSpecializationSpecific: category.id === specializationId,
        isGeneral: category.id === 'allgemein'
      };
    });

    return metadata;
  }

  /**
   * Infer content type from item structure
   * @private
   * @param {Object} item - Content item
   * @returns {string} Content type ('modules', 'quizzes', 'other')
   */
  _inferContentType(item) {
    if (item.questions && Array.isArray(item.questions)) {
      return 'quizzes';
    }
    if (item.content || item.sections || item.modules) {
      return 'modules';
    }
    return 'other';
  }

  /**
   * Get content categories for display/filtering
   * @param {string} specializationId - The specialization ID
   * @returns {Array} Array of category objects with relevance information
   */
  getContentCategories(specializationId) {
    if (!specializationId) {
      return [];
    }

    const categories = [];

    // Add general category
    categories.push({
      id: 'general',
      name: 'Allgemein',
      description: 'Fachrichtungsübergreifende Inhalte',
      color: '#6b7280',
      relevance: 'high'
    });

    // Add specialization-specific categories
    for (const category of this.categoriesData.categories) {
      const relevance = this.getCategoryRelevance(category.id, specializationId);
      
      if (relevance !== 'none') {
        categories.push({
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          relevance: relevance
        });
      }
    }

    return categories;
  }

  /**
   * Get three-tier content categories for display/filtering
   * @param {string} specializationId - The specialization ID
   * @returns {Array} Array of three-tier category objects with relevance information
   */
  getThreeTierContentCategories(specializationId) {
    if (!specializationId) {
      return [];
    }

    // Get three-tier categories from CategoryMappingService if available
    if (this.categoryMappingService) {
      const threeTierCategories = this.categoryMappingService.getThreeTierCategories();
      
      return threeTierCategories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        relevance: this.categoryMappingService.getCategoryRelevance(category.id, specializationId)
      }));
    }

    // Fallback to hardcoded three-tier categories if service not available
    const fallbackCategories = [
      {
        id: 'daten-prozessanalyse',
        name: 'Daten und Prozessanalyse',
        description: 'Inhalte mit hoher Relevanz für die Fachrichtung Daten- und Prozessanalyse',
        color: '#3b82f6',
        icon: '📊'
      },
      {
        id: 'anwendungsentwicklung',
        name: 'Anwendungsentwicklung',
        description: 'Inhalte mit hoher Relevanz für die Fachrichtung Anwendungsentwicklung',
        color: '#10b981',
        icon: '💻'
      },
      {
        id: 'allgemein',
        name: 'Allgemein',
        description: 'Fachrichtungsübergreifende Inhalte und Grundlagen für beide Spezialisierungen',
        color: '#6b7280',
        icon: '📚'
      }
    ];

    return fallbackCategories.map(category => ({
      ...category,
      relevance: this._getThreeTierCategoryRelevance(category.id, specializationId)
    }));
  }

  /**
   * Get relevance for three-tier categories (fallback implementation)
   * @private
   * @param {string} categoryId - Three-tier category ID
   * @param {string} specializationId - Specialization ID
   * @returns {string} Relevance level
   */
  _getThreeTierCategoryRelevance(categoryId, specializationId) {
    const relevanceMap = {
      'daten-prozessanalyse': {
        'daten-prozessanalyse': 'high',
        'anwendungsentwicklung': 'low'
      },
      'anwendungsentwicklung': {
        'anwendungsentwicklung': 'high',
        'daten-prozessanalyse': 'low'
      },
      'allgemein': {
        'anwendungsentwicklung': 'high',
        'daten-prozessanalyse': 'high'
      }
    };

    return relevanceMap[categoryId]?.[specializationId] || 'none';
  }

  /**
   * Get user's content filtering preferences
   * @returns {Object} User preferences object
   */
  getPreferences() {
    const specializationState = this.stateManager.getState('specialization');
    return specializationState?.preferences || {
      showAllContent: false,
      preferredCategories: []
    };
  }

  /**
   * Update user's content filtering preferences
   * @param {Object} preferences - Preferences object
   * @param {boolean} preferences.showAllContent - Whether to show all content
   * @param {Array} preferences.preferredCategories - Array of preferred category IDs
   * @returns {boolean} True if successful
   */
  setPreferences(preferences) {
    try {
      if (!preferences || typeof preferences !== 'object') {
        throw new Error('Invalid preferences object');
      }

      const currentPreferences = this.getPreferences();
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences
      };

      this.stateManager.setState('specialization.preferences', updatedPreferences);
      return true;
    } catch (error) {
      console.error('Error setting preferences:', error);
      return false;
    }
  }

  /**
   * Reset specialization selection (for testing or user reset)
   * @returns {boolean} True if successful
   */
  resetSpecialization() {
    try {
      this.stateManager.setState('specialization', {
        current: null,
        hasSelected: false,
        preferences: {
          showAllContent: false,
          preferredCategories: []
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error resetting specialization:', error);
      return false;
    }
  }

  /**
   * Migrate existing users to have a default specialization
   * This method should be called during app initialization for backward compatibility
   * @param {string} defaultSpecialization - Default specialization for existing users
   * @returns {Object} Migration result with status and details
   */
  migrateExistingUser(defaultSpecialization = 'anwendungsentwicklung') {
    try {
      // Check if migration has already been performed
      const migrationStatus = this.stateManager.getState('migration.specialization');
      if (migrationStatus && migrationStatus.completed) {
        return {
          performed: false,
          reason: 'already_migrated',
          timestamp: migrationStatus.timestamp,
          version: migrationStatus.version
        };
      }

      const specializationState = this.stateManager.getState('specialization');
      const progress = this.stateManager.getState('progress');
      
      // Check if user has existing progress but no specialization set
      const hasExistingProgress = progress && (
        (progress.modulesCompleted && progress.modulesCompleted.length > 0) ||
        (progress.modulesInProgress && progress.modulesInProgress.length > 0) ||
        (progress.quizAttempts && progress.quizAttempts.length > 0)
      );

      // Check if user has any stored preferences or settings (indicates existing user)
      const hasExistingSettings = this._hasExistingUserData();

      // Determine if migration is needed
      const needsMigration = (hasExistingProgress || hasExistingSettings) && 
                           (!specializationState || !specializationState.hasSelected);

      if (needsMigration) {
        // Perform migration
        const migrationResult = this._performMigration(defaultSpecialization, {
          hasExistingProgress,
          hasExistingSettings,
          progressData: progress
        });

        // Record migration status
        this._recordMigrationStatus(migrationResult);

        console.log(`✅ Migrated existing user to specialization: ${defaultSpecialization}`);
        
        return {
          performed: true,
          reason: 'existing_user_detected',
          specialization: defaultSpecialization,
          preservedProgress: migrationResult.preservedProgress,
          timestamp: new Date().toISOString()
        };
      }

      // No migration needed - new user or already has specialization
      return {
        performed: false,
        reason: specializationState?.hasSelected ? 'already_has_specialization' : 'new_user',
        currentSpecialization: specializationState?.current || null
      };

    } catch (error) {
      console.error('❌ Error migrating existing user:', error);
      
      // Record failed migration attempt
      this._recordMigrationStatus({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return {
        performed: false,
        reason: 'migration_error',
        error: error.message
      };
    }
  }

  /**
   * Check if user has existing data that indicates they're not a new user
   * @private
   * @returns {boolean} True if existing user data is found
   */
  _hasExistingUserData() {
    try {
      // Check for theme preferences
      const themePreference = this.storage.get('theme-preference');
      
      // Check for any stored state data
      const storedState = this.storage.get('app-state');
      
      // Check for any analytics or session data
      const sessionData = this.stateManager.getState('session');
      const analyticsData = this.stateManager.getState('analytics');
      
      // Check for any exam progress data
      const examProgress = this.stateManager.getState('examProgress');
      
      return !!(themePreference || storedState || sessionData || analyticsData || examProgress);
    } catch (error) {
      console.warn('Error checking existing user data:', error);
      return false;
    }
  }

  /**
   * Perform the actual migration process
   * @private
   * @param {string} defaultSpecialization - The specialization to assign
   * @param {Object} context - Migration context with user data
   * @returns {Object} Migration result
   */
  _performMigration(defaultSpecialization, context) {
    const { hasExistingProgress, progressData } = context;
    
    // Set the specialization (this will preserve progress automatically)
    const success = this.setSpecialization(defaultSpecialization, { 
      preserveProgress: true 
    });

    if (!success) {
      throw new Error('Failed to set specialization during migration');
    }

    // Analyze and categorize existing progress
    const progressAnalysis = this._analyzeExistingProgress(progressData);

    // Perform three-tier category migration if CategoryMappingService is available
    let threeTierMigration = null;
    if (this.categoryMappingService && hasExistingProgress) {
      threeTierMigration = this._migrateToThreeTierCategories(progressData);
    }

    // Update progress metadata to include migration information
    if (hasExistingProgress) {
      const currentProgress = this.stateManager.getState('progress') || {};
      currentProgress.migrationInfo = {
        migratedAt: new Date().toISOString(),
        originalProgress: progressAnalysis,
        assignedSpecialization: defaultSpecialization,
        preservedItems: {
          modules: progressAnalysis.totalModules,
          quizzes: progressAnalysis.totalQuizAttempts
        },
        threeTierMigration: threeTierMigration
      };
      
      this.stateManager.setState('progress', currentProgress);
    }

    return {
      success: true,
      preservedProgress: progressAnalysis,
      assignedSpecialization: defaultSpecialization,
      threeTierMigration: threeTierMigration,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Migrate existing progress to three-tier category system
   * @private
   * @param {Object} progressData - Progress data to migrate
   * @returns {Object} Migration result for three-tier categories
   */
  _migrateToThreeTierCategories(progressData) {
    if (!progressData || !this.categoryMappingService) {
      return null;
    }

    const migration = {
      status: 'success',
      migratedItems: 0,
      categoryMapping: {},
      errors: []
    };

    try {
      // Create three-tier progress structure
      const threeTierProgress = {
        'daten-prozessanalyse': { modules: [], quizzes: [] },
        'anwendungsentwicklung': { modules: [], quizzes: [] },
        'allgemein': { modules: [], quizzes: [] }
      };

      // Migrate completed modules
      (progressData.modulesCompleted || []).forEach(moduleId => {
        try {
          const mockItem = { id: moduleId, category: this._extractCategoryFromId(moduleId) };
          const mappingResult = this.categoryMappingService.mapToThreeTierCategory(mockItem);
          const category = mappingResult.threeTierCategory;
          
          threeTierProgress[category].modules.push(moduleId);
          migration.categoryMapping[moduleId] = category;
          migration.migratedItems++;
        } catch (error) {
          migration.errors.push(`Failed to migrate module ${moduleId}: ${error.message}`);
        }
      });

      // Migrate in-progress modules
      (progressData.modulesInProgress || []).forEach(moduleId => {
        try {
          const mockItem = { id: moduleId, category: this._extractCategoryFromId(moduleId) };
          const mappingResult = this.categoryMappingService.mapToThreeTierCategory(mockItem);
          const category = mappingResult.threeTierCategory;
          
          if (!threeTierProgress[category].modules.includes(moduleId)) {
            threeTierProgress[category].modules.push(moduleId);
          }
          
          if (!migration.categoryMapping[moduleId]) {
            migration.categoryMapping[moduleId] = category;
            migration.migratedItems++;
          }
        } catch (error) {
          migration.errors.push(`Failed to migrate in-progress module ${moduleId}: ${error.message}`);
        }
      });

      // Migrate quiz attempts
      (progressData.quizAttempts || []).forEach(attempt => {
        try {
          const mockItem = { id: attempt.quizId, category: this._extractCategoryFromId(attempt.quizId) };
          const mappingResult = this.categoryMappingService.mapToThreeTierCategory(mockItem);
          const category = mappingResult.threeTierCategory;
          
          threeTierProgress[category].quizzes.push(attempt);
          migration.categoryMapping[attempt.quizId] = category;
          migration.migratedItems++;
        } catch (error) {
          migration.errors.push(`Failed to migrate quiz ${attempt.quizId}: ${error.message}`);
        }
      });

      // Store the three-tier progress
      const currentProgress = this.stateManager.getState('progress') || {};
      currentProgress.threeTierCategoryProgress = threeTierProgress;
      this.stateManager.setState('progress', currentProgress);

      // Set status based on errors
      if (migration.errors.length > 0) {
        migration.status = migration.errors.length === migration.migratedItems ? 'failed' : 'partial';
      }

      migration.threeTierProgress = threeTierProgress;

    } catch (error) {
      migration.status = 'failed';
      migration.errors.push(`Migration failed: ${error.message}`);
    }

    return migration;
  }

  /**
   * Extract category from content ID
   * @private
   * @param {string} contentId - Content ID
   * @returns {string} Extracted category or inferred category
   */
  _extractCategoryFromId(contentId) {
    if (!contentId) return '';

    // Extract category from common ID patterns
    const patterns = [
      /^(BP-[A-Z]+-\d+)/i,  // BP-AE-01, BP-DPA-02
      /^(bp-[a-z]+-\d+)/i,  // bp-ae-01, bp-dpa-02
      /^(FÜ-\d+)/i,         // FÜ-01
      /^(fue-\d+)/i         // fue-01
    ];

    for (const pattern of patterns) {
      const match = contentId.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Fallback: use the first part before any delimiter
    const parts = contentId.split(/[-_]/);
    return parts.length > 1 ? parts.slice(0, 2).join('-') : contentId;
  }

  /**
   * Analyze existing progress data for migration reporting
   * @private
   * @param {Object} progressData - The progress data to analyze
   * @returns {Object} Analysis results
   */
  _analyzeExistingProgress(progressData) {
    if (!progressData) {
      return {
        totalModules: 0,
        totalQuizAttempts: 0,
        generalContent: 0,
        specializationContent: 0
      };
    }

    const modulesCompleted = progressData.modulesCompleted || [];
    const modulesInProgress = progressData.modulesInProgress || [];
    const quizAttempts = progressData.quizAttempts || [];

    // Categorize modules
    const allModules = [...new Set([...modulesCompleted, ...modulesInProgress])];
    const generalModules = this._getGeneralModules(allModules);
    const specializationModules = allModules.filter(id => !generalModules.includes(id));

    // Categorize quiz attempts
    const generalQuizzes = this._getGeneralQuizAttempts(quizAttempts);
    const specializationQuizzes = quizAttempts.filter(attempt => 
      !generalQuizzes.some(general => general.quizId === attempt.quizId)
    );

    return {
      totalModules: allModules.length,
      totalQuizAttempts: quizAttempts.length,
      generalContent: generalModules.length + generalQuizzes.length,
      specializationContent: specializationModules.length + specializationQuizzes.length,
      breakdown: {
        modules: {
          completed: modulesCompleted.length,
          inProgress: modulesInProgress.length,
          general: generalModules.length,
          specialization: specializationModules.length
        },
        quizzes: {
          total: quizAttempts.length,
          general: generalQuizzes.length,
          specialization: specializationQuizzes.length
        }
      }
    };
  }

  /**
   * Record migration status for tracking and preventing duplicate migrations
   * @private
   * @param {Object} migrationResult - The result of the migration
   */
  _recordMigrationStatus(migrationResult) {
    try {
      const migrationRecord = {
        completed: migrationResult.success,
        timestamp: migrationResult.timestamp || new Date().toISOString(),
        version: '1.0.0', // Migration version for future compatibility
        result: migrationResult,
        userAgent: navigator.userAgent,
        sessionId: this._getSessionId()
      };

      // Store migration status
      this.stateManager.setState('migration.specialization', migrationRecord);

      // Also add to migration history for analytics
      const migrationHistory = this.stateManager.getState('migration.history') || [];
      migrationHistory.push(migrationRecord);
      
      // Keep only last 5 migration records to avoid storage bloat
      if (migrationHistory.length > 5) {
        migrationHistory.splice(0, migrationHistory.length - 5);
      }
      
      this.stateManager.setState('migration.history', migrationHistory);

    } catch (error) {
      console.error('Error recording migration status:', error);
    }
  }

  /**
   * Get migration status for the current user
   * @returns {Object|null} Migration status or null if no migration performed
   */
  getMigrationStatus() {
    return this.stateManager.getState('migration.specialization') || null;
  }

  /**
   * Check if user has been migrated
   * @returns {boolean} True if user has been migrated
   */
  hasMigrated() {
    const migrationStatus = this.getMigrationStatus();
    return migrationStatus && migrationStatus.completed;
  }

  /**
   * Ensure backward compatibility with existing method signatures
   * This method maintains the original filterContentBySpecialization behavior
   * @param {Array} content - Array of content items
   * @param {string} specializationId - The specialization ID
   * @param {Object} options - Filtering options (original format)
   * @returns {Array} Filtered content array
   */
  filterContentBySpecializationLegacy(content, specializationId, options = {}) {
    // Ensure we don't use three-tier categories for legacy calls
    const legacyOptions = {
      ...options,
      useThreeTierCategories: false
    };
    
    return this.filterContentBySpecialization(content, specializationId, legacyOptions);
  }

  /**
   * Get content categories in legacy format for backward compatibility
   * @param {string} specializationId - The specialization ID
   * @returns {Array} Array of category objects in legacy format
   */
  getContentCategoriesLegacy(specializationId) {
    // This maintains the original getContentCategories behavior
    return this.getContentCategories(specializationId);
  }

  /**
   * Check if three-tier category system is available and enabled
   * @returns {boolean} True if three-tier system is available
   */
  isThreeTierSystemAvailable() {
    return this.categoryMappingService !== null;
  }

  /**
   * Get migration support status for three-tier system
   * @returns {Object} Migration support information
   */
  getThreeTierMigrationSupport() {
    const currentProgress = this.stateManager.getState('progress') || {};
    const migrationInfo = currentProgress.migrationInfo || {};
    
    return {
      isAvailable: this.isThreeTierSystemAvailable(),
      hasMigrated: !!migrationInfo.threeTierMigration,
      migrationStatus: migrationInfo.threeTierMigration?.status || 'not_started',
      lastMigration: migrationInfo.migratedAt || null,
      progressPreserved: !!currentProgress.threeTierCategoryProgress
    };
  }

  /**
   * Validate that existing functionality still works after three-tier integration
   * @returns {Object} Validation result
   */
  validateBackwardCompatibility() {
    const validation = {
      status: 'success',
      tests: [],
      errors: [],
      warnings: []
    };

    try {
      // Test 1: Original method signatures still work
      const testSpecialization = 'anwendungsentwicklung';
      
      // Test getAvailableSpecializations
      const specializations = this.getAvailableSpecializations();
      validation.tests.push({
        name: 'getAvailableSpecializations',
        passed: Array.isArray(specializations) && specializations.length > 0,
        result: `Found ${specializations.length} specializations`
      });

      // Test getCurrentSpecialization
      const current = this.getCurrentSpecialization();
      validation.tests.push({
        name: 'getCurrentSpecialization',
        passed: typeof current === 'string' || current === null,
        result: `Current: ${current}`
      });

      // Test getCategoryRelevance with original parameters
      const relevance = this.getCategoryRelevance('BP-AE-01', testSpecialization);
      validation.tests.push({
        name: 'getCategoryRelevance (legacy)',
        passed: ['high', 'medium', 'low', 'none'].includes(relevance),
        result: `Relevance: ${relevance}`
      });

      // Test getContentCategories
      const categories = this.getContentCategories(testSpecialization);
      validation.tests.push({
        name: 'getContentCategories',
        passed: Array.isArray(categories),
        result: `Found ${categories.length} categories`
      });

      // Test filterContentBySpecialization with mock data
      const mockContent = [
        { id: 'test1', category: 'BP-AE-01' },
        { id: 'test2', category: 'BP-DPA-01' },
        { id: 'test3', category: 'FÜ-01' }
      ];
      
      const filtered = this.filterContentBySpecialization(mockContent, testSpecialization);
      validation.tests.push({
        name: 'filterContentBySpecialization',
        passed: Array.isArray(filtered),
        result: `Filtered ${mockContent.length} to ${filtered.length} items`
      });

      // Check for any failed tests
      const failedTests = validation.tests.filter(test => !test.passed);
      if (failedTests.length > 0) {
        validation.status = 'error';
        validation.errors.push(`${failedTests.length} backward compatibility tests failed`);
      }

      // Test three-tier integration if available
      if (this.isThreeTierSystemAvailable()) {
        const threeTierCategories = this.getThreeTierContentCategories(testSpecialization);
        validation.tests.push({
          name: 'getThreeTierContentCategories',
          passed: Array.isArray(threeTierCategories) && threeTierCategories.length === 3,
          result: `Found ${threeTierCategories.length} three-tier categories`
        });

        const threeTierFiltered = this.filterContentByThreeTierCategory(mockContent, testSpecialization);
        validation.tests.push({
          name: 'filterContentByThreeTierCategory',
          passed: Array.isArray(threeTierFiltered),
          result: `Three-tier filtering works`
        });
      } else {
        validation.warnings.push('Three-tier category system not available - some new features disabled');
      }

    } catch (error) {
      validation.status = 'error';
      validation.errors.push(`Validation failed: ${error.message}`);
    }

    return validation;
  }

  /**
   * Set CategoryMappingService dependency (for dependency injection)
   * @param {CategoryMappingService} categoryMappingService - The service instance
   */
  setCategoryMappingService(categoryMappingService) {
    this.categoryMappingService = categoryMappingService;
  }
}

export default SpecializationService;