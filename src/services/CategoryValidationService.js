/**
 * CategoryValidationService - Comprehensive validation for content categorization
 * Provides validation tools, conflict detection, and optimization suggestions
 * for the three-tier category system
 */
class CategoryValidationService {
  constructor(
    categoryMappingService,
    ihkContentService,
    specializationService
  ) {
    this.categoryMappingService = categoryMappingService;
    this.ihkContentService = ihkContentService;
    this.specializationService = specializationService;
    this.validationRules = this._initializeValidationRules();
  }

  /**
   * Initialize validation rules configuration
   * @private
   * @returns {Object} Validation rules configuration
   */
  _initializeValidationRules() {
    return {
      categoryDistribution: {
        minPercentagePerCategory: 10, // Each category should have at least 10% of content
        maxPercentagePerCategory: 70, // No category should dominate with >70%
        warningThreshold: 5, // Warn if category has <5% of content
      },
      specializationRelevance: {
        requiredHighRelevancePercentage: 30, // Each specialization should have 30% high-relevance content
        maxLowRelevancePercentage: 20, // Max 20% low-relevance content per specialization
      },
      contentQuality: {
        requireCategoryMetadata: true,
        requireSpecializationRelevance: true,
        allowUnmappedContent: false,
      },
      conflictDetection: {
        checkCrossReferences: true,
        validatePrerequisites: true,
        checkDuplicateAssignments: true,
      },
    };
  }

  /**
   * Perform comprehensive validation of all content categorization
   * @param {Object} options - Validation options
   * @returns {Object} Comprehensive validation report
   */
  async validateAllContentCategorization(options = {}) {
    try {
      const startTime = new Date();
      console.warn(
        'Starting comprehensive content categorization validation...'
      );

      // Get all content for validation
      const allContent = await this._getAllContent();

      // Perform different types of validation
      const validationResults = {
        summary: {
          totalContent: allContent.length,
          validationStarted: startTime.toISOString(),
          validationCompleted: null,
          overallStatus: 'success',
        },
        categoryMappingValidation:
          await this._validateCategoryMappings(allContent),
        distributionValidation:
          await this._validateCategoryDistribution(allContent),
        specializationRelevanceValidation:
          await this._validateSpecializationRelevance(allContent),
        conflictDetection: await this._detectCategoryConflicts(allContent),
        qualityAssessment: await this._assessContentQuality(allContent),
        optimizationSuggestions: [],
      };

      // Generate optimization suggestions based on validation results
      validationResults.optimizationSuggestions =
        this._generateOptimizationSuggestions(validationResults);

      // Determine overall status
      validationResults.summary.overallStatus =
        this._determineOverallStatus(validationResults);
      validationResults.summary.validationCompleted = new Date().toISOString();
      validationResults.summary.validationDuration = new Date() - startTime;

      return validationResults;
    } catch (error) {
      console.error('Comprehensive validation failed:', error);
      return {
        summary: {
          totalContent: 0,
          validationStarted: new Date().toISOString(),
          validationCompleted: new Date().toISOString(),
          overallStatus: 'error',
          error: error.message,
        },
      };
    }
  }

