// @ts-nocheck
/* eslint-env node */
/**
 * Final Validation Report Generator
 * Generates a comprehensive final report with summary statistics and historical context
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Load existing validation report
 */
function loadValidationReport() {
  const reportPath = path.join(rootDir, 'COMPREHENSIVE_VALIDATION_REPORT.json');

  if (!fs.existsSync(reportPath)) {
    throw new Error(
      'Comprehensive validation report not found. Run validate-comprehensive.js first.'
    );
  }

  return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
}

/**
 * Load historical reports if they exist
 */
function loadHistoricalReports() {
  const reports = {};

  const reportFiles = [
    'UTF8_ENCODING_REPORT.json',
    'JSON_STRUCTURE_VALIDATION_REPORT.json',
    'MARKDOWN_CONTENT_VALIDATION_REPORT.json',
    'ROUTE_AUDIT_REPORT.json',
  ];

  reportFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      try {
        reports[file] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch {
        // Skip invalid reports
      }
    }
  });

  return reports;
}

/**
 * Count files processed during cleanup
 */
function countProcessedFiles() {
  const stats = {
    totalModules: 0,
    totalQuizzes: 0,
    totalLearningPaths: 0,
  };

  const modulesDir = path.join(rootDir, 'src', 'data', 'ihk', 'modules');
  const quizzesDir = path.join(rootDir, 'src', 'data', 'ihk', 'quizzes');
  const pathsDir = path.join(rootDir, 'src', 'data', 'ihk', 'learning-paths');

  if (fs.existsSync(modulesDir)) {
    stats.totalModules = fs
      .readdirSync(modulesDir)
      .filter(f => f.endsWith('.json')).length;
  }

  if (fs.existsSync(quizzesDir)) {
    stats.totalQuizzes = fs
      .readdirSync(quizzesDir)
      .filter(f => f.endsWith('.json')).length;
  }

  if (fs.existsSync(pathsDir)) {
    stats.totalLearningPaths = fs
      .readdirSync(pathsDir)
      .filter(f => f.endsWith('.json')).length;
  }

  return stats;
}

/**
 * Check for remaining issues that need manual review
 */
function identifyManualReviewItems(validationReport) {
  const manualReviewItems = [];

  // Check for files with errors
  const filesWithErrors = validationReport.files.filter(f => f.errorCount > 0);
  if (filesWithErrors.length > 0) {
    manualReviewItems.push({
      category: 'Validation Errors',
      count: filesWithErrors.length,
      description: 'Files with validation errors that need to be fixed',
      files: filesWithErrors.map(f => f.file),
    });
  }

  // Check for invalid references
  if (
    validationReport.invalidReferences &&
    validationReport.invalidReferences.length > 0
  ) {
    manualReviewItems.push({
      category: 'Invalid References',
      count: validationReport.invalidReferences.length,
      description:
        'Module prerequisites or quiz references that point to non-existent items',
      items: validationReport.invalidReferences,
    });
  }

  // Check for files with many warnings
  const filesWithManyWarnings = validationReport.files.filter(
    f => f.warningCount > 50
  );
  if (filesWithManyWarnings.length > 0) {
    manualReviewItems.push({
      category: 'High Warning Count',
      count: filesWithManyWarnings.length,
      description:
        'Files with more than 50 formatting warnings (may need review)',
      files: filesWithManyWarnings.map(f => ({
        file: f.file,
        warnings: f.warningCount,
      })),
    });
  }

  return manualReviewItems;
}

/**
 * Generate summary of fixes applied
 */
function generateFixesSummary(historicalReports) {
  const summary = {
    encodingFixes: 0,
    structureFixes: 0,
    routeFixes: 0,
    fileCleanup: 0,
  };

  // Check UTF-8 encoding report
  if (historicalReports['UTF8_ENCODING_REPORT.json']) {
    const report = historicalReports['UTF8_ENCODING_REPORT.json'];
    if (report.summary && report.summary.totalIssues) {
      summary.encodingFixes = report.summary.totalIssues;
    }
  }

  // Check route audit report
  if (historicalReports['ROUTE_AUDIT_REPORT.json']) {
    const report = historicalReports['ROUTE_AUDIT_REPORT.json'];
    if (report.summary) {
      summary.routeFixes =
        (report.summary.deadRoutes || 0) +
        (report.summary.invalidPrerequisites || 0) +
        (report.summary.invalidQuizReferences || 0);
    }
  }

  return summary;
}

/**
 * Generate the final validation report
 */
