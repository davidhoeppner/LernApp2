// @ts-nocheck
/* eslint-env node */
/**
 * Route Auditor Script
 * Extracts and catalogs all routes, module IDs, quiz IDs, and identifies dead routes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const rootDir = path.resolve(process.cwd(), '..');

/**
 * Extract registered routes from Router.js and app.js
 */
function extractRegisteredRoutes() {
  const routes = new Set();

  // Known registered routes from app.js analysis
  const knownRoutes = [
    '/',
    '/modules',
    '/modules/:id',
    '/quizzes',
    '/quizzes/:id',
    '/progress',
  ];

  knownRoutes.forEach(route => routes.add(route));

  return Array.from(routes);
}

/**
 * Extract route references from component files
 */
function extractRouteReferences() {
  const references = new Set();
  const componentsDir = path.join(rootDir, 'src', 'components');

  if (!fs.existsSync(componentsDir)) {
    console.warn('⚠️  Components directory not found');
    return Array.from(references);
  }

  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.js'));

  files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Match href="#/..." patterns
    const hrefMatches = content.matchAll(/href=["']#(\/[^"']*?)["']/g);
    for (const match of hrefMatches) {
      references.add(match[1]);
    }

    // Match navigate('/...') patterns
    const navigateMatches = content.matchAll(/navigate\(['"]([^'"]+)['"]/g);
    for (const match of navigateMatches) {
      references.add(match[1]);
    }

    // Match navigate(`/...`) patterns (template literals)
    const navigateTemplateMatches = content.matchAll(/navigate\(`([^`]+)`\)/g);
    for (const match of navigateTemplateMatches) {
      // Extract the base route pattern
      const route = match[1].replace(/\$\{[^}]+\}/g, ':param');
      references.add(route);
    }
  });

  return Array.from(references);
}

/**
 * Extract module IDs from all module JSON files
 */
function extractModuleIds() {
  const moduleIds = new Set();
  const modulesDir = path.join(rootDir, 'src', 'data', 'ihk', 'modules');

  if (!fs.existsSync(modulesDir)) {
    console.warn('⚠️  IHK modules directory not found');
    return Array.from(moduleIds);
  }

  const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    try {
      const filePath = path.join(modulesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const module = JSON.parse(content);

      if (module.id) {
        moduleIds.add(module.id);
      }
    } catch (error) {
      console.error(`❌ Error reading module file ${file}:`, error.message);
    }
  });

  // Also check legacy modules.json
  const legacyModulesPath = path.join(rootDir, 'src', 'data', 'modules.json');
  if (fs.existsSync(legacyModulesPath)) {
    try {
      const content = fs.readFileSync(legacyModulesPath, 'utf-8');
      const modules = JSON.parse(content);

      if (Array.isArray(modules)) {
        modules.forEach(module => {
          if (module.id) {
            moduleIds.add(module.id);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error reading legacy modules.json:', error.message);
    }
  }

  return Array.from(moduleIds);
}

/**
 * Extract quiz IDs from all quiz JSON files
 */
function extractQuizIds() {
  const quizIds = new Set();
  const quizzesDir = path.join(rootDir, 'src', 'data', 'ihk', 'quizzes');

  if (!fs.existsSync(quizzesDir)) {
    console.warn('⚠️  IHK quizzes directory not found');
    return Array.from(quizIds);
  }

  const files = fs.readdirSync(quizzesDir).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    try {
      const filePath = path.join(quizzesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const quiz = JSON.parse(content);

      if (quiz.id) {
        quizIds.add(quiz.id);
      }
    } catch (error) {
      console.error(`❌ Error reading quiz file ${file}:`, error.message);
    }
  });

  return Array.from(quizIds);
}

/**
 * Check if a route pattern matches a referenced route
 */
function routeMatches(pattern, reference) {
  // Exact match
  if (pattern === reference) return true;

  // Pattern matching (e.g., /modules/:id matches /modules/fue-01-planning)
  const patternRegex = pattern.replace(/:[^/]+/g, '[^/]+');
  const regex = new RegExp(`^${patternRegex}$`);

  return regex.test(reference);
}

/**
 * Identify dead routes (referenced but not registered)
 */
function identifyDeadRoutes(registeredRoutes, referencedRoutes) {
  const deadRoutes = [];

  referencedRoutes.forEach(ref => {
    const isRegistered = registeredRoutes.some(reg => routeMatches(reg, ref));

    if (!isRegistered) {
      deadRoutes.push(ref);
    }
  });

  return deadRoutes;
}

/**
 * Check module prerequisites for invalid references
 */
function checkModulePrerequisites(moduleIds) {
  const invalidRefs = [];
  const modulesDir = path.join(rootDir, 'src', 'data', 'ihk', 'modules');

  if (!fs.existsSync(modulesDir)) {
    return invalidRefs;
  }

  const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    try {
      const filePath = path.join(modulesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const module = JSON.parse(content);

      if (module.prerequisites && Array.isArray(module.prerequisites)) {
        module.prerequisites.forEach(prereqId => {
          if (!moduleIds.includes(prereqId)) {
            invalidRefs.push({
              file: file,
              moduleId: module.id,
              field: 'prerequisites',
              invalidId: prereqId,
            });
          }
        });
      }
    } catch (error) {
      console.error(
        `❌ Error checking prerequisites in ${file}:`,
        error.message
      );
    }
  });

  return invalidRefs;
}

/**
 * Check relatedQuizzes for invalid references
 */
function checkRelatedQuizzes(moduleIds, quizIds) {
  const invalidRefs = [];
  const modulesDir = path.join(rootDir, 'src', 'data', 'ihk', 'modules');

  if (!fs.existsSync(modulesDir)) {
    return invalidRefs;
  }

  const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    try {
      const filePath = path.join(modulesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const module = JSON.parse(content);

      if (module.relatedQuizzes && Array.isArray(module.relatedQuizzes)) {
        module.relatedQuizzes.forEach(quizId => {
          if (!quizIds.includes(quizId)) {
            invalidRefs.push({
              file: file,
              moduleId: module.id,
              field: 'relatedQuizzes',
              invalidId: quizId,
            });
          }
        });
      }
    } catch (error) {
      console.error(
        `❌ Error checking relatedQuizzes in ${file}:`,
        error.message
      );
    }
  });

  return invalidRefs;
}

/**
 * Main audit function
 */
function auditRoutes() {
  console.log('🔍 Starting route audit...\n');

  // Extract all data
  console.log('📋 Extracting registered routes...');
  const registeredRoutes = extractRegisteredRoutes();
  console.log(`   Found ${registeredRoutes.length} registered routes`);

  console.log('📋 Extracting route references from components...');
  const referencedRoutes = extractRouteReferences();
  console.log(`   Found ${referencedRoutes.length} route references`);

  console.log('📋 Extracting module IDs...');
  const moduleIds = extractModuleIds();
  console.log(`   Found ${moduleIds.length} modules`);

  console.log('📋 Extracting quiz IDs...');
  const quizIds = extractQuizIds();
  console.log(`   Found ${quizIds.length} quizzes`);

  console.log('\n🔍 Analyzing routes...');
  const deadRoutes = identifyDeadRoutes(registeredRoutes, referencedRoutes);

  console.log('🔍 Checking module prerequisites...');
  const invalidPrereqs = checkModulePrerequisites(moduleIds);

  console.log('🔍 Checking related quizzes...');
  const invalidQuizRefs = checkRelatedQuizzes(moduleIds, quizIds);

  // Create audit report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      registeredRoutes: registeredRoutes.length,
      referencedRoutes: referencedRoutes.length,
      moduleIds: moduleIds.length,
      quizIds: quizIds.length,
      deadRoutes: deadRoutes.length,
      invalidPrerequisites: invalidPrereqs.length,
      invalidQuizReferences: invalidQuizRefs.length,
    },
    registeredRoutes: registeredRoutes.sort(),
    referencedRoutes: referencedRoutes.sort(),
    moduleIds: moduleIds.sort(),
    quizIds: quizIds.sort(),
    deadRoutes: deadRoutes.sort(),
    invalidPrerequisites: invalidPrereqs,
    invalidQuizReferences: invalidQuizRefs,
  };

  // Save report
  const reportPath = path.join(rootDir, 'ROUTE_AUDIT_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 ROUTE AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Registered Routes: ${registeredRoutes.length}`);
  console.log(`📍 Referenced Routes: ${referencedRoutes.length}`);
  console.log(`📚 Module IDs: ${moduleIds.length}`);
  console.log(`📝 Quiz IDs: ${quizIds.length}`);
  console.log(`❌ Dead Routes: ${deadRoutes.length}`);
  console.log(`⚠️  Invalid Prerequisites: ${invalidPrereqs.length}`);
  console.log(`⚠️  Invalid Quiz References: ${invalidQuizRefs.length}`);
  console.log('='.repeat(60));

  if (deadRoutes.length > 0) {
    console.log('\n❌ Dead Routes Found:');
    deadRoutes.forEach(route => {
      console.log(`   - ${route}`);
    });
  }

  if (invalidPrereqs.length > 0) {
    console.log('\n⚠️  Invalid Prerequisites Found:');
    invalidPrereqs.forEach(ref => {
      console.log(
        `   - ${ref.file}: ${ref.moduleId} references non-existent prerequisite "${ref.invalidId}"`
      );
    });
  }

  if (invalidQuizRefs.length > 0) {
    console.log('\n⚠️  Invalid Quiz References Found:');
    invalidQuizRefs.forEach(ref => {
      console.log(
        `   - ${ref.file}: ${ref.moduleId} references non-existent quiz "${ref.invalidId}"`
      );
    });
  }

  if (
    deadRoutes.length === 0 &&
    invalidPrereqs.length === 0 &&
    invalidQuizRefs.length === 0
  ) {
    console.log('\n✅ No issues found! All routes and references are valid.');
  }

  console.log(`\n📄 Full report saved to: ${reportPath}`);

  return report;
}

// Run the audit
try {
  const report = auditRoutes();

  // Exit with error code if issues found
  if (
    report.deadRoutes.length > 0 ||
    report.invalidPrerequisites.length > 0 ||
    report.invalidQuizReferences.length > 0
  ) {
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Route audit failed:', error);
  process.exit(1);
}
