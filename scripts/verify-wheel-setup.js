/**
 * Verify Wheel Feature Setup
 * Automated checks to ensure all components are in place before manual testing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

class WheelSetupVerifier {
  constructor() {
    this.checks = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Run all verification checks
   */
  async verify() {
    console.log('🎯 Verifying Wheel Feature Setup');
    console.log('=================================\n');

    await this.checkFileExists();
    await this.checkNavigationIntegration();
    await this.checkRouteRegistration();
    await this.checkStylesPresent();
    await this.checkAccessibilityFeatures();

    this.printResults();
    return this.failed === 0;
  }

  /**
   * Check if WheelView component exists
   */
  async checkFileExists() {
    console.log('📋 Checking File Existence...');

    const files = [
      'src/components/WheelView.js',
      'src/components/Navigation.js',
      'src/app.js',
      'src/style.css',
    ];

    for (const file of files) {
      const filePath = path.join(rootDir, file);
      const exists = fs.existsSync(filePath);

      if (exists) {
        console.log(`  ✅ ${file}`);
        this.recordCheck(`File exists: ${file}`, true);
      } else {
        console.log(`  ❌ ${file} - NOT FOUND`);
        this.recordCheck(`File exists: ${file}`, false);
      }
    }
    console.log();
  }

  /**
   * Check if wheel link is in navigation
   */
  async checkNavigationIntegration() {
    console.log('📋 Checking Navigation Integration...');

    const navPath = path.join(rootDir, 'src/components/Navigation.js');

    try {
      const content = fs.readFileSync(navPath, 'utf-8');

      // Check for wheel link
      const hasWheelLink =
        content.includes('#/wheel') || content.includes('href="#/wheel"');
      const hasWheelText =
        content.includes('Lern-Modul') || content.includes('🎯');
      const hasAriaLabel =
        content.includes('aria-label') && content.includes('wheel');

      if (hasWheelLink) {
        console.log('  ✅ Wheel link present in navigation');
        this.recordCheck('Navigation: Wheel link', true);
      } else {
        console.log('  ❌ Wheel link NOT found in navigation');
        this.recordCheck('Navigation: Wheel link', false);
      }

      if (hasWheelText) {
        console.log('  ✅ Wheel link text/icon present');
        this.recordCheck('Navigation: Link text', true);
      } else {
        console.log('  ❌ Wheel link text/icon NOT found');
        this.recordCheck('Navigation: Link text', false);
      }

      if (hasAriaLabel) {
        console.log('  ✅ ARIA labels present');
        this.recordCheck('Navigation: ARIA labels', true);
      } else {
        console.log('  ⚠️  ARIA labels may be missing');
        this.recordCheck('Navigation: ARIA labels', false);
      }
    } catch (error) {
      console.log(`  ❌ Error reading Navigation.js: ${error.message}`);
      this.recordCheck('Navigation integration', false);
    }
    console.log();
  }

  /**
   * Check if wheel route is registered
   */
  async checkRouteRegistration() {
    console.log('📋 Checking Route Registration...');

    const appPath = path.join(rootDir, 'src/app.js');

    try {
      const content = fs.readFileSync(appPath, 'utf-8');

      // Check for WheelView import
      const hasImport =
        content.includes('import') && content.includes('WheelView');

      // Check for route registration
      const hasRoute =
        content.includes("'/wheel'") || content.includes('"/wheel"');
      const hasWheelView = content.includes('new WheelView');

      if (hasImport) {
        console.log('  ✅ WheelView imported');
        this.recordCheck('Route: WheelView import', true);
      } else {
        console.log('  ❌ WheelView NOT imported');
        this.recordCheck('Route: WheelView import', false);
      }

      if (hasRoute) {
        console.log('  ✅ /wheel route registered');
        this.recordCheck('Route: /wheel registration', true);
      } else {
        console.log('  ❌ /wheel route NOT registered');
        this.recordCheck('Route: /wheel registration', false);
      }

      if (hasWheelView) {
        console.log('  ✅ WheelView instantiated in route');
        this.recordCheck('Route: WheelView instantiation', true);
      } else {
        console.log('  ❌ WheelView NOT instantiated');
        this.recordCheck('Route: WheelView instantiation', false);
      }
    } catch (error) {
      console.log(`  ❌ Error reading app.js: ${error.message}`);
      this.recordCheck('Route registration', false);
    }
    console.log();
  }

  /**
   * Check if wheel styles are present
   */
  async checkStylesPresent() {
    console.log('📋 Checking Styles...');

    const stylePath = path.join(rootDir, 'src/style.css');

    try {
      const content = fs.readFileSync(stylePath, 'utf-8');

      // Check for wheel-related styles
      const hasWheelView =
        content.includes('.wheel-view') || content.includes('wheel-view');
      const hasWheelContainer =
        content.includes('.wheel-container') ||
        content.includes('wheel-container');
      const hasWheelControls =
        content.includes('.wheel-controls') ||
        content.includes('wheel-controls');
      const hasDarkMode =
        content.includes('[data-theme="dark"]') && content.includes('wheel');

      if (hasWheelView) {
        console.log('  ✅ .wheel-view styles present');
        this.recordCheck('Styles: .wheel-view', true);
      } else {
        console.log('  ⚠️  .wheel-view styles may be missing');
        this.recordCheck('Styles: .wheel-view', false);
      }

      if (hasWheelContainer) {
        console.log('  ✅ .wheel-container styles present');
        this.recordCheck('Styles: .wheel-container', true);
      } else {
        console.log('  ⚠️  .wheel-container styles may be missing');
        this.recordCheck('Styles: .wheel-container', false);
      }

      if (hasWheelControls) {
        console.log('  ✅ .wheel-controls styles present');
        this.recordCheck('Styles: .wheel-controls', true);
      } else {
        console.log('  ⚠️  .wheel-controls styles may be missing');
        this.recordCheck('Styles: .wheel-controls', false);
      }

      if (hasDarkMode) {
        console.log('  ✅ Dark mode styles present');
        this.recordCheck('Styles: Dark mode', true);
      } else {
        console.log('  ⚠️  Dark mode styles may be missing');
        this.recordCheck('Styles: Dark mode', false);
      }
    } catch (error) {
      console.log(`  ❌ Error reading style.css: ${error.message}`);
      this.recordCheck('Styles check', false);
    }
    console.log();
  }

  /**
   * Check accessibility features in WheelView
   */
  async checkAccessibilityFeatures() {
    console.log('📋 Checking Accessibility Features...');

    const wheelPath = path.join(rootDir, 'src/components/WheelView.js');

    try {
      const content = fs.readFileSync(wheelPath, 'utf-8');

      // Check for accessibility features
      const hasAriaLabel = content.includes('aria-label');
      const hasAriaLive = content.includes('aria-live');
      const hasRole = content.includes('role=');
      const hasAccessibilityHelper = content.includes('accessibilityHelper');
      const hasAnnounce = content.includes('announce');

      if (hasAriaLabel) {
        console.log('  ✅ aria-label attributes present');
        this.recordCheck('A11y: aria-label', true);
      } else {
        console.log('  ❌ aria-label attributes missing');
        this.recordCheck('A11y: aria-label', false);
      }

      if (hasAriaLive) {
        console.log('  ✅ aria-live region present');
        this.recordCheck('A11y: aria-live', true);
      } else {
        console.log('  ❌ aria-live region missing');
        this.recordCheck('A11y: aria-live', false);
      }

      if (hasRole) {
        console.log('  ✅ ARIA roles present');
        this.recordCheck('A11y: ARIA roles', true);
      } else {
        console.log('  ⚠️  ARIA roles may be missing');
        this.recordCheck('A11y: ARIA roles', false);
      }

      if (hasAccessibilityHelper && hasAnnounce) {
        console.log('  ✅ AccessibilityHelper used for announcements');
        this.recordCheck('A11y: Announcements', true);
      } else {
        console.log('  ⚠️  AccessibilityHelper may not be used');
        this.recordCheck('A11y: Announcements', false);
      }
    } catch (error) {
      console.log(`  ❌ Error reading WheelView.js: ${error.message}`);
      this.recordCheck('Accessibility check', false);
    }
    console.log();
  }

  /**
   * Record check result
   */
  recordCheck(name, passed) {
    this.checks.push({ name, passed });
    if (passed) {
      this.passed++;
    } else {
      this.failed++;
    }
  }

  /**
   * Print results summary
   */
  printResults() {
    console.log('=================================');
    console.log('📊 Verification Summary');
    console.log('=================================\n');

    console.log(`Total Checks: ${this.checks.length}`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}\n`);

    if (this.failed > 0) {
      console.log('❌ Failed Checks:');
      this.checks
        .filter(c => !c.passed)
        .forEach(c => console.log(`   - ${c.name}`));
      console.log();
    }

    if (this.failed === 0) {
      console.log('✅ All checks passed! Ready for manual testing.');
      console.log('\n📝 Next Steps:');
      console.log('   1. Start the dev server: npm run dev');
      console.log('   2. Open WHEEL_MANUAL_TEST_CHECKLIST.md');
      console.log('   3. Follow the manual testing steps');
      console.log('   4. Complete all verification checklists\n');
    } else {
      console.log(
        '⚠️  Some checks failed. Please fix issues before manual testing.\n'
      );
    }

    return this.failed === 0;
  }
}

// Run verification
const verifier = new WheelSetupVerifier();
verifier.verify().then(success => {
  process.exit(success ? 0 : 1);
});
