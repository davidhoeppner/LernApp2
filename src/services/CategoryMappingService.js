import threeTierCategoriesData from '../data/ihk/metadata/three-tier-categories.json' with { type: 'json' };
import categoryMappingRulesData from '../data/ihk/metadata/category-mapping-rules.json' with { type: 'json' };

/**
 * CategoryMappingService - Maps existing content categories to three-tier system
 * Handles the transformation from complex hierarchical categories to simplified
 * three-tier structure: "Daten und Prozessanalyse", "Anwendungsentwicklung", "Allgemein"
 */
class CategoryMappingService {
  constructor(specializationService) {
    this.specializationService = specializationService;
    this.threeTierCategories = this._loadThreeTierCategories();
    this.mappingRules = this._loadMappingRules();
    this.configuration = threeTierCategoriesData.mappingConfiguration;
  }

  /**
   * Load the three-tier category definitions from configuration
   * @private
   * @returns {Array} Array of three-tier category objects
   */
  _loadThreeTierCategories() {
    try {
      return threeTierCategoriesData.categories || [];
    } catch (error) {
      console.error('Error loading three-tier categories:', error);
      return this._getFallbackCategories();
    }
  }

  /**
   * Get fallback categories if configuration loading fails
   * @private
   * @returns {Array} Array of fallback category objects
   */
  _getFallbackCategories() {
    return [
      {
        id: 'daten-prozessanalyse',
        name: 'Daten und Prozessanalyse',
        description: 'Inhalte mit hoher Relevanz für die Fachrichtung Daten- und Prozessanalyse',
        color: '#3b82f6',
        icon: '📊'
      },
      {
        id: 'anwendungsentwicklung',
        name: 'Anwendungsentwicklung',
        description: 'Inhalte mit hoher Relevanz für die Fachrichtung Anwendungsentwicklung',
        color: '#10b981',
        icon: '💻'
      },
      {
        id: 'allgemein',
        name: 'Allgemein',
        description: 'Fachrichtungsübergreifende Inhalte und Grundlagen für beide Spezialisierungen',
        color: '#6b7280',
        icon: '📚'
      }
    ];
  }

  /**
   * Load category mapping rules from configuration
   * @private
   * @returns {Array} Array of mapping rule objects with compiled regex patterns
   */
  _loadMappingRules() {
    try {
      const rules = categoryMappingRulesData.mappingRules || [];
      
      // Convert string patterns to RegExp objects and filter active rules
      return rules
        .filter(rule => rule.active !== false)
        .map(rule => ({
          ...rule,
          sourcePattern: new RegExp(rule.sourcePattern, 'i'),
          condition: rule.conditions // Note: 'conditions' in JSON, 'condition' in code
        }))
        .sort((a, b) => b.priority - a.priority); // Sort by priority descending
        
    } catch (error) {
      console.error('Error loading mapping rules:', error);
      return this._getFallbackMappingRules();
    }
  }

  /**
   * Get fallback mapping rules if configuration loading fails
   * @private
   * @returns {Array} Array of fallback mapping rule objects
   */
  _getFallbackMappingRules() {
    return [
      // Explicit DPA content (highest priority)
      {
        id: 'dpa-explicit-fallback',
        sourcePattern: /^(BP-DPA-|bp-dpa-)/i,
        targetCategory: 'daten-prozessanalyse',
        priority: 100,
        description: 'Fallback: DPA-specific content with BP-DPA prefix'
      },
      // Explicit AE content (highest priority)
      {
        id: 'ae-explicit-fallback',
        sourcePattern: /^(BP-AE-|bp-ae-)/i,
        targetCategory: 'anwendungsentwicklung',
        priority: 100,
        description: 'Fallback: AE-specific content with BP-AE prefix'
      },
      // General content (FÜ prefix)
      {
        id: 'general-fue-fallback',
        sourcePattern: /^(FÜ-|FUE-|fue-)/i,
        targetCategory: 'allgemein',
        priority: 90,
        description: 'Fallback: General content with FÜ/FUE prefix'
      },
      // Default fallback (lowest priority)
      {
        id: 'default-fallback',
        sourcePattern: /.*/,
        targetCategory: 'allgemein',
        priority: 1,
        description: 'Fallback: Default for unmapped content'
      }
    ];
  }

