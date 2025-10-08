// @ts-nocheck
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const process.cwd() = path.dirname(__filename);

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

function validateModule(data, context = '') {
  const issues = [];

  // Check for required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in data)) {
      issues.push({
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
        severity: 'error',
        field,
        message: `${context}Field contains literal "undefined" string value`,
      });
    } else if (Array.isArray(value) && value.includes('undefined')) {
      issues.push({
        severity: 'error',
        field,
        message: `${context}Array contains literal "undefined" string value`,
      });
    }
  }

  return issues;
}

function validateJSONStructure(filePath) {
  const issues = [];

  try {
    // Read and parse JSON
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check for valid JSON syntax
    let data;
    try {
      data = JSON.parse(content);
    } catch (parseError) {
      issues.push({
        severity: 'error',
        field: 'JSON',
        message: `Invalid JSON syntax: ${parseError.message}`,
        line: parseError.lineNumber || null,
      });
      return { valid: false, issues };
    }

    // Handle both single module and modules array format
    if (data.modules && Array.isArray(data.modules)) {
      // Wrapper format with modules array
      if (data.modules.length === 0) {
        issues.push({
          severity: 'error',
          field: 'modules',
          message: 'Modules array is empty',
        });
      } else {
        // Validate each module in the array
        data.modules.forEach((module, index) => {
          const moduleIssues = validateModule(module, `Module ${index + 1}: `);
          issues.push(...moduleIssues);
        });
      }
    } else {
      // Single module format
      const moduleIssues = validateModule(data);
      issues.push(...moduleIssues);
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
    };
  } catch (error) {
    issues.push({
      severity: 'error',
      field: 'FILE',
      message: `Error reading file: ${error.message}`,
    });
    return { valid: false, issues };
  }
}

function validateAllModules(modulesDir) {
  const results = {
    totalFiles: 0,
    validFiles: 0,
    invalidFiles: 0,
    files: [],
  };

  try {
    const files = fs
      .readdirSync(modulesDir)
      .filter(file => file.endsWith('.json'));

    results.totalFiles = files.length;

    for (const file of files) {
      const filePath = path.join(modulesDir, file);
      const validation = validateJSONStructure(filePath);

      results.files.push({
        file,
        path: filePath,
        valid: validation.valid,
        issues: validation.issues,
      });

      if (validation.valid) {
        results.validFiles++;
      } else {
        results.invalidFiles++;
      }
    }
  } catch (error) {
    console.error('Error scanning modules directory:', error.message);
  }

  return results;
}

function generateReport(results) {
  console.log('\n=== JSON Structure Validation Report ===\n');
  console.log(`Total files: ${results.totalFiles}`);
  console.log(`Valid files: ${results.validFiles}`);
  console.log(`Invalid files: ${results.invalidFiles}`);
  console.log(
    `Success rate: ${((results.validFiles / results.totalFiles) * 100).toFixed(1)}%\n`
  );

  if (results.invalidFiles > 0) {
    console.log('=== Issues Found ===\n');

    for (const file of results.files) {
      if (!file.valid) {
        console.log(`\n📄 ${file.file}`);
        for (const issue of file.issues) {
          const icon = issue.severity === 'error' ? '❌' : '⚠️';
          console.log(`  ${icon} [${issue.field}] ${issue.message}`);
        }
      }
    }
  } else {
    console.log('✅ All files passed validation!');
  }

  return results;
}

// Main execution
const modulesDir = path.join(process.cwd(), '..', 'src', 'data', 'ihk', 'modules');
const results = validateAllModules(modulesDir);
const report = generateReport(results);

// Save report to JSON
const reportPath = path.join(
  process.cwd(),
  '..',
  'JSON_STRUCTURE_VALIDATION_REPORT.json'
);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📊 Report saved to: ${reportPath}`);

// Exit with error code if validation failed
process.exit(results.invalidFiles > 0 ? 1 : 0);