  /**
   * Validate category mappings for all content
   * @private
   * @param {Array} allContent - All content items
   * @returns {Object} Category mapping validation results
   */
  async _validateCategoryMappings(allContent) {
    const results = {
      status: 'success',
      totalItems: allContent.length,
      validMappings: 0,
      invalidMappings: 0,
      warnings: [],
      errors: [],
      details: [],
    };

    for (const content of allContent) {
      try {
        const mappingResult =
          this.categoryMappingService.mapToThreeTierCategory(content);
        const itemValidation = {
          contentId: content.id,
          contentType: this._getContentType(content),
          originalCategory: content.category,
          mappedCategory: mappingResult.threeTierCategory,
          appliedRule: mappingResult.appliedRule,
          isValid: true,
          issues: [],
        };

        // Validate mapping result
        if (!mappingResult.threeTierCategory) {
          itemValidation.isValid = false;
          itemValidation.issues.push('No category assigned');
          results.invalidMappings++;
        } else if (
          !this._isValidThreeTierCategory(mappingResult.threeTierCategory)
        ) {
          itemValidation.isValid = false;
          itemValidation.issues.push(
            `Invalid category: ${mappingResult.threeTierCategory}`
          );
          results.invalidMappings++;
        } else {
          results.validMappings++;
        }

        // Check for potential mapping issues
        const mappingIssues = this._checkMappingIssues(content, mappingResult);
        if (mappingIssues.length > 0) {
          itemValidation.issues.push(...mappingIssues);
          if (mappingIssues.some(issue => issue.severity === 'error')) {
            itemValidation.isValid = false;
            results.invalidMappings++;
            results.validMappings--;
          }
        }

        results.details.push(itemValidation);
      } catch (error) {
        results.invalidMappings++;
        results.errors.push(
          `Failed to validate ${content.id}: ${error.message}`
        );
        results.details.push({
          contentId: content.id,
          isValid: false,
          issues: [`Validation error: ${error.message}`],
        });
      }
    }

    // Set overall status
    if (results.invalidMappings > 0) {
      results.status = 'error';
    } else if (results.warnings.length > 0) {
      results.status = 'warning';
    }

    return results;
  }

  /**
   * Validate category distribution across content
   * @private
   * @param {Array} allContent - All content items
   * @returns {Object} Distribution validation results
   */
  async _validateCategoryDistribution(allContent) {
    const distribution = {
      'daten-prozessanalyse': { count: 0, percentage: 0, content: [] },
      anwendungsentwicklung: { count: 0, percentage: 0, content: [] },
      allgemein: { count: 0, percentage: 0, content: [] },
    };

    // Count content by category
    for (const content of allContent) {
      const mappingResult =
        this.categoryMappingService.mapToThreeTierCategory(content);
      const category = mappingResult.threeTierCategory || 'allgemein';

      if (distribution[category]) {
        distribution[category].count++;
        distribution[category].content.push(content.id);
      }
    }

    // Calculate percentages
    const totalContent = allContent.length;
    Object.keys(distribution).forEach(category => {
      distribution[category].percentage =
        totalContent > 0
          ? Math.round((distribution[category].count / totalContent) * 100)
          : 0;
    });

    // Validate distribution against rules
    const validationResult = {
      status: 'success',
      distribution,
      issues: [],
      recommendations: [],
    };

    const rules = this.validationRules.categoryDistribution;

    Object.entries(distribution).forEach(([category, data]) => {
      // Check minimum percentage
      if (data.percentage < rules.minPercentagePerCategory) {
        validationResult.issues.push({
          severity: 'error',
          category,
          message: `Category ${category} has only ${data.percentage}% of content (minimum: ${rules.minPercentagePerCategory}%)`,
        });
        validationResult.status = 'error';
      }

      // Check maximum percentage
      if (data.percentage > rules.maxPercentagePerCategory) {
        validationResult.issues.push({
          severity: 'warning',
          category,
          message: `Category ${category} has ${data.percentage}% of content (maximum recommended: ${rules.maxPercentagePerCategory}%)`,
        });
        if (validationResult.status === 'success') {
          validationResult.status = 'warning';
        }
      }

      // Check warning threshold
      if (data.percentage < rules.warningThreshold) {
        validationResult.issues.push({
          severity: 'warning',
          category,
          message: `Category ${category} has very low content (${data.percentage}%)`,
        });
        if (validationResult.status === 'success') {
          validationResult.status = 'warning';
        }
      }
    });

    return validationResult;
  }

