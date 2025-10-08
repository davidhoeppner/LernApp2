// @ts-nocheck
/* eslint-env node */
/**
 * Comprehensive Integration Test Runner
 * Runs all end-to-end integration tests for the three-tier category system
 * Combines core functionality tests, migration tests, and generates unified report
 */

import { runAllTests as runCoreTests } from './test-three-tier-integration.js';
import { runMigrationTests } from './test-migration-integration.js';
import { runEnhancedContentLoadingTests } from './test-enhanced-content-loading.js';

/**
 * Run comprehensive integration test suite
 */
async function runComprehensiveIntegrationTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        COMPREHENSIVE THREE-TIER INTEGRATION TESTS         ║');
  console.log('║                                                            ║');
  console.log('║  Testing complete three-tier category system functionality ║');
  console.log('║  • Core service integrations                               ║');
  console.log('║  • Migration and validation tools                          ║');
  console.log('║  • Backward compatibility                                  ║');
  console.log('║  • Performance requirements                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const overallStartTime = performance.now();
  let coreTestsReport = null;
  let migrationTestsReport = null;
  let contentLoadingTestsReport = null;

  try {
    // Run core functionality tests
    console.log('\n🚀 Starting Core Functionality Tests...');
    coreTestsReport = await runCoreTests();

    console.log('\n🔄 Starting Migration and Validation Tests...');
    migrationTestsReport = await runMigrationTests();

    console.log('\n📚 Starting Enhanced Content Loading Tests...');
    contentLoadingTestsReport = await runEnhancedContentLoadingTests();
  } catch (error) {
    console.error(
      '❌ Critical error during comprehensive test execution:',
      error
    );
  }

  const overallEndTime = performance.now();
  const totalExecutionTime = (
    (overallEndTime - overallStartTime) /
    1000
  ).toFixed(2);

  // Generate unified report
  generateUnifiedReport(
    coreTestsReport,
    migrationTestsReport,
    contentLoadingTestsReport,
    totalExecutionTime
  );

  // Determine overall success
  const overallSuccess =
    coreTestsReport?.success &&
    migrationTestsReport?.success &&
    contentLoadingTestsReport?.success;

  return {
    success: overallSuccess,
    coreTests: coreTestsReport,
    migrationTests: migrationTestsReport,
    contentLoadingTests: contentLoadingTestsReport,
    totalExecutionTime: parseFloat(totalExecutionTime),
  };
}

/**
 * Generate unified test report
 */
