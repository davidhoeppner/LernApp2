/**
 * Module Validator
 * Validates IHK module data for correctness and completeness
 */

class ModuleValidator {
  constructor() {
    this.validDifficulties = ['beginner', 'intermediate', 'advanced'];
    this.validRelevance = ['low', 'medium', 'high'];
  }

  /**
   * Validate a complete module
   */
  validate(module) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!module.id) errors.push('Missing required field: id');
    if (!module.title) errors.push('Missing required field: title');
    if (!module.description) errors.push('Missing required field: description');
    if (!module.content) errors.push('Missing required field: content');
    if (!module.category) errors.push('Missing required field: category');
    if (!module.difficulty) errors.push('Missing required field: difficulty');

    // Validate difficulty
    if (
      module.difficulty &&
      !this.validDifficulties.includes(module.difficulty)
    ) {
      errors.push(
        `Invalid difficulty: "${module.difficulty}". Must be one of: ${this.validDifficulties.join(', ')}`
      );
    }

    // Validate exam relevance
    if (
      module.examRelevance &&
      !this.validRelevance.includes(module.examRelevance)
    ) {
      errors.push(
        `Invalid examRelevance: "${module.examRelevance}". Must be one of: ${this.validRelevance.join(', ')}`
      );
    }

    // Validate category format
    if (module.category && !module.category.match(/^(FÜ|BP)-\d{2}$/)) {
      errors.push(
        `Invalid category format: "${module.category}". Expected format: FÜ-XX or BP-XX`
      );
    }

    // Validate estimated duration
    if (module.estimatedDuration !== undefined) {
      if (typeof module.estimatedDuration !== 'number') {
        errors.push('estimatedDuration must be a number');
      } else if (module.estimatedDuration < 0) {
        errors.push('estimatedDuration must be positive');
      }
    }

    // Validate tags
    if (module.tags && !Array.isArray(module.tags)) {
      errors.push('tags must be an array');
    }

    // Validate markdown content
    if (module.content) {
      const contentValidation = this.validateMarkdown(module.content);
      errors.push(...contentValidation.errors);
      warnings.push(...contentValidation.warnings);
    }

    // Validate related modules
    if (module.relatedModules) {
      if (!Array.isArray(module.relatedModules)) {
        errors.push('relatedModules must be an array');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate markdown content
   */
  validateMarkdown(content) {
    const errors = [];
    const warnings = [];

    // Check for unclosed code blocks
    const codeBlockMatches = content.match(/```/g);
    const codeBlockCount = codeBlockMatches ? codeBlockMatches.length : 0;
    if (codeBlockCount % 2 !== 0) {
      errors.push('Unclosed code block in content (uneven number of ```)');
    }

    // Check for broken links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const linkText = match[1];
      const url = match[2];

      // Check for empty links
      if (!url || url.trim() === '') {
        errors.push(`Empty link URL for text "${linkText}"`);
      }

      // Check for invalid anchor links
      if (url.startsWith('#') && !url.match(/^#[a-z0-9-]+$/i)) {
        warnings.push(`Potentially invalid anchor link: ${url}`);
      }
    }

    // Check for empty headings
    const headingRegex = /^#{1,6}\s*$/gm;
    if (headingRegex.test(content)) {
      warnings.push('Found empty heading(s) in content');
    }

    // Check for very short content
    if (content.length < 100) {
      warnings.push(
        `Content is very short (${content.length} characters). Consider adding more detail.`
      );
    }

    return { errors, warnings };
  }

  /**
   * Validate multiple modules
   */
  validateMultiple(modules) {
    const results = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    modules.forEach((module, index) => {
      const validation = this.validate(module);
      results.push({
        moduleId: module.id || `module-${index}`,
        title: module.title || 'Untitled',
        ...validation,
      });
      totalErrors += validation.errors.length;
      totalWarnings += validation.warnings.length;
    });

    return {
      summary: {
        totalModules: modules.length,
        validModules: results.filter(r => r.valid).length,
        invalidModules: results.filter(r => !r.valid).length,
        totalErrors,
        totalWarnings,
      },
      results,
    };
  }
}

export default ModuleValidator;
