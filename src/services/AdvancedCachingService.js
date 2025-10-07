/**
 * AdvancedCachingService - Implements intelligent caching strategies
 * for categorized content with lazy loading and smart invalidation
 */
class AdvancedCachingService {
  constructor(ihkContentService, categoryMappingService) {
    this.ihkContentService = ihkContentService;
    this.categoryMappingService = categoryMappingService;
    
    // Multi-level cache structure
    this.caches = {
      // L1: Hot cache for frequently accessed data
      hot: new Map(),
      // L2: Warm cache for recently accessed data
      warm: new Map(),
      // L3: Cold cache for less frequently accessed data
      cold: new Map(),
      // Metadata cache for category information
      metadata: new Map(),
      // Search result cache
      searchResults: new Map()
    };
    
    // Cache statistics and management
    this.stats = {
      hits: { hot: 0, warm: 0, cold: 0, metadata: 0, searchResults: 0 },
      misses: { hot: 0, warm: 0, cold: 0, metadata: 0, searchResults: 0 },
      evictions: { hot: 0, warm: 0, cold: 0, metadata: 0, searchResults: 0 },
      promotions: { warmToHot: 0, coldToWarm: 0 },
      totalRequests: 0
    };
    
    // Cache configuration
    this.config = {
      maxSizes: {
        hot: 100,      // Most frequently accessed items
        warm: 500,     // Recently accessed items
        cold: 2000,    // Less frequently accessed items
        metadata: 50,  // Category metadata
        searchResults: 200 // Search result cache
      },
      ttl: {
        hot: 3600000,      // 1 hour
        warm: 1800000,     // 30 minutes
        cold: 900000,      // 15 minutes
        metadata: 7200000, // 2 hours
        searchResults: 300000 // 5 minutes
      },
      accessThresholds: {
        hotPromotion: 5,   // Promote to hot after 5 accesses
        warmPromotion: 3,  // Promote to warm after 3 accesses
        evictionAge: 3600000 // Evict items older than 1 hour
      },
      lazyLoading: {
        enabled: true,
        batchSize: 10,
        preloadThreshold: 0.8 // Preload when cache is 80% full
      }
    };
    
    // Access tracking for intelligent promotion/demotion
    this.accessTracker = new Map();
    
    // Invalidation tracking
    this.invalidationQueue = new Set();
    this.invalidationTimer = null;
    
    // Preloading queue
    this.preloadQueue = new Set();
    this.preloadInProgress = false;
    
    this._startMaintenanceTasks();
  }

