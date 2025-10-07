/**
 * MigrationToolsIntegration - Integrates all migration and validation tools
 * Provides a unified interface for migration operations, validation, and monitoring
 */
class MigrationToolsIntegration {
  constructor(
    progressMigrationService,
    categoryValidationService,
    migrationMonitoringService,
    categoryMappingService,
    storageService,
    stateManager
  ) {
    this.progressMigrationService = progressMigrationService;
    this.categoryValidationService = categoryValidationService;
    this.migrationMonitoringService = migrationMonitoringService;
    this.categoryMappingService = categoryMappingService;
    this.storageService = storageService;
    this.stateManager = stateManager;
  }

  /**
   * Perform complete migration with monitoring and validation
   * @param {Object} options - Migration options
   * @returns {Object} Complete migration result
   */
  async performCompleteMigration(options = {}) {
    try {
      console.warn(
        'Starting complete migration with monitoring and validation...'
      );

      // Step 1: Pre-migration validation
      console.warn('Step 1: Pre-migration validation...');
      const preValidation =
        await this.categoryValidationService.validateAllContentCategorization();

      if (preValidation.summary.overallStatus === 'error' && !options.force) {
        throw new Error(
          'Pre-migration validation failed. Use force option to proceed anyway.'
        );
      }

      // Step 2: Start migration monitoring
      console.warn('Step 2: Starting migration monitoring...');
      const migrationId = this._generateMigrationId();
      const monitoringResult =
        this.migrationMonitoringService.startMigrationMonitoring(migrationId, {
          type: 'complete_migration',
          options: options,
          preValidationStatus: preValidation.summary.overallStatus,
        });

      if (!monitoringResult.success) {
        throw new Error(
          `Failed to start monitoring: ${monitoringResult.error}`
        );
      }

      const sessionId = monitoringResult.sessionId;

      try {
        // Step 3: Execute migration
        console.warn('Step 3: Executing migration...');
        this.migrationMonitoringService.updateMigrationProgress(sessionId, {
          checkpoint: {
            phase: 'migration_start',
            description: 'Starting user progress migration',
          },
        });

        const migrationResult =
          await this.progressMigrationService.migrateUserProgress(options);

        this.migrationMonitoringService.updateMigrationProgress(sessionId, {
          itemsProcessed: migrationResult.summary?.modulesProcessed || 0,
          itemsTotal: migrationResult.summary?.modulesProcessed || 0,
          checkpoint: {
            phase: 'migration_complete',
            description: 'User progress migration completed',
          },
        });

        if (!migrationResult.success) {
          throw new Error(`Migration failed: ${migrationResult.error}`);
        }

        // Step 4: Post-migration validation
        console.warn('Step 4: Post-migration validation...');
        this.migrationMonitoringService.updateMigrationProgress(sessionId, {
          checkpoint: {
            phase: 'post_validation_start',
            description: 'Starting post-migration validation',
          },
        });

        const postValidationReport =
          await this.migrationMonitoringService.generatePostMigrationValidationReport(
            migrationId
          );

        // Step 5: Complete monitoring
        console.warn('Step 5: Completing monitoring...');
        const completionResult =
          this.migrationMonitoringService.completeMigrationMonitoring(
            sessionId,
            {
              success: true,
              migrationResult,
              postValidationReport,
            }
          );

        return {
          success: true,
          migrationId,
          sessionId,
          preValidation,
          migrationResult,
          postValidationReport,
          monitoringResult: completionResult,
          summary: {
            totalSteps: 5,
            completedSteps: 5,
            migrationStatus: 'completed',
            validationStatus: postValidationReport.overallStatus,
            duration: completionResult.duration,
          },
        };
      } catch (migrationError) {
        // Handle migration failure
        console.error('Migration failed:', migrationError);

        this.migrationMonitoringService.completeMigrationMonitoring(sessionId, {
          success: false,
          error: migrationError.message,
        });

        throw migrationError;
      }
    } catch (error) {
      console.error('Complete migration failed:', error);
      return {
        success: false,
        error: error.message,
        migrationId: null,
        sessionId: null,
      };
    }
  }

