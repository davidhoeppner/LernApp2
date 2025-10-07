/**
 * PerformanceMonitoringService - Monitors and tracks performance metrics
 * for the three-tier category system operations
 */
class PerformanceMonitoringService {
  constructor() {
    this.metrics = {
      operations: new Map(), // operation type -> metrics array
      alerts: [],
      thresholds: {
        categoryFilter: 100, // ms
        categorySearch: 150, // ms
        indexBuild: 5000, // ms
        cacheHitRate: 80, // percentage
        memoryUsage: 100, // MB
      },
      monitoring: {
        enabled: true,
        alerting: true,
        detailedLogging: false,
        retentionPeriod: 3600000, // 1 hour in ms
      },
    };

    this.dashboardData = {
      realTimeMetrics: [],
      aggregatedStats: {},
      performanceTrends: {},
      systemHealth: 'good',
    };

    // Start monitoring intervals
    this._startMonitoring();
  }

  /**
   * Start performance monitoring intervals
   * @private
   */
  _startMonitoring() {
    if (!this.metrics.monitoring.enabled) return;

    // Real-time metrics collection (every 10 seconds)
    this.metricsInterval = setInterval(() => {
      this._collectRealTimeMetrics();
    }, 10000);

    // Aggregated statistics calculation (every minute)
    this.statsInterval = setInterval(() => {
      this._calculateAggregatedStats();
    }, 60000);

    // Performance trend analysis (every 5 minutes)
    this.trendsInterval = setInterval(() => {
      this._analyzeTrends();
    }, 300000);

    // Cleanup old metrics (every 10 minutes)
    this.cleanupInterval = setInterval(() => {
      this._cleanupOldMetrics();
    }, 600000);
  }

  /**
   * Record a performance metric for an operation
   * @param {string} operationType - Type of operation (e.g., 'categoryFilter', 'categorySearch')
   * @param {Object} metricData - Metric data including duration, parameters, etc.
   */
  recordMetric(operationType, metricData) {
    if (!this.metrics.monitoring.enabled) return;

    const timestamp = Date.now();
    const metric = {
      timestamp,
      duration: metricData.duration,
      parameters: metricData.parameters || {},
      resultCount: metricData.resultCount || 0,
      cacheHit: metricData.cacheHit || false,
      memoryUsage: this._getCurrentMemoryUsage(),
      ...metricData,
    };

    // Store metric
    if (!this.metrics.operations.has(operationType)) {
      this.metrics.operations.set(operationType, []);
    }

    this.metrics.operations.get(operationType).push(metric);

    // Check for performance issues
    this._checkPerformanceThresholds(operationType, metric);

    // Log detailed information if enabled
    if (this.metrics.monitoring.detailedLogging) {
      console.log(`Performance metric recorded: ${operationType}`, metric);
    }
  }

  /**
   * Check if metric exceeds performance thresholds and create alerts
   * @private
   * @param {string} operationType - Type of operation
   * @param {Object} metric - Metric data
   */
  _checkPerformanceThresholds(operationType, metric) {
    const threshold = this.metrics.thresholds[operationType];

    if (threshold && metric.duration > threshold) {
      this._createAlert('performance', {
        operationType,
        threshold,
        actualDuration: metric.duration,
        severity: metric.duration > threshold * 2 ? 'high' : 'medium',
        timestamp: metric.timestamp,
        details: metric,
      });
    }

    // Check memory usage
    if (metric.memoryUsage > this.metrics.thresholds.memoryUsage) {
      this._createAlert('memory', {
        threshold: this.metrics.thresholds.memoryUsage,
        actualUsage: metric.memoryUsage,
        severity:
          metric.memoryUsage > this.metrics.thresholds.memoryUsage * 1.5
            ? 'high'
            : 'medium',
        timestamp: metric.timestamp,
      });
    }
  }

  /**
   * Create a performance alert
   * @private
   * @param {string} type - Alert type
   * @param {Object} alertData - Alert data
   */
  _createAlert(type, alertData) {
    if (!this.metrics.monitoring.alerting) return;

    const alert = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      acknowledged: false,
      ...alertData,
    };

    this.metrics.alerts.push(alert);

    // Log alert
    console.warn(`Performance alert created: ${type}`, alert);

