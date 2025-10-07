/**
 * Migration Utilities - Helper functions for migration operations
 * Provides convenient functions for common migration tasks
 */

/**
 * Initialize migration services with proper dependencies
 * @param {Object} dependencies - Service dependencies
 * @returns {Object} Initialized migration services
 */
export function initializeMigrationServices(dependencies) {
  const {
    storageService,
    stateManager,
    categoryMappingService,
    ihkContentService,
    specializationService,
    moduleService,
    quizService
  } = dependencies;

  // Import services dynamically to avoid circular dependencies
  const ProgressMigrationService = dependencies.ProgressMigrationService;
  const CategoryValidationService = dependencies.CategoryValidationService;
  const MigrationMonitoringService = dependencies.MigrationMonitoringService;
  const MigrationToolsIntegration = dependencies.MigrationToolsIntegration;

  // Initialize services in dependency order
  const progressMigrationService = new ProgressMigrationService(
    dependencies.progressService,
    categoryMappingService,
    storageService,
    stateManager
  );

  const categoryValidationService = new CategoryValidationService(
    categoryMappingService,
    ihkContentService,
    specializationService
  );

  const migrationMonitoringService = new MigrationMonitoringService(
    storageService,
    progressMigrationService,
    categoryValidationService
  );

  const migrationToolsIntegration = new MigrationToolsIntegration(
    progressMigrationService,
    categoryValidationService,
    migrationMonitoringService,
    categoryMappingService,
    storageService,
    stateManager
  );

  return {
    progressMigrationService,
    categoryValidationService,
    migrationMonitoringService,
    migrationToolsIntegration
  };
}

/**
 * Check if migration is needed
 * @param {Object} stateManager - State manager instance
 * @returns {boolean} True if migration is needed
 */
export function isMigrationNeeded(stateManager) {
  try {
    const currentProgress = stateManager.getState('progress') || {};
    
    // Check if progress has migration info indicating it's already migrated
    const hasMigrationInfo = currentProgress.migrationInfo && 
                            currentProgress.migrationInfo.targetStructure === 'three-tier-categories';
    
    // Check if there's any progress data to migrate
    const hasProgressData = (currentProgress.modulesCompleted && currentProgress.modulesCompleted.length > 0) ||
                           (currentProgress.quizAttempts && currentProgress.quizAttempts.length > 0) ||
                           (currentProgress.specializationProgress && Object.keys(currentProgress.specializationProgress).length > 0);
    
    return hasProgressData && !hasMigrationInfo;
  } catch (error) {
    console.error('Error checking migration need:', error);
    return false;
  }
}

/**
 * Perform quick migration readiness check
 * @param {Object} migrationServices - Migration services object
 * @returns {Promise<Object>} Readiness check result
 */
export async function quickReadinessCheck(migrationServices) {
  try {
    const { migrationToolsIntegration } = migrationServices;
    return await migrationToolsIntegration.validateMigrationReadiness();
  } catch (error) {
    console.error('Quick readiness check failed:', error);
    return {
      success: false,
      error: error.message,
      readiness: {
        overall: 'error',
        checks: {},
        warnings: [],
        blockers: [`Readiness check failed: ${error.message}`]
      }
    };
  }
}

/**
 * Execute migration with progress callback
 * @param {Object} migrationServices - Migration services object
 * @param {Function} progressCallback - Progress callback function
 * @param {Object} options - Migration options
 * @returns {Promise<Object>} Migration result
 */
export async function executeMigrationWithProgress(migrationServices, progressCallback, options = {}) {
  try {
    const { migrationToolsIntegration } = migrationServices;
    
    // Start migration
    if (progressCallback) {
      progressCallback({ phase: 'starting', progress: 0, message: 'Starting migration...' });
    }

    const result = await migrationToolsIntegration.performCompleteMigration(options);

    if (progressCallback) {
      progressCallback({ 
        phase: 'completed', 
        progress: 100, 
        message: result.success ? 'Migration completed successfully' : 'Migration failed',
        result 
      });
    }

    return result;
  } catch (error) {
    if (progressCallback) {
      progressCallback({ 
        phase: 'error', 
        progress: 0, 
        message: `Migration failed: ${error.message}`,
        error: error.message 
      });
    }
    throw error;
  }
}

/**
 * Generate migration summary report
 * @param {Object} migrationServices - Migration services object
 * @param {string} migrationId - Optional migration ID
 * @returns {Promise<Object>} Summary report
 */