  /**
   * Validate migration readiness
   * @returns {Object} Readiness assessment
   */
  async validateMigrationReadiness() {
    try {
      console.warn('Validating migration readiness...');

      const readinessCheck = {
        overall: 'ready',
        checks: {},
        warnings: [],
        blockers: [],
      };

      // Check if already migrated
      const alreadyMigrated =
        this.progressMigrationService.isProgressMigrated();
      readinessCheck.checks.alreadyMigrated = {
        status: alreadyMigrated ? 'warning' : 'pass',
        message: alreadyMigrated
          ? 'Progress appears to be already migrated'
          : 'Progress not yet migrated',
      };

      if (alreadyMigrated) {
        readinessCheck.warnings.push('Progress appears to be already migrated');
      }

      // Check category mapping service
      const mappingRulesValidation =
        this.categoryMappingService.validateMappingRules();
      readinessCheck.checks.mappingRules = {
        status: mappingRulesValidation.status === 'success' ? 'pass' : 'fail',
        message: `Mapping rules validation: ${mappingRulesValidation.status}`,
        details: mappingRulesValidation,
      };

      if (mappingRulesValidation.status === 'error') {
        readinessCheck.blockers.push(
          'Category mapping rules validation failed'
        );
        readinessCheck.overall = 'blocked';
      }

      // Check storage availability
      try {
        this.storageService.setItem('migration_readiness_test', 'test');
        this.storageService.removeItem('migration_readiness_test');
        readinessCheck.checks.storage = {
          status: 'pass',
          message: 'Storage service is available',
        };
      } catch (storageError) {
        readinessCheck.checks.storage = {
          status: 'fail',
          message: `Storage service error: ${storageError.message}`,
        };
        readinessCheck.blockers.push('Storage service is not available');
        readinessCheck.overall = 'blocked';
      }

      // Check current progress data
      const currentProgress = this.stateManager.getState('progress') || {};
      const hasProgressData = Object.keys(currentProgress).length > 0;
      readinessCheck.checks.progressData = {
        status: hasProgressData ? 'pass' : 'warning',
        message: hasProgressData
          ? 'Progress data found'
          : 'No progress data found',
      };

      if (!hasProgressData) {
        readinessCheck.warnings.push('No existing progress data to migrate');
      }

      // Set overall status
      if (readinessCheck.blockers.length > 0) {
        readinessCheck.overall = 'blocked';
      } else if (readinessCheck.warnings.length > 0) {
        readinessCheck.overall = 'ready_with_warnings';
      }

      return {
        success: true,
        readiness: readinessCheck,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Migration readiness validation failed:', error);
      return {
        success: false,
        error: error.message,
        readiness: {
          overall: 'error',
          checks: {},
          warnings: [],
          blockers: [`Readiness check failed: ${error.message}`],
        },
      };
    }
  }

  /**
   * Get comprehensive migration status
   * @returns {Object} Complete migration status
   */
  getMigrationStatus() {
    try {
      const migrationHistory =
        this.progressMigrationService.getMigrationHistory();
      const monitoringSessions =
        this.migrationMonitoringService.getAllMonitoringSessions();
      const isAlreadyMigrated =
        this.progressMigrationService.isProgressMigrated();

      return {
        success: true,
        status: {
          isMigrated: isAlreadyMigrated,
          history: migrationHistory,
          monitoring: {
            activeSessions: monitoringSessions.active.length,
            completedSessions: monitoringSessions.completed.length,
            failedSessions: monitoringSessions.failed.length,
            totalSessions: monitoringSessions.total,
          },
          lastMigration:
            migrationHistory.completed.length > 0
              ? migrationHistory.completed[
                  migrationHistory.completed.length - 1
                ]
              : null,
          lastRollback:
            migrationHistory.rollbacks.length > 0
              ? migrationHistory.rollbacks[
                  migrationHistory.rollbacks.length - 1
                ]
              : null,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get migration status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Perform rollback with monitoring
   * @param {string} migrationId - Migration ID to rollback
   * @param {Object} options - Rollback options
   * @returns {Object} Rollback result
   */
  async performMonitoredRollback(migrationId, options = {}) {
    try {
      console.warn(
        `Starting monitored rollback for migration ${migrationId}...`
      );

      // Validate rollback request
      const migrationHistory =
        this.progressMigrationService.getMigrationHistory();
      const migrationExists = migrationHistory.completed.some(
        m => m.migrationId === migrationId
      );

      if (!migrationExists) {
        throw new Error(
          `Migration ${migrationId} not found in completed migrations`
        );
      }

      // Execute rollback with monitoring
      const rollbackResult =
        await this.migrationMonitoringService.rollbackMigration(
          migrationId,
          options
        );

      if (rollbackResult.success) {
        // Generate post-rollback validation
        const postRollbackValidation =
          await this.categoryValidationService.validateAllContentCategorization();

        return {
          success: true,
          migrationId,
          rollbackResult,
          postRollbackValidation,
          summary: {
            rollbackCompleted: true,
            stepsCompleted: rollbackResult.steps?.length || 0,
            verificationPassed: rollbackResult.verificationPassed,
            validationStatus: postRollbackValidation.summary.overallStatus,
          },
        };
      } else {
        throw new Error(`Rollback failed: ${rollbackResult.error}`);
      }
    } catch (error) {
      console.error('Monitored rollback failed:', error);
      return {
        success: false,
        error: error.message,
        migrationId,
      };
    }
  }

  /**
   * Generate comprehensive migration report
   * @param {string} migrationId - Optional migration ID for specific report
   * @returns {Object} Comprehensive report
   */
  async generateComprehensiveReport(migrationId = null) {
    try {
      console.warn('Generating comprehensive migration report...');

      const report = {
        reportId: this._generateReportId(),
        generatedAt: new Date().toISOString(),
        type: migrationId ? 'specific_migration' : 'system_overview',
      };

      // Get migration monitoring report
      const monitoringReport =
        this.migrationMonitoringService.generateMigrationReport(migrationId);

      // Get validation report
      const validationReport =
        await this.categoryValidationService.validateAllContentCategorization();

      // Get conflict report
      const conflictReport =
        await this.categoryValidationService.createConflictReport();

      // Get assignment suggestions
      const assignmentSuggestions =
        await this.categoryValidationService.generateAssignmentSuggestions();

      // Combine all reports
      report.monitoring = monitoringReport;
      report.validation = validationReport;
      report.conflicts = conflictReport;
      report.suggestions = assignmentSuggestions;

      // Generate executive summary
      report.executiveSummary = this._generateExecutiveSummary(report);

      return {
        success: true,
        report,
      };
    } catch (error) {
      console.error('Failed to generate comprehensive report:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Private helper methods

  /**
   * Generate migration ID
   * @private
   * @returns {string} Migration ID
   */
  _generateMigrationId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `migration-${timestamp}-${random}`;
  }

  /**
   * Generate report ID
   * @private
   * @returns {string} Report ID
   */
  _generateReportId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `comprehensive-report-${timestamp}-${random}`;
  }

  /**
   * Generate executive summary from all reports
   * @private
   * @param {Object} report - Complete report data
   * @returns {Object} Executive summary
   */
  _generateExecutiveSummary(report) {
    const summary = {
      overallStatus: 'success',
      keyFindings: [],
      criticalIssues: [],
      recommendations: [],
      metrics: {},
    };

    // Analyze monitoring data
    if (report.monitoring && report.monitoring.summary) {
      summary.metrics.migrationSuccess =
        report.monitoring.summary.successRate || 0;
      summary.metrics.processingRate =
        report.monitoring.summary.averageProcessingRate || 0;
    }

    // Analyze validation data
    if (report.validation && report.validation.summary) {
      summary.metrics.validationStatus =
        report.validation.summary.overallStatus;

      if (report.validation.summary.overallStatus === 'error') {
        summary.criticalIssues.push('Content validation failed');
        summary.overallStatus = 'error';
      }
    }

    // Analyze conflicts
    if (report.conflicts && report.conflicts.conflictSummary) {
      summary.metrics.totalConflicts =
        report.conflicts.conflictSummary.totalConflicts || 0;

      if (summary.metrics.totalConflicts > 0) {
        summary.keyFindings.push(
          `${summary.metrics.totalConflicts} category assignment conflicts detected`
        );
      }
    }

    // Analyze suggestions
    if (report.suggestions && report.suggestions.suggestionsCount) {
      summary.metrics.optimizationOpportunities =
        report.suggestions.suggestionsCount;

      if (report.suggestions.suggestionsCount > 0) {
        summary.recommendations.push(
          `${report.suggestions.suggestionsCount} optimization opportunities identified`
        );
      }
    }

    return summary;
  }
}

export default MigrationToolsIntegration;
