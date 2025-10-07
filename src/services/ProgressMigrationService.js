/**
 * ProgressMigrationService - Handles migration of user progress to three-tier category system
 * Ensures no data loss during category system transition and preserves all user achievements
 */
class ProgressMigrationService {
  constructor(progressService, categoryMappingService, storageService, stateManager) {
    this.progressService = progressService;
    this.categoryMappingService = categoryMappingService;
    this.storageService = storageService;
    this.stateManager = stateManager;
    this.migrationVersion = '1.0.0';
  }

  /**
   * Migrate user progress to three-tier category structure
   * @param {Object} options - Migration options
   * @returns {Object} Migration result with status and details
   */
  async migrateUserProgress(options = {}) {
    try {
      const migrationId = this._generateMigrationId();
      const startTime = new Date().toISOString();
      
      console.log(`Starting progress migration ${migrationId}...`);

      // Get current progress data
      const currentProgress = this.stateManager.getState('progress') || {};
      
      // Create backup before migration
      const backupResult = await this._createProgressBackup(currentProgress, migrationId);
      if (!backupResult.success) {
        throw new Error(`Backup creation failed: ${backupResult.error}`);
      }

      // Validate current progress structure
      const validationResult = this._validateCurrentProgress(currentProgress);
      if (!validationResult.isValid && !options.force) {
        throw new Error(`Progress validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Perform the migration
      const migrationResult = await this._performProgressMigration(currentProgress, migrationId);
      
      // Verify migration integrity
      const verificationResult = await this._verifyMigrationIntegrity(
        currentProgress, 
        migrationResult.migratedProgress
      );

      if (!verificationResult.isValid && !options.force) {
        // Rollback on verification failure
        await this._rollbackMigration(migrationId);
        throw new Error(`Migration verification failed: ${verificationResult.errors.join(', ')}`);
      }

      // Apply migrated progress
      this.stateManager.setState('progress', migrationResult.migratedProgress);
      
      // Mark migration as completed
      await this._markMigrationCompleted(migrationId, {
        startTime,
        endTime: new Date().toISOString(),
        originalItemCount: migrationResult.originalItemCount,
        migratedItemCount: migrationResult.migratedItemCount,
        backupId: backupResult.backupId
      });

      return {
        success: true,
        migrationId,
        summary: {
          modulesProcessed: migrationResult.modulesProcessed,
          quizzesProcessed: migrationResult.quizzesProcessed,
          specializationProgressPreserved: migrationResult.specializationProgressPreserved,
          backupCreated: backupResult.backupId,
          verificationPassed: verificationResult.isValid
        },
        details: migrationResult,
        warnings: [...validationResult.warnings, ...verificationResult.warnings]
      };

    } catch (error) {
      console.error('Progress migration failed:', error);
      return {
        success: false,
        error: error.message,
        migrationId: null,
        summary: null
      };
    }
  }

  /**
   * Perform the actual progress migration
   * @private
   * @param {Object} currentProgress - Current progress data
   * @param {string} migrationId - Migration identifier
   * @returns {Object} Migration result
   */
  async _performProgressMigration(currentProgress, migrationId) {
    const migratedProgress = {
      ...currentProgress,
      migrationInfo: {
        version: this.migrationVersion,
        migrationId,
        migratedAt: new Date().toISOString(),
        originalStructure: 'legacy-categories',
        targetStructure: 'three-tier-categories'
      }
    };

    let modulesProcessed = 0;
    let quizzesProcessed = 0;
    let specializationProgressPreserved = 0;

    // Migrate completed modules with category mapping
    if (currentProgress.modulesCompleted) {
      migratedProgress.modulesCompleted = await this._migrateModuleProgress(
        currentProgress.modulesCompleted
      );
      modulesProcessed = migratedProgress.modulesCompleted.length;
    }

    // Migrate modules in progress with category mapping
    if (currentProgress.modulesInProgress) {
      migratedProgress.modulesInProgress = await this._migrateModuleProgress(
        currentProgress.modulesInProgress
      );
    }

    // Migrate quiz attempts with enhanced category information
    if (currentProgress.quizAttempts) {
      migratedProgress.quizAttempts = await this._migrateQuizAttempts(
        currentProgress.quizAttempts
      );
      quizzesProcessed = migratedProgress.quizAttempts.length;
    }

    // Migrate specialization-specific progress
    if (currentProgress.specializationProgress) {
      migratedProgress.specializationProgress = await this._migrateSpecializationProgress(
        currentProgress.specializationProgress
      );
      specializationProgressPreserved = Object.keys(migratedProgress.specializationProgress).length;
    }

    // Add three-tier category progress tracking
    migratedProgress.threeTierCategoryProgress = await this._generateThreeTierCategoryProgress(
      migratedProgress
    );

    return {
      migratedProgress,
      originalItemCount: (currentProgress.modulesCompleted?.length || 0) + 
                        (currentProgress.quizAttempts?.length || 0),
      migratedItemCount: (migratedProgress.modulesCompleted?.length || 0) + 
                        (migratedProgress.quizAttempts?.length || 0),
      modulesProcessed,
      quizzesProcessed,
      specializationProgressPreserved
    };
  }

  /**
   * Migrate module progress with three-tier category mapping
   * @private
   * @param {Array} moduleIds - Array of module IDs
   * @returns {Array} Migrated module progress with category info
   */
  async _migrateModuleProgress(moduleIds) {
    const migratedModules = [];

    for (const moduleId of moduleIds) {
      try {
        // Create enhanced module progress entry
        const moduleProgress = {
          id: moduleId,
          originalId: moduleId, // Preserve original for rollback
          migratedAt: new Date().toISOString()
        };

        // Try to get module metadata for category mapping
        const moduleMetadata = await this._getModuleMetadata(moduleId);
        if (moduleMetadata) {
          const mappingResult = this.categoryMappingService.mapToThreeTierCategory(moduleMetadata);
          moduleProgress.threeTierCategory = mappingResult.threeTierCategory;
          moduleProgress.categoryMappingInfo = {
            appliedRule: mappingResult.appliedRule,
            originalCategory: moduleMetadata.category,
            mappingReason: mappingResult.reason
          };
        } else {
          // Fallback category assignment based on ID patterns
          moduleProgress.threeTierCategory = this._inferCategoryFromId(moduleId);
          moduleProgress.categoryMappingInfo = {
            appliedRule: null,
            originalCategory: null,
            mappingReason: 'Inferred from module ID pattern'
          };
        }

        migratedModules.push(moduleProgress);

      } catch (error) {
        console.warn(`Failed to migrate module ${moduleId}:`, error);
        // Preserve original entry with error info
        migratedModules.push({
          id: moduleId,
          originalId: moduleId,
          threeTierCategory: 'allgemein', // Safe fallback
          migrationError: error.message,
          migratedAt: new Date().toISOString()
        });
      }
    }

    return migratedModules;
  }

  /**
   * Migrate quiz attempts with enhanced category information
   * @private
   * @param {Array} quizAttempts - Array of quiz attempt objects
   * @returns {Array} Migrated quiz attempts with category info
   */
  async _migrateQuizAttempts(quizAttempts) {
    const migratedAttempts = [];

    for (const attempt of quizAttempts) {
      try {
        const migratedAttempt = {
          ...attempt,
          originalQuizId: attempt.quizId, // Preserve original for rollback
          migratedAt: new Date().toISOString()
        };

        // Try to get quiz metadata for category mapping
        const quizMetadata = await this._getQuizMetadata(attempt.quizId);
        if (quizMetadata) {
          const mappingResult = this.categoryMappingService.mapToThreeTierCategory(quizMetadata);
          migratedAttempt.threeTierCategory = mappingResult.threeTierCategory;
          migratedAttempt.categoryMappingInfo = {
            appliedRule: mappingResult.appliedRule,
            originalCategory: quizMetadata.category,
            mappingReason: mappingResult.reason
          };
        } else {
          // Fallback category assignment based on ID patterns
          migratedAttempt.threeTierCategory = this._inferCategoryFromId(attempt.quizId);
          migratedAttempt.categoryMappingInfo = {
            appliedRule: null,
            originalCategory: null,
            mappingReason: 'Inferred from quiz ID pattern'
          };
        }

        migratedAttempts.push(migratedAttempt);

      } catch (error) {
        console.warn(`Failed to migrate quiz attempt ${attempt.quizId}:`, error);
        // Preserve original entry with error info
        migratedAttempts.push({
          ...attempt,
          originalQuizId: attempt.quizId,
          threeTierCategory: 'allgemein', // Safe fallback
          migrationError: error.message,
          migratedAt: new Date().toISOString()
        });
      }
    }

    return migratedAttempts;
  }

  /**
   * Migrate specialization-specific progress
   * @private
   * @param {Object} specializationProgress - Specialization progress data
   * @returns {Object} Migrated specialization progress
   */
  async _migrateSpecializationProgress(specializationProgress) {
    const migratedSpecializationProgress = {};

    for (const [specializationId, progressData] of Object.entries(specializationProgress)) {
      try {
        migratedSpecializationProgress[specializationId] = {
          ...progressData,
          migratedAt: new Date().toISOString(),
          originalStructure: 'legacy-categories',
          
          // Migrate modules within specialization progress
          modulesCompleted: progressData.modulesCompleted ? 
            await this._migrateModuleProgress(progressData.modulesCompleted) : [],
          
          modulesInProgress: progressData.modulesInProgress ?
            await this._migrateModuleProgress(progressData.modulesInProgress) : [],
          
          // Migrate quiz attempts within specialization progress
          quizAttempts: progressData.quizAttempts ?
            await this._migrateQuizAttempts(progressData.quizAttempts) : []
        };

        // Add three-tier category breakdown for this specialization
        migratedSpecializationProgress[specializationId].threeTierCategoryBreakdown = 
          await this._generateSpecializationCategoryBreakdown(
            migratedSpecializationProgress[specializationId], 
            specializationId
          );

      } catch (error) {
        console.warn(`Failed to migrate specialization progress for ${specializationId}:`, error);
        // Preserve original with error info
        migratedSpecializationProgress[specializationId] = {
          ...progressData,
          migrationError: error.message,
          migratedAt: new Date().toISOString()
        };
      }
    }

    return migratedSpecializationProgress;
  }

  /**
   * Generate three-tier category progress summary
   * @private
   * @param {Object} migratedProgress - Migrated progress data
   * @returns {Object} Three-tier category progress breakdown
   */
  async _generateThreeTierCategoryProgress(migratedProgress) {
    const categoryProgress = {
      'daten-prozessanalyse': {
        modulesCompleted: 0,
        quizzesTaken: 0,
        averageQuizScore: 0,
        lastActivity: null
      },
      'anwendungsentwicklung': {
        modulesCompleted: 0,
        quizzesTaken: 0,
        averageQuizScore: 0,
        lastActivity: null
      },
      'allgemein': {
        modulesCompleted: 0,
        quizzesTaken: 0,
        averageQuizScore: 0,
        lastActivity: null
      }
    };

    // Count modules by category
    if (migratedProgress.modulesCompleted) {
      migratedProgress.modulesCompleted.forEach(module => {
        const category = module.threeTierCategory || 'allgemein';
        if (categoryProgress[category]) {
          categoryProgress[category].modulesCompleted++;
        }
      });
    }

    // Count quizzes and calculate averages by category
    if (migratedProgress.quizAttempts) {
      const categoryQuizScores = {
        'daten-prozessanalyse': [],
        'anwendungsentwicklung': [],
        'allgemein': []
      };

      migratedProgress.quizAttempts.forEach(attempt => {
        const category = attempt.threeTierCategory || 'allgemein';
        if (categoryProgress[category]) {
          categoryProgress[category].quizzesTaken++;
          categoryQuizScores[category].push(attempt.score);
          
          // Update last activity
          if (!categoryProgress[category].lastActivity || 
              new Date(attempt.date) > new Date(categoryProgress[category].lastActivity)) {
            categoryProgress[category].lastActivity = attempt.date;
          }
        }
      });

      // Calculate average scores
      Object.keys(categoryQuizScores).forEach(category => {
        const scores = categoryQuizScores[category];
        if (scores.length > 0) {
          categoryProgress[category].averageQuizScore = 
            Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        }
      });
    }

    return {
      summary: categoryProgress,
      generatedAt: new Date().toISOString(),
      totalCategories: Object.keys(categoryProgress).length
    };
  }

  /**
   * Generate specialization-specific category breakdown
   * @private
   * @param {Object} specializationProgress - Specialization progress data
   * @param {string} specializationId - Specialization identifier
   * @returns {Object} Category breakdown for specialization
   */
  async _generateSpecializationCategoryBreakdown(specializationProgress, specializationId) {
    // Similar to _generateThreeTierCategoryProgress but specialization-specific
    const breakdown = await this._generateThreeTierCategoryProgress(specializationProgress);
    
    // Add specialization-specific relevance information
    const categories = this.categoryMappingService.getThreeTierCategories();
    categories.forEach(category => {
      const relevance = this.categoryMappingService.getCategoryRelevance(category.id, specializationId);
      if (breakdown.summary[category.id]) {
        breakdown.summary[category.id].relevanceForSpecialization = relevance;
      }
    });

    return breakdown;
  }

  /**
   * Get module metadata for category mapping
   * @private
   * @param {string} moduleId - Module identifier
   * @returns {Object|null} Module metadata or null if not found
   */
  async _getModuleMetadata(moduleId) {
    try {
      // Try to get module from module service if available
      if (this.moduleService) {
        const modules = await this.moduleService.getModules();
        return modules.find(module => module.id === moduleId);
      }
      
      // Fallback: create minimal metadata from ID
      return {
        id: moduleId,
        category: this._extractCategoryFromId(moduleId)
      };
    } catch (error) {
      console.warn(`Could not get metadata for module ${moduleId}:`, error);
      return null;
    }
  }

  /**
   * Get quiz metadata for category mapping
   * @private
   * @param {string} quizId - Quiz identifier
   * @returns {Object|null} Quiz metadata or null if not found
   */
  async _getQuizMetadata(quizId) {
    try {
      // Try to get quiz from quiz service if available
      if (this.quizService) {
        const quizzes = await this.quizService.getQuizzes();
        return quizzes.find(quiz => quiz.id === quizId);
      }
      
      // Fallback: create minimal metadata from ID
      return {
        id: quizId,
        category: this._extractCategoryFromId(quizId)
      };
    } catch (error) {
      console.warn(`Could not get metadata for quiz ${quizId}:`, error);
      return null;
    }
  }

  /**
   * Extract category from content ID using patterns
   * @private
   * @param {string} contentId - Content identifier
   * @returns {string} Extracted category or empty string
   */
  _extractCategoryFromId(contentId) {
    if (!contentId) return '';
    
    // Match common category patterns
    const patterns = [
      /^(BP-DPA-\d+)/i,
      /^(BP-AE-\d+)/i,
      /^(FÜ-\d+)/i,
      /^(FUE-\d+)/i,
      /^(bp-dpa-)/i,
      /^(bp-ae-)/i,
      /^(fue-)/i
    ];

    for (const pattern of patterns) {
      const match = contentId.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return '';
  }

  /**
   * Infer three-tier category from content ID
   * @private
   * @param {string} contentId - Content identifier
   * @returns {string} Inferred three-tier category
   */
  _inferCategoryFromId(contentId) {
    if (!contentId) return 'allgemein';

    const id = contentId.toLowerCase();
    
    if (id.includes('bp-dpa') || id.includes('dpa-')) {
      return 'daten-prozessanalyse';
    }
    
    if (id.includes('bp-ae') || id.includes('ae-')) {
      return 'anwendungsentwicklung';
    }
    
    return 'allgemein';
  }

  /**
   * Generate unique migration identifier
   * @private
   * @returns {string} Migration ID
   */
  _generateMigrationId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `migration-${timestamp}-${random}`;
  }

  /**
   * Create backup of current progress before migration
   * @private
   * @param {Object} currentProgress - Current progress data
   * @param {string} migrationId - Migration identifier
   * @returns {Object} Backup result
   */
  async _createProgressBackup(currentProgress, migrationId) {
    try {
      const backupId = `backup-${migrationId}`;
      const backupData = {
        backupId,
        createdAt: new Date().toISOString(),
        migrationId,
        originalProgress: JSON.parse(JSON.stringify(currentProgress)), // Deep copy
        backupVersion: this.migrationVersion
      };

      // Store backup in localStorage with special key
      const backupKey = `progress_backup_${backupId}`;
      this.storageService.setItem(backupKey, backupData);

      // Also store backup reference in migration history
      const migrationHistory = this.storageService.getItem('migration_history') || [];
      migrationHistory.push({
        migrationId,
        backupId,
        createdAt: backupData.createdAt,
        type: 'progress_migration'
      });
      this.storageService.setItem('migration_history', migrationHistory);

      return {
        success: true,
        backupId,
        backupKey
      };

    } catch (error) {
      console.error('Failed to create progress backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate current progress structure before migration
   * @private
   * @param {Object} currentProgress - Current progress data
   * @returns {Object} Validation result
   */
  _validateCurrentProgress(currentProgress) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check basic structure
    if (!currentProgress || typeof currentProgress !== 'object') {
      result.isValid = false;
      result.errors.push('Progress data is not a valid object');
      return result;
    }

    // Validate modules completed
    if (currentProgress.modulesCompleted && !Array.isArray(currentProgress.modulesCompleted)) {
      result.isValid = false;
      result.errors.push('modulesCompleted is not an array');
    }

    // Validate modules in progress
    if (currentProgress.modulesInProgress && !Array.isArray(currentProgress.modulesInProgress)) {
      result.isValid = false;
      result.errors.push('modulesInProgress is not an array');
    }

    // Validate quiz attempts
    if (currentProgress.quizAttempts && !Array.isArray(currentProgress.quizAttempts)) {
      result.isValid = false;
      result.errors.push('quizAttempts is not an array');
    } else if (currentProgress.quizAttempts) {
      // Validate quiz attempt structure
      currentProgress.quizAttempts.forEach((attempt, index) => {
        if (!attempt.quizId) {
          result.warnings.push(`Quiz attempt ${index} missing quizId`);
        }
        if (typeof attempt.score !== 'number') {
          result.warnings.push(`Quiz attempt ${index} has invalid score`);
        }
      });
    }

    // Check for already migrated data
    if (currentProgress.migrationInfo) {
      result.warnings.push('Progress appears to have been migrated already');
    }

    return result;
  }

  /**
   * Verify migration integrity by comparing before and after
   * @private
   * @param {Object} originalProgress - Original progress data
   * @param {Object} migratedProgress - Migrated progress data
   * @returns {Object} Verification result
   */
  async _verifyMigrationIntegrity(originalProgress, migratedProgress) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Verify no data loss in modules completed
      const originalModulesCount = originalProgress.modulesCompleted?.length || 0;
      const migratedModulesCount = migratedProgress.modulesCompleted?.length || 0;
      
      if (migratedModulesCount < originalModulesCount) {
        result.isValid = false;
        result.errors.push(`Module data loss: ${originalModulesCount} -> ${migratedModulesCount}`);
      }

      // Verify no data loss in quiz attempts
      const originalQuizzesCount = originalProgress.quizAttempts?.length || 0;
      const migratedQuizzesCount = migratedProgress.quizAttempts?.length || 0;
      
      if (migratedQuizzesCount < originalQuizzesCount) {
        result.isValid = false;
        result.errors.push(`Quiz data loss: ${originalQuizzesCount} -> ${migratedQuizzesCount}`);
      }

      // Verify specialization progress preservation
      if (originalProgress.specializationProgress) {
        const originalSpecCount = Object.keys(originalProgress.specializationProgress).length;
        const migratedSpecCount = Object.keys(migratedProgress.specializationProgress || {}).length;
        
        if (migratedSpecCount < originalSpecCount) {
          result.warnings.push(`Specialization progress count changed: ${originalSpecCount} -> ${migratedSpecCount}`);
        }
      }

      // Verify three-tier category assignments
      if (migratedProgress.modulesCompleted) {
        const unassignedModules = migratedProgress.modulesCompleted.filter(
          module => !module.threeTierCategory
        );
        if (unassignedModules.length > 0) {
          result.warnings.push(`${unassignedModules.length} modules without three-tier category assignment`);
        }
      }

      if (migratedProgress.quizAttempts) {
        const unassignedQuizzes = migratedProgress.quizAttempts.filter(
          attempt => !attempt.threeTierCategory
        );
        if (unassignedQuizzes.length > 0) {
          result.warnings.push(`${unassignedQuizzes.length} quiz attempts without three-tier category assignment`);
        }
      }

      // Verify migration metadata
      if (!migratedProgress.migrationInfo) {
        result.warnings.push('Migration metadata missing');
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Verification failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Mark migration as completed in storage
   * @private
   * @param {string} migrationId - Migration identifier
   * @param {Object} migrationSummary - Migration summary data
   */
  async _markMigrationCompleted(migrationId, migrationSummary) {
    try {
      const completedMigrations = this.storageService.getItem('completed_migrations') || [];
      completedMigrations.push({
        migrationId,
        completedAt: new Date().toISOString(),
        version: this.migrationVersion,
        summary: migrationSummary
      });
      this.storageService.setItem('completed_migrations', completedMigrations);
    } catch (error) {
      console.warn('Failed to mark migration as completed:', error);
    }
  }

  /**
   * Rollback migration using backup data
   * @param {string} migrationId - Migration identifier to rollback
   * @returns {Object} Rollback result
   */
  async rollbackMigration(migrationId) {
    try {
      const backupId = `backup-${migrationId}`;
      const backupKey = `progress_backup_${backupId}`;
      
      const backupData = this.storageService.getItem(backupKey);
      if (!backupData) {
        throw new Error(`Backup not found for migration ${migrationId}`);
      }

      // Restore original progress
      this.stateManager.setState('progress', backupData.originalProgress);

      // Mark rollback in history
      const rollbackHistory = this.storageService.getItem('rollback_history') || [];
      rollbackHistory.push({
        migrationId,
        rolledBackAt: new Date().toISOString(),
        backupId
      });
      this.storageService.setItem('rollback_history', rollbackHistory);

      return {
        success: true,
        migrationId,
        backupId,
        message: 'Migration successfully rolled back'
      };

    } catch (error) {
      console.error('Migration rollback failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get migration history and status
   * @returns {Object} Migration history information
   */
  getMigrationHistory() {
    try {
      return {
        completed: this.storageService.getItem('completed_migrations') || [],
        rollbacks: this.storageService.getItem('rollback_history') || [],
        backups: this.storageService.getItem('migration_history') || []
      };
    } catch (error) {
      console.error('Failed to get migration history:', error);
      return {
        completed: [],
        rollbacks: [],
        backups: []
      };
    }
  }

  /**
   * Check if progress has been migrated to three-tier categories
   * @returns {boolean} True if already migrated
   */
  isProgressMigrated() {
    try {
      const currentProgress = this.stateManager.getState('progress') || {};
      return !!(currentProgress.migrationInfo && 
                currentProgress.migrationInfo.targetStructure === 'three-tier-categories');
    } catch (error) {
      console.error('Failed to check migration status:', error);
      return false;
    }
  }
}

export default ProgressMigrationService;