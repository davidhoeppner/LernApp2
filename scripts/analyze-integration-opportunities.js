import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class IntegrationAnalyzer {
  constructor() {
    this.components = new Map();
    this.services = new Map();
    this.usedInRoutes = new Set();
    this.usedInImports = new Set();
  }

  async analyze() {
    console.log('🔍 Analyzing integration opportunities...\n');

    // Scan components and services
    await this.scanComponents();
    await this.scanServices();

    // Check what's used in app.js
    await this.analyzeAppUsage();

    // Identify unused but potentially valuable code
    const opportunities = this.identifyOpportunities();

    return opportunities;
  }

  async scanComponents() {
    const componentsDir = path.join(__dirname, '..', 'src', 'components');
    const files = fs.readdirSync(componentsDir);

    for (const file of files) {
      if (file.endsWith('.js')) {
        const filePath = path.join(componentsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const componentName = path.basename(file, '.js');

        this.components.set(componentName, {
          file: `src/components/${file}`,
          lines: content.split('\n').length,
          hasClass: content.includes('class '),
          hasRender: content.includes('render('),
          hasAsync: content.includes('async '),
          complexity: this.estimateComplexity(content),
        });
      }
    }
  }

  async scanServices() {
    const servicesDir = path.join(__dirname, '..', 'src', 'services');
    const files = fs.readdirSync(servicesDir);

    for (const file of files) {
      if (file.endsWith('.js')) {
        const filePath = path.join(servicesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const serviceName = path.basename(file, '.js');

        this.services.set(serviceName, {
          file: `src/services/${file}`,
          lines: content.split('\n').length,
          methods: this.extractMethods(content),
          complexity: this.estimateComplexity(content),
        });
      }
    }
  }

  async analyzeAppUsage() {
    const appPath = path.join(__dirname, '..', 'src', 'app.js');
    const content = fs.readFileSync(appPath, 'utf-8');

    // Find imports
    const importMatches = content.matchAll(/import\s+(\w+)\s+from/g);
    for (const match of importMatches) {
      this.usedInImports.add(match[1]);
    }

    // Find route registrations
    const routeMatches = content.matchAll(/new\s+(\w+)\(/g);
    for (const match of routeMatches) {
      this.usedInRoutes.add(match[1]);
    }
  }

  extractMethods(content) {
    const methods = [];
    const methodMatches = content.matchAll(
      /(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/g
    );
    for (const match of methodMatches) {
      if (
        match[1] !== 'constructor' &&
        match[1] !== 'if' &&
        match[1] !== 'for'
      ) {
        methods.push(match[1]);
      }
    }
    return methods;
  }

  estimateComplexity(content) {
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+\w+/g) || []).length;
    const classes = (content.match(/class\s+\w+/g) || []).length;
    const asyncOps = (content.match(/async\s+/g) || []).length;

    return {
      lines,
      functions,
      classes,
      asyncOps,
      score: lines + functions * 10 + classes * 20 + asyncOps * 5,
    };
  }

  identifyOpportunities() {
    const opportunities = [];

    // Check for unused components
    for (const [name, info] of this.components.entries()) {
      const isUsed =
        this.usedInImports.has(name) || this.usedInRoutes.has(name);

      if (!isUsed) {
        opportunities.push({
          type: 'component',
          name,
          ...info,
          recommendation: this.analyzeComponent(name, info),
        });
      }
    }

    // Check for service overlap
    const serviceOpportunities = this.analyzeServiceOverlap();
    opportunities.push(...serviceOpportunities);

    return opportunities;
  }

  analyzeComponent(name, info) {
    // Analyze if component should be integrated or removed
    const analysis = {
      functionalityValue: 'unknown',
      codeQuality: info.complexity.score < 500 ? 'good' : 'complex',
      integrationEffort:
        info.lines < 200 ? 'low' : info.lines < 400 ? 'medium' : 'high',
      userBenefit: 'unknown',
      action: 'review',
    };

    // Specific component analysis
    if (name.includes('Quiz') && !name.includes('IHK')) {
      analysis.functionalityValue = 'low';
      analysis.userBenefit = 'low';
      analysis.action = 'remove';
      analysis.reason = 'Superseded by IHK quiz components';
    } else if (name.includes('Module') && !name.includes('IHK')) {
      analysis.functionalityValue = 'medium';
      analysis.userBenefit = 'medium';
      analysis.action = 'evaluate';
      analysis.reason = 'May have unique features worth preserving';
    } else if (name.includes('LearningPath') && !name.includes('IHK')) {
      analysis.functionalityValue = 'medium';
      analysis.userBenefit = 'medium';
      analysis.action = 'evaluate';
      analysis.reason = 'Check if IHK version covers all functionality';
    }

    return analysis;
  }

  analyzeServiceOverlap() {
    const opportunities = [];

    // Check QuizService vs IHKContentService
    if (
      this.services.has('QuizService') &&
      this.services.has('IHKContentService')
    ) {
      const quizService = this.services.get('QuizService');
      const ihkService = this.services.get('IHKContentService');

      opportunities.push({
        type: 'service-overlap',
        name: 'QuizService + IHKContentService',
        services: ['QuizService', 'IHKContentService'],
        recommendation: {
          functionalityValue: 'high',
          codeQuality: 'good',
          integrationEffort: 'medium',
          userBenefit: 'high',
          action: 'consolidate',
          reason:
            'Both handle quiz data loading. IHKContentService is more comprehensive.',
          strategy:
            'Migrate QuizService functionality into IHKContentService or create facade',
        },
      });
    }

    // Check ModuleService vs IHKContentService
    if (
      this.services.has('ModuleService') &&
      this.services.has('IHKContentService')
    ) {
      opportunities.push({
        type: 'service-overlap',
        name: 'ModuleService + IHKContentService',
        services: ['ModuleService', 'IHKContentService'],
        recommendation: {
          functionalityValue: 'high',
          codeQuality: 'good',
          integrationEffort: 'medium',
          userBenefit: 'high',
          action: 'consolidate',
          reason: 'Both handle module data. Consider unified content service.',
          strategy:
            'Create unified ContentService or clearly separate concerns',
        },
      });
    }

    // Check ProgressService vs ExamProgressService
    if (
      this.services.has('ProgressService') &&
      this.services.has('ExamProgressService')
    ) {
      opportunities.push({
        type: 'service-overlap',
        name: 'ProgressService + ExamProgressService',
        services: ['ProgressService', 'ExamProgressService'],
        recommendation: {
          functionalityValue: 'high',
          codeQuality: 'good',
          integrationEffort: 'low',
          userBenefit: 'medium',
          action: 'evaluate',
          reason: 'Both track progress. May have different scopes.',
          strategy:
            'Determine if they serve different purposes or should be merged',
        },
      });
    }

    return opportunities;
  }
}

function generateReport(opportunities) {
  const timestamp = new Date().toISOString();

  let report = `# Integration Opportunities Analysis Report\n\n`;
  report += `Generated: ${timestamp}\n\n`;
  report += `## Executive Summary\n\n`;

  const components = opportunities.filter(o => o.type === 'component');
  const serviceOverlaps = opportunities.filter(
    o => o.type === 'service-overlap'
  );

  report += `- **Unused Components Found**: ${components.length}\n`;
  report += `- **Service Overlaps Found**: ${serviceOverlaps.length}\n`;
  report += `- **Total Opportunities**: ${opportunities.length}\n\n`;

  report += `## Analysis Criteria\n\n`;
  report += `Each opportunity is evaluated based on:\n`;
  report += `- **Functionality Value**: Does it provide useful features?\n`;
  report += `- **Code Quality**: Is it well-written and maintainable?\n`;
  report += `- **Integration Effort**: How difficult to integrate?\n`;
  report += `- **User Benefit**: Would users benefit from this feature?\n\n`;

  report += `---\n\n`;

  if (components.length > 0) {
    report += `## Unused Components\n\n`;

    const toRemove = components.filter(
      c => c.recommendation.action === 'remove'
    );
    const toEvaluate = components.filter(
      c => c.recommendation.action === 'evaluate'
    );
    const toReview = components.filter(
      c => c.recommendation.action === 'review'
    );

    if (toRemove.length > 0) {
      report += `### 🔴 Recommended for Removal (${toRemove.length})\n\n`;
      toRemove.forEach(comp => {
        report += `#### ${comp.name}\n`;
        report += `- **File**: \`${comp.file}\`\n`;
        report += `- **Lines**: ${comp.lines}\n`;
        report += `- **Complexity**: ${comp.complexity.score}\n`;
        report += `- **Reason**: ${comp.recommendation.reason}\n`;
        report += `- **Action**: Remove after verifying no dependencies\n\n`;
      });
    }

    if (toEvaluate.length > 0) {
      report += `### 🟡 Requires Evaluation (${toEvaluate.length})\n\n`;
      toEvaluate.forEach(comp => {
        report += `#### ${comp.name}\n`;
        report += `- **File**: \`${comp.file}\`\n`;
        report += `- **Lines**: ${comp.lines}\n`;
        report += `- **Complexity**: ${comp.complexity.score}\n`;
        report += `- **Reason**: ${comp.recommendation.reason}\n`;
        report += `- **Integration Effort**: ${comp.recommendation.integrationEffort}\n`;
        report += `- **Action**: Review functionality before deciding\n\n`;
      });
    }

    if (toReview.length > 0) {
      report += `### 🔵 Needs Review (${toReview.length})\n\n`;
      toReview.forEach(comp => {
        report += `#### ${comp.name}\n`;
        report += `- **File**: \`${comp.file}\`\n`;
        report += `- **Lines**: ${comp.lines}\n`;
        report += `- **Action**: Manual review required\n\n`;
      });
    }
  }

  if (serviceOverlaps.length > 0) {
    report += `## Service Consolidation Opportunities\n\n`;

    serviceOverlaps.forEach(overlap => {
      report += `### ${overlap.name}\n`;
      report += `- **Services**: ${overlap.services.join(', ')}\n`;
      report += `- **Functionality Value**: ${overlap.recommendation.functionalityValue}\n`;
      report += `- **Code Quality**: ${overlap.recommendation.codeQuality}\n`;
      report += `- **Integration Effort**: ${overlap.recommendation.integrationEffort}\n`;
      report += `- **User Benefit**: ${overlap.recommendation.userBenefit}\n`;
      report += `- **Recommended Action**: ${overlap.recommendation.action}\n\n`;
      report += `**Analysis:**\n`;
      report += `${overlap.recommendation.reason}\n\n`;
      report += `**Strategy:**\n`;
      report += `${overlap.recommendation.strategy}\n\n`;
      report += `---\n\n`;
    });
  }

  report += `## Recommendations\n\n`;
  report += `### Immediate Actions\n`;
  report += `1. Remove components superseded by IHK versions\n`;
  report += `2. Consolidate quiz-related services\n`;
  report += `3. Create unified content service architecture\n\n`;

  report += `### Medium-term Actions\n`;
  report += `1. Evaluate module-related components for unique features\n`;
  report += `2. Standardize progress tracking services\n`;
  report += `3. Document service boundaries and responsibilities\n\n`;

  report += `### Long-term Actions\n`;
  report += `1. Create comprehensive service layer documentation\n`;
  report += `2. Establish patterns for new feature development\n`;
  report += `3. Regular code audits to prevent duplication\n\n`;

  report += `## Integration Decision Matrix\n\n`;
  report += `| Component/Service | Action | Priority | Effort | Benefit |\n`;
  report += `|-------------------|--------|----------|--------|----------|\n`;

  opportunities.forEach(opp => {
    const name = opp.name;
    const action = opp.recommendation?.action || 'review';
    const effort = opp.recommendation?.integrationEffort || 'unknown';
    const benefit = opp.recommendation?.userBenefit || 'unknown';
    const priority =
      action === 'remove'
        ? 'High'
        : action === 'consolidate'
          ? 'High'
          : 'Medium';

    report += `| ${name} | ${action} | ${priority} | ${effort} | ${benefit} |\n`;
  });

  report += `\n`;

  report += `## Next Steps\n\n`;
  report += `1. Review this report with the team\n`;
  report += `2. Prioritize integration/removal decisions\n`;
  report += `3. Create detailed migration plans for consolidations\n`;
  report += `4. Execute changes incrementally with testing\n`;
  report += `5. Update documentation after each change\n`;

  return report;
}

// Run analysis
const analyzer = new IntegrationAnalyzer();
const opportunities = await analyzer.analyze();

console.log('📝 Generating report...\n');

const report = generateReport(opportunities);
const reportPath = path.join(
  __dirname,
  '..',
  'INTEGRATION_OPPORTUNITIES_REPORT.md'
);
fs.writeFileSync(reportPath, report);

console.log('✅ Report generated successfully!');
console.log(`📄 Report saved to: INTEGRATION_OPPORTUNITIES_REPORT.md\n`);

console.log('📊 Summary:');
console.log(
  `   - Unused components: ${opportunities.filter(o => o.type === 'component').length}`
);
console.log(
  `   - Service overlaps: ${opportunities.filter(o => o.type === 'service-overlap').length}`
);
console.log(`   - Total opportunities: ${opportunities.length}`);
