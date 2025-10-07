/**
 * ContentRelationshipService - Manages cross-category content relationships
 * Identifies and maps relationships between content across the three-tier category system
 * Provides content recommendations and prerequisite tracking
 */
class ContentRelationshipService {
  constructor(
    ihkContentService,
    categoryMappingService,
    specializationService
  ) {
    this.contentService = ihkContentService;
    this.categoryMappingService = categoryMappingService;
    this.specializationService = specializationService;

    // Cache for relationship mappings
    this.relationshipCache = new Map();
    this.prerequisiteCache = new Map();
    this.recommendationCache = new Map();

    // Relationship types
    this.relationshipTypes = {
      PREREQUISITE: 'prerequisite',
      RELATED: 'related',
      ADVANCED: 'advanced',
      COMPLEMENTARY: 'complementary',
    };
  }

  /**
   * Initialize the service and build relationship mappings
   */
  async initialize() {
    try {
      await this._buildRelationshipMappings();
      console.warn('ContentRelationshipService initialized successfully');
    } catch (error) {
      console.error('Error initializing ContentRelationshipService:', error);
      throw error;
    }
  }

  /**
   * Get related content across categories for a given content item
   * @param {string} contentId - The content item ID
   * @param {Object} options - Options for filtering relationships
   * @returns {Promise<Object>} Related content grouped by relationship type and category
   */
  async getRelatedContent(contentId, options = {}) {
    try {
      const {
        maxResults = 5,
        includeTypes = Object.values(this.relationshipTypes),
        excludeCurrentCategory = false,
        specializationId = null,
      } = options;

      // Get the source content item
      const sourceContent = await this._getContentById(contentId);
      if (!sourceContent) {
        return { relationships: {}, totalFound: 0 };
      }

      // Check cache first
      const cacheKey = `${contentId}-${JSON.stringify(options)}`;
      if (this.relationshipCache.has(cacheKey)) {
        return this.relationshipCache.get(cacheKey);
      }

      const relationships = {};
      let totalFound = 0;

      // Find relationships for each type
      for (const relationshipType of includeTypes) {
        const relatedItems = await this._findRelatedContentByType(
          sourceContent,
          relationshipType,
          { maxResults, excludeCurrentCategory, specializationId }
        );

        if (relatedItems.length > 0) {
          relationships[relationshipType] = relatedItems;
          totalFound += relatedItems.length;
        }
      }

      const result = { relationships, totalFound };

      // Cache the result
      this.relationshipCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Error getting related content:', error);
      return { relationships: {}, totalFound: 0 };
    }
  }

  /**
   * Get prerequisite content for a given content item
   * @param {string} contentId - The content item ID
   * @returns {Promise<Array>} Array of prerequisite content items
   */
  async getPrerequisites(contentId) {
    try {
      if (this.prerequisiteCache.has(contentId)) {
        return this.prerequisiteCache.get(contentId);
      }

      const sourceContent = await this._getContentById(contentId);
      if (!sourceContent) {
        return [];
      }

      const prerequisites = await this._findPrerequisites(sourceContent);

      // Cache the result
      this.prerequisiteCache.set(contentId, prerequisites);

      return prerequisites;
    } catch (error) {
      console.error('Error getting prerequisites:', error);
      return [];
    }
  }

  /**
   * Get content recommendations based on user's progress and specialization
   * @param {string} specializationId - User's specialization
   * @param {Array} completedContentIds - Array of completed content IDs
   * @param {Object} options - Options for recommendations
   * @returns {Promise<Array>} Array of recommended content items
   */
  async getContentRecommendations(
    specializationId,
    completedContentIds = [],
    options = {}
  ) {
    try {
      const {
        maxResults = 10,
        includeCategories = [
          'daten-prozessanalyse',
          'anwendungsentwicklung',
          'allgemein',
        ],
        difficultyProgression = true,
      } = options;

      const cacheKey = `rec-${specializationId}-${completedContentIds.length}-${JSON.stringify(options)}`;
      if (this.recommendationCache.has(cacheKey)) {
        return this.recommendationCache.get(cacheKey);
      }

      const recommendations = [];

      // Get all available content
      const allContent = await this._getAllContent();

      // Filter out completed content
      const availableContent = allContent.filter(
        item => !completedContentIds.includes(item.id)
      );

      // Score and rank content based on various factors
      const scoredContent = await this._scoreContentForRecommendation(
        availableContent,
        specializationId,
        completedContentIds,
        { includeCategories, difficultyProgression }
      );

      // Sort by score and take top results
      const topRecommendations = scoredContent
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

      // Cache the result
      this.recommendationCache.set(cacheKey, topRecommendations);

      return topRecommendations;
    } catch (error) {
      console.error('Error getting content recommendations:', error);
      return [];
    }
  }

