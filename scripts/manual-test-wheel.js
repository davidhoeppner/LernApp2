/**
 * Manual Testing Script for Wheel Feature
 * This script helps verify all manual testing requirements for Task 9
 *
 * Requirements being tested:
 * - 8.1: Click wheel link in navigation
 * - 8.2: Spin wheel 3 times
 * - 8.3: Click "Zum Modul" and verify it navigates
 * - State persistence across page reloads
 * - Mobile responsiveness
 * - Dark mode styling
 */

class WheelManualTester {
  constructor() {
    this.testResults = [];
    this.currentTest = 0;
  }

  /**
   * Run all manual tests
   */
  async runTests() {
    console.log('🎯 Starting Wheel Feature Manual Testing');
    console.log('==========================================\n');

    await this.testNavigationLink();
    await this.testWheelSpinning();
    await this.testNavigation();
    await this.testStatePersistence();
    await this.testResponsiveness();
    await this.testDarkMode();

    this.printResults();
  }

  /**
   * Test 1: Navigation link is present and clickable
   */
  async testNavigationLink() {
    console.log('📋 Test 1: Navigation Link');
    console.log('---------------------------');

    try {
      // Check if wheel link exists in navigation
      const wheelLink = document.querySelector('a[href="#/wheel"]');

      if (!wheelLink) {
        this.recordResult(
          'Navigation Link',
          false,
          'Wheel link not found in navigation'
        );
        return;
      }

      console.log('✅ Wheel link found in navigation');
      console.log(`   Text: ${wheelLink.textContent}`);
      console.log(`   Href: ${wheelLink.getAttribute('href')}`);
      console.log(`   ARIA Label: ${wheelLink.getAttribute('aria-label')}`);

      // Check if link is visible
      const isVisible = wheelLink.offsetParent !== null;
      console.log(`   Visible: ${isVisible ? 'Yes' : 'No'}`);

      this.recordResult(
        'Navigation Link',
        true,
        'Wheel link present and accessible'
      );

      console.log('\n📝 Manual Action Required:');
      console.log('   1. Click the "🎯 Lern-Modul" link in the navigation');
      console.log('   2. Verify the wheel page loads');
      console.log('   3. Verify the URL changes to #/wheel\n');
    } catch (error) {
      this.recordResult('Navigation Link', false, error.message);
    }
  }

  /**
   * Test 2: Wheel spinning functionality
   */
  async testWheelSpinning() {
    console.log('📋 Test 2: Wheel Spinning (3 times)');
    console.log('------------------------------------');

    console.log('📝 Manual Actions Required:');
    console.log('   1. Navigate to the wheel page (#/wheel)');
    console.log('   2. Click "Rad drehen" button');
    console.log('   3. Wait for animation to complete (~1.5-2 seconds)');
    console.log('   4. Verify a module is selected and displayed');
    console.log('   5. Click "Nochmal" button');
    console.log('   6. Repeat steps 3-5 two more times (total 3 spins)');
    console.log('\n✅ Verification Checklist:');
    console.log('   [ ] Animation cycles through modules smoothly');
    console.log('   [ ] Animation takes approximately 1.5-2 seconds');
    console.log('   [ ] Selected module is displayed clearly');
    console.log('   [ ] "Nochmal" and "Zum Modul" buttons appear after spin');
    console.log('   [ ] Can spin 3 consecutive times without errors');
    console.log('   [ ] Each spin selects a (potentially) different module\n');

    // Check if we're on the wheel page
    const currentHash = window.location.hash;
    if (currentHash === '#/wheel') {
      console.log('✅ Currently on wheel page - ready for testing');

      // Check for required elements
      const spinBtn = document.querySelector('#btn-spin');
      const wheelDisplay = document.querySelector('#wheel-module-display');

      if (spinBtn && wheelDisplay) {
        console.log('✅ Wheel UI elements found');
        this.recordResult(
          'Wheel Spinning',
          true,
          'UI elements present, manual testing required'
        );
      } else {
        console.log('⚠️  Some UI elements missing');
        this.recordResult('Wheel Spinning', false, 'Missing UI elements');
      }
    } else {
      console.log('⚠️  Not on wheel page - navigate to #/wheel first');
      this.recordResult('Wheel Spinning', null, 'Manual navigation required');
    }
  }