  /**
   * Start background maintenance tasks
   * @private
   */
  _startMaintenanceTasks() {
    // Cache cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this._performCacheCleanup();
    }, 300000);
    
    // Cache optimization every 10 minutes
    this.optimizationInterval = setInterval(() => {
      this._optimizeCacheDistribution();
    }, 600000);
    
    // Preloading task every 30 seconds
    this.preloadInterval = setInterval(() => {
      this._processPreloadQueue();
    }, 30000);
  }

  /**
   * Get content by category with intelligent caching
   * @param {string} categoryId - Category ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Cached or loaded content
   */
  async getContentByCategory(categoryId, options = {}) {
    this.stats.totalRequests++;
    
    const cacheKey = this._generateCacheKey('category', categoryId, options);
    
    // Try to get from cache (L1 -> L2 -> L3)
    let cachedResult = this._getFromCache(cacheKey);
    
    if (cachedResult) {
      this._recordAccess(cacheKey);
      return cachedResult.data;
    }
    
    // Cache miss - load data
    const startTime = performance.now();
    
    try {
      let data;
      
      // Use optimized service if available
      if (this.ihkContentService.getContentByThreeTierCategoryOptimized) {
        data = await this.ihkContentService.getContentByThreeTierCategoryOptimized(categoryId, options);
      } else {
        data = await this.ihkContentService.getContentByThreeTierCategory(categoryId, options);
      }
      
      // Store in cache
      this._storeInCache(cacheKey, data, 'cold');
      
      // Schedule preloading of related content
      this._schedulePreloading(categoryId, options);
      
      return data;
      
    } catch (error) {
      console.error('Error loading content for caching:', error);
      throw error;
    }
  }

  /**
   * Search content with result caching
   * @param {string} query - Search query
   * @param {string} categoryId - Category ID
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Cached or loaded search results
   */
  async searchContent(query, categoryId, options = {}) {
    this.stats.totalRequests++;
    
    const cacheKey = this._generateCacheKey('search', { query, categoryId }, options);
    
    // Try to get from search results cache
    let cachedResult = this._getFromSearchCache(cacheKey);
    
    if (cachedResult) {
      this._recordAccess(cacheKey);
      return cachedResult.data;
    }
    
    // Cache miss - perform search
    try {
      let data;
      
      // Use optimized service if available
      if (this.ihkContentService.searchInCategoryOptimized) {
        data = await this.ihkContentService.searchInCategoryOptimized(query, categoryId, options);
      } else {
        data = await this.ihkContentService.searchInCategory(query, categoryId, options);
      }
      
      // Store in search results cache
      this._storeInSearchCache(cacheKey, data);
      
      return data;
      
    } catch (error) {
      console.error('Error performing search for caching:', error);
      throw error;
    }
  }

  /**
   * Get category metadata with caching
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Cached or loaded metadata
   */
  async getCategoryMetadata(categoryId) {
    this.stats.totalRequests++;
    
    const cacheKey = `metadata:${categoryId}`;
    
    // Try to get from metadata cache
    let cachedResult = this._getFromMetadataCache(cacheKey);
    
    if (cachedResult) {
      this.stats.hits.metadata++;
      return cachedResult.data;
    }
    
    // Cache miss - load metadata
    this.stats.misses.metadata++;
    
    try {
      let metadata;
      
      if (this.categoryMappingService) {
        metadata = this.categoryMappingService.getThreeTierCategory(categoryId);
      }
      
      if (!metadata) {
        // Fallback to default metadata
        metadata = {
          id: categoryId,
          name: categoryId,
          description: 'Category metadata not available',
          color: '#6b7280',
          icon: '📁'
        };
      }
      
      // Store in metadata cache
      this._storeInMetadataCache(cacheKey, metadata);
      
      return metadata;
      
    } catch (error) {
      console.error('Error loading category metadata:', error);
      throw error;
    }
  }

  /**
   * Generate cache key for content queries
   * @private
   * @param {string} type - Query type
   * @param {*} identifier - Primary identifier
   * @param {Object} options - Query options
   * @returns {string} Cache key
   */
  _generateCacheKey(type, identifier, options = {}) {
    const optionsStr = JSON.stringify(options, Object.keys(options).sort());
    const identifierStr = typeof identifier === 'object' 
      ? JSON.stringify(identifier, Object.keys(identifier).sort())
      : String(identifier);
    
    return `${type}:${identifierStr}:${optionsStr}`;
  }

  /**
   * Get item from multi-level cache
   * @private
   * @param {string} key - Cache key
   * @returns {Object|null} Cached item or null
   */
  _getFromCache(key) {
    // Check hot cache first
    if (this.caches.hot.has(key)) {
      const item = this.caches.hot.get(key);
      if (this._isItemValid(item)) {
        this.stats.hits.hot++;
        return item;
      } else {
        this.caches.hot.delete(key);
      }
    }
    
    // Check warm cache
    if (this.caches.warm.has(key)) {
      const item = this.caches.warm.get(key);
      if (this._isItemValid(item)) {
        this.stats.hits.warm++;
        // Consider promoting to hot cache
        this._considerPromotion(key, item, 'warm');
        return item;
      } else {
        this.caches.warm.delete(key);
      }
    }
    
    // Check cold cache
    if (this.caches.cold.has(key)) {
      const item = this.caches.cold.get(key);
      if (this._isItemValid(item)) {
        this.stats.hits.cold++;
        // Consider promoting to warm cache
        this._considerPromotion(key, item, 'cold');
        return item;
      } else {
        this.caches.cold.delete(key);
      }
    }
    
    // Cache miss
    this.stats.misses.hot++;
    return null;
  }

  /**
   * Get item from search results cache
   * @private
   * @param {string} key - Cache key
   * @returns {Object|null} Cached item or null
   */
  _getFromSearchCache(key) {
    if (this.caches.searchResults.has(key)) {
      const item = this.caches.searchResults.get(key);
      if (this._isItemValid(item, 'searchResults')) {
        this.stats.hits.searchResults++;
        return item;
      } else {
        this.caches.searchResults.delete(key);
      }
    }
    
    this.stats.misses.searchResults++;
    return null;
  }

  /**
   * Get item from metadata cache
   * @private
   * @param {string} key - Cache key
   * @returns {Object|null} Cached item or null
   */
  _getFromMetadataCache(key) {
    if (this.caches.metadata.has(key)) {
      const item = this.caches.metadata.get(key);
      if (this._isItemValid(item, 'metadata')) {
        this.stats.hits.metadata++;
        return item;
      } else {
        this.caches.metadata.delete(key);
      }
    }
    
    this.stats.misses.metadata++;
    return null;
  }

  /**
   * Store item in appropriate cache level
   * @private
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {string} level - Cache level ('hot', 'warm', 'cold')
   */
  _storeInCache(key, data, level = 'cold') {
    const item = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now()
    };
    
    const cache = this.caches[level];
    const maxSize = this.config.maxSizes[level];
    
    // Evict items if cache is full
    if (cache.size >= maxSize) {
      this._evictLeastRecentlyUsed(cache, level);
    }
    
    cache.set(key, item);
    this._trackAccess(key);
  }

  /**
   * Store item in search results cache
   * @private
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  _storeInSearchCache(key, data) {
    const item = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now()
    };
    
    const cache = this.caches.searchResults;
    const maxSize = this.config.maxSizes.searchResults;
    
    // Evict items if cache is full
    if (cache.size >= maxSize) {
      this._evictLeastRecentlyUsed(cache, 'searchResults');
    }
    
    cache.set(key, item);
  }

  /**
   * Store item in metadata cache
   * @private
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  _storeInMetadataCache(key, data) {
    const item = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now()
    };
    
    const cache = this.caches.metadata;
    const maxSize = this.config.maxSizes.metadata;
    
    // Evict items if cache is full
    if (cache.size >= maxSize) {
      this._evictLeastRecentlyUsed(cache, 'metadata');
    }
    
    cache.set(key, item);
  }

  /**
   * Check if cached item is still valid
   * @private
   * @param {Object} item - Cached item
   * @param {string} cacheType - Type of cache
   * @returns {boolean} True if item is valid
   */
  _isItemValid(item, cacheType = 'cold') {
    const now = Date.now();
    const ttl = this.config.ttl[cacheType] || this.config.ttl.cold;
    
    return (now - item.timestamp) < ttl;
  }

  /**
   * Record access for cache promotion consideration
   * @private
   * @param {string} key - Cache key
   */
  _recordAccess(key) {
    this._trackAccess(key);
  }

  /**
   * Track access patterns for intelligent cache management
   * @private
   * @param {string} key - Cache key
   */
  _trackAccess(key) {
    if (!this.accessTracker.has(key)) {
      this.accessTracker.set(key, {
        count: 0,
        firstAccess: Date.now(),
        lastAccess: Date.now(),
        frequency: 0
      });
    }
    
    const tracker = this.accessTracker.get(key);
    tracker.count++;
    tracker.lastAccess = Date.now();
    
    // Calculate access frequency (accesses per hour)
    const timeSpan = tracker.lastAccess - tracker.firstAccess;
    tracker.frequency = timeSpan > 0 ? (tracker.count / (timeSpan / 3600000)) : 0;
  }

  /**
   * Consider promoting item to higher cache level
   * @private
   * @param {string} key - Cache key
   * @param {Object} item - Cache item
   * @param {string} currentLevel - Current cache level
   */
  _considerPromotion(key, item, currentLevel) {
    const tracker = this.accessTracker.get(key);
    if (!tracker) return;
    
    // Update item access info
    item.accessCount = tracker.count;
    item.lastAccess = tracker.lastAccess;
    
    // Promotion logic
    if (currentLevel === 'cold' && tracker.count >= this.config.accessThresholds.warmPromotion) {
      this._promoteItem(key, item, 'cold', 'warm');
    } else if (currentLevel === 'warm' && tracker.count >= this.config.accessThresholds.hotPromotion) {
      this._promoteItem(key, item, 'warm', 'hot');
    }
  }

  /**
   * Promote item from one cache level to another
   * @private
   * @param {string} key - Cache key
   * @param {Object} item - Cache item
   * @param {string} fromLevel - Source cache level
   * @param {string} toLevel - Target cache level
   */
  _promoteItem(key, item, fromLevel, toLevel) {
    // Remove from current level
    this.caches[fromLevel].delete(key);
    
    // Add to target level
    const targetCache = this.caches[toLevel];
    const maxSize = this.config.maxSizes[toLevel];
    
    // Make space if needed
    if (targetCache.size >= maxSize) {
      this._evictLeastRecentlyUsed(targetCache, toLevel);
    }
    
    targetCache.set(key, item);
    
    // Update statistics
    const promotionKey = `${fromLevel}To${toLevel.charAt(0).toUpperCase() + toLevel.slice(1)}`;
    if (this.stats.promotions[promotionKey] !== undefined) {
      this.stats.promotions[promotionKey]++;
    }
  }

  /**
   * Evict least recently used items from cache
   * @private
   * @param {Map} cache - Cache to evict from
   * @param {string} level - Cache level name
   */
  _evictLeastRecentlyUsed(cache, level) {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of cache.entries()) {
      if (item.lastAccess < oldestTime) {
        oldestTime = item.lastAccess;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      cache.delete(oldestKey);
      this.accessTracker.delete(oldestKey);
      this.stats.evictions[level]++;
    }
  }

  /**
   * Schedule preloading of related content
   * @private
   * @param {string} categoryId - Category ID
   * @param {Object} options - Query options
   */
  _schedulePreloading(categoryId, options) {
    if (!this.config.lazyLoading.enabled) return;
    
    // Add related categories to preload queue
    const relatedCategories = this._getRelatedCategories(categoryId);
    
    relatedCategories.forEach(relatedCategoryId => {
      const preloadKey = this._generateCacheKey('category', relatedCategoryId, options);
      this.preloadQueue.add(preloadKey);
    });
  }

  /**
   * Get related categories for preloading
   * @private
   * @param {string} categoryId - Category ID
   * @returns {Array} Related category IDs
   */
  _getRelatedCategories(categoryId) {
    // Simple related category logic - can be enhanced
    const allCategories = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'];
    return allCategories.filter(cat => cat !== categoryId);
  }

  /**
   * Process preload queue
   * @private
   */
  async _processPreloadQueue() {
    if (this.preloadInProgress || this.preloadQueue.size === 0) return;
    
    this.preloadInProgress = true;
    
    try {
      const batchSize = Math.min(this.config.lazyLoading.batchSize, this.preloadQueue.size);
      const batch = Array.from(this.preloadQueue).slice(0, batchSize);
      
      for (const cacheKey of batch) {
        // Parse cache key to extract parameters
        const [type, identifier, optionsStr] = cacheKey.split(':');
        
        if (type === 'category' && !this._getFromCache(cacheKey)) {
          try {
            const options = JSON.parse(optionsStr || '{}');
            await this.getContentByCategory(identifier, options);
          } catch (error) {
            console.warn('Preload failed for:', cacheKey, error);
          }
        }
        
        this.preloadQueue.delete(cacheKey);
      }
      
    } catch (error) {
      console.error('Error processing preload queue:', error);
    } finally {
      this.preloadInProgress = false;
    }
  }

  /**
   * Perform cache cleanup
   * @private
   */
  _performCacheCleanup() {
    const now = Date.now();
    const evictionAge = this.config.accessThresholds.evictionAge;
    
    // Clean up all cache levels
    Object.entries(this.caches).forEach(([level, cache]) => {
      const keysToDelete = [];
      
      for (const [key, item] of cache.entries()) {
        if (now - item.lastAccess > evictionAge) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => {
        cache.delete(key);
        this.accessTracker.delete(key);
        this.stats.evictions[level]++;
      });
    });
    
    // Clean up access tracker
    const trackerKeysToDelete = [];
    for (const [key, tracker] of this.accessTracker.entries()) {
      if (now - tracker.lastAccess > evictionAge) {
        trackerKeysToDelete.push(key);
      }
    }
    
    trackerKeysToDelete.forEach(key => {
      this.accessTracker.delete(key);
    });
  }

  /**
   * Optimize cache distribution based on access patterns
   * @private
   */
  _optimizeCacheDistribution() {
    // Analyze access patterns and adjust cache sizes if needed
    const totalAccesses = Object.values(this.stats.hits).reduce((sum, hits) => sum + hits, 0);
    
    if (totalAccesses === 0) return;
    
    // Calculate hit rates for each cache level
    const hitRates = {
      hot: this.stats.hits.hot / totalAccesses,
      warm: this.stats.hits.warm / totalAccesses,
      cold: this.stats.hits.cold / totalAccesses
    };
    
    // Adjust cache sizes based on hit rates (simple heuristic)
    if (hitRates.hot > 0.6) {
      // Hot cache is very effective, consider increasing its size
      this.config.maxSizes.hot = Math.min(this.config.maxSizes.hot * 1.1, 200);
    }
    
    if (hitRates.cold > 0.4) {
      // Cold cache is getting too many hits, consider promoting more items
      this.config.accessThresholds.warmPromotion = Math.max(this.config.accessThresholds.warmPromotion - 1, 1);
    }
  }

  /**
   * Invalidate cache entries
   * @param {string|Array} keys - Cache key(s) to invalidate
   */
  invalidate(keys) {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    
    keysArray.forEach(key => {
      // Remove from all cache levels
      Object.values(this.caches).forEach(cache => {
        cache.delete(key);
      });
      
      // Remove from access tracker
      this.accessTracker.delete(key);
    });
  }

  /**
   * Invalidate all caches
   */
  invalidateAll() {
    Object.values(this.caches).forEach(cache => {
      cache.clear();
    });
    
    this.accessTracker.clear();
    this.preloadQueue.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStatistics() {
    const totalHits = Object.values(this.stats.hits).reduce((sum, hits) => sum + hits, 0);
    const totalMisses = Object.values(this.stats.misses).reduce((sum, misses) => sum + misses, 0);
    const totalRequests = totalHits + totalMisses;
    
    return {
      ...this.stats,
      summary: {
        totalRequests,
        totalHits,
        totalMisses,
        hitRate: totalRequests > 0 ? (totalHits / totalRequests * 100).toFixed(2) + '%' : '0%',
        cacheSizes: {
          hot: this.caches.hot.size,
          warm: this.caches.warm.size,
          cold: this.caches.cold.size,
          metadata: this.caches.metadata.size,
          searchResults: this.caches.searchResults.size
        },
        memoryEstimate: this._estimateMemoryUsage()
      }
    };
  }

  /**
   * Estimate memory usage of caches
   * @private
   * @returns {string} Memory usage estimate
   */
  _estimateMemoryUsage() {
    let totalItems = 0;
    Object.values(this.caches).forEach(cache => {
      totalItems += cache.size;
    });
    
    // Rough estimate: 5KB per cached item on average
    const estimatedMB = (totalItems * 5) / 1024;
    return `~${estimatedMB.toFixed(1)} MB`;
  }

  /**
   * Configure caching behavior
   * @param {Object} newConfig - New configuration
   */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Cleanup and stop background tasks
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }
    
    if (this.preloadInterval) {
      clearInterval(this.preloadInterval);
    }
    
    this.invalidateAll();
  }
}

export default AdvancedCachingService;