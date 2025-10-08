// @ts-nocheck
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Design tokens from style.css
const DESIGN_TOKENS = {
  colors: [
    '--color-primary',
    '--color-primary-dark',
    '--color-primary-light',
    '--color-success',
    '--color-warning',
    '--color-error',
    '--color-bg',
    '--color-bg-secondary',
    '--color-bg-tertiary',
    '--color-text',
    '--color-text-secondary',
    '--color-text-tertiary',
    '--color-border',
  ],
  spacing: [
    '--spacing-xs',
    '--spacing-sm',
    '--spacing-md',
    '--spacing-lg',
    '--spacing-xl',
    '--spacing-2xl',
    '--spacing-3xl',
  ],
  fontSize: [
    '--font-size-xs',
    '--font-size-sm',
    '--font-size-base',
    '--font-size-lg',
    '--font-size-xl',
    '--font-size-2xl',
    '--font-size-3xl',
    '--font-size-4xl',
  ],
  borderRadius: [
    '--radius-sm',
    '--radius-md',
    '--radius-lg',
    '--radius-xl',
    '--radius-full',
  ],
  shadows: ['--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-xl'],
  transitions: ['--transition-fast', '--transition-base', '--transition-slow'],
};

// Patterns to detect hardcoded values
const PATTERNS = {
  // Hex colors: #fff, #ffffff, #FFF, #FFFFFF
  hexColor: /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g,
  // RGB/RGBA colors: rgb(255, 255, 255), rgba(255, 255, 255, 0.5)
  rgbColor: /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)/g,
  // Pixel spacing: 10px, 20px (but not 0px)
  pixelSpacing: /(?<![\d.])\d+px\b/g,
  // Rem spacing without var: 1rem, 2rem (but not in var())
  remSpacing: /(?<!var\([^)]*)\d+\.?\d*rem\b/g,
  // Pixel font sizes: font-size: 16px
  pixelFontSize: /font-size:\s*\d+px/g,
  // Hardcoded transitions: transition: 0.3s, 300ms
  hardcodedTransition: /transition:\s*[^;]*?(\d+\.?\d*(s|ms))/g,
};

// Interactive elements that should have hover/focus states
const INTERACTIVE_ELEMENTS = [
  'button',
  'a',
  'input',
  'textarea',
  'select',
  '[role="button"]',
  '[role="link"]',
  '.btn',
  '.card',
  '.action-card',
  '.stat-card',
];

const issues = [];
let totalFiles = 0;

/**
 * Scan a file for styling issues
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  totalFiles++;

  // Check for hardcoded colors
  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
      return;
    }

    // Check for hex colors
    const hexMatches = line.match(PATTERNS.hexColor);
    if (hexMatches) {
      hexMatches.forEach(match => {
        // Skip if it's already in a var() or a comment
        if (
          !line.includes(`var(`) ||
          line.indexOf(match) < line.indexOf('var(')
        ) {
          issues.push({
            file: relativePath,
            line: lineNumber,
            type: 'hardcoded-color',
            severity: 'critical',
            current: match,
            recommended: 'Use CSS custom property (e.g., var(--color-primary))',
            description: 'Hardcoded hex color should use CSS custom property',
            snippet: line.trim(),
          });
        }
      });
    }

    // Check for RGB/RGBA colors
    const rgbMatches = line.match(PATTERNS.rgbColor);
    if (rgbMatches) {
      rgbMatches.forEach(match => {
        if (
          !line.includes(`var(`) ||
          line.indexOf(match) < line.indexOf('var(')
        ) {
          issues.push({
            file: relativePath,
            line: lineNumber,
            type: 'hardcoded-color',
            severity: 'critical',
            current: match,
            recommended: 'Use CSS custom property (e.g., var(--color-primary))',
            description: 'Hardcoded RGB color should use CSS custom property',
            snippet: line.trim(),
          });
        }
      });
    }

    // Check for hardcoded pixel spacing
    const pixelMatches = line.match(PATTERNS.pixelSpacing);
    if (
      pixelMatches &&
      (line.includes('padding') ||
        line.includes('margin') ||
        line.includes('gap'))
    ) {
      pixelMatches.forEach(match => {
        if (match !== '0px' && !line.includes('var(')) {
          issues.push({
            file: relativePath,
            line: lineNumber,
            type: 'hardcoded-spacing',
            severity: 'warning',
            current: match,
            recommended:
              'Use spacing token (e.g., var(--spacing-md)) or utility class',
            description: 'Hardcoded spacing should use design tokens',
            snippet: line.trim(),
          });
        }
      });
    }

    // Check for hardcoded font sizes
    const fontSizeMatches = line.match(PATTERNS.pixelFontSize);
    if (fontSizeMatches) {
      fontSizeMatches.forEach(match => {
        if (!line.includes('var(')) {
          issues.push({
            file: relativePath,
            line: lineNumber,
            type: 'hardcoded-font-size',
            severity: 'warning',
            current: match,
            recommended:
              'Use font-size token (e.g., var(--font-size-base)) or utility class',
            description: 'Hardcoded font size should use design tokens',
            snippet: line.trim(),
          });
        }
      });
    }

    // Check for hardcoded transitions
    const transitionMatches = line.match(PATTERNS.hardcodedTransition);
    if (transitionMatches) {
      transitionMatches.forEach(match => {
        if (!line.includes('var(--transition')) {
          issues.push({
            file: relativePath,
            line: lineNumber,
            type: 'hardcoded-transition',
            severity: 'info',
            current: match,
            recommended: 'Use transition token (e.g., var(--transition-fast))',
            description: 'Hardcoded transition should use design tokens',
            snippet: line.trim(),
          });
        }
      });
    }
  });

  // Check for missing hover/focus states
  checkInteractiveStates(content, relativePath);

  // Check for responsive design issues
  checkResponsiveDesign(content, relativePath);
}

/**
 * Check if interactive elements have proper hover/focus states
 */
