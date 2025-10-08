// @ts-nocheck
/* eslint-env node */
/**
 * Comprehensive Validation Orchestrator
 * Runs all validators and generates a comprehensive validation report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const process.cwd() = path.dirname(__filename);
const rootDir = path.resolve(process.cwd(), '..');

// Import validation functions from existing scripts
const REQUIRED_FIELDS = ['id', 'title', 'description', 'category', 'content'];

const FIELD_TYPES = {
  id: 'string',
  title: 'string',
  description: 'string',
  category: 'string',
  subcategory: 'string',
  difficulty: 'string',
  examRelevance: 'string',
  newIn2025: 'boolean',
  removedIn2025: 'boolean',
  important: 'boolean',
  estimatedTime: 'number',
  prerequisites: 'array',
  tags: 'array',
  content: 'string',
  codeExamples: 'array',
  relatedQuizzes: 'array',
  resources: 'array',
  lastUpdated: 'string',
  version: 'string',
};

function getType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

// JSON Structure Validation
function validateJSONStructure(data, context = '') {
  const issues = [];

  for (const field of REQUIRED_FIELDS) {
    if (!(field in data)) {
      issues.push({
        category: 'structure',
        severity: 'error',
        field,
        message: `${context}Missing required field: ${field}`,
      });
    }
  }

  for (const [field, value] of Object.entries(data)) {
    if (field in FIELD_TYPES) {
      const expectedType = FIELD_TYPES[field];
      const actualType = getType(value);

      if (actualType !== expectedType) {
        issues.push({
          category: 'structure',
          severity: 'error',
          field,
          message: `${context}Invalid type for ${field}: expected ${expectedType}, got ${actualType}`,
        });
      }
    }
  }

  for (const [field, value] of Object.entries(data)) {
    if (typeof value === 'string' && value === 'undefined') {
      issues.push({
        category: 'structure',
        severity: 'error',
        field,
        message: `${context}Field contains literal "undefined" string value`,
      });
    } else if (Array.isArray(value) && value.includes('undefined')) {
      issues.push({
        category: 'structure',
        severity: 'error',
        field,
        message: `${context}Array contains literal "undefined" string value`,
      });
    }
  }

  return issues;
}

// Encoding Validation
function validateEncoding(content, context = '') {
  const issues = [];

  const encodingPatterns = [
    { pattern: /Ã¼/g, char: 'ü', name: 'u-umlaut' },
    { pattern: /Ã¶/g, char: 'ö', name: 'o-umlaut' },
    { pattern: /Ã¤/g, char: 'ä', name: 'a-umlaut' },
    { pattern: /ÃŸ/g, char: 'ß', name: 'eszett' },
    { pattern: /Ãœ/g, char: 'Ü', name: 'U-umlaut' },
    { pattern: /Ã–/g, char: 'Ö', name: 'O-umlaut' },
    { pattern: /Ã„/g, char: 'Ä', name: 'A-umlaut' },
  ];

  for (const { pattern, char, name } of encodingPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        category: 'encoding',
        severity: 'error',
        message: `${context}Found ${matches.length} encoding issue(s) for ${name} (should be "${char}")`,
        count: matches.length,
      });
    }
  }

  return issues;
}

// Markdown Content Validation
function validateMarkdownContent(content, context = '') {
  const issues = [];

  const malformedHeaderRegex = /^#{1,6}[^\s]/gm;
  let match;

  while ((match = malformedHeaderRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    issues.push({
      category: 'markdown',
      severity: 'warning',
      type: 'header',
      message: `${context}Malformed header at line ${lineNum}: missing space after #`,
      line: lineNum,
    });
  }

  const malformedListRegex = /^(\s*)([-*+]|\d+\.)[^\s]/gm;

  while ((match = malformedListRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    issues.push({
      category: 'markdown',
      severity: 'warning',
      type: 'list',
      message: `${context}Malformed list item at line ${lineNum}: missing space after marker`,
      line: lineNum,
    });
  }

  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBlockStart = -1;

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockStart = index + 1;
      } else {
        inCodeBlock = false;
      }
    }
  });

  if (inCodeBlock) {
    issues.push({
      category: 'markdown',
      severity: 'error',
      type: 'code-block',
      message: `${context}Unclosed code block starting at line ${codeBlockStart}`,
      line: codeBlockStart,
    });
  }

  return issues;
}

// Code Examples Validation
function validateCodeExamples(codeExamples, context = '') {
  const issues = [];
  const requiredFields = ['language', 'title', 'code', 'explanation'];

  if (!Array.isArray(codeExamples)) {
    return issues;
  }

  codeExamples.forEach((example, index) => {
    const exampleContext = `${context}Code example ${index + 1}: `;

    for (const field of requiredFields) {
      if (!(field in example) || !example[field]) {
        issues.push({
          category: 'code-examples',
          severity: 'error',
          field,
          message: `${exampleContext}Missing or empty required field: ${field}`,
        });
      }
    }
  });

  return issues;
}

// Validate a single module
function validateModule(data, context = '') {
  const issues = [];

  issues.push(...validateJSONStructure(data, context));

  if (data.content && typeof data.content === 'string') {
    issues.push(...validateMarkdownContent(data.content, context));
    issues.push(...validateEncoding(data.content, context));
  }

  if (data.codeExamples) {
    issues.push(...validateCodeExamples(data.codeExamples, context));
  }

  return issues;
}

// Validate a single file
function validateFile(filePath) {
  const issues = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let data;

    try {
      data = JSON.parse(content);
    } catch (parseError) {
      issues.push({
        category: 'json',
        severity: 'error',
        message: `Invalid JSON: ${parseError.message}`,
      });
      return { valid: false, issues };
    }

    if (data.modules && Array.isArray(data.modules)) {
      data.modules.forEach((module, index) => {
        const moduleIssues = validateModule(module, `Module ${index + 1}: `);
        issues.push(...moduleIssues);
      });
    } else {
      const moduleIssues = validateModule(data);
      issues.push(...moduleIssues);
    }

    const errorCount = issues.filter(i => i.severity === 'error').length;

    return {
      valid: errorCount === 0,
      issues,
    };
  } catch (error) {
    issues.push({
      category: 'file',
      severity: 'error',
      message: `Error reading file: ${error.message}`,
    });
    return { valid: false, issues };
  }
}

// Extract module and quiz IDs for reference validation
function extractModuleIds() {
  const moduleIds = new Set();
  const modulesDir = path.join(rootDir, 'src', 'data', 'ihk', 'modules');

  if (!fs.existsSync(modulesDir)) {
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
    } catch {
      // Skip files with errors
    }
  });

  return Array.from(moduleIds);
}

function extractQuizIds() {
  const quizIds = new Set();
  const quizzesDir = path.join(rootDir, 'src', 'data', 'ihk', 'quizzes');

  if (!fs.existsSync(quizzesDir)) {
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
    } catch {
      // Skip files with errors
    }
  });

  return Array.from(quizIds);
}

// Check module references
function checkModuleReferences(moduleIds, quizIds) {
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
              type: 'module',
            });
          }
        });
      }

      if (module.relatedQuizzes && Array.isArray(module.relatedQuizzes)) {
        module.relatedQuizzes.forEach(quizId => {
          if (!quizIds.includes(quizId)) {
            invalidRefs.push({
              file: file,
              moduleId: module.id,
              field: 'relatedQuizzes',
              invalidId: quizId,
              type: 'quiz',
            });
          }
        });
      }
    } catch {
      // Skip files with errors
    }
  });

  return invalidRefs;
}

// Main validation orchestrator
async function runComprehensiveValidation() {
  const startTime = Date.now();

  console.log('🔍 Starting comprehensive validation...\n');

  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: 0,
      validFiles: 0,
      filesWithErrors: 0,
      filesWithWarnings: 0,
      totalIssues: 0,
      issuesByCategory: {
        structure: 0,
        markdown: 0,
        encoding: 0,
        'code-examples': 0,
        json: 0,
        file: 0,
        references: 0,
      },
      issuesBySeverity: {
        error: 0,
        warning: 0,
      },
      invalidReferences: 0,
    },
    files: [],
    invalidReferences: [],
    executionTime: 0,
  };

  // Validate all module files
  const modulesDir = path.join(rootDir, 'src', 'data', 'ihk', 'modules');

  if (fs.existsSync(modulesDir)) {
    const files = fs
      .readdirSync(modulesDir)
      .filter(f => f.endsWith('.json'))
      .sort();

    results.summary.totalFiles = files.length;

    for (const file of files) {
      const filePath = path.join(modulesDir, file);
      const validation = validateFile(filePath);

      const errorCount = validation.issues.filter(
        i => i.severity === 'error'
      ).length;
      const warningCount = validation.issues.filter(
        i => i.severity === 'warning'
      ).length;

      validation.issues.forEach(issue => {
        const category = issue.category || 'other';
        if (category in results.summary.issuesByCategory) {
          results.summary.issuesByCategory[category]++;
        }
        results.summary.issuesBySeverity[issue.severity]++;
      });

      results.files.push({
        file,
        path: filePath,
        valid: validation.valid,
        issues: validation.issues,
        errorCount,
        warningCount,
      });

      results.summary.totalIssues += validation.issues.length;

      if (validation.valid) {
        results.summary.validFiles++;
      } else {
        results.summary.filesWithErrors++;
      }

      if (warningCount > 0) {
        results.summary.filesWithWarnings++;
      }
    }
  }

  // Check references

  console.log('🔍 Checking module and quiz references...');
  const moduleIds = extractModuleIds();
  const quizIds = extractQuizIds();
  const invalidRefs = checkModuleReferences(moduleIds, quizIds);

  results.invalidReferences = invalidRefs;
  results.summary.invalidReferences = invalidRefs.length;
  results.summary.issuesByCategory.references = invalidRefs.length;

  if (invalidRefs.length > 0) {
    results.summary.issuesBySeverity.error += invalidRefs.length;
    results.summary.totalIssues += invalidRefs.length;
  }

  results.executionTime = Date.now() - startTime;

  return results;
}

// Generate console report
function generateConsoleReport(results) {
  console.log(
    '\n╔════════════════════════════════════════════════════════════╗'
  );

  console.log('║     COMPREHENSIVE VALIDATION REPORT                        ║');

  console.log(
    '╚════════════════════════════════════════════════════════════╝\n'
  );

  console.log('📊 SUMMARY');

  console.log('─'.repeat(60));

  console.log(`Total files scanned:      ${results.summary.totalFiles}`);

  console.log(
    `Files with no errors:     ${results.summary.validFiles} (${((results.summary.validFiles / results.summary.totalFiles) * 100).toFixed(1)}%)`
  );

  console.log(`Files with errors:        ${results.summary.filesWithErrors}`);

  console.log(
    `Files with warnings only: ${results.summary.filesWithWarnings - results.summary.filesWithErrors}`
  );

  console.log(`Total issues found:       ${results.summary.totalIssues}`);

  console.log(
    `  - Errors:               ${results.summary.issuesBySeverity.error}`
  );

  console.log(
    `  - Warnings:             ${results.summary.issuesBySeverity.warning}`
  );

  console.log(`Invalid references:       ${results.summary.invalidReferences}`);

  console.log(`Execution time:           ${results.executionTime}ms`);

  console.log('\n📋 ISSUES BY CATEGORY');

  console.log('─'.repeat(60));
  for (const [category, count] of Object.entries(
    results.summary.issuesByCategory
  )) {
    if (count > 0) {
      console.log(`  ${category.padEnd(20)} ${count}`);
    }
  }

  if (results.summary.filesWithErrors > 0) {
    console.log('\n❌ FILES WITH ERRORS');

    console.log('─'.repeat(60));

    for (const file of results.files) {
      if (file.errorCount > 0) {
        console.log(`\n📄 ${file.file}`);

        console.log(
          `   Errors: ${file.errorCount}, Warnings: ${file.warningCount}`
        );

        const errors = file.issues
          .filter(i => i.severity === 'error')
          .slice(0, 5);
        for (const issue of errors) {
          console.log(`   ❌ [${issue.category}] ${issue.message}`);
        }

        if (file.errorCount > 5) {
          console.log(`   ... and ${file.errorCount - 5} more errors`);
        }
      }
    }
  }

  if (results.summary.invalidReferences > 0) {
    console.log('\n⚠️  INVALID REFERENCES');

    console.log('─'.repeat(60));

    for (const ref of results.invalidReferences) {
      console.log(
        `   - ${ref.file}: ${ref.moduleId} references non-existent ${ref.type} "${ref.invalidId}"`
      );
    }
  }

  if (
    results.summary.filesWithErrors === 0 &&
    results.summary.issuesBySeverity.warning === 0 &&
    results.summary.invalidReferences === 0
  ) {
    console.log('\n✅ ALL VALIDATIONS PASSED!');

    console.log('─'.repeat(60));

    console.log('All modules are valid with no errors or warnings.');
  } else if (
    results.summary.filesWithErrors === 0 &&
    results.summary.invalidReferences === 0
  ) {
    console.log('\n✅ NO ERRORS FOUND!');

    console.log('─'.repeat(60));

    console.log(
      'All modules passed validation. Only minor formatting warnings exist.'
    );
  }

  console.log('\n');
}

// Main execution
try {
  const results = await runComprehensiveValidation();
  generateConsoleReport(results);

  const reportPath = path.join(rootDir, 'COMPREHENSIVE_VALIDATION_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log(`📊 Detailed report saved to: ${reportPath}\n`);

  process.exit(
    results.summary.filesWithErrors > 0 || results.summary.invalidReferences > 0
      ? 1
      : 0
  );
} catch (error) {
  console.error('❌ Validation failed:', error);

  process.exit(1);
}
