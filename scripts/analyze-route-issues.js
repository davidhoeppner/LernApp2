// @ts-nocheck
/* eslint-env node */
/**
 * Route Issues Analyzer
 * Generates detailed analysis of dead routes and invalid references
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const process.cwd() = path.dirname(__filename);
const rootDir = path.resolve(process.cwd(), '..');

/**
 * Load the route audit report
 */
function loadAuditReport() {
  const reportPath = path.join(rootDir, 'ROUTE_AUDIT_REPORT.json');

  if (!fs.existsSync(reportPath)) {
    console.error(
      '❌ Route audit report not found. Run audit-routes.js first.'
    );

    process.exit(1);
  }

  const content = fs.readFileSync(reportPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Analyze dead routes and find where they're referenced
 */
function analyzeDeadRoutes(deadRoutes) {
  const analysis = [];
  const componentsDir = path.join(rootDir, 'src', 'components');

  if (!fs.existsSync(componentsDir)) {
    return analysis;
  }

  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.js'));

  deadRoutes.forEach(deadRoute => {
    const references = [];

    files.forEach(file => {
      const filePath = path.join(componentsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for the dead route in this line
        if (line.includes(deadRoute)) {
          references.push({
            file: `src/components/${file}`,
            line: index + 1,
            code: line.trim(),
          });
        }
      });
    });

    analysis.push({
      route: deadRoute,
      references: references,
      recommendation: getDeadRouteRecommendation(deadRoute),
    });
  });

  return analysis;
}

/**
 * Get recommendation for fixing a dead route
 */
function getDeadRouteRecommendation(route) {
  if (route === '/ihk') {
    return 'Remove references to /ihk route. IHK content is now integrated into /modules and /quizzes.';
  }
  if (route === '/ihk/modules') {
    return 'Replace with /modules route. IHK modules are now part of the main modules view.';
  }
  if (route.includes('/ihk/modules/')) {
    return 'Replace with /modules/:id route. Use /modules/${moduleId} instead.';
  }
  return 'Remove or update this route reference.';
}

/**
 * Analyze invalid prerequisites
 */
function analyzeInvalidPrerequisites(invalidPrereqs, moduleIds) {
  const analysis = [];

  invalidPrereqs.forEach(ref => {
    const suggestions = findSimilarModules(ref.invalidId, moduleIds);

    analysis.push({
      file: `src/data/ihk/modules/${ref.file}`,
      moduleId: ref.moduleId,
      invalidPrerequisite: ref.invalidId,
      suggestions: suggestions,
      recommendation: getSuggestionRecommendation(ref.invalidId, suggestions),
    });
  });

  return analysis;
}

/**
 * Analyze invalid quiz references
 */
function analyzeInvalidQuizReferences(invalidQuizRefs, quizIds) {
  const analysis = [];

  invalidQuizRefs.forEach(ref => {
    const suggestions = findSimilarQuizzes(ref.invalidId, quizIds);

    analysis.push({
      file: `src/data/ihk/modules/${ref.file}`,
      moduleId: ref.moduleId,
      invalidQuizId: ref.invalidId,
      suggestions: suggestions,
      recommendation: getSuggestionRecommendation(ref.invalidId, suggestions),
    });
  });

  return analysis;
}

/**
 * Find similar module IDs using fuzzy matching
 */
function findSimilarModules(invalidId, moduleIds) {
  const suggestions = [];

  moduleIds.forEach(moduleId => {
    const similarity = calculateSimilarity(invalidId, moduleId);
    if (similarity > 0.5) {
      suggestions.push({
        id: moduleId,
        similarity: similarity,
      });
    }
  });

  return suggestions.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}

/**
 * Find similar quiz IDs using fuzzy matching
 */
function findSimilarQuizzes(invalidId, quizIds) {
  const suggestions = [];

  quizIds.forEach(quizId => {
    const similarity = calculateSimilarity(invalidId, quizId);
    if (similarity > 0.5) {
      suggestions.push({
        id: quizId,
        similarity: similarity,
      });
    }
  });

  return suggestions.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}

/**
 * Calculate similarity between two strings (simple Levenshtein-based)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Get recommendation based on suggestions
 */
function getSuggestionRecommendation(invalidId, suggestions) {
  if (suggestions.length === 0) {
    return `Remove reference to "${invalidId}" as no similar items exist.`;
  }

  const bestMatch = suggestions[0];
  if (bestMatch.similarity > 0.8) {
    return `Replace "${invalidId}" with "${bestMatch.id}" (${Math.round(bestMatch.similarity * 100)}% match).`;
  }

  return `Consider replacing "${invalidId}" with one of the suggested alternatives or remove the reference.`;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(
  report,
  deadRoutesAnalysis,
  prereqsAnalysis,
  quizRefsAnalysis
) {
  let markdown = '# Route Issues Analysis Report\n\n';
  markdown += `Generated: ${new Date().toISOString()}\n\n`;

  markdown += '## Summary\n\n';
  markdown += `- **Dead Routes:** ${report.deadRoutes.length}\n`;
  markdown += `- **Invalid Prerequisites:** ${report.invalidPrerequisites.length}\n`;
  markdown += `- **Invalid Quiz References:** ${report.invalidQuizReferences.length}\n\n`;

  // Dead Routes Section
  if (deadRoutesAnalysis.length > 0) {
    markdown += '## Dead Routes\n\n';
    markdown +=
      'These routes are referenced in components but not registered in the router.\n\n';

    deadRoutesAnalysis.forEach(item => {
      markdown += `### Route: \`${item.route}\`\n\n`;
      markdown += `**Recommendation:** ${item.recommendation}\n\n`;

      if (item.references.length > 0) {
        markdown += '**References:**\n\n';
        item.references.forEach(ref => {
          markdown += `- \`${ref.file}\` (line ${ref.line})\n`;
          markdown += `  \`\`\`javascript\n  ${ref.code}\n  \`\`\`\n\n`;
        });
      }
    });
  }

  // Invalid Prerequisites Section
  if (prereqsAnalysis.length > 0) {
    markdown += '## Invalid Prerequisites\n\n';
    markdown +=
      'These module prerequisites reference non-existent modules.\n\n';

    prereqsAnalysis.forEach(item => {
      markdown += `### ${item.file}\n\n`;
      markdown += `- **Module:** ${item.moduleId}\n`;
      markdown += `- **Invalid Prerequisite:** \`${item.invalidPrerequisite}\`\n`;
      markdown += `- **Recommendation:** ${item.recommendation}\n`;

      if (item.suggestions.length > 0) {
        markdown += `- **Suggestions:**\n`;
        item.suggestions.forEach(sug => {
          markdown += `  - \`${sug.id}\` (${Math.round(sug.similarity * 100)}% match)\n`;
        });
      }
      markdown += '\n';
    });
  }

  // Invalid Quiz References Section
  if (quizRefsAnalysis.length > 0) {
    markdown += '## Invalid Quiz References\n\n';
    markdown += 'These modules reference non-existent quizzes.\n\n';

    quizRefsAnalysis.forEach(item => {
      markdown += `### ${item.file}\n\n`;
      markdown += `- **Module:** ${item.moduleId}\n`;
      markdown += `- **Invalid Quiz:** \`${item.invalidQuizId}\`\n`;
      markdown += `- **Recommendation:** ${item.recommendation}\n`;

      if (item.suggestions.length > 0) {
        markdown += `- **Suggestions:**\n`;
        item.suggestions.forEach(sug => {
          markdown += `  - \`${sug.id}\` (${Math.round(sug.similarity * 100)}% match)\n`;
        });
      }
      markdown += '\n';
    });
  }

  markdown += '## Next Steps\n\n';
  markdown += '1. Review each issue and its recommendation\n';
  markdown += '2. Update component files to fix dead route references\n';
  markdown += '3. Update module JSON files to fix invalid prerequisites\n';
  markdown += '4. Update module JSON files to fix invalid quiz references\n';
  markdown += '5. Run the audit again to verify all issues are resolved\n';

  return markdown;
}

/**
 * Main analysis function
 */
function analyzeRouteIssues() {
  console.log('🔍 Analyzing route issues...\n');

  // Load audit report
  const report = loadAuditReport();

  // Analyze dead routes
  console.log('📋 Analyzing dead routes...');
  const deadRoutesAnalysis = analyzeDeadRoutes(report.deadRoutes);

  // Analyze invalid prerequisites
  console.log('📋 Analyzing invalid prerequisites...');
  const prereqsAnalysis = analyzeInvalidPrerequisites(
    report.invalidPrerequisites,
    report.moduleIds
  );

  // Analyze invalid quiz references
  console.log('📋 Analyzing invalid quiz references...');
  const quizRefsAnalysis = analyzeInvalidQuizReferences(
    report.invalidQuizReferences,
    report.quizIds
  );

  // Generate markdown report
  console.log('📄 Generating detailed report...');
  const markdown = generateMarkdownReport(
    report,
    deadRoutesAnalysis,
    prereqsAnalysis,
    quizRefsAnalysis
  );

  // Save report
  const reportPath = path.join(rootDir, 'ROUTE_ISSUES_ANALYSIS.md');
  fs.writeFileSync(reportPath, markdown);

  console.log('\n✅ Analysis complete!');
  console.log(`📄 Detailed report saved to: ${reportPath}`);
}

// Run the analysis
try {
  analyzeRouteIssues();
} catch (error) {
  console.error('❌ Analysis failed:', error);

  process.exit(1);
}
