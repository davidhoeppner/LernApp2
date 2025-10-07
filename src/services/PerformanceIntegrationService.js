import PerformanceOptimizationService from './PerformanceOptimizationService.js';
import PerformanceMonitoringService from './PerformanceMonitoringService.js';
import AdvancedCachingService from './AdvancedCachingService.js';
import PerformanceDashboard from '../components/PerformanceDashboard.js';

/**
 * PerformanceIntegrationService - Integrates all performance-related services
 * Provides a unified interface for performance optimization, monitoring, and alerting
 */
class PerformanceIntegrationService {
  constructor(ihkContentService, categoryMappingService) {
    this.ihkContentService = ihkContentService;
    this.categoryMappingService = categoryMappingService;

    // Initialize performance services
    this.advancedCachingService = new AdvancedCachingService(
      ihkContentService,
      categoryMappingService
    );

    this.performanceOptimizationService = new PerformanceOptimizationService(
      ihkContentService,
      categoryMappingService,
      this.advancedCachingService
    );

    this.performanceMonitoringService = new PerformanceMonitoringService();

    this.performanceDashboard = new PerformanceDashboard(
      this.performanceMonitoringService,
      this.performanceOptimizationService
    );

    // Configuration
    this.config = {
      enableOptimization: true,
      enableMonitoring: true,
      enableDashboard: false,
      autoTuning: true,
      alertThresholds: {
        responseTime: 100, // ms
        cacheHitRate: 80, // percentage
        memoryUsage: 100, // MB
        errorRate: 5, // percentage
      },
    };

    // Performance state
    this.isInitialized = false;
    this.autoTuningInterval = null;

    this._initialize();
  }

  /**
   * Initialize the performance integration
   * @private
   */
  async _initialize() {
    try {
      // Configure monitoring thresholds
      this.performanceMonitoringService.updateThresholds({
        categoryFilter: this.config.alertThresholds.responseTime,
        categorySearch: this.config.alertThresholds.responseTime * 1.5,
        cacheHitRate: this.config.alertThresholds.cacheHitRate,
        memoryUsage: this.config.alertThresholds.memoryUsage,
      });

      // Start auto-tuning if enabled
      if (this.config.autoTuning) {
        this._startAutoTuning();
      }

      this.isInitialized = true;
  console.warn('Performance integration initialized successfully');
    } catch (error) {
      console.error('Error initializing performance integration:', error);
    }
  }

  /**
   * Get optimized content by category
   * @param {string} categoryId - Category ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Content items
   */
  async getContentByCategory(categoryId, options = {}) {
    const startTime = performance.now();

    try {
      let result;

      if (
        this.config.enableOptimization &&
        this.performanceOptimizationService
      ) {
        result =
          await this.performanceOptimizationService.getContentByThreeTierCategory(
            categoryId,
            options
          );
      } else {
        // Fallback to basic service
        result = await this.ihkContentService.getContentByThreeTierCategory(
          categoryId,
          options
        );
      }

      // Record metrics
      if (this.config.enableMonitoring) {
        this.performanceMonitoringService.recordMetric('categoryFilter', {
          duration: performance.now() - startTime,
          parameters: { categoryId, ...options },
          resultCount: result.length,
          optimized: this.config.enableOptimization,
        });
      }

      return result;
    } catch (error) {
      // Record error metrics
      if (this.config.enableMonitoring) {
        this.performanceMonitoringService.recordMetric('categoryFilter', {
          duration: performance.now() - startTime,
          parameters: { categoryId, ...options },
          resultCount: 0,
          error: true,
          errorMessage: error.message,
        });
      }

      throw error;
    }
  }

