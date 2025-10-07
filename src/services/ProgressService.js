/* global Blob, URL */
import modulesData from '../data/modules.json';

import StorageService from './StorageService.js';
import { EXAM, PROGRESS_WEIGHTS, PROGRESS_STATUS } from '../utils/constants.js';

/**
 * ProgressService - Tracks and calculates user progress with specialization support
 */
class ProgressService {
  constructor(stateManager, storageService, moduleService, quizService, specializationService) {
    this.stateManager = stateManager;
    this.storage = storageService || new StorageService();
    this.moduleService = moduleService;
    this.quizService = quizService;
    this.specializationService = specializationService;
    this.totalModules = modulesData.length; // Fallback for legacy compatibility
  }

  /**
   * Get overall progress percentage with specialization awareness
   */
  async getOverallProgress(specializationId = null) {
    try {
      const currentSpecialization = specializationId || 
        (this.specializationService ? this.specializationService.getCurrentSpecialization() : null);
      
      const progress = this.stateManager.getState('progress') || {};
      const modulesCompleted = progress.modulesCompleted || [];
      const quizAttempts = progress.quizAttempts || [];

      // Get actual total counts from services
      let totalModules = this.totalModules; // Fallback
      let totalQuizzes = 0;
      let relevantModules = [];
      let relevantQuizzes = [];

      try {
        if (this.moduleService) {
          const modules = await this.moduleService.getModules();
          totalModules = modules.length;
          
          // Filter modules by specialization if available
          if (currentSpecialization && this.specializationService) {
            relevantModules = this.specializationService.filterContentBySpecialization(
              modules, 
              currentSpecialization,
              { minRelevance: 'low', includeGeneral: true }
            );
          } else {
            relevantModules = modules;
          }
        }
      } catch (error) {
        console.warn('Could not get module count, using fallback:', error);
      }

      try {
        if (this.quizService) {
          const quizzes = await this.quizService.getQuizzes();
          totalQuizzes = quizzes.length;
          
          // Filter quizzes by specialization if available
          if (currentSpecialization && this.specializationService) {
            relevantQuizzes = this.specializationService.filterContentBySpecialization(
              quizzes,
              currentSpecialization,
              { minRelevance: 'low', includeGeneral: true }
            );
          } else {
            relevantQuizzes = quizzes;
          }
        }
      } catch (error) {
        console.warn('Could not get quiz count:', error);
      }

      // Filter completed modules and quiz attempts by relevance
      const relevantModuleIds = relevantModules.map(m => m.id);
      const relevantQuizIds = relevantQuizzes.map(q => q.id);
      
      const relevantCompletedModules = modulesCompleted.filter(id => 
        relevantModuleIds.includes(id)
      );
      
      const relevantQuizAttempts = quizAttempts.filter(attempt =>
        relevantQuizIds.includes(attempt.quizId)
      );

      // Calculate module completion percentage
      const moduleCompletionPercentage =
        relevantModules.length > 0
          ? Math.round((relevantCompletedModules.length / relevantModules.length) * 100)
          : 0;

      // Calculate average quiz score
      let averageQuizScore = 0;
      if (relevantQuizAttempts.length > 0) {
        const totalScore = relevantQuizAttempts.reduce(
          (sum, attempt) => sum + attempt.score,
          0
        );
        averageQuizScore = Math.round(totalScore / relevantQuizAttempts.length);
      }

      // Overall progress is weighted: 70% modules, 30% quizzes
      const overallPercentage = Math.round(
        moduleCompletionPercentage * PROGRESS_WEIGHTS.MODULE_COMPLETION +
          averageQuizScore * PROGRESS_WEIGHTS.QUIZ_AVERAGE
      );

      return {
        overallPercentage,
        modulesCompleted: relevantCompletedModules.length,
        totalModules: relevantModules.length,
        totalQuizzes: relevantQuizzes.length,
        moduleCompletionPercentage,
        quizzesTaken: relevantQuizAttempts.length,
        averageQuizScore,
        lastActivity: progress.lastActivity || null,
        specialization: currentSpecialization,
        // Additional specialization-specific stats
        categoryBreakdown: this._getCategoryBreakdown(relevantCompletedModules, relevantQuizAttempts, currentSpecialization)
      };
    } catch (error) {
      console.error('Error getting overall progress:', error);
      throw new Error('Failed to calculate overall progress');
    }
  }

