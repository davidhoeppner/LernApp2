/**
 * WheelModuleValidator - Validates modules for the Wheel of Fortune
 * Ensures modules have required properties and filters out invalid ones
 */

class WheelModuleValidator {
  /**
   * Validate a single module object
   * @param {Object} module - Module to validate
   * @returns {boolean} - True if module is valid
   */
  validateModule(module) {
    // Check if module exists and is an object
    if (!module || typeof module !== 'object') {
      return false;
    }

    // Check required properties
    if (!module.id || typeof module.id !== 'string' || module.id.trim() === '') {
      return false;
    }

    if (!module.title || typeof module.title !== 'string' || module.title.trim() === '') {
      return false;
    }

    if (!module.category || typeof module.category !== 'string' || module.category.trim() === '') {
      return false;
    }

    return true;
  }

  /**
   * Filter array of modules to only include valid ones
   * @param {Array} modules - Array of modules to filter
   * @returns {Array} - Array of valid modules
   */
  filterValidModules(modules) {
    if (!Array.isArray(modules)) {
      console.warn('WheelModuleValidator: modules is not an array, returning empty array');
      return [];
    }

    const validModules = modules.filter(module => {
      const isValid = this.validateModule(module);
      if (!isValid) {
        console.warn('WheelModuleValidator: Invalid module filtered out:', module);
      }
      return isValid;
    });

    console.log(`WheelModuleValidator: Filtered ${modules.length} modules to ${validModules.length} valid modules`);
    return validModules;
  }

  /**
   * Get fallback modules with guaranteed valid structure
   * @returns {Array} - Array of valid fallback modules
   */
  getFallbackModules() {
    const fallbacks = [
      {
        id: 'intro-basics',
        title: 'Introduction to Basics',
        category: 'fundamentals'
      },
      {
        id: 'getting-started',
        title: 'Getting Started',
        category: 'basics'
      },
      {
        id: 'bp-03-tdd',
        title: 'Test-Driven Development (TDD)',
        category: 'BP-03'
      },
      {
        id: 'bp-04-scrum',
        title: 'Scrum',
        category: 'BP-04'
      },
      {
        id: 'bp-05-sorting',
        title: 'Sortierverfahren',
        category: 'BP-05'
      }
    ];

    // Validate fallback modules to ensure they're correct
    const validFallbacks = this.filterValidModules(fallbacks);
    
    if (validFallbacks.length === 0) {
      console.error('WheelModuleValidator: All fallback modules are invalid! This should never happen.');
      // Return minimal valid module as last resort
      return [{
        id: 'emergency-fallback',
        title: 'Learning Module',
        category: 'general'
      }];
    }

    return validFallbacks;
  }

  /**
   * Log validation failure details for debugging
   * @param {Object} module - Module that failed validation
   * @param {string} reason - Reason for validation failure
   */
  logValidationFailure(module, reason) {
    console.warn('WheelModuleValidator: Validation failed', {
      module: module,
      reason: reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Validate and log detailed information about a module
   * @param {Object} module - Module to validate with detailed logging
   * @returns {boolean} - True if module is valid
   */
  validateModuleWithLogging(module) {
    if (!module || typeof module !== 'object') {
      this.logValidationFailure(module, 'Module is null, undefined, or not an object');
      return false;
    }

    if (!module.id || typeof module.id !== 'string' || module.id.trim() === '') {
      this.logValidationFailure(module, 'Module id is missing, not a string, or empty');
      return false;
    }

    if (!module.title || typeof module.title !== 'string' || module.title.trim() === '') {
      this.logValidationFailure(module, 'Module title is missing, not a string, or empty');
      return false;
    }

    if (!module.category || typeof module.category !== 'string' || module.category.trim() === '') {
      this.logValidationFailure(module, 'Module category is missing, not a string, or empty');
      return false;
    }

    return true;
  }
}

export default WheelModuleValidator;