function generateFinalReport() {
  console.log('📊 Generating final validation report...\n');

  const validationReport = loadValidationReport();
  const historicalReports = loadHistoricalReports();
  const fileStats = countProcessedFiles();
  const manualReviewItems = identifyManualReviewItems(validationReport);
  const fixesSummary = generateFixesSummary(historicalReports);

  const finalReport = {
    metadata: {
      generatedAt: new Date().toISOString(),
      reportVersion: '1.0.0',
      projectName: 'IHK Learning Application',
    },
    executiveSummary: {
      overallStatus:
        validationReport.summary.filesWithErrors === 0 &&
        validationReport.summary.invalidReferences === 0
          ? 'PASSED'
          : 'FAILED',
      totalFilesProcessed:
        fileStats.totalModules +
        fileStats.totalQuizzes +
        fileStats.totalLearningPaths,
      totalIssuesFound: validationReport.summary.totalIssues,
      criticalIssues: validationReport.summary.issuesBySeverity.error,
      warnings: validationReport.summary.issuesBySeverity.warning,
      validationSuccessRate: (
        (validationReport.summary.validFiles /
          validationReport.summary.totalFiles) *
        100
      ).toFixed(2),
    },
    fileStatistics: {
      modules: fileStats.totalModules,
      quizzes: fileStats.totalQuizzes,
      learningPaths: fileStats.totalLearningPaths,
      totalFiles:
        fileStats.totalModules +
        fileStats.totalQuizzes +
        fileStats.totalLearningPaths,
    },
    validationResults: {
      totalFilesValidated: validationReport.summary.totalFiles,
      filesWithNoErrors: validationReport.summary.validFiles,
      filesWithErrors: validationReport.summary.filesWithErrors,
      filesWithWarningsOnly:
        validationReport.summary.filesWithWarnings -
        validationReport.summary.filesWithErrors,
      invalidReferences: validationReport.summary.invalidReferences,
    },
    issueBreakdown: {
      byCategory: validationReport.summary.issuesByCategory,
      bySeverity: validationReport.summary.issuesBySeverity,
    },
    fixesApplied: {
      encodingIssuesFixed: fixesSummary.encodingFixes,
      structureIssuesFixed: fixesSummary.structureFixes,
      routeIssuesFixed: fixesSummary.routeFixes,
      filesCleanedUp: fixesSummary.fileCleanup,
      totalFixesApplied:
        fixesSummary.encodingFixes +
        fixesSummary.structureFixes +
        fixesSummary.routeFixes +
        fixesSummary.fileCleanup,
    },
    manualReviewRequired: {
      itemsRequiringReview: manualReviewItems.length,
      items: manualReviewItems,
    },
    detailedValidation: {
      files: validationReport.files,
      invalidReferences: validationReport.invalidReferences,
    },
    recommendations: generateRecommendations(
      validationReport,
      manualReviewItems
    ),
    historicalContext: {
      previousReports: Object.keys(historicalReports),
      reportCount: Object.keys(historicalReports).length,
    },
  };

  return finalReport;
}

/**
 * Generate recommendations based on validation results
 */
function generateRecommendations(validationReport, manualReviewItems) {
  const recommendations = [];

  if (validationReport.summary.filesWithErrors > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Validation Errors',
      recommendation: `Fix ${validationReport.summary.filesWithErrors} file(s) with validation errors before deployment`,
      action:
        'Review error details in the detailed validation section and fix all critical issues',
    });
  }

  if (validationReport.summary.invalidReferences > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Invalid References',
      recommendation: `Fix ${validationReport.summary.invalidReferences} invalid reference(s) to prevent broken links`,
      action:
        'Update or remove invalid module prerequisites and quiz references',
    });
  }

  if (validationReport.summary.issuesByCategory.encoding > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Encoding Issues',
      recommendation: `Fix ${validationReport.summary.issuesByCategory.encoding} encoding issue(s) for proper German character display`,
      action: 'Run the UTF-8 encoding fix script to correct character encoding',
    });
  }

  if (validationReport.summary.filesWithWarnings > 10) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Formatting Warnings',
      recommendation: `${validationReport.summary.filesWithWarnings} file(s) have formatting warnings`,
      action:
        'Consider fixing markdown formatting issues for better content quality (optional)',
    });
  }

  if (
    manualReviewItems.length === 0 &&
    validationReport.summary.filesWithErrors === 0
  ) {
    recommendations.push({
      priority: 'INFO',
      category: 'Deployment Ready',
      recommendation:
        'All critical validations passed - application is ready for deployment',
      action: 'Proceed with deployment following the deployment checklist',
    });
  }

  return recommendations;
}

