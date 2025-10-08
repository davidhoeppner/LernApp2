// @ts-nocheck
/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const process.cwd() = path.dirname(__filename);

function validateMarkdownContent(content, context = '') {
  const issues = [];

  // Check for malformed headers
  const malformedHeaderRegex = /^#{1,6}[^\s]/gm;

  let match;
  while ((match = malformedHeaderRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    issues.push({
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
      severity: 'warning',
      type: 'list',
      message: `${context}Malformed list item at line ${lineNum}: missing space after marker`,
      line: lineNum,
    });
  }

  // Check for malformed code blocks
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

  // Check if code block is not closed
  if (inCodeBlock) {
    issues.push({
      severity: 'error',
      type: 'code-block',
      message: `${context}Unclosed code block starting at line ${codeBlockStart}`,
      line: codeBlockStart,
    });
  }

  // Check for properly formatted escaped newlines
  // In JSON strings, newlines should be \n not \\n
  const doubleEscapedNewlines = content.match(/\\\\n/g);
  if (doubleEscapedNewlines) {
    issues.push({
      severity: 'warning',
      type: 'escaping',
      message: `${context}Found ${doubleEscapedNewlines.length} double-escaped newlines (\\\\n) - should be \\n in JSON`,
      count: doubleEscapedNewlines.length,
    });
  }

  return issues;
}

function validateCodeExamples(codeExamples, context = '') {
  const issues = [];
  const requiredFields = ['language', 'title', 'code', 'explanation'];

  if (!Array.isArray(codeExamples)) {
    return issues;
  }

  codeExamples.forEach((example, index) => {
    const exampleContext = `${context}Code example ${index + 1}: `;

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in example) || !example[field]) {
        issues.push({
          severity: 'error',
          type: 'code-example',
          field,
          message: `${exampleContext}Missing or empty required field: ${field}`,
        });
      }
    }

    // Validate field types
    if (example.language && typeof example.language !== 'string') {
      issues.push({
        severity: 'error',
        type: 'code-example',
        field: 'language',
        message: `${exampleContext}Language must be a string`,
      });
    }

    if (example.title && typeof example.title !== 'string') {
      issues.push({
        severity: 'error',
        type: 'code-example',
        field: 'title',
        message: `${exampleContext}Title must be a string`,
      });
    }

    if (example.code && typeof example.code !== 'string') {
      issues.push({
        severity: 'error',
        type: 'code-example',
        field: 'code',
        message: `${exampleContext}Code must be a string`,
      });
    }

    if (example.explanation && typeof example.explanation !== 'string') {
      issues.push({
        severity: 'error',
        type: 'code-example',
        field: 'explanation',
        message: `${exampleContext}Explanation must be a string`,
      });
    }
  });

  return issues;
}

function validateModuleContent(data, context = '') {
  const issues = [];

  // Validate markdown content
  if (data.content && typeof data.content === 'string') {
    const markdownIssues = validateMarkdownContent(data.content, context);
    issues.push(...markdownIssues);
  }

  // Validate code examples
  if (data.codeExamples) {
    const codeExampleIssues = validateCodeExamples(data.codeExamples, context);
    issues.push(...codeExampleIssues);
  }

  return issues;
}

function validateFile(filePath) {
  const issues = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let data;

    try {
      data = JSON.parse(content);
    } catch (parseError) {
      issues.push({
        severity: 'error',
        type: 'json',
        message: `Invalid JSON: ${parseError.message}`,
      });
      return { valid: false, issues };
    }

    // Handle both single module and modules array format
    if (data.modules && Array.isArray(data.modules)) {
      data.modules.forEach((module, index) => {
        const moduleIssues = validateModuleContent(
          module,
          `Module ${index + 1}: `
        );
        issues.push(...moduleIssues);
      });
    } else {
      const moduleIssues = validateModuleContent(data);
      issues.push(...moduleIssues);
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
    };
  } catch (error) {
    issues.push({
      severity: 'error',
      type: 'file',
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
    totalIssues: 0,
    errorCount: 0,
    warningCount: 0,
    files: [],
  };

  try {
    const files = fs
      .readdirSync(modulesDir)
      .filter(file => file.endsWith('.json'));

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

      results.files.push({
        file,
        path: filePath,
        valid: validation.valid,
        issues: validation.issues,
        errorCount,
        warningCount,
      });

      results.totalIssues += validation.issues.length;
      results.errorCount += errorCount;
      results.warningCount += warningCount;

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
  console.log('\n=== Markdown Content Validation Report ===\n');
  console.log(`Total files: ${results.totalFiles}`);
  console.log(`Valid files: ${results.validFiles}`);
  console.log(`Files with errors: ${results.invalidFiles}`);
  console.log(
    `Total issues: ${results.totalIssues} (${results.errorCount} errors, ${results.warningCount} warnings)`
  );
  console.log(
    `Success rate: ${((results.validFiles / results.totalFiles) * 100).toFixed(1)}%\n`
  );

  if (results.totalIssues > 0) {
    console.log('=== Issues Found ===\n');

    for (const file of results.files) {
      if (file.issues.length > 0) {
        console.log(`\n📄 ${file.file}`);
        console.log(
          `   ${file.errorCount} errors, ${file.warningCount} warnings`
        );

        for (const issue of file.issues) {
          const icon = issue.severity === 'error' ? '❌' : '⚠️';
          const location = issue.line ? ` (line ${issue.line})` : '';
          console.log(`  ${icon} [${issue.type}]${location} ${issue.message}`);
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
  'MARKDOWN_CONTENT_VALIDATION_REPORT.json'
);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Exit with error code if validation failed
process.exit(results.invalidFiles > 0 ? 1 : 0);
