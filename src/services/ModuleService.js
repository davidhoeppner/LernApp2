import modulesData from '../data/modules.json';

import StorageService from './StorageService.js';

/**
 * ModuleService - Manages learning module data and operations
 * Now includes both regular and IHK modules with specialization filtering support
 */
class ModuleService {
  constructor(stateManager, storageService, ihkContentService, specializationService) {
    this.stateManager = stateManager;
    this.storage = storageService || new StorageService();
    this.ihkContentService = ihkContentService;
    this.specializationService = specializationService;
    this.modules = modulesData;
    this.ihkModulesLoaded = false;
  }

  /**
   * Get all modules (IHK modules only - the actual content you want)
   */
  async getModules() {
    try {
      // Get IHK modules - this is your actual content
      let ihkModules = [];
      if (this.ihkContentService) {
        try {
          ihkModules = await this.ihkContentService.searchContent('', {});
          
          // Add debugging to identify problematic modules
          console.log('Raw IHK modules loaded:', ihkModules.length);
          
          ihkModules = ihkModules.map((module, index) => {
            // Check for undefined properties
            if (!module.title || !module.description) {
              console.warn(`Module at index ${index} has undefined properties:`, {
                id: module.id,
                title: module.title,
                description: module.description,
                module: module
              });
            }
            
            return {
              ...module,
              source: 'ihk',
              // Map IHK fields to regular module fields for consistency
              duration: module.estimatedTime || module.estimatedDuration || 30,
            };
          });
          
          // Filter out any modules with missing essential properties
          const validModules = ihkModules.filter(module => 
            module && module.id && module.title && module.description
          );
          
          if (validModules.length !== ihkModules.length) {
            console.warn(`Filtered out ${ihkModules.length - validModules.length} invalid modules`);
          }
          
          console.log('Valid IHK modules after filtering:', validModules.length);
          return validModules;
        } catch (error) {
          console.error('Could not load IHK modules:', error);
          throw error;
        }
      }

      // Return only IHK modules (your actual content)
      return ihkModules;
    } catch (error) {
      console.error('Error getting modules:', error);
      throw new Error('Failed to load modules');
    }
  }

  /**
   * Get module by ID with error handling (IHK modules only)
   */
  async getModuleById(id) {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid module ID');
      }

      // Get from IHK modules (your actual content)
      let module = null;
      if (this.ihkContentService) {
        try {
          module = await this.ihkContentService.getModuleById(id);
        } catch (error) {
          console.error('Module not found in IHK content:', error);
        }
      }

      if (!module) {
        throw new Error(`Module with ID "${id}" not found`);
      }

      // Get progress data
      const progress = this.stateManager.getState('progress') || {};
      const modulesCompleted = progress.modulesCompleted || [];
      const modulesInProgress = progress.modulesInProgress || [];

      // Update last accessed time
      const updatedModule = {
        ...module,
        completed: modulesCompleted.includes(module.id),
        inProgress: modulesInProgress.includes(module.id),
        lastAccessed: new Date().toISOString(),
        source: 'ihk',
        duration: module.estimatedDuration || 30,
      };

      // Mark as in progress if not completed
      if (!modulesCompleted.includes(id) && !modulesInProgress.includes(id)) {
        this._markModuleInProgress(id);
      }