  /**
   * Find content that builds upon the given content (advanced/next steps)
   * @param {string} contentId - The base content item ID
   * @returns {Promise<Array>} Array of advanced content items
   */
  async getAdvancedContent(contentId) {
    try {
      const sourceContent = await this._getContentById(contentId);
      if (!sourceContent) {
        return [];
      }

      return await this._findRelatedContentByType(
        sourceContent,
        this.relationshipTypes.ADVANCED,
        { maxResults: 5 }
      );
    } catch (error) {
      console.error('Error getting advanced content:', error);
      return [];
    }
  }

  /**
   * Clear all caches (useful for testing or when content changes)
   */
  clearCache() {
    this.relationshipCache.clear();
    this.prerequisiteCache.clear();
    this.recommendationCache.clear();
  }

  // Private methods

  /**
   * Build relationship mappings between content items
   * @private
   */
  async _buildRelationshipMappings() {
    try {
      const allContent = await this._getAllContent();

      // Build keyword and topic mappings
      this.keywordMap = new Map();
      this.topicMap = new Map();
      this.difficultyMap = new Map();

      for (const content of allContent) {
        // Extract keywords from title and description
        const keywords = this._extractKeywords(content);
        this.keywordMap.set(content.id, keywords);

        // Map topics/categories
        const topics = this._extractTopics(content);
        this.topicMap.set(content.id, topics);

        // Map difficulty levels
        this.difficultyMap.set(
          content.id,
          content.difficulty || 'intermediate'
        );
      }

      console.warn(
        `Built relationship mappings for ${allContent.length} content items`
      );
    } catch (error) {
      console.error('Error building relationship mappings:', error);
      throw error;
    }
  }

  /**
   * Get content by ID from the content service
   * @private
   */
  async _getContentById(contentId) {
    try {
      // Try to get as module first
      const module = await this.contentService.getModuleById(contentId);
      if (module) {
        return { ...module, type: 'module' };
      }

      // Try to get as quiz
      const quiz = await this.contentService.getQuizById(contentId);
      if (quiz) {
        return { ...quiz, type: 'quiz' };
      }

      return null;
    } catch (error) {
      console.error('Error getting content by ID:', error);
      return null;
    }
  }

  /**
   * Get all content from the content service
   * @private
   */
  async _getAllContent() {
    try {
      const [modules, quizzes] = await Promise.all([
        this.contentService.getAllModules(),
        this.contentService.getAllQuizzes(),
      ]);

      const allContent = [
        ...modules.map(m => ({ ...m, type: 'module' })),
        ...quizzes.map(q => ({ ...q, type: 'quiz' })),
      ];

      return allContent;
    } catch (error) {
      console.error('Error getting all content:', error);
      return [];
    }
  }

  /**
   * Find related content by relationship type
   * @private
   */
  async _findRelatedContentByType(
    sourceContent,
    relationshipType,
    options = {}
  ) {
    const {
      maxResults = 5,
      excludeCurrentCategory = false,
      specializationId = null,
    } = options;

    try {
      const allContent = await this._getAllContent();
      const candidates = [];

      for (const content of allContent) {
        if (content.id === sourceContent.id) continue;

        // Skip if excluding current category
        if (
          excludeCurrentCategory &&
          content.threeTierCategory === sourceContent.threeTierCategory
        ) {
          continue;
        }

        const relationshipScore = this._calculateRelationshipScore(
          sourceContent,
          content,
          relationshipType,
          specializationId
        );

        if (relationshipScore > 0.3) {
          // Minimum threshold
          candidates.push({
            ...content,
            relationshipScore,
            relationshipType,
          });
        }
      }

      // Sort by score and return top results
      return candidates
        .sort((a, b) => b.relationshipScore - a.relationshipScore)
        .slice(0, maxResults);
    } catch (error) {
      console.error('Error finding related content by type:', error);
      return [];
    }
  }

  /**
   * Find prerequisite content for a given content item
   * @private
   */
  async _findPrerequisites(sourceContent) {
    try {
      const allContent = await this._getAllContent();
      const prerequisites = [];

      for (const content of allContent) {
        if (content.id === sourceContent.id) continue;

        // Check if this content is a prerequisite
        const isPrerequisite = this._isPrerequisite(content, sourceContent);

        if (isPrerequisite) {
          prerequisites.push({
            ...content,
            prerequisiteReason: this._getPrerequisiteReason(
              content,
              sourceContent
            ),
          });
        }
      }

      // Sort by importance/difficulty
      return prerequisites.sort((a, b) => {
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
        return (
          (difficultyOrder[a.difficulty] || 2) -
          (difficultyOrder[b.difficulty] || 2)
        );
      });
    } catch (error) {
      console.error('Error finding prerequisites:', error);
      return [];
    }
  }