  /**
   * Search content with optimization
   * @param {string} query - Search query
   * @param {string} categoryId - Category ID
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchInCategory(query, categoryId, options = {}) {
    const startTime = performance.now();

    try {
      let result;

      if (
        this.config.enableOptimization &&
        this.performanceOptimizationService
      ) {
        result = await this.performanceOptimizationService.searchInCategory(
          query,
          categoryId,
          options
        );
      } else {
        // Fallback to basic service
        result = await this.ihkContentService.searchInCategory(
          query,
          categoryId,
          options
        );
      }

      // Record metrics
      if (this.config.enableMonitoring) {
        this.performanceMonitoringService.recordMetric('categorySearch', {
          duration: performance.now() - startTime,
          parameters: {
            query: query?.substring(0, 50),
            categoryId,
            ...options,
          },
          resultCount: result.length,
          optimized: this.config.enableOptimization,
        });
      }

      return result;
    } catch (error) {
      // Record error metrics
      if (this.config.enableMonitoring) {
        this.performanceMonitoringService.recordMetric('categorySearch', {
          duration: performance.now() - startTime,
          parameters: {
            query: query?.substring(0, 50),
            categoryId,
            ...options,
          },
          resultCount: 0,
          error: true,
          errorMessage: error.message,
        });
      }

      throw error;
    }
  }

  /**
   * Get comprehensive performance report
   * @param {Object} options - Report options
   * @returns {Object} Performance report
   */
  getPerformanceReport(options = {}) {
    const report = {
      timestamp: Date.now(),
      services: {
        optimization: !!this.performanceOptimizationService,
        monitoring: !!this.performanceMonitoringService,
        caching: !!this.advancedCachingService,
        dashboard: !!this.performanceDashboard,
      },
      configuration: this.config,
    };

    // Add monitoring data
    if (this.performanceMonitoringService) {
      report.monitoring =
        this.performanceMonitoringService.getPerformanceReport(options);
    }

    // Add optimization metrics
    if (this.performanceOptimizationService) {
      report.optimization =
        this.performanceOptimizationService.getPerformanceMetrics();
    }

    // Add caching statistics
    if (this.advancedCachingService) {
      report.caching = this.advancedCachingService.getStatistics();
    }

    // Generate overall health score
    report.healthScore = this._calculateHealthScore(report);

    return report;
  }

  /**
   * Calculate overall system health score
   * @private
   * @param {Object} report - Performance report
   * @returns {Object} Health score information
   */
  _calculateHealthScore(report) {
    let score = 100;
    const factors = [];

    // Check response time
    const avgResponseTime = report.optimization?.summary?.avgDurationMs;
    if (avgResponseTime > this.config.alertThresholds.responseTime * 2) {
      score -= 30;
      factors.push('High response time');
    } else if (avgResponseTime > this.config.alertThresholds.responseTime) {
      score -= 15;
      factors.push('Elevated response time');
    }

    // Check cache hit rate
    const cacheHitRate = report.optimization?.summary?.cacheHitRate;
    if (cacheHitRate < this.config.alertThresholds.cacheHitRate - 20) {
      score -= 25;
      factors.push('Low cache hit rate');
    } else if (cacheHitRate < this.config.alertThresholds.cacheHitRate) {
      score -= 10;
      factors.push('Below target cache hit rate');
    }

    // Check for active alerts
    const activeAlerts =
      report.monitoring?.alerts?.filter(a => !a.acknowledged) || [];
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'high');
    const warningAlerts = activeAlerts.filter(a => a.severity === 'medium');

    score -= criticalAlerts.length * 20;
    score -= warningAlerts.length * 10;

    if (criticalAlerts.length > 0) {
      factors.push(`${criticalAlerts.length} critical alerts`);
    }
    if (warningAlerts.length > 0) {
      factors.push(`${warningAlerts.length} warning alerts`);
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    // Determine health status
    let status = 'excellent';
    if (score < 50) status = 'poor';
    else if (score < 70) status = 'fair';
    else if (score < 85) status = 'good';

    return {
      score,
      status,
      factors,
      recommendation: this._getHealthRecommendation(score, factors),
    };
  }

  /**
   * Get health recommendation based on score and factors
   * @private
   * @param {number} score - Health score
   * @param {Array} factors - Factors affecting health
   * @returns {string} Recommendation text
   */
  _getHealthRecommendation(score, _factors) {
    if (score >= 85) {
      return 'System performance is excellent. Continue monitoring.';
    }

    if (score >= 70) {
      return 'System performance is good. Consider minor optimizations.';
    }

    if (score >= 50) {
      return 'System performance needs attention. Review and address the identified issues.';
    }

    return 'System performance is poor. Immediate action required to address critical issues.';
  }

  /**
   * Show performance dashboard
   * @param {HTMLElement} parentElement - Parent element for dashboard
   */
  showDashboard(parentElement) {
    if (this.config.enableDashboard && this.performanceDashboard) {
      this.performanceDashboard.show(parentElement);
    }
  }

  /**
   * Hide performance dashboard
   */
  hideDashboard() {
    if (this.performanceDashboard) {
      this.performanceDashboard.hide();
    }
  }

  /**
   * Toggle performance dashboard
   * @param {HTMLElement} parentElement - Parent element for dashboard
   */
  toggleDashboard(parentElement) {
    if (this.performanceDashboard) {
      this.performanceDashboard.toggle(parentElement);
    }
  }

  /**
   * Start auto-tuning process
   * @private
   */
  _startAutoTuning() {
    // Run auto-tuning every 10 minutes
    this.autoTuningInterval = setInterval(() => {
      this._performAutoTuning();
    }, 600000);
  }

