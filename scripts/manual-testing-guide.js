/**
 * Manual Testing Guide for Simple Learning App
 *
 * This script provides a comprehensive manual testing checklist
 * for all application features after code cleanup and refactoring.
 */

class ManualTestingGuide {
  constructor() {
    this.testResults = {
      routes: {},
      navigation: {},
      modules: {},
      quizzes: {},
      progress: {},
      wheel: {},
      accessibility: {},
      performance: {},
      errors: [],
    };
    this.startTime = Date.now();
  }

  /**
   * Start the manual testing process
   */
  async startTesting() {
    console.log('🧪 Starting Manual Testing Guide');
    console.log('================================');

    this.displayTestingInstructions();
    this.setupTestingHelpers();

    // Wait for user to start testing
    console.log('\n📋 Follow the testing checklist below:');
    this.displayTestingChecklist();
  }

  /**
   * Display testing instructions
   */
  displayTestingInstructions() {
    console.log(`
📋 MANUAL TESTING INSTRUCTIONS
==============================

This guide will help you systematically test all application features.
Open your browser's Developer Tools (F12) to see this guide and track results.

Testing Areas:
1. Routes and Navigation
2. Module Functionality  
3. Quiz Functionality
4. Progress Tracking
5. Wheel of Fortune
6. Accessibility Features
7. Error Handling
8. Performance

Use the helper functions provided to log test results:
- testHelper.pass(testName, details)
- testHelper.fail(testName, error, details)
- testHelper.info(testName, details)
    `);
  }

  /**
   * Setup testing helper functions
   */
  setupTestingHelpers() {
    // Make testing helpers globally available
    window.testHelper = {
      pass: (testName, details = '') => {
        console.log(`✅ PASS: ${testName}`, details);
        this.logTestResult(testName, 'pass', details);
      },

      fail: (testName, error = '', details = '') => {
        console.error(`❌ FAIL: ${testName}`, error, details);
        this.logTestResult(testName, 'fail', { error, details });
      },

      info: (testName, details = '') => {
        console.log(`ℹ️  INFO: ${testName}`, details);
        this.logTestResult(testName, 'info', details);
      },

      warn: (testName, details = '') => {
        console.warn(`⚠️  WARN: ${testName}`, details);
        this.logTestResult(testName, 'warn', details);
      },

      // Helper to test route navigation
      testRoute: async (route, expectedTitle = '') => {
        try {
          window.location.hash = route;
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait for route to load

          const currentRoute = window.location.hash;
          const pageTitle = document.title;
          const mainContent = document.getElementById('main-content');

          if (
            currentRoute === route &&
            mainContent &&
            mainContent.innerHTML.trim()
          ) {
            this.pass(`Route ${route}`, `Title: ${pageTitle}, Content loaded`);
            return true;
          } else {
            this.fail(`Route ${route}`, 'Route not loaded properly');
            return false;
          }
        } catch (error) {
          this.fail(`Route ${route}`, error.message);
          return false;
        }
      },

      // Helper to check for console errors
      checkConsoleErrors: () => {
        const errors = this.testResults.errors;
        if (errors.length === 0) {
          this.pass('Console Errors', 'No console errors detected');
        } else {
          this.fail('Console Errors', `${errors.length} errors found`, errors);
        }
      },

      // Helper to test accessibility
      testAccessibility: () => {
        const issues = [];

        // Check for skip link
        const skipLink = document.querySelector('.skip-link');
        if (!skipLink) issues.push('Missing skip link');

        // Check for main landmark
        const main = document.querySelector('main');
        if (!main) issues.push('Missing main landmark');

        // Check for heading structure
        const h1 = document.querySelector('h1');
        if (!h1) issues.push('Missing h1 heading');

        // Check for alt text on images
        const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
        if (imagesWithoutAlt.length > 0) {
          issues.push(`${imagesWithoutAlt.length} images without alt text`);
        }

        // Check for form labels
        const inputsWithoutLabels = document.querySelectorAll(
          'input:not([aria-label]):not([aria-labelledby])'
        );
        const inputsWithoutLabelsFiltered = Array.from(
          inputsWithoutLabels
        ).filter(input => {
          return (
            !input.closest('label') &&
            !document.querySelector(`label[for="${input.id}"]`)
          );
        });
        if (inputsWithoutLabelsFiltered.length > 0) {
          issues.push(
            `${inputsWithoutLabelsFiltered.length} inputs without labels`
          );
        }

        if (issues.length === 0) {
          this.pass(
            'Accessibility Check',
            'Basic accessibility requirements met'
          );
        } else {
          this.warn('Accessibility Check', issues.join(', '));
        }
      },

      // Generate final test report
      generateReport: () => {
        const endTime = Date.now();
        const duration = Math.round((endTime - this.startTime) / 1000);

        console.log('\n📊 MANUAL TESTING REPORT');
        console.log('========================');
        console.log(`Testing Duration: ${duration} seconds`);
        console.log(`Total Tests: ${Object.keys(this.testResults).length}`);

        // Count results by type
        const resultCounts = { pass: 0, fail: 0, warn: 0, info: 0 };
        Object.values(this.testResults).forEach(category => {
          if (typeof category === 'object' && !Array.isArray(category)) {
            Object.values(category).forEach(result => {
              if (result && result.status) {
                resultCounts[result.status] =
                  (resultCounts[result.status] || 0) + 1;
              }
            });
          }
        });

        console.log(`✅ Passed: ${resultCounts.pass}`);
        console.log(`❌ Failed: ${resultCounts.fail}`);
        console.log(`⚠️  Warnings: ${resultCounts.warn}`);
        console.log(`ℹ️  Info: ${resultCounts.info}`);

        // Show detailed results
        console.log('\nDetailed Results:');
        console.log(this.testResults);

        return this.testResults;
      },
    };

    // Capture console errors
    const originalError = console.error;
    console.error = (...args) => {
      this.testResults.errors.push({
        timestamp: new Date().toISOString(),
        message: args.join(' '),
      });
      originalError.apply(console, args);
    };
  }