  /**
   * Map a content item to the appropriate three-tier category
   * @param {Object} contentItem - The content item to map
   * @returns {Object} Three-tier category assignment result
   */
  mapToThreeTierCategory(contentItem) {
    try {
      if (!contentItem || typeof contentItem !== 'object') {
        throw new Error('Invalid content item provided');
      }

      const sourceCategory = contentItem.category || contentItem.categoryId || '';
      
      // Find the highest priority matching rule
      const matchingRule = this._findMatchingRule(sourceCategory, contentItem);
      
      if (!matchingRule) {
        console.warn(`No mapping rule found for content item: ${contentItem.id || 'unknown'}`);
        return this._createMappingResult('allgemein', null, 'No matching rule found');
      }

      const targetCategory = this.threeTierCategories.find(cat => cat.id === matchingRule.targetCategory);
      
      return this._createMappingResult(
        matchingRule.targetCategory,
        matchingRule,
        'Successfully mapped using rule',
        targetCategory
      );

    } catch (error) {
      console.error('Error mapping content item to three-tier category:', error);
      return this._createMappingResult('allgemein', null, `Error: ${error.message}`);
    }
  }

  /**
   * Find the matching rule with highest priority for a content item
   * @private
   * @param {string} sourceCategory - The source category identifier
   * @param {Object} contentItem - The content item being mapped
   * @returns {Object|null} The matching rule or null if none found
   */
  _findMatchingRule(sourceCategory, contentItem) {
    const applicableRules = this.mappingRules
      .filter(rule => this._ruleMatches(rule, sourceCategory, contentItem))
      .sort((a, b) => b.priority - a.priority); // Sort by priority descending

    return applicableRules.length > 0 ? applicableRules[0] : null;
  }

  /**
   * Check if a mapping rule matches the given content
   * @private
   * @param {Object} rule - The mapping rule to check
   * @param {string} sourceCategory - The source category identifier
   * @param {Object} contentItem - The content item being evaluated
   * @returns {boolean} True if the rule matches
   */
  _ruleMatches(rule, sourceCategory, contentItem) {
    // Check pattern match
    if (!rule.sourcePattern.test(sourceCategory)) {
      return false;
    }

    // Check additional conditions if present
    if (rule.condition) {
      return this._evaluateRuleCondition(rule.condition, contentItem);
    }

    return true;
  }

  /**
   * Evaluate additional conditions for a mapping rule
   * @private
   * @param {Object} condition - The condition to evaluate
   * @param {Object} contentItem - The content item being evaluated
   * @returns {boolean} True if condition is met
   */
  _evaluateRuleCondition(condition, contentItem) {
    if (condition.specializationRelevance && this.specializationService) {
      const categoryId = contentItem.category || contentItem.categoryId;
      
      for (const [specializationId, expectedRelevance] of Object.entries(condition.specializationRelevance)) {
        const actualRelevance = this.specializationService.getCategoryRelevance(categoryId, specializationId);
        
        if (Array.isArray(expectedRelevance)) {
          // Multiple acceptable relevance levels
          if (!expectedRelevance.includes(actualRelevance)) {
            return false;
          }
        } else {
          // Single expected relevance level
          if (actualRelevance !== expectedRelevance) {
            return false;
          }
        }
      }
    }

    // Add more condition types here as needed
    if (condition.contentType) {
      const itemType = this._inferContentType(contentItem);
      if (itemType !== condition.contentType) {
        return false;
      }
    }

    if (condition.tags && Array.isArray(condition.tags)) {
      const itemTags = contentItem.tags || [];
      const hasRequiredTag = condition.tags.some(tag => 
        itemTags.some(itemTag => itemTag.toLowerCase().includes(tag.toLowerCase()))
      );
      if (!hasRequiredTag) {
        return false;
      }
    }

    return true;
  }

  /**
   * Infer content type from content item structure
   * @private
   * @param {Object} contentItem - The content item to analyze
   * @returns {string} Inferred content type ('module' or 'quiz')
   */
  _inferContentType(contentItem) {
    if (contentItem.questions && Array.isArray(contentItem.questions)) {
      return 'quiz';
    }
    if (contentItem.content || contentItem.sections) {
      return 'module';
    }
    return 'unknown';
  }

