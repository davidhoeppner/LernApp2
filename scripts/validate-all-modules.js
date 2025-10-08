// @ts-nocheck
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required fields for module schema
const REQUIRED_FIELDS = ['id', 'title', 'description', 'category', 'content'];

// Expected field types
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

  // Check for required fields
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

  // Validate field types
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

  // Check for literal "undefined" string values
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

// Markdown Content Validation
function validateMarkdownContent(content, context = '') {
  const issues = [];

  // Check for malformed headers
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

  // Check for malformed lists
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

  // Check for unclosed code blocks
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

// Encoding Validation
function validateEncoding(content, context = '') {
  const issues = [];

  // Check for common encoding issues
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

// Validate a single module
function validateModule(data, context = '') {
  const issues = [];

  // JSON structure validation
  issues.push(...validateJSONStructure(data, context));

  // Markdown content validation
  if (data.content && typeof data.content === 'string') {
    issues.push(...validateMarkdownContent(data.content, context));
    issues.push(...validateEncoding(data.content, context));
  }

  // Code examples validation
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

    // Handle both single module and modules array format
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

// Validate all modules
function validateAllModules(modulesDir) {
  const results = {
    timestamp: new Date().toISOString(),
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
    },
    issuesBySeverity: {
      error: 0,
      warning: 0,
    },
    files: [],
  };

  try {
    const files = fs
      .readdirSync(modulesDir)
      .filter(file => file.endsWith('.json'))
      .sort();

    results.totalFiles = files.length;

    for (const file of files) {
      const filePath = path.join(modulesDir, file);
      const validation = validateFile(filePath);

      const errorCount = validation.issues.filter(
        i => i.severity === 'error'
      ).length;
      const warningCount = validation.issues.filter(
        i => i.severity === 'warning'
      ).length;

      // Count issues by category
      validation.issues.forEach(issue => {
        const category = issue.category || 'other';
        if (category in results.issuesByCategory) {
          results.issuesByCategory[category]++;
        }
        results.issuesBySeverity[issue.severity]++;
      });

      results.files.push({
        file,
        path: filePath,
        valid: validation.valid,
        issues: validation.issues,
        errorCount,
        warningCount,
      });

      results.totalIssues += validation.issues.length;

      if (validation.valid) {
        results.validFiles++;
      } else {
        results.filesWithErrors++;
      }

      if (warningCount > 0) {
        results.filesWithWarnings++;
      }
    }
  } catch (error) {
    console.error('Error scanning modules directory:', error.message);
  }

  return results;
}

// Generate console report
function generateConsoleReport(results) {
  console.log(
    '\n╔════════════════════════════════════════════════════════════╗'
  );
  console.log('║     COMPREHENSIVE MODULE VALIDATION REPORT                 ║');
  console.log(
    '╚════════════════════════════════════════════════════════════╝\n'
  );

  console.log('📊 SUMMARY');
  console.log('─'.repeat(60));
  console.log(`Total files scanned:      ${results.totalFiles}`);
  console.log(
    `Files with no errors:     ${results.validFiles} (${((results.validFiles / results.totalFiles) * 100).toFixed(1)}%)`
  );
  console.log(`Files with errors:        ${results.filesWithErrors}`);
  console.log(
    `Files with warnings only: ${results.filesWithWarnings - results.filesWithErrors}`
  );
  console.log(`Total issues found:       ${results.totalIssues}`);
  console.log(`  - Errors:               ${results.issuesBySeverity.error}`);
  console.log(`  - Warnings:             ${results.issuesBySeverity.warning}`);

  console.log('\n📋 ISSUES BY CATEGORY');
  console.log('─'.repeat(60));
  for (const [category, count] of Object.entries(results.issuesByCategory)) {
    if (count > 0) {
      console.log(`  ${category.padEnd(20)} ${count}`);
    }
  }

  if (results.filesWithErrors > 0) {
    console.log('\n❌ FILES WITH ERRORS');
    console.log('─'.repeat(60));

    for (const file of results.files) {
      if (file.errorCount > 0) {
        console.log(`\n📄 ${file.file}`);
        console.log(
          `   Errors: ${file.errorCount}, Warnings: ${file.warningCount}`
        );

        // Show first 5 errors
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

  if (results.filesWithWarnings > 0 && results.filesWithErrors === 0) {
    console.log('\n⚠️  FILES WITH WARNINGS (No Errors)');
    console.log('─'.repeat(60));
    console.log(
      `${results.filesWithWarnings} file(s) have formatting warnings but no errors.`
    );
    console.log(
      'These are mostly stylistic issues and do not affect functionality.'
    );
  }

  if (results.filesWithErrors === 0 && results.issuesBySeverity.warning === 0) {
    console.log('\n✅ ALL VALIDATIONS PASSED!');
    console.log('─'.repeat(60));
    console.log('All modules are valid with no errors or warnings.');
  } else if (results.filesWithErrors === 0) {
    console.log('\n✅ NO ERRORS FOUND!');
    console.log('─'.repeat(60));
    console.log(
      'All modules passed validation. Only minor formatting warnings exist.'
    );
  }

  console.log('\n');
}

// Main execution
const modulesDir = path.join(__dirname, '..', 'src', 'data', 'ihk', 'modules');
console.log(`\n🔍 Scanning modules in: ${modulesDir}\n`);

const results = validateAllModules(modulesDir);
generateConsoleReport(results);

// Save detailed report to JSON
const reportPath = path.join(
  __dirname,
  '..',
  'COMPREHENSIVE_VALIDATION_REPORT.json'
);
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

// Exit with error code if validation failed
process.exit(results.filesWithErrors > 0 ? 1 : 0);