function checkInteractiveStates(content, filePath) {
  // Look for style definitions in the component
  const styleMatch = content.match(/style\s*=\s*`([^`]+)`/s);
  if (!styleMatch) return;

  const styles = styleMatch[1];

  INTERACTIVE_ELEMENTS.forEach(selector => {
    // Check if selector exists in styles
    const selectorRegex = new RegExp(
      `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{`,
      'g'
    );
    if (selectorRegex.test(styles)) {
      // Check for hover state
      const hoverRegex = new RegExp(
        `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:hover\\s*{`,
        'g'
      );
      if (!hoverRegex.test(styles)) {
        issues.push({
          file: filePath,
          line: 0,
          type: 'missing-hover-state',
          severity: 'warning',
          current: selector,
          recommended: `Add ${selector}:hover { ... } with visual feedback`,
          description: `Interactive element "${selector}" is missing hover state`,
          snippet: '',
        });
      }

      // Check for focus state
      const focusRegex = new RegExp(
        `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:focus(-visible)?\\s*{`,
        'g'
      );
      if (!focusRegex.test(styles)) {
        issues.push({
          file: filePath,
          line: 0,
          type: 'missing-focus-state',
          severity: 'critical',
          current: selector,
          recommended: `Add ${selector}:focus-visible { ... } for accessibility`,
          description: `Interactive element "${selector}" is missing focus state`,
          snippet: '',
        });
      }
    }
  });
}

/**
 * Check for responsive design issues
 */
function checkResponsiveDesign(content, filePath) {
  // Check if component has media queries

  // Check if component has fixed widths
  const fixedWidthRegex = /width:\s*\d+px/g;
  const fixedWidthMatches = content.match(fixedWidthRegex);

  if (fixedWidthMatches && fixedWidthMatches.length > 2) {
    issues.push({
      file: filePath,
      line: 0,
      type: 'responsive-issue',
      severity: 'warning',
      current: `${fixedWidthMatches.length} fixed width declarations`,
      recommended: 'Use relative units (%, rem, vw) or max-width',
      description: 'Multiple fixed widths may cause responsive design issues',
      snippet: '',
    });
  }

  // Check for horizontal scroll issues (overflow-x)
  if (
    content.includes('overflow-x: scroll') ||
    content.includes('overflow-x: auto')
  ) {
    issues.push({
      file: filePath,
      line: 0,
      type: 'responsive-issue',
      severity: 'info',
      current: 'overflow-x: scroll/auto',
      recommended: 'Ensure this is intentional and works on mobile',
      description: 'Horizontal scroll detected - verify mobile behavior',
      snippet: '',
    });
  }

  // Check for small touch targets
  const minHeightRegex = /min-height:\s*(\d+)px/g;
  let match;
  while ((match = minHeightRegex.exec(content)) !== null) {
    const height = parseInt(match[1]);
    if (height < 44) {
      issues.push({
        file: filePath,
        line: 0,
        type: 'accessibility-issue',
        severity: 'warning',
        current: `min-height: ${height}px`,
        recommended: 'Use min-height: 44px for touch-friendly targets',
        description: 'Touch target too small for mobile accessibility',
        snippet: '',
      });
    }
  }
}

/**
 * Recursively scan directory for component files
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      scanFile(filePath);
    }
  });
}

/**
 * Generate markdown report
 */
function generateReport() {
  const timestamp = new Date().toISOString();

  // Categorize issues
  const categories = {
    'hardcoded-color': [],
    'hardcoded-spacing': [],
    'hardcoded-font-size': [],
    'hardcoded-transition': [],
    'missing-hover-state': [],
    'missing-focus-state': [],
    'responsive-issue': [],
    'accessibility-issue': [],
  };

  issues.forEach(issue => {
    if (categories[issue.type]) {
      categories[issue.type].push(issue);
    }
  });

  // Count by severity
  const severityCounts = {
    critical: issues.filter(i => i.severity === 'critical').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
  };

  let report = `# Style Audit Report

**Generated:** ${new Date(timestamp).toLocaleString()}

## Executive Summary

- **Total Files Scanned:** ${totalFiles}
- **Total Issues Found:** ${issues.length}
- **Critical Issues:** ${severityCounts.critical}
- **Warnings:** ${severityCounts.warning}
- **Info:** ${severityCounts.info}

## Issue Breakdown by Category

`;

  // Add category summaries
  Object.entries(categories).forEach(([category, categoryIssues]) => {
    const categoryName = category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    report += `- **${categoryName}:** ${categoryIssues.length}\n`;
  });

  report += `\n---\n\n`;

  // Detailed issues by category
  Object.entries(categories).forEach(([category, categoryIssues]) => {
    if (categoryIssues.length === 0) return;

    const categoryName = category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    report += `## ${categoryName} (${categoryIssues.length} issues)\n\n`;

    // Group by file
    const byFile = {};
    categoryIssues.forEach(issue => {
      if (!byFile[issue.file]) {
        byFile[issue.file] = [];
      }
      byFile[issue.file].push(issue);
    });

    Object.entries(byFile).forEach(([file, fileIssues]) => {
      report += `### ${file}\n\n`;

      fileIssues.forEach((issue, index) => {
        report += `**Issue ${index + 1}** (${issue.severity.toUpperCase()})\n`;
        if (issue.line > 0) {
          report += `- **Line:** ${issue.line}\n`;
        }
        report += `- **Current:** \`${issue.current}\`\n`;
        report += `- **Recommended:** ${issue.recommended}\n`;
        report += `- **Description:** ${issue.description}\n`;
        if (issue.snippet) {
          report += `- **Code:** \`${issue.snippet}\`\n`;
        }
        report += `\n`;
      });

      report += `\n`;
    });
  });

  // Recommendations section
  report += `---

## Recommendations

### Priority 1: Critical Issues (${severityCounts.critical})

`;

  if (categories['hardcoded-color'].length > 0) {
    report += `1. **Replace Hardcoded Colors** (${categories['hardcoded-color'].length} instances)
   - Replace all hex and RGB colors with CSS custom properties
   - Use \`var(--color-primary)\`, \`var(--color-text)\`, etc.
   - Ensures theme consistency and easier maintenance

`;
  }

  if (categories['missing-focus-state'].length > 0) {
    report += `2. **Add Focus States** (${categories['missing-focus-state'].length} instances)
   - Add \`:focus-visible\` styles to all interactive elements
   - Critical for keyboard navigation and accessibility
   - Use \`outline: 2px solid var(--color-primary)\`

`;
  }

  report += `### Priority 2: Warnings (${severityCounts.warning})

`;

  if (categories['hardcoded-spacing'].length > 0) {
    report += `1. **Replace Hardcoded Spacing** (${categories['hardcoded-spacing'].length} instances)
   - Use spacing tokens: \`var(--spacing-md)\`, \`var(--spacing-lg)\`, etc.
   - Or use utility classes: \`.p-md\`, \`.m-lg\`, etc.
   - Ensures consistent spacing throughout the app

`;
  }

  if (categories['missing-hover-state'].length > 0) {
    report += `2. **Add Hover States** (${categories['missing-hover-state'].length} instances)
   - Add \`:hover\` styles to interactive elements
   - Provides visual feedback for user interactions
   - Use \`transition: var(--transition-fast)\` for smooth effects

`;
  }

  if (categories['hardcoded-font-size'].length > 0) {
    report += `3. **Replace Hardcoded Font Sizes** (${categories['hardcoded-font-size'].length} instances)
   - Use font-size tokens: \`var(--font-size-base)\`, \`var(--font-size-lg)\`, etc.
   - Or use utility classes: \`.text-base\`, \`.text-lg\`, etc.
   - Ensures consistent typography

`;
  }

  if (categories['responsive-issue'].length > 0) {
    report += `4. **Fix Responsive Issues** (${categories['responsive-issue'].length} instances)
   - Replace fixed widths with relative units
   - Add media queries for mobile, tablet, desktop
   - Test at 320px, 768px, 1024px, 1920px

`;
  }

  if (categories['accessibility-issue'].length > 0) {
    report += `5. **Fix Accessibility Issues** (${categories['accessibility-issue'].length} instances)
   - Ensure touch targets are at least 44x44px
   - Add proper ARIA labels where needed
   - Test with keyboard navigation

`;
  }

  report += `### Priority 3: Info (${severityCounts.info})

`;

  if (categories['hardcoded-transition'].length > 0) {
    report += `1. **Replace Hardcoded Transitions** (${categories['hardcoded-transition'].length} instances)
   - Use transition tokens: \`var(--transition-fast)\`, \`var(--transition-base)\`, etc.
   - Ensures consistent animation timing
   - Easier to adjust globally

`;
  }

  report += `---

## Next Steps

1. **Review Critical Issues First**
   - Focus on hardcoded colors and missing focus states
   - These have the biggest impact on user experience and accessibility

2. **Address Warnings**
   - Fix spacing, hover states, and font sizes
   - Improves visual consistency

3. **Polish with Info Items**
   - Standardize transitions
   - Final touches for a polished experience

4. **Test Thoroughly**
   - Test in both light and dark themes
   - Test on mobile, tablet, and desktop
   - Test with keyboard navigation
   - Test with screen readers

5. **Document Changes**
   - Keep track of what was fixed
   - Note any patterns or common issues
   - Update style guide if needed

---

## Design Tokens Reference

### Colors
\`\`\`css
${DESIGN_TOKENS.colors.map(token => `${token}`).join('\n')}
\`\`\`

### Spacing
\`\`\`css
${DESIGN_TOKENS.spacing.map(token => `${token}`).join('\n')}
\`\`\`

### Font Sizes
\`\`\`css
${DESIGN_TOKENS.fontSize.map(token => `${token}`).join('\n')}
\`\`\`

### Border Radius
\`\`\`css
${DESIGN_TOKENS.borderRadius.map(token => `${token}`).join('\n')}
\`\`\`

### Shadows
\`\`\`css
${DESIGN_TOKENS.shadows.map(token => `${token}`).join('\n')}
\`\`\`

### Transitions
\`\`\`css
${DESIGN_TOKENS.transitions.map(token => `${token}`).join('\n')}
\`\`\`

---

*This report was automatically generated by the style audit tool.*
`;

  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Starting style audit...\n');

  const componentsDir = path.join(process.cwd(), 'src', 'components');
  const servicesDir = path.join(process.cwd(), 'src', 'services');

  console.log('📁 Scanning components directory...');
  scanDirectory(componentsDir);

  console.log('📁 Scanning services directory...');
  scanDirectory(servicesDir);

  console.log(`\n✅ Scanned ${totalFiles} files`);
  console.log(`📊 Found ${issues.length} issues\n`);

  console.log('📝 Generating report...');
  const report = generateReport();

  const reportPath = path.join(process.cwd(), 'STYLE_AUDIT_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log(`✅ Report generated: ${reportPath}\n`);

  // Print summary
  const severityCounts = {
    critical: issues.filter(i => i.severity === 'critical').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
  };

  console.log('📊 Summary:');
  console.log(`   Critical: ${severityCounts.critical}`);
  console.log(`   Warnings: ${severityCounts.warning}`);
  console.log(`   Info: ${severityCounts.info}`);
  console.log(`   Total: ${issues.length}\n`);

  // Exit with error code if critical issues found
  if (severityCounts.critical > 0) {
    console.log('⚠️  Critical issues found! Please review the report.');
    process.exit(1);
  } else {
    console.log('✨ No critical issues found!');
    process.exit(0);
  }
}

main();