  /**
   * Create a standardized mapping result object
   * @private
   * @param {string} categoryId - The target category ID
   * @param {Object|null} rule - The applied mapping rule
   * @param {string} reason - Reason for the mapping decision
   * @param {Object|null} categoryInfo - Full category information
   * @returns {Object} Mapping result object
   */
  _createMappingResult(categoryId, rule, reason, categoryInfo = null) {
    const category = categoryInfo || this.threeTierCategories.find(cat => cat.id === categoryId);
    
    return {
      threeTierCategory: categoryId,
      categoryInfo: category,
      appliedRule: rule ? {
        priority: rule.priority,
        description: rule.description,
        pattern: rule.sourcePattern.toString()
      } : null,
      reason: reason,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get category relevance for a specific specialization
   * @param {string} categoryId - The three-tier category ID
   * @param {string} specializationId - The specialization ID
   * @returns {string} Relevance level: 'high', 'medium', 'low', 'none'
   */
  getCategoryRelevance(categoryId, specializationId) {
    if (!categoryId || !specializationId) {
      return 'none';
    }

    // Define relevance mapping for three-tier categories
    const relevanceMap = {
      'daten-prozessanalyse': {
        'daten-prozessanalyse': 'high',
        'anwendungsentwicklung': 'low'
      },
      'anwendungsentwicklung': {
        'anwendungsentwicklung': 'high',
        'daten-prozessanalyse': 'low'
      },
      'allgemein': {
        'anwendungsentwicklung': 'high',
        'daten-prozessanalyse': 'high'
      }
    };

    return relevanceMap[categoryId]?.[specializationId] || 'none';
  }

  /**
   * Get all three-tier categories
   * @returns {Array} Array of three-tier category objects
   */
  getThreeTierCategories() {
    return [...this.threeTierCategories];
  }

  /**
   * Get a specific three-tier category by ID
   * @param {string} categoryId - The category ID to retrieve
   * @returns {Object|null} Category object or null if not found
   */
  getThreeTierCategory(categoryId) {
    return this.threeTierCategories.find(cat => cat.id === categoryId) || null;
  }

  /**
   * Validate category mapping for a single content item or array of items
   * @param {Object|Array} contentItems - Content item(s) to validate
   * @returns {Object} Validation result with status, errors, and warnings
   */
  validateCategoryMapping(contentItems) {
    try {
      const items = Array.isArray(contentItems) ? contentItems : [contentItems];
      const validationResult = {
        status: 'success',
        totalItems: items.length,
        validItems: 0,
        invalidItems: 0,
        warnings: [],
        errors: [],
        details: []
      };

      for (const item of items) {
        const itemValidation = this._validateSingleItem(item);
        validationResult.details.push(itemValidation);

        if (itemValidation.isValid) {
          validationResult.validItems++;
        } else {
          validationResult.invalidItems++;
          validationResult.errors.push(...itemValidation.errors);
        }

        if (itemValidation.warnings.length > 0) {
          validationResult.warnings.push(...itemValidation.warnings);
        }
      }

      // Set overall status
      if (validationResult.invalidItems > 0) {
        validationResult.status = 'error';
      } else if (validationResult.warnings.length > 0) {
        validationResult.status = 'warning';
      }

      // Add summary statistics
      validationResult.summary = this._generateValidationSummary(validationResult);

      return validationResult;

    } catch (error) {
      console.error('Error validating category mapping:', error);
      return {
        status: 'error',
        totalItems: 0,
        validItems: 0,
        invalidItems: 0,
        warnings: [],
        errors: [`Validation failed: ${error.message}`],
        details: []
      };
    }
  }

  /**
   * Validate a single content item
   * @private
   * @param {Object} item - Content item to validate
   * @returns {Object} Item validation result
   */
  _validateSingleItem(item) {
    // Basic item structure validation first
    if (!item || typeof item !== 'object') {
      return {
        itemId: 'unknown',
        isValid: false,
        errors: ['Invalid item structure: item must be an object'],
        warnings: [],
        mappingResult: null,
        originalCategory: null
      };
    }

    const result = {
      itemId: item.id || 'unknown',
      isValid: true,
      errors: [],
      warnings: [],
      mappingResult: null,
      originalCategory: item.category || item.categoryId || null
    };

    // Validate item has required fields
    if (!item.id) {
      result.warnings.push('Item missing ID field');
    }

    // Perform category mapping
    try {
      result.mappingResult = this.mapToThreeTierCategory(item);
      
      // Validate mapping result
      if (!result.mappingResult.threeTierCategory) {
        result.isValid = false;
        result.errors.push('Mapping failed: no target category assigned');
      } else if (!this._isValidThreeTierCategory(result.mappingResult.threeTierCategory)) {
        result.isValid = false;
        result.errors.push(`Invalid target category: ${result.mappingResult.threeTierCategory}`);
      }

      // Check for mapping conflicts
      const conflicts = this._checkMappingConflicts(item, result.mappingResult);
      if (conflicts.length > 0) {
        result.warnings.push(...conflicts);
      }

      // Validate specialization relevance consistency
      const relevanceIssues = this._validateRelevanceConsistency(item, result.mappingResult);
      if (relevanceIssues.length > 0) {
        result.warnings.push(...relevanceIssues);
      }

    } catch (mappingError) {
      result.isValid = false;
      result.errors.push(`Mapping error: ${mappingError.message}`);
    }

    return result;
  }

  /**
   * Check if a category ID is a valid three-tier category
   * @private
   * @param {string} categoryId - Category ID to validate
   * @returns {boolean} True if valid
   */
  _isValidThreeTierCategory(categoryId) {
    const validCategories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
    return validCategories.includes(categoryId);
  }

  /**
   * Check for potential mapping conflicts
   * @private
   * @param {Object} item - Content item
   * @param {Object} mappingResult - Mapping result to check
   * @returns {Array} Array of conflict warning messages
   */
  _checkMappingConflicts(item, mappingResult) {
    const conflicts = [];
    const originalCategory = item.category || item.categoryId || '';
    const targetCategory = mappingResult.threeTierCategory;

    // Check for obvious mismatches
    if (originalCategory.toLowerCase().includes('dpa') && targetCategory !== 'daten-prozessanalyse') {
      conflicts.push(`Potential conflict: DPA content mapped to ${targetCategory}`);
    }

    if (originalCategory.toLowerCase().includes('ae') && targetCategory !== 'anwendungsentwicklung') {
      conflicts.push(`Potential conflict: AE content mapped to ${targetCategory}`);
    }

    if (originalCategory.toLowerCase().includes('fue') && targetCategory !== 'allgemein') {
      conflicts.push(`Potential conflict: General content mapped to ${targetCategory}`);
    }

    // Check for low-priority rule usage on important content
    if (mappingResult.appliedRule && mappingResult.appliedRule.priority < 50 && item.important) {
      conflicts.push('Important content mapped using low-priority rule');
    }

    return conflicts;
  }

  /**
   * Validate specialization relevance consistency
   * @private
   * @param {Object} item - Content item
   * @param {Object} mappingResult - Mapping result to check
   * @returns {Array} Array of relevance warning messages
   */
  _validateRelevanceConsistency(item, mappingResult) {
    const warnings = [];
    
    if (!this.specializationService) {
      return warnings;
    }

    const targetCategory = mappingResult.threeTierCategory;
    const originalCategory = item.category || item.categoryId;

    if (originalCategory) {
      // Check relevance for both specializations
      const aeRelevance = this.specializationService.getCategoryRelevance(originalCategory, 'anwendungsentwicklung');
      const dpaRelevance = this.specializationService.getCategoryRelevance(originalCategory, 'daten-prozessanalyse');

      // Validate mapping consistency with relevance
      if (targetCategory === 'anwendungsentwicklung' && aeRelevance === 'none') {
        warnings.push('Content mapped to AE category but has no AE relevance');
      }

      if (targetCategory === 'daten-prozessanalyse' && dpaRelevance === 'none') {
        warnings.push('Content mapped to DPA category but has no DPA relevance');
      }

      if (targetCategory === 'allgemein' && aeRelevance === 'none' && dpaRelevance === 'none') {
        warnings.push('Content mapped to general category but has no relevance for either specialization');
      }
    }

    return warnings;
  }

  /**
   * Generate validation summary statistics
   * @private
   * @param {Object} validationResult - Validation result to summarize
   * @returns {Object} Summary statistics
   */
  _generateValidationSummary(validationResult) {
    const categoryDistribution = {};
    const ruleUsage = {};
    let conflictCount = 0;

    validationResult.details.forEach(detail => {
      if (detail.mappingResult && detail.mappingResult.threeTierCategory) {
        const category = detail.mappingResult.threeTierCategory;
        categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;

        if (detail.mappingResult.appliedRule) {
          const ruleId = detail.mappingResult.appliedRule.description || 'unknown';
          ruleUsage[ruleId] = (ruleUsage[ruleId] || 0) + 1;
        }
      }

      if (detail.warnings.some(w => w.includes('conflict'))) {
        conflictCount++;
      }
    });

    return {
      categoryDistribution,
      ruleUsage,
      conflictCount,
      successRate: validationResult.totalItems > 0 
        ? (validationResult.validItems / validationResult.totalItems * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Validate mapping rules configuration
   * @returns {Object} Rule validation result
   */
  validateMappingRules() {
    try {
      const result = {
        status: 'success',
        totalRules: this.mappingRules.length,
        validRules: 0,
        invalidRules: 0,
        errors: [],
        warnings: [],
        details: []
      };

      const priorities = new Set();
      const targetCategories = new Set();

      for (const rule of this.mappingRules) {
        const ruleValidation = this._validateSingleRule(rule);
        result.details.push(ruleValidation);

        if (ruleValidation.isValid) {
          result.validRules++;
          priorities.add(rule.priority);
          targetCategories.add(rule.targetCategory);
        } else {
          result.invalidRules++;
          result.errors.push(...ruleValidation.errors);
        }

        if (ruleValidation.warnings.length > 0) {
          result.warnings.push(...ruleValidation.warnings);
        }
      }

      // Check for priority conflicts
      if (priorities.size !== this.mappingRules.length) {
        result.warnings.push('Some rules have duplicate priorities - this may cause non-deterministic behavior');
      }

      // Check category coverage
      const expectedCategories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
      const missingCategories = expectedCategories.filter(cat => !targetCategories.has(cat));
      if (missingCategories.length > 0) {
        result.warnings.push(`No rules target these categories: ${missingCategories.join(', ')}`);
      }

      // Set overall status
      if (result.invalidRules > 0) {
        result.status = 'error';
      } else if (result.warnings.length > 0) {
        result.status = 'warning';
      }

      return result;

    } catch (error) {
      console.error('Error validating mapping rules:', error);
      return {
        status: 'error',
        totalRules: 0,
        validRules: 0,
        invalidRules: 0,
        errors: [`Rule validation failed: ${error.message}`],
        warnings: [],
        details: []
      };
    }
  }

  /**
   * Validate a single mapping rule
   * @private
   * @param {Object} rule - Mapping rule to validate
   * @returns {Object} Rule validation result
   */
  _validateSingleRule(rule) {
    const result = {
      ruleId: rule.id || 'unknown',
      isValid: true,
      errors: [],
      warnings: []
    };

    // Required fields validation
    if (!rule.sourcePattern) {
      result.isValid = false;
      result.errors.push('Rule missing sourcePattern');
    }

    if (!rule.targetCategory) {
      result.isValid = false;
      result.errors.push('Rule missing targetCategory');
    }

    if (typeof rule.priority !== 'number') {
      result.isValid = false;
      result.errors.push('Rule missing or invalid priority');
    }

    // Validate target category
    if (rule.targetCategory && !this._isValidThreeTierCategory(rule.targetCategory)) {
      result.isValid = false;
      result.errors.push(`Invalid target category: ${rule.targetCategory}`);
    }

    // Validate priority range
    if (typeof rule.priority === 'number' && (rule.priority < 1 || rule.priority > 100)) {
      result.warnings.push(`Priority ${rule.priority} outside recommended range (1-100)`);
    }

    // Validate regex pattern
    if (rule.sourcePattern && !(rule.sourcePattern instanceof RegExp)) {
      try {
        new RegExp(rule.sourcePattern);
      } catch (regexError) {
        result.isValid = false;
        result.errors.push(`Invalid regex pattern: ${regexError.message}`);
      }
    }

    return result;
  }

  /**
   * Get mapping rules for debugging and validation
   * @returns {Array} Array of mapping rule objects
   */
  getMappingRules() {
    return [...this.mappingRules];
  }

  /**
   * Get validation configuration
   * @returns {Object} Validation configuration object
   */
  getValidationConfiguration() {
    return {
      ...this.configuration,
      validationRules: categoryMappingRulesData.validationRules || [],
      threeTierCategories: this.threeTierCategories.map(cat => cat.id)
    };
  }
}

export default CategoryMappingService;