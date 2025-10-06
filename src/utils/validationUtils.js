/**
 * Shared validation utilities for consistent data validation
 */

/**
 * Validate JSON structure
 * @param {string} content - JSON content to validate
 * @returns {Object} Validation result with valid flag and error message
 */
export function validateJSON(content) {
  try {
    JSON.parse(content);
    return { valid: true, error: null };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Validate basic module structure
 * @param {Object} module - Module object to validate
 * @param {string} context - Context for error messages
 * @returns {Array} Array of validation issues
 */
export function validateModuleStructure(module, context = '') {
  const issues = [];

  if (!module || typeof module !== 'object') {
    issues.push({
      type: 'error',
      message: `${context}Module must be an object`,
      field: 'root',
    });
    return issues;
  }

  // Required fields
  const requiredFields = ['id', 'title', 'description', 'category'];
  for (const field of requiredFields) {
    if (!module[field] || typeof module[field] !== 'string') {
      issues.push({
        type: 'error',
        message: `${context}Missing or invalid required field: ${field}`,
        field,
      });
    }
  }

  // Validate ID format (should be kebab-case)
  if (module.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(module.id)) {
    issues.push({
      type: 'warning',
      message: `${context}ID should be in kebab-case format`,
      field: 'id',
    });
  }

  // Validate arrays
  const arrayFields = ['tags', 'prerequisites'];
  for (const field of arrayFields) {
    if (module[field] && !Array.isArray(module[field])) {
      issues.push({
        type: 'error',
        message: `${context}Field ${field} must be an array`,
        field,
      });
    }
  }

  return issues;
}

/**
 * Validate markdown content for common issues
 * @param {string} content - Markdown content to validate
 * @param {string} context - Context for error messages
 * @returns {Array} Array of validation issues
 */
export function validateMarkdownContent(content, context = '') {
  const issues = [];

  if (!content || typeof content !== 'string') {
    issues.push({
      type: 'error',
      message: `${context}Content must be a non-empty string`,
      field: 'content',
    });
    return issues;
  }

  // Check for common markdown issues
  const lines = content.split('\n');

  // Check for unbalanced code blocks
  const codeBlockMatches = content.match(/```/g);
  if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
    issues.push({
      type: 'error',
      message: `${context}Unbalanced code blocks (\`\`\` markers)`,
      field: 'content',
    });
  }

  // Check for unbalanced inline code
  const inlineCodeMatches = content.match(/`/g);
  if (inlineCodeMatches && inlineCodeMatches.length % 2 !== 0) {
    issues.push({
      type: 'warning',
      message: `${context}Potentially unbalanced inline code (\` markers)`,
      field: 'content',
    });
  }

  // Check for empty headers
  const emptyHeaders = lines.filter(line => /^#+\s*$/.test(line));
  if (emptyHeaders.length > 0) {
    issues.push({
      type: 'warning',
      message: `${context}Found ${emptyHeaders.length} empty header(s)`,
      field: 'content',
    });
  }

  // Check for very long lines (over 120 characters)
  const longLines = lines.filter(line => line.length > 120);
  if (longLines.length > 0) {
    issues.push({
      type: 'info',
      message: `${context}Found ${longLines.length} line(s) over 120 characters`,
      field: 'content',
    });
  }

  return issues;
}

/**
 * Validate encoding for common issues
 * @param {string} content - Content to validate
 * @param {string} context - Context for error messages
 * @returns {Array} Array of validation issues
 */
export function validateEncoding(content, context = '') {
  const issues = [];

  if (!content || typeof content !== 'string') {
    return issues;
  }

  // Check for common encoding issues
  const encodingIssues = [
    { pattern: /â€™/g, name: 'Smart apostrophe', replacement: "'" },
    { pattern: /â€œ/g, name: 'Smart quote open', replacement: '"' },
    { pattern: /â€\u009d/g, name: 'Smart quote close', replacement: '"' },
    { pattern: /â€"/g, name: 'Em dash', replacement: '—' },
    { pattern: /Ã¤/g, name: 'ä character', replacement: 'ä' },
    { pattern: /Ã¶/g, name: 'ö character', replacement: 'ö' },
    { pattern: /Ã¼/g, name: 'ü character', replacement: 'ü' },
    { pattern: /ÃŸ/g, name: 'ß character', replacement: 'ß' },
  ];

  for (const issue of encodingIssues) {
    const matches = content.match(issue.pattern);
    if (matches) {
      issues.push({
        type: 'warning',
        message: `${context}Found ${matches.length} encoding issue(s): ${issue.name}`,
        field: 'encoding',
        pattern: issue.pattern,
        replacement: issue.replacement,
      });
    }
  }

  return issues;
}

/**
 * Validate code examples structure
 * @param {Array} codeExamples - Array of code examples to validate
 * @param {string} context - Context for error messages
 * @returns {Array} Array of validation issues
 */
export function validateCodeExamples(codeExamples, context = '') {
  const issues = [];

  if (!Array.isArray(codeExamples)) {
    issues.push({
      type: 'error',
      message: `${context}Code examples must be an array`,
      field: 'codeExamples',
    });
    return issues;
  }

  const requiredFields = ['language', 'title', 'code', 'explanation'];

  codeExamples.forEach((example, index) => {
    const exampleContext = `${context}Code example ${index + 1}: `;

    if (!example || typeof example !== 'object') {
      issues.push({
        type: 'error',
        message: `${exampleContext}Must be an object`,
        field: `codeExamples[${index}]`,
      });
      return;
    }

    for (const field of requiredFields) {
      if (!example[field] || typeof example[field] !== 'string') {
        issues.push({
          type: 'error',
          message: `${exampleContext}Missing or invalid required field: ${field}`,
          field: `codeExamples[${index}].${field}`,
        });
      }
    }

    // Validate language is supported
    const supportedLanguages = [
      'javascript',
      'python',
      'java',
      'sql',
      'html',
      'css',
      'json',
      'bash',
      'xml',
    ];
    if (
      example.language &&
      !supportedLanguages.includes(example.language.toLowerCase())
    ) {
      issues.push({
        type: 'warning',
        message: `${exampleContext}Language '${example.language}' may not be supported for syntax highlighting`,
        field: `codeExamples[${index}].language`,
      });
    }
  });

  return issues;
}
