# Migration and Validation Tools

This document describes the migration and validation tools implemented for the three-tier category system transition.

## Overview

The migration tools provide comprehensive functionality for:

- **User Progress Migration**: Safely migrate existing user progress to the new three-tier category structure
- **Category Assignment Validation**: Validate and optimize content categorization
- **Migration Monitoring**: Track migration progress and handle rollbacks
- **Integration Tools**: Unified interface for all migration operations

## Services

### 1. ProgressMigrationService

Handles migration of user progress data to the three-tier category system.

**Key Features:**

- Preserves all existing progress data (modules completed, quiz attempts, specialization progress)
- Maps content to new three-tier categories using CategoryMappingService
- Creates backups before migration
- Supports rollback functionality
- Validates migration integrity

**Usage:**

```javascript
const migrationResult = await progressMigrationService.migrateUserProgress({
  force: false, // Set to true to proceed despite validation warnings
});
```

### 2. CategoryValidationService

Provides comprehensive validation for content categorization.

**Key Features:**

- Validates category mappings for all content
- Detects category assignment conflicts
- Analyzes category distribution and specialization relevance
- Generates optimization suggestions
- Creates detailed validation reports

**Usage:**

```javascript
// Validate all content categorization
const validationResult =
  await categoryValidationService.validateAllContentCategorization();

// Generate conflict report
const conflictReport = await categoryValidationService.createConflictReport();

// Get assignment suggestions
const suggestions =
  await categoryValidationService.generateAssignmentSuggestions();
```

### 3. MigrationMonitoringService

Monitors migration progress and provides rollback capabilities.

**Key Features:**

- Real-time migration progress tracking
- Performance metrics and alerts
- Rollback functionality with integrity verification
- Post-migration validation reports
- Migration history and status tracking

**Usage:**

```javascript
// Start monitoring
const monitoringResult =
  migrationMonitoringService.startMigrationMonitoring(migrationId);

// Update progress
migrationMonitoringService.updateMigrationProgress(sessionId, {
  itemsProcessed: 50,
  itemsTotal: 100,
  checkpoint: { phase: 'processing', description: 'Processing modules' },
});

// Rollback migration
const rollbackResult =
  await migrationMonitoringService.rollbackMigration(migrationId);
```

### 4. MigrationToolsIntegration

Unified interface that combines all migration tools.

**Key Features:**

- Complete migration workflow with monitoring and validation
- Migration readiness assessment
- Comprehensive reporting
- Monitored rollback operations

**Usage:**

```javascript
// Perform complete migration
const result = await migrationToolsIntegration.performCompleteMigration({
  force: false,
});

// Check migration readiness
const readiness = await migrationToolsIntegration.validateMigrationReadiness();

// Generate comprehensive report
const report = await migrationToolsIntegration.generateComprehensiveReport();
```

## Migration Utilities

The `migrationUtils.js` file provides convenient helper functions:

```javascript
import migrationUtils from './src/utils/migrationUtils.js';

// Check if migration is needed
const needsMigration = migrationUtils.isMigrationNeeded(stateManager);

// Execute migration with progress callback
const result = await migrationUtils.executeMigrationWithProgress(
  migrationServices,
  progress => console.log(progress),
  { force: false }
);

// Get formatted migration status
const status = migrationUtils.getMigrationStatusFormatted(migrationServices);
```

## Migration Workflow

### 1. Pre-Migration Assessment

```javascript
// Check if migration is needed
const needsMigration = migrationUtils.isMigrationNeeded(stateManager);

if (needsMigration) {
  // Validate readiness
  const readiness = await migrationUtils.quickReadinessCheck(migrationServices);

  if (readiness.readiness.overall === 'blocked') {
    console.error('Migration blocked:', readiness.readiness.blockers);
    return;
  }
}
```

### 2. Execute Migration