  /**
   * Score content for recommendation based on various factors
   * @private
   */
  async _scoreContentForRecommendation(
    availableContent,
    specializationId,
    completedContentIds,
    options
  ) {
    const { includeCategories, difficultyProgression } = options;

    return availableContent.map(content => {
      let score = 0;

      // Base score from specialization relevance
      if (
        content.specializationRelevance &&
        content.specializationRelevance[specializationId]
      ) {
        const relevance = content.specializationRelevance[specializationId];
        score += relevance === 'high' ? 3 : relevance === 'medium' ? 2 : 1;
      }

      // Category inclusion bonus
      if (includeCategories.includes(content.threeTierCategory)) {
        score += 2;
      }

      // Difficulty progression bonus
      if (difficultyProgression) {
        const userLevel = this._estimateUserLevel(completedContentIds);
        const contentDifficulty = content.difficulty || 'intermediate';

        if (this._isDifficultyAppropriate(userLevel, contentDifficulty)) {
          score += 2;
        }
      }

      // Prerequisite completion bonus
      const prerequisitesMet = this._checkPrerequisitesMet(
        content,
        completedContentIds
      );
      if (prerequisitesMet) {
        score += 1;
      }

      return {
        ...content,
        score,
        recommendationReasons: this._getRecommendationReasons(
          content,
          score,
          specializationId
        ),
      };
    });
  }