/**
 * Generate console output
 */
function printFinalReport(report) {
  console.log(
    '\n╔════════════════════════════════════════════════════════════╗'
  );

  console.log('║          FINAL VALIDATION REPORT                           ║');

  console.log(
    '╚════════════════════════════════════════════════════════════╝\n'
  );

  // Executive Summary

  console.log('📊 EXECUTIVE SUMMARY');

  console.log('─'.repeat(60));

  console.log(
    `Overall Status:           ${report.executiveSummary.overallStatus}`
  );

  console.log(
    `Total Files Processed:    ${report.executiveSummary.totalFilesProcessed}`
  );

  console.log(
    `Validation Success Rate:  ${report.executiveSummary.validationSuccessRate}%`
  );

  console.log(
    `Critical Issues:          ${report.executiveSummary.criticalIssues}`
  );

  console.log(`Warnings:                 ${report.executiveSummary.warnings}`);

  // File Statistics

  console.log('\n📁 FILE STATISTICS');

  console.log('─'.repeat(60));

  console.log(`Modules:                  ${report.fileStatistics.modules}`);

  console.log(`Quizzes:                  ${report.fileStatistics.quizzes}`);

  console.log(
    `Learning Paths:           ${report.fileStatistics.learningPaths}`
  );

  console.log(`Total Files:              ${report.fileStatistics.totalFiles}`);

  // Validation Results

  console.log('\n✅ VALIDATION RESULTS');

  console.log('─'.repeat(60));

  console.log(
    `Files Validated:          ${report.validationResults.totalFilesValidated}`
  );

  console.log(
    `Files with No Errors:     ${report.validationResults.filesWithNoErrors}`
  );

  console.log(
    `Files with Errors:        ${report.validationResults.filesWithErrors}`
  );

  console.log(
    `Files with Warnings Only: ${report.validationResults.filesWithWarningsOnly}`
  );

  console.log(
    `Invalid References:       ${report.validationResults.invalidReferences}`
  );

  // Issue Breakdown

  console.log('\n📋 ISSUE BREAKDOWN BY CATEGORY');

  console.log('─'.repeat(60));
  for (const [category, count] of Object.entries(
    report.issueBreakdown.byCategory
  )) {
    if (count > 0) {
      console.log(`  ${category.padEnd(20)} ${count}`);
    }
  }

  // Fixes Applied

  console.log('\n🔧 FIXES APPLIED');

  console.log('─'.repeat(60));

  console.log(
    `Encoding Issues Fixed:    ${report.fixesApplied.encodingIssuesFixed}`
  );

  console.log(
    `Structure Issues Fixed:   ${report.fixesApplied.structureIssuesFixed}`
  );

  console.log(
    `Route Issues Fixed:       ${report.fixesApplied.routeIssuesFixed}`
  );

  console.log(
    `Files Cleaned Up:         ${report.fixesApplied.filesCleanedUp}`
  );

  console.log(
    `Total Fixes Applied:      ${report.fixesApplied.totalFixesApplied}`
  );

  // Manual Review Required
  if (report.manualReviewRequired.itemsRequiringReview > 0) {
    console.log('\n⚠️  MANUAL REVIEW REQUIRED');

    console.log('─'.repeat(60));

    console.log(
      `Items Requiring Review:   ${report.manualReviewRequired.itemsRequiringReview}`
    );

    report.manualReviewRequired.items.forEach(item => {
      console.log(`\n  ${item.category} (${item.count} items)`);

      console.log(`  ${item.description}`);
    });
  }

  // Recommendations

  console.log('\n💡 RECOMMENDATIONS');

  console.log('─'.repeat(60));
  report.recommendations.forEach((rec, index) => {
    console.log(`\n${index + 1}. [${rec.priority}] ${rec.category}`);

    console.log(`   ${rec.recommendation}`);

    console.log(`   Action: ${rec.action}`);
  });

  console.log('\n');
}

// Main execution
try {
  const finalReport = generateFinalReport();
  printFinalReport(finalReport);

  // Save report
  const reportPath = path.join(rootDir, 'FINAL_VALIDATION_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));

  console.log(`📄 Final validation report saved to: ${reportPath}\n`);

  // Exit with appropriate code

  process.exit(finalReport.executiveSummary.overallStatus === 'PASSED' ? 0 : 1);
} catch (error) {
  console.error(
    '❌ Failed to generate final validation report:',
    error.message
  );

  process.exit(1);
}