  /**
   * Test 3: Navigation to selected module
   */
  async testNavigation() {
    console.log('📋 Test 3: Navigate to Selected Module');
    console.log('---------------------------------------');

    console.log('📝 Manual Actions Required:');
    console.log('   1. After spinning the wheel and selecting a module');
    console.log('   2. Click the "Zum Modul" button');
    console.log('   3. Verify you are navigated to the module detail page');
    console.log('   4. Verify the URL changes to #/modules/{module-id}');
    console.log('   5. Verify the correct module content is displayed\n');

    console.log('✅ Verification Checklist:');
    console.log('   [ ] "Zum Modul" button is visible after spin');
    console.log('   [ ] Clicking button navigates to module page');
    console.log('   [ ] URL matches selected module ID');
    console.log('   [ ] Module content loads correctly');
    console.log('   [ ] No console errors during navigation\n');

    this.recordResult('Module Navigation', null, 'Manual testing required');
  }

  /**
   * Test 4: State persistence across page reloads
   */
  async testStatePersistence() {
    console.log('📋 Test 4: State Persistence');
    console.log('-----------------------------');

    console.log('📝 Manual Actions Required:');
    console.log('   1. Spin the wheel and select a module');
    console.log('   2. Note the selected module name');
    console.log('   3. Reload the page (F5 or Ctrl+R)');
    console.log('   4. Navigate back to the wheel page (#/wheel)');
    console.log(
      '   5. Verify the previously selected module is still displayed\n'
    );

    // Check if state is saved
    try {
      const stateManager = window.app?.services?.stateManager;
      if (stateManager) {
        const lastModule = stateManager.getState('lastWheelModule');

        if (lastModule) {
          console.log('✅ Last selected module found in state:');
          console.log(`   Module: ${lastModule.title}`);
          console.log(`   Category: ${lastModule.category}`);
          console.log(`   Selected at: ${lastModule.selectedAt}`);
          this.recordResult('State Persistence', true, 'State saved correctly');
        } else {
          console.log('⚠️  No saved wheel state found');
          console.log('   Spin the wheel first to test persistence');
          this.recordResult('State Persistence', null, 'No state to test yet');
        }
      } else {
        console.log('⚠️  StateManager not accessible');
        this.recordResult(
          'State Persistence',
          null,
          'Cannot verify programmatically'
        );
      }
    } catch (error) {
      console.log('⚠️  Error checking state:', error.message);
      this.recordResult(
        'State Persistence',
        null,
        'Manual verification required'
      );
    }

    console.log('\n✅ Verification Checklist:');
    console.log('   [ ] Selected module persists after page reload');
    console.log('   [ ] State is restored when returning to wheel page');
    console.log('   [ ] No errors in console after reload\n');
  }

  /**
   * Test 5: Mobile responsiveness
   */
  async testResponsiveness() {
    console.log('📋 Test 5: Mobile Responsiveness');
    console.log('---------------------------------');

    console.log('📝 Manual Actions Required:');
    console.log('   Option A - Using Browser DevTools:');
    console.log('   1. Open browser DevTools (F12)');
    console.log('   2. Toggle device toolbar (Ctrl+Shift+M)');
    console.log('   3. Select a mobile device (e.g., iPhone 12, Galaxy S20)');
    console.log('   4. Navigate to wheel page');
    console.log('   5. Test all functionality on mobile viewport\n');

    console.log('   Option B - Using Real Device:');
    console.log('   1. Open the app on your phone');
    console.log('   2. Navigate to the wheel page');
    console.log('   3. Test all functionality\n');

    console.log('✅ Verification Checklist:');
    console.log('   [ ] Wheel page is readable on mobile (320px - 768px)');
    console.log('   [ ] Buttons are large enough to tap (min 44x44px)');
    console.log('   [ ] Text is legible without zooming');
    console.log('   [ ] Animation works smoothly on mobile');
    console.log('   [ ] Navigation menu works on mobile');
    console.log('   [ ] No horizontal scrolling');
    console.log('   [ ] Touch interactions work correctly\n');

    // Check viewport
    const width = window.innerWidth;
    console.log(`Current viewport width: ${width}px`);

    if (width <= 768) {
      console.log('✅ Currently in mobile viewport - ready for testing');
      this.recordResult(
        'Mobile Responsiveness',
        null,
        'Manual testing in progress'
      );
    } else {
      console.log(
        'ℹ️  Currently in desktop viewport - switch to mobile for testing'
      );
      this.recordResult(
        'Mobile Responsiveness',
        null,
        'Switch to mobile viewport'
      );
    }
  }

