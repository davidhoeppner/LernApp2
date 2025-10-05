/**
 * Learning Path Validator
 * Validates IHK learning path data for correctness and completeness
 */

class LearningPathValidator {
  constructor(allModules = new Map()) {
    this.allModules = allModules;
  }

  /**
   * Set available modules for reference validation
   */
  setModules(modules) {
    this.allModules = new Map();
    modules.forEach(module => {
      this.allModules.set(module.id, module);
    });
  }

  /**
   * Validate a complete learning path
   */
  validate(learningPath) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!learningPath.id) errors.push('Missing required field: id');
    if (!learningPath.title) errors.push('Missing required field: title');
    if (!learningPath.description) {
      warnings.push('Missing description field (recommended for clarity)');
    }

    if (!learningPath.modules || learningPath.modules.length === 0) {
      errors.push('Learning path must have at least one module');
    }

    // Validate modules array
    if (learningPath.modules && Array.isArray(learningPath.modules)) {
      learningPath.modules.forEach((moduleId, index) => {
        // Check if module ID is a string
        if (typeof moduleId !== 'string') {
          errors.push(
            `Module ${index + 1}: Module ID must be a string (got ${typeof moduleId})`
          );
        }

        // Check if referenced module exists
        if (this.allModules.size > 0 && !this.allModules.has(moduleId)) {
          errors.push(
            `Module ${index + 1}: Referenced module "${moduleId}" does not exist`
          );
        }
      });

      // Check for duplicate modules
      const uniqueModules = new Set(learningPath.modules);
      if (uniqueModules.size < learningPath.modules.length) {
        warnings.push('Learning path contains duplicate module references');
      }
    } else if (learningPath.modules) {
      errors.push('modules must be an array');
    }

    // Validate estimated duration
    if (learningPath.estimatedDuration !== undefined) {
      if (typeof learningPath.estimatedDuration !== 'number') {
        errors.push('estimatedDuration must be a number');
      } else if (learningPath.estimatedDuration < 0) {
        errors.push('estimatedDuration must be positive');
      }
    } else {
      warnings.push(
        'Missing estimatedDuration field (recommended for planning)'
      );
    }

    // Validate difficulty
    if (learningPath.difficulty) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(learningPath.difficulty)) {
        errors.push(
          `Invalid difficulty: "${learningPath.difficulty}". Must be one of: ${validDifficulties.join(', ')}`
        );
      }
    }

    // Validate tags
    if (learningPath.tags && !Array.isArray(learningPath.tags)) {
      errors.push('tags must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate multiple learning paths
   */
  validateMultiple(learningPaths) {
    const results = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    learningPaths.forEach((path, index) => {
      const validation = this.validate(path);
      results.push({
        pathId: path.id || `path-${index}`,
        title: path.title || 'Untitled',
        ...validation,
      });
      totalErrors += validation.errors.length;
      totalWarnings += validation.warnings.length;
    });

    return {
      summary: {
        totalPaths: learningPaths.length,
        validPaths: results.filter(r => r.valid).length,
        invalidPaths: results.filter(r => !r.valid).length,
        totalErrors,
        totalWarnings,
      },
      results,
    };
  }
}

export default LearningPathValidator;
