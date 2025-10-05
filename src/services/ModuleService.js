import modulesData from '../data/modules.json';
import StorageService from './StorageService.js';

/**
 * ModuleService - Manages learning module data and operations
 * Now includes both regular and IHK modules
 */
class ModuleService {
  constructor(stateManager, storageService, ihkContentService) {
    this.stateManager = stateManager;
    this.storage = storageService || new StorageService();
    this.ihkContentService = ihkContentService;
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
          ihkModules = ihkModules.map(module => ({
            ...module,
            source: 'ihk',
            // Map IHK fields to regular module fields for consistency
            duration: module.estimatedDuration || 30,
          }));
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
}

export default ModuleService;