function generateUnifiedReport(
  coreReport,
  migrationReport,
  contentLoadingReport,
  executionTime
) {
  console.log('\n' + '='.repeat(90));
  console.log('📋 COMPREHENSIVE THREE-TIER CATEGORY SYSTEM TEST REPORT');
  console.log('='.repeat(90));

  // Calculate overall statistics
  const totalTests =
    (coreReport?.totalTests || 0) +
    (migrationReport?.totalTests || 0) +
    (contentLoadingReport?.totalTests || 0);
  const totalPassed =
    (coreReport?.passed || 0) +
    (migrationReport?.passed || 0) +
    (contentLoadingReport?.passed || 0);
  const totalFailed =
    (coreReport?.failed || 0) +
    (migrationReport?.failed || 0) +
    (contentLoadingReport?.failed || 0);
  const overallSuccessRate =
    totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

  console.log(`\n📊 OVERALL STATISTICS:`);
  console.log(`   Total Tests Executed: ${totalTests}`);
  console.log(`   Total Passed: ${totalPassed}`);
  console.log(`   Total Failed: ${totalFailed}`);
  console.log(`   Overall Success Rate: ${overallSuccessRate}%`);
  console.log(`   Total Execution Time: ${executionTime}s`);

  // Core functionality results
  if (coreReport) {
    console.log(`\n🔧 CORE FUNCTIONALITY TESTS:`);
    console.log(`   Tests: ${coreReport.totalTests}`);
    console.log(`   Passed: ${coreReport.passed}`);
    console.log(`   Failed: ${coreReport.failed}`);
    console.log(`   Success Rate: ${coreReport.successRate}%`);

    if (coreReport.categories) {
      console.log(`   Category Breakdown:`);
      Object.entries(coreReport.categories).forEach(([category, results]) => {
        const total = results.passed + results.failed;
        if (total > 0) {
          const rate = ((results.passed / total) * 100).toFixed(1);
          console.log(
            `     • ${category}: ${results.passed}/${total} (${rate}%)`
          );
        }
      });
    }
  }

  // Migration and validation results
  if (migrationReport) {
    console.log(`\n🔄 MIGRATION & VALIDATION TESTS:`);
    console.log(`   Tests: ${migrationReport.totalTests}`);
    console.log(`   Passed: ${migrationReport.passed}`);
    console.log(`   Failed: ${migrationReport.failed}`);
    console.log(`   Success Rate: ${migrationReport.successRate}%`);
  }

  // Enhanced content loading results
  if (contentLoadingReport) {
    console.log(`\n📚 ENHANCED CONTENT LOADING TESTS:`);
    console.log(`   Tests: ${contentLoadingReport.totalTests}`);
    console.log(`   Passed: ${contentLoadingReport.passed}`);
    console.log(`   Failed: ${contentLoadingReport.failed}`);
    console.log(`   Success Rate: ${contentLoadingReport.successRate}%`);
  }

  // System readiness assessment
  console.log(`\n🎯 SYSTEM READINESS ASSESSMENT:`);

  const coreSuccess = coreReport?.success || false;
  const migrationSuccess = migrationReport?.success || false;
  const contentLoadingSuccess = contentLoadingReport?.success || false;
  const overallSuccess =
    coreSuccess && migrationSuccess && contentLoadingSuccess;

  if (overallSuccess) {
    console.log('   ✅ READY FOR PRODUCTION');
    console.log('   ✅ All core functionality tests passed');
    console.log('   ✅ All migration and validation tests passed');
    console.log('   ✅ All enhanced content loading tests passed');
    console.log('   ✅ Three-tier category system is fully operational');
    console.log('   ✅ Backward compatibility is maintained');
    console.log('   ✅ Performance requirements are met');
  } else {
    console.log('   ⚠️  NOT READY FOR PRODUCTION');

    if (!coreSuccess) {
      console.log('   ❌ Core functionality tests failed');
      console.log('   → Review service integrations and configurations');
    }

    if (!migrationSuccess) {
      console.log('   ❌ Migration and validation tests failed');
      console.log('   → Review migration tools and data integrity');
    }

    if (!contentLoadingSuccess) {
      console.log('   ❌ Enhanced content loading tests failed');
      console.log('   → Review content loading pipeline and categorization');
    }

    console.log('   → Address failed tests before deployment');
  }

  // Recommendations
  console.log(`\n💡 RECOMMENDATIONS:`);

  if (overallSuccess) {
    console.log('   🚀 System is ready for deployment');
    console.log('   📚 Consider running performance benchmarks under load');
    console.log('   🔍 Monitor system behavior in production environment');
    console.log('   📝 Update documentation with any configuration changes');
  } else {
    console.log('   🔧 Fix failing tests before proceeding');
    console.log('   📊 Review test output for specific error details');
    console.log('   🔍 Validate data integrity and service configurations');
    console.log('   ⚡ Check performance requirements are met');

    if (totalFailed > 0) {
      console.log(`   📋 ${totalFailed} test(s) require attention`);
    }
  }

  // Next steps
  console.log(`\n🎯 NEXT STEPS:`);

  if (overallSuccess) {
    console.log('   1. ✅ Deploy three-tier category system to production');
    console.log('   2. 📊 Monitor system performance and user feedback');
    console.log('   3. 📚 Update user documentation and training materials');
    console.log('   4. 🔄 Plan regular validation and maintenance cycles');
  } else {
    console.log('   1. 🔧 Address all failing tests');
    console.log('   2. 🔍 Re-run integration tests to verify fixes');
    console.log('   3. 📊 Validate system performance under expected load');
    console.log('   4. 📝 Update configurations and documentation as needed');
  }

  console.log('\n' + '='.repeat(90));

  // Quality gates
  console.log(`\n🚪 QUALITY GATES:`);
  console.log(`   Core Functionality: ${coreSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(
    `   Migration & Validation: ${migrationSuccess ? '✅ PASS' : '❌ FAIL'}`
  );
  console.log(
    `   Overall System: ${overallSuccess ? '✅ READY' : '❌ NOT READY'}`
  );

  console.log('\n' + '='.repeat(90));
}

/**
 * Validate system requirements before running tests
 */
function validateSystemRequirements() {
  console.log('🔍 Validating system requirements...');

  const requirements = [
    {
      name: 'Node.js ES Modules',
      check: () => typeof import.meta !== 'undefined',
      message: 'ES Modules support required',
    },
    {
      name: 'Performance API',
      check: () => typeof performance !== 'undefined',
      message: 'Performance measurement API required',
    },
    {
      name: 'File System Access',
      check: () => {
        try {
          import('fs');
          return true;
        } catch {
          return false;
        }
      },
      message: 'File system access required for data loading',
    },
  ];

  const failedRequirements = requirements.filter(req => !req.check());

  if (failedRequirements.length > 0) {
    console.error('❌ System requirements not met:');
    failedRequirements.forEach(req => {
      console.error(`   • ${req.name}: ${req.message}`);
    });
    return false;
  }

  console.log('✅ All system requirements met');
  return true;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting comprehensive integration test suite...\n');

  // Validate system requirements first
  if (!validateSystemRequirements()) {
    console.error('❌ System requirements validation failed');
    process.exit(1);
  }

  runComprehensiveIntegrationTests()
    .then(report => {
      const exitCode = report.success ? 0 : 1;

      if (report.success) {
        console.log('\n🎉 All integration tests passed successfully!');
        console.log('🚀 Three-tier category system is ready for production.');
      } else {
        console.log('\n⚠️  Some integration tests failed.');
        console.log(
          '🔧 Please review the test results and fix issues before deployment.'
        );
      }

      process.exit(exitCode);
    })
    .catch(error => {
      console.error('\n💥 Fatal error during test execution:', error);
      console.error('🔧 Please check system configuration and try again.');
      process.exit(1);
    });
}

// Export for use in other scripts
export { runComprehensiveIntegrationTests };
