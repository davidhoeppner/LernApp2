/**
 * PerformanceOptimizationService - Optimizes category-based content filtering and search
 * Implements efficient data structures, caching strategies, and performance monitoring
 * for the three-tier category system
 */
class PerformanceOptimizationService {
  constructor(
    ihkContentService,
    categoryMappingService,
    advancedCachingService
  ) {
    this.ihkContentService = ihkContentService;
    this.categoryMappingService = categoryMappingService;
    this.advancedCachingService = advancedCachingService;

    // Performance-optimized data structures
    this.categoryIndexes = new Map(); // category -> Set of content IDs
    this.contentCache = new Map(); // content ID -> content object
    this.searchIndexes = new Map(); // search terms -> Set of content IDs
    this.metadataCache = new Map(); // metadata keys -> cached values

    // Performance monitoring
    this.performanceMetrics = {
      filterOperations: [],
      searchOperations: [],
      cacheHits: 0,
      cacheMisses: 0,
      indexBuilds: 0,
    };

    // Configuration
    this.config = {
      maxCacheSize: 10000,
      maxSearchIndexSize: 5000,
      performanceTargetMs: 100,
      enableMetrics: true,
      cacheInvalidationDelay: 5000, // 5 seconds
    };

    // Cache invalidation tracking
    this.invalidationTimers = new Map();
    this.lastIndexBuild = null;

    this._initializeIndexes();
  }