  /**
   * Validate specialization relevance across categories
   * @private
   * @param {Array} allContent - All content items
   * @returns {Object} Specialization relevance validation results
   */
  async _validateSpecializationRelevance(allContent) {
    const specializationAnalysis = {
      anwendungsentwicklung: {
        high: { count: 0, percentage: 0, content: [] },
        medium: { count: 0, percentage: 0, content: [] },
        low: { count: 0, percentage: 0, content: [] },
        none: { count: 0, percentage: 0, content: [] },
      },
      'daten-prozessanalyse': {
        high: { count: 0, percentage: 0, content: [] },
        medium: { count: 0, percentage: 0, content: [] },
        low: { count: 0, percentage: 0, content: [] },
        none: { count: 0, percentage: 0, content: [] },
      },
    };

    // Analyze relevance for each specialization
    for (const content of allContent) {
      const mappingResult =
        this.categoryMappingService.mapToThreeTierCategory(content);
      const category = mappingResult.threeTierCategory;

      ['anwendungsentwicklung', 'daten-prozessanalyse'].forEach(
        specializationId => {
          const relevance = this.categoryMappingService.getCategoryRelevance(
            category,
            specializationId
          );

          if (specializationAnalysis[specializationId][relevance]) {
            specializationAnalysis[specializationId][relevance].count++;
            specializationAnalysis[specializationId][relevance].content.push(
              content.id
            );
          }
        }
      );
    }

    // Calculate percentages
    const totalContent = allContent.length;
    Object.keys(specializationAnalysis).forEach(specializationId => {
      Object.keys(specializationAnalysis[specializationId]).forEach(
        relevanceLevel => {
          const data = specializationAnalysis[specializationId][relevanceLevel];
          data.percentage =
            totalContent > 0
              ? Math.round((data.count / totalContent) * 100)
              : 0;
        }
      );
    });

    // Validate against rules
    const validationResult = {
      status: 'success',
      analysis: specializationAnalysis,
      issues: [],
      recommendations: [],
    };

    const rules = this.validationRules.specializationRelevance;

    Object.entries(specializationAnalysis).forEach(
      ([specializationId, relevanceData]) => {
        // Check high relevance requirement
        if (
          relevanceData.high.percentage < rules.requiredHighRelevancePercentage
        ) {
          validationResult.issues.push({
            severity: 'warning',
            specialization: specializationId,
            message: `Only ${relevanceData.high.percentage}% high-relevance content for ${specializationId} (required: ${rules.requiredHighRelevancePercentage}%)`,
          });
          if (validationResult.status === 'success') {
            validationResult.status = 'warning';
          }
        }

        // Check low relevance threshold
        if (relevanceData.low.percentage > rules.maxLowRelevancePercentage) {
          validationResult.issues.push({
            severity: 'warning',
            specialization: specializationId,
            message: `${relevanceData.low.percentage}% low-relevance content for ${specializationId} (maximum: ${rules.maxLowRelevancePercentage}%)`,
          });
          if (validationResult.status === 'success') {
            validationResult.status = 'warning';
          }
        }
      }
    );

    return validationResult;
  }

  /**
   * Detect category assignment conflicts
   * @private
   * @param {Array} allContent - All content items
   * @returns {Object} Conflict detection results
   */
  async _detectCategoryConflicts(allContent) {
    const conflicts = {
      duplicateAssignments: [],
      crossReferenceConflicts: [],
      prerequisiteConflicts: [],
      specializationMismatches: [],
    };

    const categoryAssignments = new Map();

    // Check for duplicate assignments and collect mappings
    for (const content of allContent) {
      const mappingResult =
        this.categoryMappingService.mapToThreeTierCategory(content);
      const category = mappingResult.threeTierCategory;

      // Track assignments for duplicate detection
      const assignmentKey = `${content.id}-${category}`;
      if (categoryAssignments.has(assignmentKey)) {
        conflicts.duplicateAssignments.push({
          contentId: content.id,
          category,
          message: 'Duplicate category assignment detected',
        });
      } else {
        categoryAssignments.set(assignmentKey, {
          content,
          category,
          mappingResult,
        });
      }

      // Check for specialization mismatches
      const specializationMismatch = this._checkSpecializationMismatch(
        content,
        mappingResult
      );
      if (specializationMismatch) {
        conflicts.specializationMismatches.push(specializationMismatch);
      }
    }

    // Check cross-reference conflicts (if content references other content)
    if (this.validationRules.conflictDetection.checkCrossReferences) {
      conflicts.crossReferenceConflicts =
        await this._checkCrossReferenceConflicts(allContent);
    }

    // Check prerequisite conflicts
    if (this.validationRules.conflictDetection.validatePrerequisites) {
      conflicts.prerequisiteConflicts =
        await this._checkPrerequisiteConflicts(allContent);
    }

    return {
      status: this._getConflictStatus(conflicts),
      conflicts,
      summary: {
        totalConflicts: Object.values(conflicts).reduce(
          (sum, arr) => sum + arr.length,
          0
        ),
        conflictTypes: Object.keys(conflicts).filter(
          key => conflicts[key].length > 0
        ),
      },
    };
  }