      return updatedModule;
    } catch (error) {
      console.error(`Error getting module ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mark module as in progress (internal helper)
   */
  _markModuleInProgress(moduleId) {
    const progress = this.stateManager.getState('progress') || {};
    const modulesInProgress = progress.modulesInProgress || [];

    if (!modulesInProgress.includes(moduleId)) {
      this.stateManager.setState('progress.modulesInProgress', [
        ...modulesInProgress,
        moduleId,
      ]);
    }
  }

  /**
   * Mark module as complete and update progress
   */
  async markModuleComplete(id) {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid module ID');
      }

      // Verify module exists
      const module = this.modules.find(m => m.id === id);
      if (!module) {
        throw new Error(`Module with ID "${id}" not found`);
      }

      const progress = this.stateManager.getState('progress') || {};
      const modulesCompleted = progress.modulesCompleted || [];
      const modulesInProgress = progress.modulesInProgress || [];

      // Add to completed if not already there
      if (!modulesCompleted.includes(id)) {
        this.stateManager.setState('progress.modulesCompleted', [
          ...modulesCompleted,
          id,
        ]);
      }

      // Remove from in progress
      if (modulesInProgress.includes(id)) {
        this.stateManager.setState(
          'progress.modulesInProgress',
          modulesInProgress.filter(moduleId => moduleId !== id)
        );
      }

      // Update last activity
      this.stateManager.setState(
        'progress.lastActivity',
        new Date().toISOString()
      );

      return true;
    } catch (error) {
      console.error(`Error marking module ${id} as complete:`, error);
      throw error;
    }
  }

  /**
   * Get module progress
   */
  async getModuleProgress(id) {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid module ID');
      }

      // Verify module exists
      const module = this.modules.find(m => m.id === id);
      if (!module) {
        throw new Error(`Module with ID "${id}" not found`);
      }

      const progress = this.stateManager.getState('progress') || {};
      const modulesCompleted = progress.modulesCompleted || [];
      const modulesInProgress = progress.modulesInProgress || [];

      return {
        moduleId: id,
        completed: modulesCompleted.includes(id),
        inProgress: modulesInProgress.includes(id),
        status: modulesCompleted.includes(id)
          ? 'completed'
          : modulesInProgress.includes(id)
            ? 'in-progress'
            : 'not-started',
      };
    } catch (error) {
      console.error(`Error getting progress for module ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get modules filtered by specialization
   * @param {string} specializationId - The specialization ID to filter for
   * @param {Object} options - Filtering options
   * @param {string} options.minRelevance - Minimum relevance level ('high', 'medium', 'low')
   * @param {boolean} options.includeGeneral - Whether to include general content
   * @returns {Promise<Array>} Filtered modules array
   */
  async getModulesBySpecialization(specializationId, options = {}) {
    try {
      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      // Get all modules first
      const allModules = await this.getModules();

      // If no specialization service available, return all modules
      if (!this.specializationService) {
        console.warn('SpecializationService not available, returning all modules');
        return allModules;
      }

      // Filter modules by specialization
      const filteredModules = this.specializationService.filterContentBySpecialization(
        allModules,
        specializationId,
        {
          minRelevance: options.minRelevance || 'low',
          includeGeneral: options.includeGeneral !== false // default to true
        }
      );

      return filteredModules;
    } catch (error) {
      console.error(`Error getting modules by specialization ${specializationId}:`, error);
      throw error;
    }
  }

  /**
   * Get modules organized by category for a specific specialization
   * @param {string} specializationId - The specialization ID
   * @returns {Promise<Object>} Object with categories as keys and module arrays as values
   */
  async getCategorizedModules(specializationId) {
    try {
      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      // Get all modules
      const allModules = await this.getModules();

      // If no specialization service available, return modules under 'all' category
      if (!this.specializationService) {
        console.warn('SpecializationService not available, returning uncategorized modules');
        return { all: allModules };
      }

      // Get content categories for this specialization
      const categories = this.specializationService.getContentCategories(specializationId);
      const categorizedModules = {};

      // Initialize categories
      categories.forEach(category => {
        categorizedModules[category.id] = [];
      });

      // Add an 'all' category for convenience
      categorizedModules.all = allModules;

      // Categorize modules
      allModules.forEach(module => {
        const categoryId = module.category || module.categoryId;
        
        if (categoryId) {
          // Get relevance for this category and specialization
          const relevance = this.specializationService.getCategoryRelevance(categoryId, specializationId);
          
          // Add to appropriate category based on relevance
          if (relevance === 'high' || relevance === 'medium') {
            // Find the category this module belongs to
            const category = categories.find(cat => cat.id === categoryId);
            if (category) {
              categorizedModules[category.id].push(module);
            } else {
              // Check if it's general content
              if (this._isGeneralContent(categoryId)) {
                if (!categorizedModules.general) {
                  categorizedModules.general = [];
                }
                categorizedModules.general.push(module);
              }
            }
          }
        } else {
          // Module without category - add to general if it exists
          if (categorizedModules.general) {
            categorizedModules.general.push(module);
          }
        }
      });

      return categorizedModules;
    } catch (error) {
      console.error(`Error getting categorized modules for specialization ${specializationId}:`, error);
      throw error;
    }
  }

  /**
   * Get modules by category for a specific specialization
   * @param {string} categoryId - The category ID to filter by
   * @param {string} specializationId - The specialization ID
   * @returns {Promise<Array>} Modules in the specified category
   */
  async getModulesByCategory(categoryId, specializationId) {
    try {
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Invalid category ID');
      }

      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      // Get all modules
      const allModules = await this.getModules();

      // Filter modules by category
      const categoryModules = allModules.filter(module => {
        const moduleCategoryId = module.category || module.categoryId;
        return moduleCategoryId === categoryId;
      });

      // If no specialization service available, return category modules as-is
      if (!this.specializationService) {
        console.warn('SpecializationService not available, returning unfiltered category modules');
        return categoryModules;
      }

      // Further filter by specialization relevance
      const filteredModules = this.specializationService.filterContentBySpecialization(
        categoryModules,
        specializationId,
        {
          minRelevance: 'low',
          includeGeneral: true
        }
      );

      return filteredModules;
    } catch (error) {
      console.error(`Error getting modules by category ${categoryId} for specialization ${specializationId}:`, error);
      throw error;
    }
  }

  /**
   * Check if content is general (applies to all specializations)
   * @private
   * @param {string} categoryId - The category ID to check
   * @returns {boolean} True if content is general
   */
  _isGeneralContent(categoryId) {
    if (!this.specializationService) {
      return false;
    }

    // Delegate to SpecializationService
    return this.specializationService._isGeneralContent(categoryId);
  }

  /**
   * Get current user's specialization-filtered modules
   * Convenience method that uses the current user's specialization
   * @param {Object} options - Filtering options
   * @returns {Promise<Array>} Filtered modules for current specialization
   */
  async getCurrentSpecializationModules(options = {}) {
    try {
      if (!this.specializationService) {
        console.warn('SpecializationService not available, returning all modules');
        return await this.getModules();
      }

      const currentSpecialization = this.specializationService.getCurrentSpecialization();
      
      if (!currentSpecialization) {
        // No specialization selected, return all modules
        return await this.getModules();
      }

      return await this.getModulesBySpecialization(currentSpecialization, options);
    } catch (error) {
      console.error('Error getting current specialization modules:', error);
      throw error;
    }
  }

  /**
   * Get module statistics by specialization
   * @param {string} specializationId - The specialization ID
   * @returns {Promise<Object>} Statistics object with counts by category and relevance
   */
  async getModuleStatistics(specializationId) {
    try {
      if (!specializationId || typeof specializationId !== 'string') {
        throw new Error('Invalid specialization ID');
      }

      const allModules = await this.getModules();
      const stats = {
        total: allModules.length,
        byRelevance: {
          high: 0,
          medium: 0,
          low: 0,
          none: 0
        },
        byCategory: {},
        specialization: specializationId
      };

      if (!this.specializationService) {
        console.warn('SpecializationService not available, returning basic statistics');
        return stats;
      }

      // Calculate statistics
      allModules.forEach(module => {
        const categoryId = module.category || module.categoryId;
        
        if (categoryId) {
          const relevance = this.specializationService.getCategoryRelevance(categoryId, specializationId);
          
          // Count by relevance
          if (stats.byRelevance[relevance] !== undefined) {
            stats.byRelevance[relevance]++;
          }

          // Count by category
          if (!stats.byCategory[categoryId]) {
            stats.byCategory[categoryId] = {
              count: 0,
              relevance: relevance
            };
          }
          stats.byCategory[categoryId].count++;
        } else {
          // Module without category
          stats.byRelevance.none++;
        }
      });

      return stats;
    } catch (error) {
      console.error(`Error getting module statistics for specialization ${specializationId}:`, error);
      throw error;
    }
  }
}

export default ModuleService;