  /**
   * Calculate relationship score between two content items
   * @private
   */
  _calculateRelationshipScore(
    sourceContent,
    targetContent,
    relationshipType,
    specializationId
  ) {
    let score = 0;

    // Keyword similarity
    const sourceKeywords = this.keywordMap.get(sourceContent.id) || [];
    const targetKeywords = this.keywordMap.get(targetContent.id) || [];
    const keywordSimilarity = this._calculateKeywordSimilarity(
      sourceKeywords,
      targetKeywords
    );
    score += keywordSimilarity * 0.4;

    // Topic similarity
    const sourceTopics = this.topicMap.get(sourceContent.id) || [];
    const targetTopics = this.topicMap.get(targetContent.id) || [];
    const topicSimilarity = this._calculateTopicSimilarity(
      sourceTopics,
      targetTopics
    );
    score += topicSimilarity * 0.3;

    // Specialization relevance
    if (specializationId && targetContent.specializationRelevance) {
      const relevance = targetContent.specializationRelevance[specializationId];
      score += relevance === 'high' ? 0.2 : relevance === 'medium' ? 0.1 : 0.05;
    }

    // Relationship type specific scoring
    switch (relationshipType) {
      case this.relationshipTypes.PREREQUISITE:
        // Lower difficulty content gets higher score for prerequisites
        if (
          this._getDifficultyLevel(targetContent) <
          this._getDifficultyLevel(sourceContent)
        ) {
          score += 0.1;
        }
        break;
      case this.relationshipTypes.ADVANCED:
        // Higher difficulty content gets higher score for advanced
        if (
          this._getDifficultyLevel(targetContent) >
          this._getDifficultyLevel(sourceContent)
        ) {
          score += 0.1;
        }
        break;
      case this.relationshipTypes.RELATED:
        // Same difficulty level gets bonus for related content
        if (
          this._getDifficultyLevel(targetContent) ===
          this._getDifficultyLevel(sourceContent)
        ) {
          score += 0.05;
        }
        break;
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Extract keywords from content
   * @private
   */
  _extractKeywords(content) {
    const text =
      `${content.title || ''} ${content.description || ''} ${content.category || ''}`.toLowerCase();

    // Common technical keywords to look for
    const technicalKeywords = [
      'datenbank',
      'database',
      'sql',
      'normalisierung',
      'er-modell',
      'etl',
      'data warehouse',
      'bi',
      'business intelligence',
      'olap',
      'programmierung',
      'java',
      'javascript',
      'python',
      'web',
      'algorithmus',
      'datenstruktur',
      'objektorientiert',
      'design pattern',
      'testing',
      'qualität',
      'projekt',
      'agil',
      'scrum',
      'sicherheit',
      'verschlüsselung',
      'authentifizierung',
      'netzwerk',
      'protokoll',
      'api',
      'rest',
      'json',
    ];

    const foundKeywords = technicalKeywords.filter(keyword =>
      text.includes(keyword)
    );

    // Also extract words from title (simplified)
    const titleWords = (content.title || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5); // Limit to first 5 words

    return [...foundKeywords, ...titleWords];
  }

  /**
   * Extract topics from content
   * @private
   */
  _extractTopics(content) {
    const topics = [];

    // Add three-tier category as primary topic
    if (content.threeTierCategory) {
      topics.push(content.threeTierCategory);
    }

    // Add original category as secondary topic
    if (content.category) {
      topics.push(content.category);
    }

    // Extract topics from content type and difficulty
    topics.push(content.type || 'unknown');
    topics.push(content.difficulty || 'intermediate');

    return topics;
  }

  /**
   * Calculate keyword similarity between two sets
   * @private
   */
  _calculateKeywordSimilarity(keywords1, keywords2) {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const intersection = keywords1.filter(k => keywords2.includes(k));
    const union = [...new Set([...keywords1, ...keywords2])];

    return intersection.length / union.length;
  }

  /**
   * Calculate topic similarity between two sets
   * @private
   */
  _calculateTopicSimilarity(topics1, topics2) {
    if (topics1.length === 0 || topics2.length === 0) return 0;

    const intersection = topics1.filter(t => topics2.includes(t));
    return intersection.length / Math.max(topics1.length, topics2.length);
  }

  /**
   * Check if content is a prerequisite for another
   * @private
   */
  _isPrerequisite(candidateContent, targetContent) {
    // Basic heuristics for prerequisite detection

    // Lower difficulty is often a prerequisite
    const candidateDifficulty = this._getDifficultyLevel(candidateContent);
    const targetDifficulty = this._getDifficultyLevel(targetContent);

    if (candidateDifficulty >= targetDifficulty) return false;

    // Check for foundational topics
    const candidateKeywords = this.keywordMap.get(candidateContent.id) || [];
    const targetKeywords = this.keywordMap.get(targetContent.id) || [];

    // If candidate has foundational keywords and target has advanced ones
    const foundationalKeywords = [
      'grundlagen',
      'einführung',
      'basics',
      'introduction',
    ];
    const hasFoundational = candidateKeywords.some(k =>
      foundationalKeywords.some(f => k.includes(f))
    );

    const keywordOverlap = this._calculateKeywordSimilarity(
      candidateKeywords,
      targetKeywords
    );

    return hasFoundational && keywordOverlap > 0.2;
  }

  /**
   * Get difficulty level as number
   * @private
   */
  _getDifficultyLevel(content) {
    const difficulty = content.difficulty || 'intermediate';
    const levels = { beginner: 1, intermediate: 2, advanced: 3 };
    return levels[difficulty] || 2;
  }

  /**
   * Get prerequisite reason
   * @private
   */
  _getPrerequisiteReason(prerequisite, target) {
    return `Foundational knowledge for ${target.title}`;
  }

  /**
   * Estimate user level based on completed content
   * @private
   */
  _estimateUserLevel(completedContentIds) {
    // Simple heuristic: more completed content = higher level
    if (completedContentIds.length < 5) return 'beginner';
    if (completedContentIds.length < 15) return 'intermediate';
    return 'advanced';
  }

  /**
   * Check if difficulty is appropriate for user level
   * @private
   */
  _isDifficultyAppropriate(userLevel, contentDifficulty) {
    const userLevelNum = this._getDifficultyLevel({ difficulty: userLevel });
    const contentLevelNum = this._getDifficultyLevel({
      difficulty: contentDifficulty,
    });

    // Content should be at user level or slightly above
    return (
      contentLevelNum >= userLevelNum && contentLevelNum <= userLevelNum + 1
    );
  }

  /**
   * Check if prerequisites are met
   * @private
   */
  _checkPrerequisitesMet(content, completedContentIds) {
    // Simplified: assume prerequisites are met if user has completed some content
    return completedContentIds.length > 0;
  }

  /**
   * Get recommendation reasons
   * @private
   */
  _getRecommendationReasons(content, score, specializationId) {
    const reasons = [];

    if (
      content.specializationRelevance &&
      content.specializationRelevance[specializationId] === 'high'
    ) {
      reasons.push('Highly relevant for your specialization');
    }

    if (score > 4) {
      reasons.push('Excellent match for your learning path');
    } else if (score > 3) {
      reasons.push('Good fit for your current level');
    }

    return reasons;
  }
}

export default ContentRelationshipService;