```javascript
// Execute with progress tracking
const migrationResult = await migrationUtils.executeMigrationWithProgress(
  migrationServices,
  progress => {
    console.log(
      `${progress.phase}: ${progress.progress}% - ${progress.message}`
    );
  },
  { force: false }
);

if (migrationResult.success) {
  console.log('Migration completed successfully');
} else {
  console.error('Migration failed:', migrationResult.error);
}
```

### 3. Post-Migration Validation

```javascript
// Generate summary report
const summary =
  await migrationUtils.generateMigrationSummary(migrationServices);

if (summary.success) {
  console.log('Migration Summary:', summary.summary);

  // Check for critical issues
  if (summary.summary.criticalIssues.length > 0) {
    console.warn('Critical issues found:', summary.summary.criticalIssues);
  }
}
```

### 4. Rollback (if needed)

```javascript
// Rollback with confirmation
const rollbackResult = await migrationUtils.rollbackMigrationWithConfirmation(
  migrationServices,
  migrationId,
  true, // confirmed
  { force: false }
);

if (rollbackResult.success) {
  console.log('Rollback completed successfully');
} else {
  console.error('Rollback failed:', rollbackResult.error);
}
```

## Data Structure Changes

### Before Migration

```javascript
{
  modulesCompleted: ["module-1", "module-2"],
  quizAttempts: [
    { quizId: "quiz-1", score: 85, date: "2024-01-01" }
  ],
  specializationProgress: {
    "anwendungsentwicklung": { /* progress data */ }
  }
}
```

### After Migration

```javascript
{
  modulesCompleted: [
    {
      id: "module-1",
      originalId: "module-1",
      threeTierCategory: "anwendungsentwicklung",
      categoryMappingInfo: { /* mapping details */ },
      migratedAt: "2024-01-15T10:00:00Z"
    }
  ],
  quizAttempts: [
    {
      quizId: "quiz-1",
      originalQuizId: "quiz-1",
      score: 85,
      date: "2024-01-01",
      threeTierCategory: "anwendungsentwicklung",
      categoryMappingInfo: { /* mapping details */ },
      migratedAt: "2024-01-15T10:00:00Z"
    }
  ],
  threeTierCategoryProgress: {
    "anwendungsentwicklung": { /* category-specific progress */ },
    "daten-prozessanalyse": { /* category-specific progress */ },
    "allgemein": { /* category-specific progress */ }
  },
  migrationInfo: {
    version: "1.0.0",
    migrationId: "migration-2024-01-15T10-00-00-abc123",
    migratedAt: "2024-01-15T10:00:00Z",
    originalStructure: "legacy-categories",
    targetStructure: "three-tier-categories"
  }
}
```

## Error Handling

All migration operations include comprehensive error handling:

- **Validation Errors**: Pre-migration validation prevents data corruption
- **Migration Failures**: Automatic rollback on critical failures
- **Backup Creation**: All operations create backups before making changes
- **Integrity Verification**: Post-operation verification ensures data consistency

## Monitoring and Alerts

The monitoring system provides:

- **Real-time Progress**: Track migration progress with detailed metrics
- **Performance Alerts**: Automatic alerts for slow processing or high error rates
- **Health Status**: Overall system health monitoring during migrations
- **Detailed Logging**: Comprehensive logs for troubleshooting

## Best Practices

1. **Always validate readiness** before starting migration
2. **Monitor progress** during migration operations
3. **Verify results** after migration completion
4. **Keep backups** until migration is confirmed successful
5. **Test rollback procedures** in development environment
6. **Review validation reports** for optimization opportunities

## Troubleshooting

### Common Issues

1. **Migration appears stalled**
   - Check monitoring alerts for performance issues
   - Verify storage service availability
   - Review error logs for specific failures

2. **Validation failures**
   - Review category mapping rules
   - Check content metadata completeness
   - Verify specialization service configuration

3. **Rollback failures**
   - Ensure backup data is available
   - Check storage service permissions
   - Verify migration history integrity

### Support

For additional support or issues:

1. Check the monitoring dashboard for real-time status
2. Review validation reports for specific error details
3. Examine migration history for previous successful operations
4. Use the comprehensive reporting tools for detailed analysis