export async function generateMigrationSummary(migrationServices, migrationId = null) {
  try {
    const { migrationToolsIntegration } = migrationServices;
    
    const comprehensiveReport = await migrationToolsIntegration.generateComprehensiveReport(migrationId);
    
    if (!comprehensiveReport.success) {
      throw new Error(comprehensiveReport.error);
    }

    // Extract key information for summary
    const summary = {
      reportId: comprehensiveReport.report.reportId,
      generatedAt: comprehensiveReport.report.generatedAt,
      executiveSummary: comprehensiveReport.report.executiveSummary,
      keyMetrics: {
        migrationSuccess: comprehensiveReport.report.executiveSummary?.metrics?.migrationSuccess || 0,
        validationStatus: comprehensiveReport.report.executiveSummary?.metrics?.validationStatus || 'unknown',
        totalConflicts: comprehensiveReport.report.executiveSummary?.metrics?.totalConflicts || 0,
        optimizationOpportunities: comprehensiveReport.report.executiveSummary?.metrics?.optimizationOpportunities || 0
      },
      recommendations: comprehensiveReport.report.executiveSummary?.recommendations || [],
      criticalIssues: comprehensiveReport.report.executiveSummary?.criticalIssues || []
    };

    return {
      success: true,
      summary,
      fullReport: comprehensiveReport.report
    };

  } catch (error) {
    console.error('Failed to generate migration summary:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate category assignments for specific content
 * @param {Object} migrationServices - Migration services object
 * @param {Array} contentItems - Content items to validate (optional)
 * @returns {Promise<Object>} Validation result
 */
export async function validateCategoryAssignments(migrationServices, contentItems = null) {
  try {
    const { categoryValidationService } = migrationServices;
    
    if (contentItems) {
      // Validate specific content items
      return categoryValidationService.validateCategoryMapping(contentItems);
    } else {
      // Validate all content
      return await categoryValidationService.validateAllContentCategorization();
    }
  } catch (error) {
    console.error('Category validation failed:', error);
    return {
      status: 'error',
      error: error.message,
      totalItems: 0,
      validItems: 0,
      invalidItems: 0,
      warnings: [],
      errors: [error.message],
      details: []
    };
  }
}

/**
 * Get migration status with user-friendly formatting
 * @param {Object} migrationServices - Migration services object
 * @returns {Object} Formatted migration status
 */
export function getMigrationStatusFormatted(migrationServices) {
  try {
    const { migrationToolsIntegration } = migrationServices;
    const status = migrationToolsIntegration.getMigrationStatus();

    if (!status.success) {
      return {
        success: false,
        error: status.error
      };
    }

    const formatted = {
      success: true,
      isMigrated: status.status.isMigrated,
      summary: {
        totalMigrations: status.status.history.completed.length,
        totalRollbacks: status.status.history.rollbacks.length,
        activeSessions: status.status.monitoring.activeSessions,
        lastMigrationDate: status.status.lastMigration?.completedAt || null,
        lastRollbackDate: status.status.lastRollback?.rolledBackAt || null
      },
      status: status.status.isMigrated ? 'migrated' : 'not_migrated',
      message: status.status.isMigrated 
        ? 'Progress has been migrated to three-tier category system'
        : 'Progress has not been migrated yet'
    };

    return formatted;
  } catch (error) {
    console.error('Failed to get formatted migration status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Rollback migration with confirmation
 * @param {Object} migrationServices - Migration services object
 * @param {string} migrationId - Migration ID to rollback
 * @param {boolean} confirmed - Whether rollback is confirmed
 * @param {Object} options - Rollback options
 * @returns {Promise<Object>} Rollback result
 */
export async function rollbackMigrationWithConfirmation(migrationServices, migrationId, confirmed = false, options = {}) {
  try {
    if (!confirmed) {
      return {
        success: false,
        requiresConfirmation: true,
        message: 'Rollback requires explicit confirmation. This will restore previous progress state.',
        migrationId
      };
    }

    const { migrationToolsIntegration } = migrationServices;
    return await migrationToolsIntegration.performMonitoredRollback(migrationId, options);
  } catch (error) {
    console.error('Rollback failed:', error);
    return {
      success: false,
      error: error.message,
      migrationId
    };
  }
}

/**
 * Export migration utilities as default object
 */
export default {
  initializeMigrationServices,
  isMigrationNeeded,
  quickReadinessCheck,
  executeMigrationWithProgress,
  generateMigrationSummary,
  validateCategoryAssignments,
  getMigrationStatusFormatted,
  rollbackMigrationWithConfirmation
};