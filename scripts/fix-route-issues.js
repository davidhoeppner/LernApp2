/**
 * Route Issues Fixer
 * Automatically fixes dead routes and invalid references
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Track all fixes applied
const fixLog = {
  timestamp: new Date().toISOString(),
  deadRoutesFixes: [],
  prerequisiteFixes: [],
  quizReferenceFixes: [],
};

/**
 * Fix dead route references in component files
 */
function fixDeadRoutes() {
  console.log('🔧 Fixing dead route references...');

  const componentsDir = path.join(rootDir, 'src', 'components');
  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.js'));

  files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Replace /ihk/modules/${...} with /modules/${...}
    const ihkModulesRegex = /#\/ihk\/modules\/\$\{([^}]+)\}/g;
    if (ihkModulesRegex.test(content)) {
      content = content.replace(ihkModulesRegex, '#/modules/${$1}');
      modified = true;
      fixLog.deadRoutesFixes.push({
        file: `src/components/${file}`,
        fix: 'Replaced #/ihk/modules/${...} with #/modules/${...}',
      });
    }

    // Replace navigate('/ihk/modules/${...}') with navigate('/modules/${...}')
    const navigateIhkModulesRegex =
      /navigate\(`\/ihk\/modules\/\$\{([^}]+)\}`\)/g;
    if (navigateIhkModulesRegex.test(content)) {
      content = content.replace(
        navigateIhkModulesRegex,
        'navigate(`/modules/${$1}`)'
      );
      modified = true;
      fixLog.deadRoutesFixes.push({
        file: `src/components/${file}`,
        fix: 'Replaced navigate(`/ihk/modules/${...}`) with navigate(`/modules/${...}`)',
      });
    }

    // Replace href="#/ihk/modules" with href="#/modules"
    if (content.includes('href="#/ihk/modules"')) {
      content = content.replace(/href="#\/ihk\/modules"/g, 'href="#/modules"');
      modified = true;
      fixLog.deadRoutesFixes.push({
        file: `src/components/${file}`,
        fix: 'Replaced href="#/ihk/modules" with href="#/modules"',
      });
    }

    // Replace navigate('/ihk') with navigate('/')
    if (content.includes("navigate('/ihk')")) {
      content = content.replace(/navigate\('\/ihk'\)/g, "navigate('/')");
      modified = true;
      fixLog.deadRoutesFixes.push({
        file: `src/components/${file}`,
        fix: "Replaced navigate('/ihk') with navigate('/')",
      });
    }

    // Replace href="#/ihk" with href="#/" (but not in breadcrumbs)
    // Keep breadcrumb links as they're just for display
    const lines = content.split('\n');
    const fixedLines = lines.map(line => {
      // Skip breadcrumb navigation items
      if (line.includes('IHK AP2') || line.includes('Lernpfade')) {
        return line;
      }
      // Fix other /ihk references
      if (line.includes('href="#/ihk"') && !line.includes('IHK AP2')) {
        modified = true;
        return line.replace(/href="#\/ihk"/g, 'href="#/"');
      }
      return line;
    });
    content = fixedLines.join('\n');

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`   ✅ Fixed ${file}`);
    }
  });
}

/**
 * Fix invalid prerequisites in module files
 */