  /**
   * Test 6: Dark mode styling
   */
  async testDarkMode() {
    console.log('📋 Test 6: Dark Mode Styling');
    console.log('-----------------------------');

    console.log('📝 Manual Actions Required:');
    console.log('   1. Navigate to the wheel page');
    console.log('   2. Toggle dark mode using the theme button in navigation');
    console.log('   3. Verify all wheel elements are styled correctly');
    console.log('   4. Toggle back to light mode');
    console.log('   5. Verify styling is correct in light mode\n');

    // Check current theme
    try {
      const themeManager = window.app?.services?.themeManager;
      if (themeManager) {
        const currentTheme = themeManager.getTheme();
        console.log(`Current theme: ${currentTheme}`);

        const htmlElement = document.documentElement;
        const dataTheme = htmlElement.getAttribute('data-theme');
        console.log(`HTML data-theme: ${dataTheme}`);

        this.recordResult('Dark Mode', null, 'Manual verification required');
      } else {
        console.log('⚠️  ThemeManager not accessible');
        this.recordResult('Dark Mode', null, 'Cannot verify programmatically');
      }
    } catch (error) {
      console.log('⚠️  Error checking theme:', error.message);
      this.recordResult('Dark Mode', null, 'Manual verification required');
    }

    console.log('\n✅ Verification Checklist:');
    console.log(
      '   [ ] Wheel container has appropriate background in dark mode'
    );
    console.log('   [ ] Text is readable in both themes');
    console.log('   [ ] Buttons have correct styling in both themes');
    console.log('   [ ] Animation display is visible in both themes');
    console.log('   [ ] No color contrast issues (WCAG AA)');
    console.log('   [ ] Theme toggle works without page reload');
    console.log('   [ ] Theme preference persists after reload\n');
  }

  /**
   * Record test result
   */
  recordResult(testName, passed, notes) {
    this.testResults.push({
      test: testName,
      passed: passed,
      notes: notes,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Print test results summary
   */
  printResults() {
    console.log('\n==========================================');
    console.log('📊 Manual Testing Summary');
    console.log('==========================================\n');

    const passed = this.testResults.filter(r => r.passed === true).length;
    const failed = this.testResults.filter(r => r.passed === false).length;
    const pending = this.testResults.filter(r => r.passed === null).length;

    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏳ Pending Manual Verification: ${pending}\n`);

    console.log('Detailed Results:');
    console.log('-----------------');
    this.testResults.forEach((result, index) => {
      const icon =
        result.passed === true ? '✅' : result.passed === false ? '❌' : '⏳';
      console.log(`${index + 1}. ${icon} ${result.test}`);
      console.log(`   ${result.notes}\n`);
    });

    console.log('==========================================');
    console.log('📝 Next Steps:');
    console.log('==========================================');
    console.log('1. Complete all manual verification steps above');
    console.log('2. Check off items in the verification checklists');
    console.log('3. Document any issues found');
    console.log('4. If all tests pass, mark Task 9 as complete\n');

    console.log('💡 Tips:');
    console.log('- Test in multiple browsers (Chrome, Firefox, Safari)');
    console.log('- Test on actual mobile devices if possible');
    console.log('- Check browser console for any errors');
    console.log('- Verify accessibility with screen reader if available\n');
  }
}

// Auto-run if script is loaded
if (typeof window !== 'undefined') {
  console.log('🎯 Wheel Manual Testing Script Loaded');
  console.log('Run: new WheelManualTester().runTests()');
  console.log('Or access via: window.wheelTester = new WheelManualTester()\n');

  // Make available globally
  window.WheelManualTester = WheelManualTester;
}

export default WheelManualTester;