  /**
   * Assess overall content quality for categorization
   * @private
   * @param {Array} allContent - All content items
   * @returns {Object} Quality assessment results
   */
  async _assessContentQuality(allContent) {
    const qualityMetrics = {
      completeness: { score: 0, issues: [] },
      consistency: { score: 0, issues: [] },
      accuracy: { score: 0, issues: [] },
      maintainability: { score: 0, issues: [] },
    };

    let totalScore = 0;
    const maxScore = 100;

    // Assess completeness (all content has proper categorization)
    const uncategorizedContent = allContent.filter(content => {
      const mappingResult =
        this.categoryMappingService.mapToThreeTierCategory(content);
      return !mappingResult.threeTierCategory;
    });

    qualityMetrics.completeness.score = Math.max(
      0,
      Math.round(
        ((allContent.length - uncategorizedContent.length) /
          allContent.length) *
          100
      )
    );

    if (uncategorizedContent.length > 0) {
      qualityMetrics.completeness.issues.push(
        `${uncategorizedContent.length} items lack proper categorization`
      );
    }

    // Assess consistency (similar content has similar categorization)
    const consistencyScore =
      await this._assessCategorizationConsistency(allContent);
    qualityMetrics.consistency.score = consistencyScore.score;
    qualityMetrics.consistency.issues = consistencyScore.issues;

    // Assess accuracy (categorization matches content characteristics)
    const accuracyScore = await this._assessCategorizationAccuracy(allContent);
    qualityMetrics.accuracy.score = accuracyScore.score;
    qualityMetrics.accuracy.issues = accuracyScore.issues;

    // Assess maintainability (clear rules, good documentation)
    const maintainabilityScore = this._assessMaintainability();
    qualityMetrics.maintainability.score = maintainabilityScore.score;
    qualityMetrics.maintainability.issues = maintainabilityScore.issues;

    // Calculate overall quality score
    totalScore = Math.round(
      (qualityMetrics.completeness.score +
        qualityMetrics.consistency.score +
        qualityMetrics.accuracy.score +
        qualityMetrics.maintainability.score) /
        4
    );

    return {
      overallScore: totalScore,
      grade: this._getQualityGrade(totalScore),
      metrics: qualityMetrics,
      recommendations: this._generateQualityRecommendations(qualityMetrics),
    };
  }