  /**
   * Perform automatic performance tuning
   * @private
   */
  async _performAutoTuning() {
    try {
      const report = this.getPerformanceReport({ timeWindow: 600000 }); // Last 10 minutes

      // Auto-tune cache sizes based on hit rates
      if (this.advancedCachingService && report.caching) {
        const hitRate = parseFloat(report.caching.summary.hitRate);

        if (hitRate < 70) {
          // Increase cache sizes
          this.advancedCachingService.configure({
            maxSizes: {
              hot: Math.min(
                200,
                Math.floor(
                  this.advancedCachingService.config.maxSizes.hot * 1.2
                )
              ),
              warm: Math.min(
                800,
                Math.floor(
                  this.advancedCachingService.config.maxSizes.warm * 1.2
                )
              ),
              cold: Math.min(
                3000,
                Math.floor(
                  this.advancedCachingService.config.maxSizes.cold * 1.2
                )
              ),
            },
          });

          console.warn('Auto-tuning: Increased cache sizes due to low hit rate');
        }
      }

      // Auto-tune performance thresholds based on recent performance
      if (report.optimization?.summary) {
        const avgResponseTime = report.optimization.summary.avgDurationMs;

        if (avgResponseTime > this.config.alertThresholds.responseTime * 1.5) {
          // Relax thresholds temporarily to reduce alert noise
          this.performanceMonitoringService.updateThresholds({
            categoryFilter: Math.min(200, avgResponseTime * 1.2),
            categorySearch: Math.min(300, avgResponseTime * 1.5),
          });

          console.warn(
            'Auto-tuning: Adjusted alert thresholds due to elevated response times'
          );
        }
      }

      // Trigger cache cleanup if memory usage is high
      if (
        report.monitoring?.summary?.avgMemoryUsage >
        this.config.alertThresholds.memoryUsage
      ) {
        await this.invalidateCache();
        console.warn(
          'Auto-tuning: Performed cache cleanup due to high memory usage'
        );
      }
    } catch (error) {
      console.error('Error during auto-tuning:', error);
    }
  }

  /**
   * Invalidate all caches
   */
  async invalidateCache() {
    try {
      if (this.performanceOptimizationService) {
        await this.performanceOptimizationService.invalidateCache();
      }

      if (this.advancedCachingService) {
        this.advancedCachingService.invalidateAll();
      }

  console.warn('All performance caches invalidated');
    } catch (error) {
      console.error('Error invalidating caches:', error);
    }
  }

  /**
   * Configure performance integration
   * @param {Object} newConfig - New configuration
   */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // Apply configuration to services
    if (this.performanceOptimizationService && newConfig.optimization) {
      this.performanceOptimizationService.configure(newConfig.optimization);
    }

    if (this.performanceMonitoringService && newConfig.monitoring) {
      this.performanceMonitoringService.configureMonitoring(
        newConfig.monitoring
      );
    }

    if (this.advancedCachingService && newConfig.caching) {
      this.advancedCachingService.configure(newConfig.caching);
    }

    if (this.performanceDashboard && newConfig.dashboard) {
      this.performanceDashboard.configure(newConfig.dashboard);
    }

    // Update alert thresholds
    if (newConfig.alertThresholds) {
      this.performanceMonitoringService.updateThresholds({
        categoryFilter: newConfig.alertThresholds.responseTime,
        categorySearch: newConfig.alertThresholds.responseTime * 1.5,
        cacheHitRate: newConfig.alertThresholds.cacheHitRate,
        memoryUsage: newConfig.alertThresholds.memoryUsage,
      });
    }

    // Restart auto-tuning if setting changed
    if (newConfig.autoTuning !== undefined) {
      if (this.autoTuningInterval) {
        clearInterval(this.autoTuningInterval);
        this.autoTuningInterval = null;
      }

      if (newConfig.autoTuning) {
        this._startAutoTuning();
      }
    }
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfiguration() {
    return { ...this.config };
  }

  /**
   * Check if performance integration is ready
   * @returns {boolean} True if ready
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Cleanup and destroy all services
   */
  destroy() {
    if (this.autoTuningInterval) {
      clearInterval(this.autoTuningInterval);
    }

    if (this.performanceDashboard) {
      this.performanceDashboard.destroy();
    }

    if (this.performanceMonitoringService) {
      this.performanceMonitoringService.destroy();
    }

    if (this.advancedCachingService) {
      this.advancedCachingService.destroy();
    }

  console.warn('Performance integration destroyed');
  }
}

export default PerformanceIntegrationService;