  /**
   * Get progress for individual module
   */
  getModuleProgress(moduleId) {
    try {
      if (!moduleId || typeof moduleId !== 'string') {
        throw new Error('Invalid module ID');
      }

      const progress = this.stateManager.getState('progress') || {};
      const modulesCompleted = progress.modulesCompleted || [];
      const modulesInProgress = progress.modulesInProgress || [];

      const isCompleted = modulesCompleted.includes(moduleId);
      const isInProgress = modulesInProgress.includes(moduleId);

      return {
        moduleId,
        completed: isCompleted,
        inProgress: isInProgress,
        status: isCompleted
          ? PROGRESS_STATUS.COMPLETED
          : isInProgress
            ? PROGRESS_STATUS.IN_PROGRESS
            : PROGRESS_STATUS.NOT_STARTED,
      };
    } catch (error) {
      console.error(`Error getting module progress for ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get quiz history with past attempts
   */
  getQuizHistory() {
    try {
      const progress = this.stateManager.getState('progress') || {};
      const quizAttempts = progress.quizAttempts || [];

      // Sort by date (most recent first)
      const sortedAttempts = [...quizAttempts].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      return sortedAttempts.map(attempt => ({
        quizId: attempt.quizId,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        date: attempt.date,
        passed: attempt.score >= EXAM.PASSING_SCORE_PERCENTAGE,
      }));
    } catch (error) {
      console.error('Error getting quiz history:', error);
      throw new Error('Failed to retrieve quiz history');
    }
  }

  /**
   * Update progress for all activity types
   */
  updateProgress(type, id, data) {
    try {
      if (!type || !id) {
        throw new Error('Invalid parameters: type and id are required');
      }

      const progress = this.stateManager.getState('progress') || {};

      switch (type) {
        case 'module-complete':
          {
            const modulesCompleted = progress.modulesCompleted || [];
            const modulesInProgress = progress.modulesInProgress || [];

            // Add to completed
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
          }
          break;

        case 'module-start':
          {
            const modulesCompleted = progress.modulesCompleted || [];
            const modulesInProgress = progress.modulesInProgress || [];

            // Add to in progress if not completed
            if (
              !modulesCompleted.includes(id) &&
              !modulesInProgress.includes(id)
            ) {
              this.stateManager.setState('progress.modulesInProgress', [
                ...modulesInProgress,
                id,
              ]);
            }
          }
          break;

        case 'quiz-complete':
          {
            if (!data || !data.score || !data.answers) {
              throw new Error(
                'Quiz completion requires score and answers data'
              );
            }

            const quizAttempts = progress.quizAttempts || [];
            const attempt = {
              quizId: id,
              score: data.score,
              totalQuestions: data.totalQuestions || data.answers.length,
              correctAnswers: data.correctAnswers || 0,
              date: new Date().toISOString(),
              answers: data.answers,
            };

            this.stateManager.setState('progress.quizAttempts', [
              ...quizAttempts,
              attempt,
            ]);
          }
          break;

        default:
          throw new Error(`Unknown progress type: ${type}`);
      }

      // Update last activity timestamp
      this.stateManager.setState(
        'progress.lastActivity',
        new Date().toISOString()
      );

      return true;
    } catch (error) {
      console.error(`Error updating progress for ${type} ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get category breakdown for progress analysis
   * @private
   * @param {Array} completedModules - Array of completed module IDs
   * @param {Array} quizAttempts - Array of quiz attempts
   * @param {string} specializationId - Current specialization ID
   * @returns {Object} Category breakdown object
   */
  _getCategoryBreakdown(completedModules, quizAttempts, specializationId) {
    if (!this.specializationService || !specializationId) {
      return {};
    }

    try {
      const categories = this.specializationService.getContentCategories(specializationId);
      const breakdown = {};

      categories.forEach(category => {
        // Count modules in this category
        const categoryModules = completedModules.filter(moduleId => {
          return this._isModuleInCategory(moduleId, category.id);
        });

        // Count quizzes in this category
        const categoryQuizzes = quizAttempts.filter(attempt => {
          return this._isQuizInCategory(attempt.quizId, category.id);
        });

        breakdown[category.id] = {
          name: category.name,
          modulesCompleted: categoryModules.length,
          quizzesTaken: categoryQuizzes.length,
          averageQuizScore: categoryQuizzes.length > 0 
            ? Math.round(categoryQuizzes.reduce((sum, attempt) => sum + attempt.score, 0) / categoryQuizzes.length)
            : 0,
          relevance: category.relevance
        };
      });

      return breakdown;
    } catch (error) {
      console.error('Error calculating category breakdown:', error);
      return {};
    }
  }

  /**
   * Check if module belongs to a specific category
   * @private
   * @param {string} moduleId - Module ID
   * @param {string} categoryId - Category ID
   * @returns {boolean} True if module belongs to category
   */
  _isModuleInCategory(moduleId, categoryId) {
    // Simple heuristic based on module ID patterns
    if (categoryId === 'general') {
      return moduleId.includes('fue-') || moduleId.includes('general-') || 
             (!moduleId.includes('bp-ae-') && !moduleId.includes('bp-dpa-'));
    }
    
    if (categoryId.includes('BP-AE') || categoryId.includes('ae')) {
      return moduleId.includes('bp-ae-') || moduleId.includes('ae-');
    }
    
    if (categoryId.includes('BP-DPA') || categoryId.includes('dpa')) {
      return moduleId.includes('bp-dpa-') || moduleId.includes('dpa-');
    }
    
    return false;
  }

  /**
   * Check if quiz belongs to a specific category
   * @private
   * @param {string} quizId - Quiz ID
   * @param {string} categoryId - Category ID
   * @returns {boolean} True if quiz belongs to category
   */
  _isQuizInCategory(quizId, categoryId) {
    // Simple heuristic based on quiz ID patterns
    if (categoryId === 'general') {
      return quizId.includes('fue-') || quizId.includes('general-') || 
             (!quizId.includes('bp-ae-') && !quizId.includes('bp-dpa-'));
    }
    
    if (categoryId.includes('BP-AE') || categoryId.includes('ae')) {
      return quizId.includes('bp-ae-') || quizId.includes('ae-');
    }
    
    if (categoryId.includes('BP-DPA') || categoryId.includes('dpa')) {
      return quizId.includes('bp-dpa-') || quizId.includes('dpa-');
    }
    
    return false;
  }

  /**
   * Get progress for a specific specialization
   * @param {string} specializationId - Specialization ID
   * @returns {Object} Specialization-specific progress
   */
  async getSpecializationProgress(specializationId) {
    try {
      if (!specializationId) {
        throw new Error('Specialization ID is required');
      }

      const progress = this.stateManager.getState('progress') || {};
      const specializationProgress = progress.specializationProgress || {};
      
      // Get saved progress for this specialization
      const savedProgress = specializationProgress[specializationId];
      
      // Get current overall progress for this specialization
      const currentProgress = await this.getOverallProgress(specializationId);
      
      return {
        specializationId,
        current: currentProgress,
        saved: savedProgress || null,
        lastSwitched: savedProgress?.savedAt || null
      };
    } catch (error) {
      console.error(`Error getting specialization progress for ${specializationId}:`, error);
      throw error;
    }
  }

  /**
   * Get progress comparison between specializations
   * @returns {Object} Progress comparison object
   */
  async getProgressComparison() {
    try {
      if (!this.specializationService) {
        return {};
      }

      const availableSpecializations = this.specializationService.getAvailableSpecializations();
      const comparison = {};

      for (const specialization of availableSpecializations) {
        try {
          comparison[specialization.id] = await this.getSpecializationProgress(specialization.id);
        } catch (error) {
          console.warn(`Could not get progress for ${specialization.id}:`, error);
          comparison[specialization.id] = null;
        }
      }

      return comparison;
    } catch (error) {
      console.error('Error getting progress comparison:', error);
      throw new Error('Failed to get progress comparison');
    }
  }

  /**
   * Preserve progress when switching specializations
   * This method is called by SpecializationService but can also be used independently
   * @param {string} fromSpecialization - Previous specialization
   * @param {string} toSpecialization - New specialization
   * @returns {boolean} True if successful
   */
  preserveProgressAcrossSpecializations(fromSpecialization, toSpecialization) {
    try {
      const progress = this.stateManager.getState('progress') || {};
      
      // Create specialization-specific progress tracking if it doesn't exist
      if (!progress.specializationProgress) {
        progress.specializationProgress = {};
      }

      // Save current progress under the previous specialization
      if (fromSpecialization) {
        progress.specializationProgress[fromSpecialization] = {
          modulesCompleted: [...(progress.modulesCompleted || [])],
          modulesInProgress: [...(progress.modulesInProgress || [])],
          quizAttempts: [...(progress.quizAttempts || [])],
          lastActivity: progress.lastActivity,
          savedAt: new Date().toISOString()
        };
      }

      // Restore progress for the new specialization if it exists
      if (progress.specializationProgress[toSpecialization]) {
        const savedProgress = progress.specializationProgress[toSpecialization];
        
        // Merge saved progress with current general progress
        const generalModules = this._getGeneralModules(progress.modulesCompleted || []);
        const generalInProgress = this._getGeneralModules(progress.modulesInProgress || []);
        const generalQuizzes = this._getGeneralQuizAttempts(progress.quizAttempts || []);

        progress.modulesCompleted = [
          ...generalModules,
          ...savedProgress.modulesCompleted.filter(id => !generalModules.includes(id))
        ];
        
        progress.modulesInProgress = [
          ...generalInProgress,
          ...savedProgress.modulesInProgress.filter(id => !generalInProgress.includes(id))
        ];
        
        progress.quizAttempts = [
          ...generalQuizzes,
          ...savedProgress.quizAttempts.filter(attempt => 
            !generalQuizzes.some(general => general.quizId === attempt.quizId)
          )
        ];
      }

      // Update the progress state
      this.stateManager.setState('progress', progress);
      
      return true;
    } catch (error) {
      console.error('Error preserving progress across specializations:', error);
      return false;
    }
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
   * Get specialization-specific completion statistics
   * @param {string} specializationId - Specialization ID
   * @returns {Object} Completion statistics
   */
  async getSpecializationStatistics(specializationId) {
    try {
      if (!specializationId) {
        throw new Error('Specialization ID is required');
      }

      const progress = await this.getOverallProgress(specializationId);
      const categoryBreakdown = progress.categoryBreakdown || {};
      
      // Calculate statistics
      const stats = {
        specializationId,
        overallCompletion: progress.overallPercentage,
        moduleCompletion: progress.moduleCompletionPercentage,
        averageQuizScore: progress.averageQuizScore,
        totalModulesCompleted: progress.modulesCompleted,
        totalQuizzesTaken: progress.quizzesTaken,
        categoryStats: {},
        strengths: [],
        improvementAreas: []
      };

      // Analyze category performance
      Object.entries(categoryBreakdown).forEach(([categoryId, categoryData]) => {
        const categoryCompletion = categoryData.modulesCompleted > 0 ? 
          Math.round((categoryData.modulesCompleted / (categoryData.modulesCompleted + 1)) * 100) : 0;
        
        stats.categoryStats[categoryId] = {
          name: categoryData.name,
          completion: categoryCompletion,
          averageQuizScore: categoryData.averageQuizScore,
          modulesCompleted: categoryData.modulesCompleted,
          quizzesTaken: categoryData.quizzesTaken
        };

        // Identify strengths and improvement areas
        if (categoryData.averageQuizScore >= 80) {
          stats.strengths.push(categoryData.name);
        } else if (categoryData.averageQuizScore > 0 && categoryData.averageQuizScore < 60) {
          stats.improvementAreas.push(categoryData.name);
        }
      });

      return stats;
    } catch (error) {
      console.error(`Error getting specialization statistics for ${specializationId}:`, error);
      throw error;
    }
  }

  /**
   * Export progress as JSON with specialization support
   */
  async exportProgress() {
    try {
      const progress = this.stateManager.getState('progress') || {};
      const currentSpecialization = this.specializationService ? 
        this.specializationService.getCurrentSpecialization() : null;
      
      const overallProgress = await this.getOverallProgress();
      const specializationProgress = currentSpecialization ? 
        await this.getSpecializationProgress(currentSpecialization) : null;

      const exportData = {
        exportDate: new Date().toISOString(),
        currentSpecialization,
        summary: overallProgress,
        specializationSpecific: specializationProgress,
        details: {
          modulesCompleted: progress.modulesCompleted || [],
          modulesInProgress: progress.modulesInProgress || [],
          quizAttempts: progress.quizAttempts || [],
          lastActivity: progress.lastActivity,
          specializationProgress: progress.specializationProgress || {}
        },
      };

      // Convert to JSON string with formatting
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `learning-progress-${currentSpecialization || 'general'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return exportData;
    } catch (error) {
      console.error('Error exporting progress:', error);
      throw new Error('Failed to export progress data');
    }
  }
}

export default ProgressService;