  /**
   * Log test result
   */
  logTestResult(testName, status, details) {
    const category = this.getCategoryFromTestName(testName);
    if (!this.testResults[category]) {
      this.testResults[category] = {};
    }

    this.testResults[category][testName] = {
      status,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get category from test name
   */
  getCategoryFromTestName(testName) {
    if (testName.toLowerCase().includes('route')) return 'routes';
    if (testName.toLowerCase().includes('nav')) return 'navigation';
    if (testName.toLowerCase().includes('module')) return 'modules';
    if (testName.toLowerCase().includes('quiz')) return 'quizzes';
    if (testName.toLowerCase().includes('progress')) return 'progress';
    if (testName.toLowerCase().includes('wheel')) return 'wheel';
    if (testName.toLowerCase().includes('accessibility'))
      return 'accessibility';
    if (testName.toLowerCase().includes('performance')) return 'performance';
    return 'general';
  }

  /**
   * Display comprehensive testing checklist
   */
  displayTestingChecklist() {
    console.log(`
🔍 TESTING CHECKLIST
====================

1. ROUTES AND NAVIGATION TESTING
---------------------------------
□ Test home route (/)
  testHelper.testRoute('/', 'Simple Learning App')

□ Test modules list route (/modules)
  testHelper.testRoute('#/modules')

□ Test module detail route (/modules/:id)
  testHelper.testRoute('#/modules/javascript-basics')

□ Test quizzes list route (/quizzes)
  testHelper.testRoute('#/quizzes')

□ Test quiz detail route (/quizzes/:id)
  testHelper.testRoute('#/quizzes/javascript-fundamentals')

□ Test progress route (/progress)
  testHelper.testRoute('#/progress')

□ Test wheel route (/wheel)
  testHelper.testRoute('#/wheel')

□ Test 404 route (invalid route)
  testHelper.testRoute('#/invalid-route')

□ Test navigation menu functionality
  - Click each navigation item
  - Verify active states
  - Test mobile menu (if applicable)

2. MODULE FUNCTIONALITY TESTING
-------------------------------
□ Module list displays correctly
  - All modules show with titles and descriptions
  - Module cards are clickable
  - Progress indicators work

□ Module detail view works
  - Content loads properly
  - Navigation between sections works
  - Progress tracking updates

□ Module completion tracking
  - Mark module as complete
  - Verify progress updates
  - Check persistence after refresh

3. QUIZ FUNCTIONALITY TESTING
-----------------------------
□ Quiz list displays correctly
  - All quizzes show with metadata
  - Difficulty indicators work
  - Quiz cards are clickable

□ Quiz taking experience
  - Questions display properly
  - Answer selection works
  - Navigation between questions
  - Submit functionality works

□ Quiz results display
  - Score calculation is correct
  - Results show properly
  - Retry functionality works

□ Quiz progress tracking
  - Attempts are recorded
  - Best scores are saved
  - Progress persists after refresh

4. PROGRESS TRACKING TESTING
----------------------------
□ Progress view displays correctly
  - Overall progress shows
  - Module progress is accurate
  - Quiz attempts are listed

□ Progress data persistence
  - Data survives page refresh
  - Data survives browser restart
  - Export/import functionality (if available)

□ Progress calculations
  - Completion percentages are correct
  - Time tracking works
  - Achievement tracking works

5. WHEEL OF FORTUNE TESTING
---------------------------
□ Wheel displays correctly
  - All modules appear on wheel
  - Wheel is visually appealing
  - No empty or undefined modules

□ Wheel functionality
  - Spinning animation works
  - Random selection works
  - Selected module navigation works

□ Edge cases
  - Test with no modules
  - Test with single module
  - Test with many modules

6. ACCESSIBILITY TESTING
------------------------
□ Keyboard navigation
  - Tab through all interactive elements
  - Enter/Space activate buttons
  - Arrow keys work in appropriate contexts

□ Screen reader compatibility
  - All content has proper labels
  - Live regions announce changes
  - Semantic HTML is used

□ Visual accessibility
  - Sufficient color contrast
  - Text is readable at 200% zoom
  - Focus indicators are visible

□ Run accessibility check
  testHelper.testAccessibility()

7. ERROR HANDLING TESTING
-------------------------
□ Network errors
  - Test with offline mode
  - Test with slow network
  - Verify error messages

□ Invalid data handling
  - Test with corrupted storage
  - Test with missing data
  - Verify graceful degradation

□ User input validation
  - Test form validation
  - Test edge cases
  - Verify error messages

8. PERFORMANCE TESTING
----------------------
□ Page load times
  - Initial load under 3 seconds
  - Route changes under 1 second
  - No blocking operations

□ Memory usage
  - No memory leaks
  - Reasonable memory consumption
  - Cleanup on route changes

□ Bundle size
  - Check network tab for asset sizes
  - Verify no unnecessary assets loaded
  - Check for code splitting

TESTING COMMANDS
================
// Start testing
testHelper.info('Testing Started', 'Beginning manual testing process');

// Test all routes quickly
async function testAllRoutes() {
  const routes = ['/', '#/modules', '#/quizzes', '#/progress', '#/wheel'];
  for (const route of routes) {
    await testHelper.testRoute(route);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run accessibility check
testHelper.testAccessibility();

// Check for console errors
testHelper.checkConsoleErrors();

// Generate final report
testHelper.generateReport();

QUICK TEST SEQUENCE
===================
1. testHelper.info('Testing Started', 'Beginning comprehensive manual testing');
2. testAllRoutes();
3. // Manually test each feature area
4. testHelper.testAccessibility();
5. testHelper.checkConsoleErrors();
6. testHelper.generateReport();
    `);
  }
}

// Auto-start the testing guide
const testingGuide = new ManualTestingGuide();
testingGuide.startTesting();

export default ManualTestingGuide;