    // Limit alert history
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-50);
    }
  }

  /**
   * Collect real-time performance metrics
   * @private
   */
  _collectRealTimeMetrics() {
    const now = Date.now();
    const timeWindow = 60000; // Last minute

    const realtimeData = {
      timestamp: now,
      operations: {},
      systemHealth: this._calculateSystemHealth(),
    };

    // Collect metrics for each operation type
    for (const [operationType, metrics] of this.metrics.operations.entries()) {
      const recentMetrics = metrics.filter(
        m => now - m.timestamp <= timeWindow
      );

      if (recentMetrics.length > 0) {
        realtimeData.operations[operationType] = {
          count: recentMetrics.length,
          avgDuration:
            recentMetrics.reduce((sum, m) => sum + m.duration, 0) /
            recentMetrics.length,
          maxDuration: Math.max(...recentMetrics.map(m => m.duration)),
          minDuration: Math.min(...recentMetrics.map(m => m.duration)),
          cacheHitRate:
            (recentMetrics.filter(m => m.cacheHit).length /
              recentMetrics.length) *
            100,
          avgResultCount:
            recentMetrics.reduce((sum, m) => sum + (m.resultCount || 0), 0) /
            recentMetrics.length,
        };
      }
    }

    this.dashboardData.realTimeMetrics.push(realtimeData);

    // Keep only recent real-time data
    if (this.dashboardData.realTimeMetrics.length > 60) {
      // Last hour
      this.dashboardData.realTimeMetrics =
        this.dashboardData.realTimeMetrics.slice(-60);
    }
  }

  /**
   * Calculate aggregated statistics
   * @private
   */
  _calculateAggregatedStats() {
    const now = Date.now();
    const timeWindows = {
      last5min: 300000,
      last15min: 900000,
      last1hour: 3600000,
    };

    this.dashboardData.aggregatedStats = {};

    for (const [windowName, windowSize] of Object.entries(timeWindows)) {
      this.dashboardData.aggregatedStats[windowName] = {};

      for (const [
        operationType,
        metrics,
      ] of this.metrics.operations.entries()) {
        const windowMetrics = metrics.filter(
          m => now - m.timestamp <= windowSize
        );

        if (windowMetrics.length > 0) {
          this.dashboardData.aggregatedStats[windowName][operationType] = {
            totalOperations: windowMetrics.length,
            avgDuration:
              windowMetrics.reduce((sum, m) => sum + m.duration, 0) /
              windowMetrics.length,
            p95Duration: this._calculatePercentile(
              windowMetrics.map(m => m.duration),
              95
            ),
            p99Duration: this._calculatePercentile(
              windowMetrics.map(m => m.duration),
              99
            ),
            cacheHitRate:
              (windowMetrics.filter(m => m.cacheHit).length /
                windowMetrics.length) *
              100,
            errorRate:
              (windowMetrics.filter(m => m.error).length /
                windowMetrics.length) *
              100,
            throughput: windowMetrics.length / (windowSize / 1000), // operations per second
            avgMemoryUsage:
              windowMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) /
              windowMetrics.length,
          };
        }
      }
    }
  }

  /**
   * Analyze performance trends
   * @private
   */
  _analyzeTrends() {
    const now = Date.now();
    const trendWindow = 1800000; // 30 minutes

    this.dashboardData.performanceTrends = {};

    for (const [operationType, metrics] of this.metrics.operations.entries()) {
      const trendMetrics = metrics.filter(
        m => now - m.timestamp <= trendWindow
      );

      if (trendMetrics.length >= 10) {
        // Need sufficient data points
        const durations = trendMetrics.map(m => m.duration);
        const timestamps = trendMetrics.map(m => m.timestamp);

        // Calculate trend direction using linear regression
        const trend = this._calculateTrend(timestamps, durations);

        this.dashboardData.performanceTrends[operationType] = {
          direction:
            trend.slope > 0.1
              ? 'increasing'
              : trend.slope < -0.1
                ? 'decreasing'
                : 'stable',
          slope: trend.slope,
          correlation: trend.correlation,
          confidence: Math.abs(trend.correlation) > 0.5 ? 'high' : 'low',
          recommendation: this._generateTrendRecommendation(
            operationType,
            trend
          ),
        };
      }
    }

    // Update overall system health
    this.dashboardData.systemHealth = this._calculateSystemHealth();
  }

  /**
   * Calculate percentile value from array of numbers
   * @private
   * @param {Array} values - Array of numeric values
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   */
  _calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate trend using simple linear regression
   * @private
   * @param {Array} x - X values (timestamps)
   * @param {Array} y - Y values (durations)
   * @returns {Object} Trend analysis result
   */
  _calculateTrend(x, y) {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate correlation coefficient
    const correlation =
      (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return { slope, intercept, correlation };
  }

  /**
   * Generate trend-based recommendations
   * @private
   * @param {string} operationType - Operation type
   * @param {Object} trend - Trend analysis result
   * @returns {string} Recommendation text
   */
  _generateTrendRecommendation(operationType, trend) {
    if (trend.direction === 'increasing' && trend.confidence === 'high') {
      return `Performance degradation detected for ${operationType}. Consider cache optimization or index rebuilding.`;
    }

    if (trend.direction === 'decreasing' && trend.confidence === 'high') {
      return `Performance improvement observed for ${operationType}. Current optimizations are effective.`;
    }

    if (trend.direction === 'stable') {
      return `Performance is stable for ${operationType}. Continue monitoring.`;
    }

    return `Insufficient data or low confidence trend for ${operationType}. Continue monitoring.`;
  }

  /**
   * Calculate overall system health score
   * @private
   * @returns {string} Health status: 'good', 'warning', 'critical'
   */
  _calculateSystemHealth() {
    const recentAlerts = this.metrics.alerts.filter(
      alert => Date.now() - alert.timestamp <= 300000 && !alert.acknowledged
    );

    const criticalAlerts = recentAlerts.filter(
      alert => alert.severity === 'high'
    );
    const warningAlerts = recentAlerts.filter(
      alert => alert.severity === 'medium'
    );

    if (criticalAlerts.length > 0) {
      return 'critical';
    }

    if (warningAlerts.length > 2) {
      return 'warning';
    }

    // Check recent performance metrics
    const recentMetrics = this._getRecentMetrics(300000); // Last 5 minutes
    const avgPerformance = this._calculateAveragePerformance(recentMetrics);

    if (avgPerformance > 200) {
      // Average operation > 200ms
      return 'warning';
    }

    return 'good';
  }

  /**
   * Get recent metrics across all operation types
   * @private
   * @param {number} timeWindow - Time window in milliseconds
   * @returns {Array} Recent metrics
   */
  _getRecentMetrics(timeWindow) {
    const now = Date.now();
    const allMetrics = [];

    for (const metrics of this.metrics.operations.values()) {
      allMetrics.push(...metrics.filter(m => now - m.timestamp <= timeWindow));
    }

    return allMetrics;
  }

  /**
   * Calculate average performance across recent metrics
   * @private
   * @param {Array} metrics - Metrics array
   * @returns {number} Average duration in milliseconds
   */
  _calculateAveragePerformance(metrics) {
    if (metrics.length === 0) return 0;

    return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
  }

  /**
   * Get current memory usage (approximation)
   * @private
   * @returns {number} Memory usage in MB
   */
  _getCurrentMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }

    // Fallback estimation based on cache sizes
    let estimatedUsage = 0;

    // Estimate based on typical object sizes
    if (window.ihkContentService) {
      estimatedUsage += (window.ihkContentService.modules?.size || 0) * 0.01; // ~10KB per module
      estimatedUsage += (window.ihkContentService.quizzes?.size || 0) * 0.005; // ~5KB per quiz
    }

    return Math.round(estimatedUsage);
  }

  /**
   * Clean up old metrics to prevent memory leaks
   * @private
   */
  _cleanupOldMetrics() {
    const cutoffTime = Date.now() - this.metrics.monitoring.retentionPeriod;

    for (const [operationType, metrics] of this.metrics.operations.entries()) {
      const filteredMetrics = metrics.filter(m => m.timestamp > cutoffTime);
      this.metrics.operations.set(operationType, filteredMetrics);
    }

    // Clean up alerts
    this.metrics.alerts = this.metrics.alerts.filter(
      alert =>
        Date.now() - alert.timestamp <= this.metrics.monitoring.retentionPeriod
    );

    // Clean up real-time metrics
    this.dashboardData.realTimeMetrics =
      this.dashboardData.realTimeMetrics.filter(
        data =>
          Date.now() - data.timestamp <= this.metrics.monitoring.retentionPeriod
      );
  }

  /**
   * Get performance dashboard data
   * @returns {Object} Dashboard data including metrics, trends, and health status
   */
  getDashboardData() {
    return {
      ...this.dashboardData,
      alerts: this.metrics.alerts.filter(alert => !alert.acknowledged),
      thresholds: this.metrics.thresholds,
      monitoring: this.metrics.monitoring,
    };
  }

  /**
   * Get detailed performance report
   * @param {Object} options - Report options
   * @returns {Object} Detailed performance report
   */
  getPerformanceReport(options = {}) {
    const {
      timeWindow = 3600000, // 1 hour default
      operationType = null,
      includeRawData = false,
    } = options;

    const now = Date.now();
    const report = {
      generatedAt: now,
      timeWindow,
      summary: {},
      operationTypes: {},
      alerts: this.metrics.alerts.filter(
        alert => now - alert.timestamp <= timeWindow
      ),
      systemHealth: this.dashboardData.systemHealth,
      recommendations: [],
    };

    // Collect metrics for specified operation type or all types
    const operationTypes = operationType
      ? [operationType]
      : Array.from(this.metrics.operations.keys());

    let totalOperations = 0;
    let totalDuration = 0;

    for (const opType of operationTypes) {
      const metrics = this.metrics.operations.get(opType) || [];
      const windowMetrics = metrics.filter(
        m => now - m.timestamp <= timeWindow
      );

      if (windowMetrics.length > 0) {
        const durations = windowMetrics.map(m => m.duration);
        const cacheHits = windowMetrics.filter(m => m.cacheHit).length;

        report.operationTypes[opType] = {
          totalOperations: windowMetrics.length,
          avgDuration:
            durations.reduce((sum, d) => sum + d, 0) / durations.length,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations),
          p50Duration: this._calculatePercentile(durations, 50),
          p95Duration: this._calculatePercentile(durations, 95),
          p99Duration: this._calculatePercentile(durations, 99),
          cacheHitRate: (cacheHits / windowMetrics.length) * 100,
          throughput: windowMetrics.length / (timeWindow / 1000),
          trend: this.dashboardData.performanceTrends[opType] || null,
        };

        if (includeRawData) {
          report.operationTypes[opType].rawMetrics = windowMetrics;
        }

        totalOperations += windowMetrics.length;
        totalDuration += durations.reduce((sum, d) => sum + d, 0);
      }
    }

    // Generate summary
    report.summary = {
      totalOperations,
      avgDuration: totalOperations > 0 ? totalDuration / totalOperations : 0,
      alertCount: report.alerts.length,
      criticalAlerts: report.alerts.filter(a => a.severity === 'high').length,
      warningAlerts: report.alerts.filter(a => a.severity === 'medium').length,
    };

    // Generate recommendations
    report.recommendations = this._generateRecommendations(report);

    return report;
  }

  /**
   * Generate performance recommendations based on report data
   * @private
   * @param {Object} report - Performance report
   * @returns {Array} Array of recommendation objects
   */
  _generateRecommendations(report) {
    const recommendations = [];

    // Check for slow operations
    for (const [opType, data] of Object.entries(report.operationTypes)) {
      if (data.p95Duration > this.metrics.thresholds[opType] * 1.5) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          operation: opType,
          issue: `95th percentile duration (${data.p95Duration.toFixed(2)}ms) exceeds threshold`,
          suggestion:
            'Consider optimizing indexes or implementing additional caching',
        });
      }

      if (data.cacheHitRate < this.metrics.thresholds.cacheHitRate) {
        recommendations.push({
          type: 'caching',
          priority: 'medium',
          operation: opType,
          issue: `Cache hit rate (${data.cacheHitRate.toFixed(2)}%) below target`,
          suggestion:
            'Review caching strategy and consider preloading frequently accessed data',
        });
      }
    }

    // Check for memory issues
    if (report.alerts.some(alert => alert.type === 'memory')) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        issue: 'Memory usage alerts detected',
        suggestion:
          'Review cache sizes and implement more aggressive cleanup policies',
      });
    }

    // Check for trending issues
    for (const [opType, trend] of Object.entries(
      this.dashboardData.performanceTrends
    )) {
      if (trend.direction === 'increasing' && trend.confidence === 'high') {
        recommendations.push({
          type: 'trend',
          priority: 'medium',
          operation: opType,
          issue: 'Performance degradation trend detected',
          suggestion: trend.recommendation,
        });
      }
    }

    return recommendations;
  }

  /**
   * Acknowledge an alert
   * @param {string} alertId - Alert ID to acknowledge
   */
  acknowledgeAlert(alertId) {
    const alert = this.metrics.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
    }
  }

  /**
   * Update performance thresholds
   * @param {Object} newThresholds - New threshold values
   */
  updateThresholds(newThresholds) {
    this.metrics.thresholds = { ...this.metrics.thresholds, ...newThresholds };
  }

  /**
   * Configure monitoring settings
   * @param {Object} newSettings - New monitoring settings
   */
  configureMonitoring(newSettings) {
    const oldEnabled = this.metrics.monitoring.enabled;
    this.metrics.monitoring = { ...this.metrics.monitoring, ...newSettings };

    // Restart monitoring if enabled state changed
    if (oldEnabled !== this.metrics.monitoring.enabled) {
      this._stopMonitoring();
      if (this.metrics.monitoring.enabled) {
        this._startMonitoring();
      }
    }
  }

  /**
   * Stop performance monitoring
   * @private
   */
  _stopMonitoring() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    if (this.trendsInterval) {
      clearInterval(this.trendsInterval);
      this.trendsInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Cleanup and stop monitoring when service is destroyed
   */
  destroy() {
    this._stopMonitoring();
    this.metrics.operations.clear();
    this.metrics.alerts = [];
    this.dashboardData.realTimeMetrics = [];
  }
}

export default PerformanceMonitoringService;