  /**
   * Initialize performance-optimized indexes
   * @private
   */
  async _initializeIndexes() {
    try {
      const startTime = performance.now();

      // Build category indexes
      await this._buildCategoryIndexes();

      // Build search indexes for common terms
      await this._buildSearchIndexes();

      const buildTime = performance.now() - startTime;
      this.lastIndexBuild = Date.now();

      if (this.config.enableMetrics) {
        this.performanceMetrics.indexBuilds++;
        console.warn(`Performance indexes built in ${buildTime.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('Error initializing performance indexes:', error);
    }
  }

  /**
   * Build optimized category indexes for fast filtering
   * @private
   */
  async _buildCategoryIndexes() {
    try {
      // Clear existing indexes
      this.categoryIndexes.clear();

      // Get all content
      const [modules, quizzes] = await Promise.all([
        this.ihkContentService.getAllModules(),
        this.ihkContentService.getAllQuizzes(),
      ]);

      const allContent = [...modules, ...quizzes];

      // Build indexes for each three-tier category
      const categories = [
        'daten-prozessanalyse',
        'anwendungsentwicklung',
        'allgemein',
      ];

      categories.forEach(categoryId => {
        this.categoryIndexes.set(categoryId, new Set());
      });

      // Index content by three-tier category
      allContent.forEach(item => {
        const threeTierCategory = item.threeTierCategory || 'allgemein';

        if (this.categoryIndexes.has(threeTierCategory)) {
          this.categoryIndexes.get(threeTierCategory).add(item.id);
        }

        // Cache the content item
        this.contentCache.set(item.id, item);
      });

      // Build additional indexes for common filters
      this._buildFilterIndexes(allContent);
    } catch (error) {
      console.error('Error building category indexes:', error);
      throw error;
    }
  }

  /**
   * Build indexes for common filter combinations
   * @private
   * @param {Array} allContent - All content items
   */
  _buildFilterIndexes(allContent) {
    // Index by difficulty
    const difficultyIndex = new Map();

    // Index by specialization relevance
    const relevanceIndex = new Map();

    // Index by content type
    const typeIndex = new Map();

    allContent.forEach(item => {
      // Difficulty index
      if (item.difficulty) {
        if (!difficultyIndex.has(item.difficulty)) {
          difficultyIndex.set(item.difficulty, new Set());
        }
        difficultyIndex.get(item.difficulty).add(item.id);
      }

      // Type index
      const type = item.questions ? 'quiz' : 'module';
      if (!typeIndex.has(type)) {
        typeIndex.set(type, new Set());
      }
      typeIndex.get(type).add(item.id);

      // Relevance index (if available)
      if (item.specializationRelevance) {
        Object.entries(item.specializationRelevance).forEach(
          ([spec, relevance]) => {
            const key = `${spec}-${relevance}`;
            if (!relevanceIndex.has(key)) {
              relevanceIndex.set(key, new Set());
            }
            relevanceIndex.get(key).add(item.id);
          }
        );
      }
    });

    // Store filter indexes
    this.categoryIndexes.set('_difficulty', difficultyIndex);
    this.categoryIndexes.set('_type', typeIndex);
    this.categoryIndexes.set('_relevance', relevanceIndex);
  }

  /**
   * Build search indexes for fast text search
   * @private
   */
  async _buildSearchIndexes() {
    try {
      this.searchIndexes.clear();

      const allContent = Array.from(this.contentCache.values());

      // Build inverted index for search terms
      allContent.forEach(item => {
        const searchableText = this._extractSearchableText(item);
        const terms = this._tokenizeText(searchableText);

        terms.forEach(term => {
          if (!this.searchIndexes.has(term)) {
            this.searchIndexes.set(term, new Set());
          }
          this.searchIndexes.get(term).add(item.id);
        });
      });

      // Limit search index size to prevent memory issues
      if (this.searchIndexes.size > this.config.maxSearchIndexSize) {
        this._pruneSearchIndexes();
      }
    } catch (error) {
      console.error('Error building search indexes:', error);
    }
  }

  /**
   * Extract searchable text from content item
   * @private
   * @param {Object} item - Content item
   * @returns {string} Searchable text
   */
  _extractSearchableText(item) {
    const parts = [
      item.title || '',
      item.description || '',
      item.content || '',
      ...(item.tags || []),
      ...(item.keywords || []),
    ];

    return parts.join(' ').toLowerCase();
  }

  /**
   * Tokenize text into search terms
   * @private
   * @param {string} text - Text to tokenize
   * @returns {Array} Array of search terms
   */
  _tokenizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length >= 2)
      .slice(0, 50); // Limit terms per item
  }

  /**
   * Prune search indexes to maintain performance
   * @private
   */
  _pruneSearchIndexes() {
    // Remove terms that appear in too few or too many documents
    const minDocuments = 2;
    const maxDocuments = Math.floor(this.contentCache.size * 0.8);

    for (const [term, documentSet] of this.searchIndexes.entries()) {
      if (documentSet.size < minDocuments || documentSet.size > maxDocuments) {
        this.searchIndexes.delete(term);
      }
    }
  }

  /**
   * Get content by three-tier category with optimized performance
   * @param {string} categoryId - Three-tier category ID
   * @param {Object} options - Additional filtering options
   * @returns {Promise<Array>} Filtered content items
   */
  async getContentByThreeTierCategory(categoryId, options = {}) {
    const startTime = performance.now();

    try {
      // Try advanced caching first
      if (this.advancedCachingService) {
        try {
          const cachedResult =
            await this.advancedCachingService.getContentByCategory(
              categoryId,
              options
            );
          if (cachedResult) {
            this.performanceMetrics.cacheHits++;
            const duration = performance.now() - startTime;
            this._recordFilterOperation(
              categoryId,
              options,
              duration,
              cachedResult.length
            );
            return cachedResult;
          }
        } catch (cacheError) {
          console.warn(
            'Advanced caching failed, falling back to index-based filtering:',
            cacheError
          );
        }
      }

      this.performanceMetrics.cacheMisses++;

      // Check if indexes need rebuilding
      await this._ensureIndexesReady();

      // Get content IDs from category index
      const categoryContentIds = this.categoryIndexes.get(categoryId);
      if (!categoryContentIds) {
        return [];
      }

      let resultIds = new Set(categoryContentIds);

      // Apply additional filters using indexes
      if (options.difficulty) {
        const difficultyIndex = this.categoryIndexes.get('_difficulty');
        const difficultyIds = difficultyIndex?.get(options.difficulty);
        if (difficultyIds) {
          resultIds = this._intersectSets(resultIds, difficultyIds);
        } else {
          resultIds = new Set(); // No matches
        }
      }

      if (options.contentType) {
        const typeIndex = this.categoryIndexes.get('_type');
        const typeIds = typeIndex?.get(options.contentType);
        if (typeIds) {
          resultIds = this._intersectSets(resultIds, typeIds);
        } else {
          resultIds = new Set(); // No matches
        }
      }

      if (options.specializationRelevance) {
        const relevanceIndex = this.categoryIndexes.get('_relevance');
        const relevanceKey = `${options.specialization}-${options.specializationRelevance}`;
        const relevanceIds = relevanceIndex?.get(relevanceKey);
        if (relevanceIds) {
          resultIds = this._intersectSets(resultIds, relevanceIds);
        } else {
          resultIds = new Set(); // No matches
        }
      }

      // Convert IDs to content objects
      const results = Array.from(resultIds)
        .map(id => this.contentCache.get(id))
        .filter(Boolean);

      // Apply sorting if requested
      if (options.sortBy) {
        this._sortResults(results, options.sortBy, options.sortOrder);
      }

      // Apply pagination if requested
      let finalResults = results;
      if (options.limit || options.offset) {
        const offset = options.offset || 0;
        const limit = options.limit || results.length;
        finalResults = results.slice(offset, offset + limit);
      }

      // Record performance metrics
      const duration = performance.now() - startTime;
      this._recordFilterOperation(
        categoryId,
        options,
        duration,
        finalResults.length
      );

      return finalResults;
    } catch (error) {
      console.error('Error in optimized category filtering:', error);
      // Fallback to original method
      return this._fallbackCategoryFilter(categoryId, options);
    }
  }

  /**
   * Optimized search within specific three-tier category
   * @param {string} query - Search query
   * @param {string} categoryId - Three-tier category ID
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchInCategory(query, categoryId, options = {}) {
    const startTime = performance.now();

    try {
      // Try advanced caching first
      if (this.advancedCachingService) {
        try {
          const cachedResult = await this.advancedCachingService.searchContent(
            query,
            categoryId,
            options
          );
          if (cachedResult) {
            this.performanceMetrics.cacheHits++;
            const duration = performance.now() - startTime;
            this._recordSearchOperation(
              query,
              categoryId,
              options,
              duration,
              cachedResult.length
            );
            return cachedResult;
          }
        } catch (cacheError) {
          console.warn(
            'Advanced search caching failed, falling back to index-based search:',
            cacheError
          );
        }
      }

      this.performanceMetrics.cacheMisses++;

      await this._ensureIndexesReady();

      if (!query || !query.trim()) {
        return this.getContentByThreeTierCategory(categoryId, options);
      }

      // Get category content IDs
      const categoryContentIds = this.categoryIndexes.get(categoryId);
      if (!categoryContentIds || categoryContentIds.size === 0) {
        return [];
      }

      // Tokenize search query
      const searchTerms = this._tokenizeText(query.toLowerCase());

      // Find matching content using search indexes
      let matchingIds = new Set();
      let isFirstTerm = true;

      for (const term of searchTerms) {
        const termMatches = this.searchIndexes.get(term) || new Set();

        if (isFirstTerm) {
          matchingIds = new Set(termMatches);
          isFirstTerm = false;
        } else {
          // Intersection for AND search
          matchingIds = this._intersectSets(matchingIds, termMatches);
        }

        if (matchingIds.size === 0) {
          break; // No matches possible
        }
      }

      // Intersect with category content
      const categoryMatches = this._intersectSets(
        matchingIds,
        categoryContentIds
      );

      // Convert to content objects and calculate relevance scores
      const results = Array.from(categoryMatches)
        .map(id => {
          const content = this.contentCache.get(id);
          if (!content) return null;

          return {
            ...content,
            _searchScore: this._calculateSearchScore(content, searchTerms),
          };
        })
        .filter(Boolean);

      // Sort by relevance score
      results.sort((a, b) => b._searchScore - a._searchScore);

      // Apply additional filters
      let filteredResults = results;
      if (options.difficulty || options.contentType) {
        filteredResults = results.filter(item => {
          if (options.difficulty && item.difficulty !== options.difficulty) {
            return false;
          }
          if (options.contentType) {
            const itemType = item.questions ? 'quiz' : 'module';
            if (itemType !== options.contentType) {
              return false;
            }
          }
          return true;
        });
      }

      // Apply pagination
      let finalResults = filteredResults;
      if (options.limit || options.offset) {
        const offset = options.offset || 0;
        const limit = options.limit || filteredResults.length;
        finalResults = filteredResults.slice(offset, offset + limit);
      }

      // Remove search score from final results
      finalResults.forEach(item => delete item._searchScore);

      // Record performance metrics
      const duration = performance.now() - startTime;
      this._recordSearchOperation(
        query,
        categoryId,
        options,
        duration,
        finalResults.length
      );

      return finalResults;
    } catch (error) {
      console.error('Error in optimized category search:', error);
      // Fallback to original search method
      return this._fallbackCategorySearch(query, categoryId, options);
    }
  }

  /**
   * Calculate search relevance score for content item
   * @private
   * @param {Object} content - Content item
   * @param {Array} searchTerms - Search terms
   * @returns {number} Relevance score
   */
  _calculateSearchScore(content, searchTerms) {
    let score = 0;
    const searchableText = this._extractSearchableText(content);

    searchTerms.forEach(term => {
      // Title matches get higher score
      if (content.title && content.title.toLowerCase().includes(term)) {
        score += 10;
      }

      // Description matches get medium score
      if (
        content.description &&
        content.description.toLowerCase().includes(term)
      ) {
        score += 5;
      }

      // Tag matches get medium score
      if (
        content.tags &&
        content.tags.some(tag => tag.toLowerCase().includes(term))
      ) {
        score += 5;
      }

      // Content matches get lower score
      if (searchableText.includes(term)) {
        score += 1;
      }

      // Exact matches get bonus
      if (
        searchableText.includes(term + ' ') ||
        searchableText.includes(' ' + term)
      ) {
        score += 2;
      }
    });

    // Boost score for important content
    if (content.important) {
      score *= 1.5;
    }

    // Boost score for high exam relevance
    if (content.examRelevance === 'high') {
      score *= 1.3;
    }

    return score;
  }

  /**
   * Intersect two sets efficiently
   * @private
   * @param {Set} setA - First set
   * @param {Set} setB - Second set
   * @returns {Set} Intersection of the two sets
   */
  _intersectSets(setA, setB) {
    const smaller = setA.size <= setB.size ? setA : setB;
    const larger = setA.size > setB.size ? setA : setB;

    const result = new Set();
    for (const item of smaller) {
      if (larger.has(item)) {
        result.add(item);
      }
    }

    return result;
  }

  /**
   * Sort results by specified criteria
   * @private
   * @param {Array} results - Results to sort
   * @param {string} sortBy - Sort field
   * @param {string} sortOrder - Sort order ('asc' or 'desc')
   */
  _sortResults(results, sortBy, sortOrder = 'asc') {
    const multiplier = sortOrder === 'desc' ? -1 : 1;

    results.sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];

      // Handle different data types
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return multiplier * valueA.localeCompare(valueB);
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return multiplier * (valueA - valueB);
      }

      // Convert to strings for comparison
      valueA = String(valueA || '');
      valueB = String(valueB || '');

      return multiplier * valueA.localeCompare(valueB);
    });
  }

  /**
   * Ensure indexes are ready and up-to-date
   * @private
   */
  async _ensureIndexesReady() {
    const now = Date.now();
    const indexAge = this.lastIndexBuild ? now - this.lastIndexBuild : Infinity;

    // Rebuild indexes if they're too old or empty
    if (indexAge > 300000 || this.categoryIndexes.size === 0) {
      // 5 minutes
      await this._initializeIndexes();
    }
  }

  /**
   * Record filter operation performance metrics
   * @private
   */
  _recordFilterOperation(categoryId, options, duration, resultCount) {
    if (!this.config.enableMetrics) return;

    this.performanceMetrics.filterOperations.push({
      timestamp: Date.now(),
      categoryId,
      options,
      duration,
      resultCount,
      meetsTarget: duration <= this.config.performanceTargetMs,
    });

    // Keep only recent metrics
    if (this.performanceMetrics.filterOperations.length > 1000) {
      this.performanceMetrics.filterOperations =
        this.performanceMetrics.filterOperations.slice(-500);
    }
  }

  /**
   * Record search operation performance metrics
   * @private
   */
  _recordSearchOperation(query, categoryId, options, duration, resultCount) {
    if (!this.config.enableMetrics) return;

    this.performanceMetrics.searchOperations.push({
      timestamp: Date.now(),
      query: query.substring(0, 50), // Limit query length in metrics
      categoryId,
      options,
      duration,
      resultCount,
      meetsTarget: duration <= this.config.performanceTargetMs,
    });

    // Keep only recent metrics
    if (this.performanceMetrics.searchOperations.length > 1000) {
      this.performanceMetrics.searchOperations =
        this.performanceMetrics.searchOperations.slice(-500);
    }
  }

  /**
   * Fallback category filter using original method
   * @private
   */
  async _fallbackCategoryFilter(categoryId, options) {
    try {
      // Use original IHKContentService method as fallback
      const allContent = await this.ihkContentService.getAllModules();
      const allQuizzes = await this.ihkContentService.getAllQuizzes();

      return [...allContent, ...allQuizzes].filter(item => {
        return item.threeTierCategory === categoryId;
      });
    } catch (error) {
      console.error('Fallback category filter failed:', error);
      return [];
    }
  }

  /**
   * Fallback category search using original method
   * @private
   */
  async _fallbackCategorySearch(query, categoryId, options) {
    try {
      const categoryContent = await this._fallbackCategoryFilter(
        categoryId,
        options
      );

      if (!query || !query.trim()) {
        return categoryContent;
      }

      const searchTerm = query.toLowerCase();
      return categoryContent.filter(item => {
        return (
          item.title?.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm) ||
          item.content?.toLowerCase().includes(searchTerm) ||
          item.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      });
    } catch (error) {
      console.error('Fallback category search failed:', error);
      return [];
    }
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics and statistics
   */
  getPerformanceMetrics() {
    const now = Date.now();
    const recentOperations = this.performanceMetrics.filterOperations
      .concat(this.performanceMetrics.searchOperations)
      .filter(op => now - op.timestamp < 300000); // Last 5 minutes

    const avgDuration =
      recentOperations.length > 0
        ? recentOperations.reduce((sum, op) => sum + op.duration, 0) /
          recentOperations.length
        : 0;

    const targetMeetRate =
      recentOperations.length > 0
        ? (recentOperations.filter(op => op.meetsTarget).length /
            recentOperations.length) *
          100
        : 100;

    // Get advanced caching statistics
    let cachingStats = {};
    if (this.advancedCachingService) {
      cachingStats = this.advancedCachingService.getStatistics();
    }

    return {
      ...this.performanceMetrics,
      advancedCaching: cachingStats,
      summary: {
        avgDurationMs: Math.round(avgDuration * 100) / 100,
        targetMeetRate: Math.round(targetMeetRate * 100) / 100,
        recentOperations: recentOperations.length,
        cacheHitRate:
          this.performanceMetrics.cacheHits +
            this.performanceMetrics.cacheMisses >
          0
            ? Math.round(
                (this.performanceMetrics.cacheHits /
                  (this.performanceMetrics.cacheHits +
                    this.performanceMetrics.cacheMisses)) *
                  100
              )
            : 0,
        indexSize: {
          categories: this.categoryIndexes.size,
          content: this.contentCache.size,
          searchTerms: this.searchIndexes.size,
        },
        advancedCacheEnabled: !!this.advancedCachingService,
      },
    };
  }

  /**
   * Clear all caches and rebuild indexes
   */
  async invalidateCache() {
    try {
      // Invalidate advanced caching service
      if (this.advancedCachingService) {
        this.advancedCachingService.invalidateAll();
      }

      // Clear local indexes and caches
      this.categoryIndexes.clear();
      this.contentCache.clear();
      this.searchIndexes.clear();
      this.metadataCache.clear();

      await this._initializeIndexes();

      console.warn('Performance caches invalidated and rebuilt');
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  /**
   * Invalidate specific cache entries
   * @param {string|Array} keys - Cache key(s) to invalidate
   */
  invalidateSpecific(keys) {
    if (this.advancedCachingService) {
      this.advancedCachingService.invalidate(keys);
    }

    // Also clear related local cache entries
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach(key => {
      this.contentCache.delete(key);
      this.metadataCache.delete(key);
    });
  }

  /**
   * Configure performance optimization settings
   * @param {Object} newConfig - New configuration options
   */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // Apply cache size limits
    if (this.contentCache.size > this.config.maxCacheSize) {
      this._pruneContentCache();
    }

    if (this.searchIndexes.size > this.config.maxSearchIndexSize) {
      this._pruneSearchIndexes();
    }
  }

  /**
   * Prune content cache to maintain size limits
   * @private
   */
  _pruneContentCache() {
    const entries = Array.from(this.contentCache.entries());
    const keepCount = Math.floor(this.config.maxCacheSize * 0.8);

    // Keep most recently accessed items (simple LRU approximation)
    const toKeep = entries.slice(-keepCount);

    this.contentCache.clear();
    toKeep.forEach(([key, value]) => {
      this.contentCache.set(key, value);
    });
  }
}

export default PerformanceOptimizationService;