function fixInvalidPrerequisites() {
  console.log('\n🔧 Fixing invalid prerequisites...');

  const fixes = {
    'bp-01-monitoring.json': {
      remove: ['bp-01-network-protocols'],
    },
    'bp-01-odbc.json': {
      replace: {
        'sql-ddl': 'sql-ddl-2025',
        'sql-dql': 'sql-dql-2025',
      },
    },
    'bp-02-nas-san.json': {
      remove: ['bp-01-conception'],
    },
    'bp-03-rest-api.json': {
      remove: ['bp-01-network-protocols'],
    },
    'bp-04-architecture-patterns.json': {
      remove: ['bp-05-oop'],
    },
  };

  Object.entries(fixes).forEach(([file, actions]) => {
    const filePath = path.join(rootDir, 'src', 'data', 'ihk', 'modules', file);

    if (!fs.existsSync(filePath)) {
      console.warn(`   ⚠️  File not found: ${file}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const module = JSON.parse(content);

    if (!module.prerequisites) {
      return;
    }

    let modified = false;

    // Handle removals
    if (actions.remove) {
      const originalLength = module.prerequisites.length;
      module.prerequisites = module.prerequisites.filter(
        prereq => !actions.remove.includes(prereq)
      );
      if (module.prerequisites.length < originalLength) {
        modified = true;
        fixLog.prerequisiteFixes.push({
          file: `src/data/ihk/modules/${file}`,
          fix: `Removed invalid prerequisites: ${actions.remove.join(', ')}`,
        });
      }
    }

    // Handle replacements
    if (actions.replace) {
      Object.entries(actions.replace).forEach(([oldId, newId]) => {
        const index = module.prerequisites.indexOf(oldId);
        if (index !== -1) {
          module.prerequisites[index] = newId;
          modified = true;
          fixLog.prerequisiteFixes.push({
            file: `src/data/ihk/modules/${file}`,
            fix: `Replaced prerequisite "${oldId}" with "${newId}"`,
          });
        }
      });
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(module, null, 2), 'utf-8');
      console.log(`   ✅ Fixed ${file}`);
    }
  });
}

/**
 * Fix invalid quiz references in module files
 */
function fixInvalidQuizReferences() {
  console.log('\n🔧 Fixing invalid quiz references...');

  const fixes = {
    'bp-01-kerberos.json': {
      replace: { 'bp-01-kerberos-quiz': 'kerberos-quiz' },
    },
    'bp-02-nas-san.json': {
      replace: { 'bp-02-storage-quiz': 'bp-02-nas-san-quiz' },
    },
    'bp-03-tdd.json': {
      replace: { 'tdd-quiz': 'tdd-quiz-2025' },
    },
    'bp-04-scrum.json': {
      replace: { 'scrum-quiz': 'scrum-quiz-2025' },
    },
    'bp-05-sorting.json': {
      replace: { 'sorting-algorithms-quiz': 'sorting-algorithms-quiz-2025' },
    },
    'bp-05-sql-reference.json': {
      replace: { 'sql-comprehensive-quiz': 'sql-comprehensive-quiz-2025' },
    },
    'fue-01-planning.json': {
      replace: { 'fue-01-quiz': 'fue-01-planning-quiz' },
    },
    'fue-02-anomalies-redundancies.json': {
      replace: {
        'fue-02-anomalies-quiz': 'fue-02-anomalies-redundancies-quiz',
      },
    },
    'fue-02-development.json': {
      replace: { 'fue-02-quiz': 'fue-02-development-quiz' },
    },
    'fue-03-load-performance-tests.json': {
      replace: {
        'fue-03-performance-testing-quiz': 'fue-03-load-performance-tests-quiz',
      },
    },
    'fue-03-quality.json': {
      replace: { 'fue-03-quiz': 'fue-03-quality-quiz' },
    },
    'fue-04-security.json': {
      replace: { 'fue-04-quiz': 'fue-04-security-quiz' },
    },
  };

  Object.entries(fixes).forEach(([file, actions]) => {
    const filePath = path.join(rootDir, 'src', 'data', 'ihk', 'modules', file);

    if (!fs.existsSync(filePath)) {
      console.warn(`   ⚠️  File not found: ${file}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const module = JSON.parse(content);

    if (!module.relatedQuizzes) {
      return;
    }

    let modified = false;

    // Handle replacements
    if (actions.replace) {
      Object.entries(actions.replace).forEach(([oldId, newId]) => {
        const index = module.relatedQuizzes.indexOf(oldId);
        if (index !== -1) {
          module.relatedQuizzes[index] = newId;
          modified = true;
          fixLog.quizReferenceFixes.push({
            file: `src/data/ihk/modules/${file}`,
            fix: `Replaced quiz reference "${oldId}" with "${newId}"`,
          });
        }
      });
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(module, null, 2), 'utf-8');
      console.log(`   ✅ Fixed ${file}`);
    }
  });
}

/**
 * Generate fix report
 */
function generateFixReport() {
  const reportPath = path.join(rootDir, 'ROUTE_FIXES_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(fixLog, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('📊 FIX SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Dead Route Fixes: ${fixLog.deadRoutesFixes.length}`);
  console.log(`✅ Prerequisite Fixes: ${fixLog.prerequisiteFixes.length}`);
  console.log(`✅ Quiz Reference Fixes: ${fixLog.quizReferenceFixes.length}`);
  console.log('='.repeat(60));
  console.log(`\n📄 Full report saved to: ${reportPath}`);
}

/**
 * Main fix function
 */
function fixRouteIssues() {
  console.log('🔧 Starting route issue fixes...\n');

  try {
    // Fix dead routes
    fixDeadRoutes();

    // Fix invalid prerequisites
    fixInvalidPrerequisites();

    // Fix invalid quiz references
    fixInvalidQuizReferences();

    // Generate report
    generateFixReport();

    console.log('\n✅ All fixes applied successfully!');
    console.log(
      '💡 Run audit-routes.js again to verify all issues are resolved.'
    );
  } catch (error) {
    console.error('\n❌ Error applying fixes:', error);
    process.exit(1);
  }
}

// Run the fixer
fixRouteIssues();