  /**
   * Generate optimization suggestions based on validation results
   * @private
   * @param {Object} validationResults - Complete validation results
   * @returns {Array} Array of optimization suggestions
   */
  _generateOptimizationSuggestions(validationResults) {
    const suggestions = [];

    // Category distribution suggestions
    if (validationResults.distributionValidation.issues.length > 0) {
      const imbalancedCategories =
        validationResults.distributionValidation.issues
          .filter(issue => issue.severity === 'error')
          .map(issue => issue.category);

      if (imbalancedCategories.length > 0) {
        suggestions.push({
          type: 'distribution',
          priority: 'high',
          title: 'Rebalance Category Distribution',
          description: `Categories ${imbalancedCategories.join(', ')} need content rebalancing`,
          actions: [
            'Review content assignment rules for underrepresented categories',
            'Consider splitting overloaded categories',
            'Add more content to underrepresented categories',
          ],
        });
      }
    }

    // Specialization relevance suggestions
    if (validationResults.specializationRelevanceValidation.issues.length > 0) {
      suggestions.push({
        type: 'relevance',
        priority: 'medium',
        title: 'Improve Specialization Relevance',
        description:
          'Some specializations lack sufficient high-relevance content',
        actions: [
          'Review and update specialization relevance mappings',
          'Create more specialized content for underserved areas',
          'Reassess general content for specialization-specific value',
        ],
      });
    }

    // Conflict resolution suggestions
    if (validationResults.conflictDetection.summary.totalConflicts > 0) {
      suggestions.push({
        type: 'conflicts',
        priority: 'high',
        title: 'Resolve Category Conflicts',
        description: `${validationResults.conflictDetection.summary.totalConflicts} conflicts detected`,
        actions: [
          'Review and resolve duplicate assignments',
          'Fix cross-reference inconsistencies',
          'Update prerequisite relationships',
        ],
      });
    }

    // Quality improvement suggestions
    if (validationResults.qualityAssessment.overallScore < 80) {
      suggestions.push({
        type: 'quality',
        priority: 'medium',
        title: 'Improve Categorization Quality',
        description: `Quality score: ${validationResults.qualityAssessment.overallScore}/100`,
        actions: validationResults.qualityAssessment.recommendations,
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Create validation report for category assignment conflicts
   * @param {Array} contentItems - Content items to check for conflicts
   * @returns {Object} Conflict validation report
   */
  async createConflictReport(contentItems = null) {
    try {
      const content = contentItems || (await this._getAllContent());
      const conflicts = await this._detectCategoryConflicts(content);

      return {
        reportId: this._generateReportId(),
        generatedAt: new Date().toISOString(),
        contentAnalyzed: content.length,
        conflictSummary: conflicts.summary,
        detailedConflicts: conflicts.conflicts,
        resolutionSuggestions: this._generateConflictResolutions(
          conflicts.conflicts
        ),
        status: conflicts.status,
      };
    } catch (error) {
      console.error('Failed to create conflict report:', error);
      return {
        reportId: null,
        error: error.message,
        status: 'error',
      };
    }
  }

  /**
   * Generate automated suggestions for optimal category assignments
   * @param {Array} contentItems - Content items to analyze
   * @returns {Object} Assignment suggestions report
   */
  async generateAssignmentSuggestions(contentItems = null) {
    try {
      const content = contentItems || (await this._getAllContent());
      const suggestions = [];

      for (const item of content) {
        const currentMapping =
          this.categoryMappingService.mapToThreeTierCategory(item);
        const alternativeMappings = await this._getAlternativeMappings(item);

        if (alternativeMappings.length > 0) {
          suggestions.push({
            contentId: item.id,
            contentType: this._getContentType(item),
            currentCategory: currentMapping.threeTierCategory,
            currentConfidence: this._calculateMappingConfidence(currentMapping),
            alternatives: alternativeMappings,
            recommendation: this._selectBestAlternative(
              currentMapping,
              alternativeMappings
            ),
          });
        }
      }

      return {
        reportId: this._generateReportId(),
        generatedAt: new Date().toISOString(),
        contentAnalyzed: content.length,
        suggestionsCount: suggestions.length,
        suggestions: suggestions.sort(
          (a, b) => b.recommendation.confidence - a.recommendation.confidence
        ),
        summary: this._summarizeAssignmentSuggestions(suggestions),
      };
    } catch (error) {
      console.error('Failed to generate assignment suggestions:', error);
      return {
        reportId: null,
        error: error.message,
        status: 'error',
      };
    }
  }

  // Helper methods for validation logic

  /**
   * Get all content from available services
   * @private
   * @returns {Array} All content items
   */
  async _getAllContent() {
    const allContent = [];

    try {
      if (this.ihkContentService) {
        const modules = await this.ihkContentService.getModules();
        const quizzes = await this.ihkContentService.getQuizzes();
        allContent.push(...modules, ...quizzes);
      }
    } catch (error) {
      console.warn('Could not load content from IHKContentService:', error);
    }

    return allContent;
  }

  /**
   * Check if category ID is valid three-tier category
   * @private
   * @param {string} categoryId - Category ID to validate
   * @returns {boolean} True if valid
   */
  _isValidThreeTierCategory(categoryId) {
    const validCategories = [
      'daten-prozessanalyse',
      'anwendungsentwicklung',
      'allgemein',
    ];
    return validCategories.includes(categoryId);
  }

  /**
   * Get content type from content item
   * @private
   * @param {Object} content - Content item
   * @returns {string} Content type
   */
  _getContentType(content) {
    if (content.questions && Array.isArray(content.questions)) {
      return 'quiz';
    }
    if (content.content || content.sections) {
      return 'module';
    }
    return 'unknown';
  }

  /**
   * Check for mapping issues in content item
   * @private
   * @param {Object} content - Content item
   * @param {Object} mappingResult - Mapping result
   * @returns {Array} Array of mapping issues
   */
  _checkMappingIssues(content, mappingResult) {
    const issues = [];

    // Check for obvious category mismatches
    const originalCategory = (content.category || '').toLowerCase();
    const targetCategory = mappingResult.threeTierCategory;

    if (
      originalCategory.includes('dpa') &&
      targetCategory !== 'daten-prozessanalyse'
    ) {
      issues.push({
        severity: 'warning',
        message: 'DPA content mapped to non-DPA category',
      });
    }

    if (
      originalCategory.includes('ae') &&
      targetCategory !== 'anwendungsentwicklung'
    ) {
      issues.push({
        severity: 'warning',
        message: 'AE content mapped to non-AE category',
      });
    }

    return issues;
  }

  /**
   * Generate unique report identifier
   * @private
   * @returns {string} Report ID
   */
  _generateReportId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `validation-report-${timestamp}-${random}`;
  }

  /**
   * Determine overall validation status
   * @private
   * @param {Object} validationResults - All validation results
   * @returns {string} Overall status
   */
  _determineOverallStatus(validationResults) {
    const hasErrors = Object.values(validationResults).some(
      result =>
        result.status === 'error' || (result.errors && result.errors.length > 0)
    );

    if (hasErrors) return 'error';

    const hasWarnings = Object.values(validationResults).some(
      result =>
        result.status === 'warning' ||
        (result.warnings && result.warnings.length > 0)
    );

    return hasWarnings ? 'warning' : 'success';
  }

  // Additional helper methods would be implemented here for:
  // - _checkSpecializationMismatch
  // - _checkCrossReferenceConflicts
  // - _checkPrerequisiteConflicts
  // - _getConflictStatus
  // - _assessCategorizationConsistency
  // - _assessCategorizationAccuracy
  // - _assessMaintainability
  // - _getQualityGrade
  // - _generateQualityRecommendations
  // - _generateConflictResolutions
  // - _getAlternativeMappings
  // - _calculateMappingConfidence
  // - _selectBestAlternative
  // - _summarizeAssignmentSuggestions

  /**
   * Check for specialization mismatch in content mapping
   * @private
   * @param {Object} content - Content item
   * @param {Object} mappingResult - Mapping result
   * @returns {Object|null} Mismatch details or null
   */
  _checkSpecializationMismatch(content, mappingResult) {
    // Implementation would check if content specialization matches category assignment
    return null; // Placeholder
  }

  /**
   * Get conflict status from conflicts object
   * @private
   * @param {Object} conflicts - Conflicts object
   * @returns {string} Status
   */
  _getConflictStatus(conflicts) {
    const totalConflicts = Object.values(conflicts).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    return totalConflicts > 0 ? 'warning' : 'success';
  }

  /**
   * Assess categorization consistency
   * @private
   * @param {Array} allContent - All content items
   * @returns {Object} Consistency assessment
   */
  async _assessCategorizationConsistency(allContent) {
    return { score: 85, issues: [] }; // Placeholder implementation
  }

  /**
   * Assess categorization accuracy
   * @private
   * @param {Array} allContent - All content items
   * @returns {Object} Accuracy assessment
   */
  async _assessCategorizationAccuracy(allContent) {
    return { score: 90, issues: [] }; // Placeholder implementation
  }

  /**
   * Assess maintainability of categorization system
   * @private
   * @returns {Object} Maintainability assessment
   */
  _assessMaintainability() {
    return { score: 80, issues: [] }; // Placeholder implementation
  }

  /**
   * Get quality grade from score
   * @private
   * @param {number} score - Quality score
   * @returns {string} Quality grade
   */
  _getQualityGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate quality recommendations
   * @private
   * @param {Object} qualityMetrics - Quality metrics
   * @returns {Array} Recommendations
   */
  _generateQualityRecommendations(qualityMetrics) {
    const recommendations = [];

    Object.entries(qualityMetrics).forEach(([metric, data]) => {
      if (data.score < 80) {
        recommendations.push(`Improve ${metric}: ${data.issues.join(', ')}`);
      }
    });

    return recommendations;
  }
}

export default CategoryValidationService;
