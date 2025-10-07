/**
 * PerformanceDashboard - Component for displaying performance metrics and monitoring data
 * Shows real-time performance data, alerts, and system health for the three-tier category system
 */
class PerformanceDashboard {
  constructor(performanceMonitoringService, performanceOptimizationService) {
    this.performanceMonitoringService = performanceMonitoringService;
    this.performanceOptimizationService = performanceOptimizationService;
    this.container = null;
    this.updateInterval = null;
    this.isVisible = false;

    // Dashboard configuration
    this.config = {
      updateIntervalMs: 5000, // Update every 5 seconds
      maxDataPoints: 60, // Keep last 60 data points (5 minutes at 5s intervals)
      alertAutoHide: 30000, // Auto-hide alerts after 30 seconds
      chartHeight: 200,
      chartWidth: 400,
    };

    this.chartData = {
      performance: [],
      cacheHitRate: [],
      throughput: [],
      memoryUsage: [],
    };
  }

  /**
   * Create and show the performance dashboard
   * @param {HTMLElement} parentElement - Parent element to attach dashboard to
   */
  show(parentElement) {
    if (this.isVisible) {
      this.hide();
    }

    this.container = this._createDashboardContainer();
    parentElement.appendChild(this.container);

    this._renderDashboard();
    this._startAutoUpdate();

    this.isVisible = true;
  }

  /**
   * Hide the performance dashboard
   */
  hide() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this._stopAutoUpdate();
    this.isVisible = false;
  }

  /**
   * Toggle dashboard visibility
   * @param {HTMLElement} parentElement - Parent element to attach dashboard to
   */
  toggle(parentElement) {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show(parentElement);
    }
  }

  /**
   * Create the main dashboard container
   * @private
   * @returns {HTMLElement} Dashboard container element
   */
  _createDashboardContainer() {
    const container = document.createElement('div');
    container.className = 'performance-dashboard';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 500px;
      max-height: 80vh;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      overflow-y: auto;
    `;

    return container;
  }

  /**
   * Render the complete dashboard
   * @private
   */
  _renderDashboard() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="dashboard-header" style="
        padding: 16px;
        border-bottom: 1px solid #eee;
        background: #f8f9fa;
        border-radius: 8px 8px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h3 style="margin: 0; color: #333;">Performance Dashboard</h3>
        <button class="close-btn" style="
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #666;
          padding: 4px;
        ">×</button>
      </div>
      
      <div class="dashboard-content" style="padding: 16px;">
        <div id="system-health" class="dashboard-section"></div>
        <div id="performance-metrics" class="dashboard-section"></div>
        <div id="cache-statistics" class="dashboard-section"></div>
        <div id="performance-charts" class="dashboard-section"></div>
        <div id="alerts-section" class="dashboard-section"></div>
        <div id="recommendations" class="dashboard-section"></div>
      </div>
    `;

    // Add event listeners
    const closeBtn = this.container.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => this.hide());

    // Initial render of all sections
    this._updateDashboard();
  }

  /**
   * Update all dashboard sections with current data
   * @private
   */
  async _updateDashboard() {
    try {
      // Get data from services
      const dashboardData = this.performanceMonitoringService
        ? this.performanceMonitoringService.getDashboardData()
        : null;

      const optimizationMetrics = this.performanceOptimizationService
        ? this.performanceOptimizationService.getPerformanceMetrics()
        : null;

      // Update each section
      this._updateSystemHealth(dashboardData);
      this._updatePerformanceMetrics(dashboardData, optimizationMetrics);
      this._updateCacheStatistics(optimizationMetrics);
      this._updatePerformanceCharts(dashboardData);
      this._updateAlerts(dashboardData);
      this._updateRecommendations(dashboardData);
    } catch (error) {
      console.error('Error updating performance dashboard:', error);
      this._showError('Failed to update dashboard data');
    }
  }

  /**
   * Update system health section
   * @private
   * @param {Object} dashboardData - Dashboard data from monitoring service
   */
  _updateSystemHealth(dashboardData) {
    const section = this.container.querySelector('#system-health');
    if (!section) return;

    const health = dashboardData?.systemHealth || 'unknown';
    const healthColor = {
      good: '#10b981',
      warning: '#f59e0b',
      critical: '#ef4444',
      unknown: '#6b7280',
    }[health];

    const healthIcon = {
      good: '✅',
      warning: '⚠️',
      critical: '🚨',
      unknown: '❓',
    }[health];

    section.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        padding: 12px;
        background: ${healthColor}15;
        border: 1px solid ${healthColor}30;
        border-radius: 6px;
        margin-bottom: 16px;
      ">
        <span style="font-size: 20px; margin-right: 12px;">${healthIcon}</span>
        <div>
          <div style="font-weight: 600; color: ${healthColor};">
            System Health: ${health.toUpperCase()}
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 2px;">
            Last updated: ${new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update performance metrics section
   * @private
   * @param {Object} dashboardData - Dashboard data
   * @param {Object} optimizationMetrics - Optimization metrics
   */
  _updatePerformanceMetrics(dashboardData, optimizationMetrics) {
    const section = this.container.querySelector('#performance-metrics');
    if (!section) return;

    const realtimeData = dashboardData?.realTimeMetrics?.slice(-1)[0];
    const summary = optimizationMetrics?.summary;

    section.innerHTML = `
      <h4 style="margin: 0 0 12px 0; color: #333;">Performance Metrics</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        ${this._createMetricCard(
          'Avg Response Time',
          summary?.avgDurationMs ? `${summary.avgDurationMs}ms` : 'N/A',
          summary?.avgDurationMs > 100 ? '#f59e0b' : '#10b981'
        )}
        
        ${this._createMetricCard(
          'Cache Hit Rate',
          summary?.cacheHitRate ? `${summary.cacheHitRate}%` : 'N/A',
          summary?.cacheHitRate < 80 ? '#f59e0b' : '#10b981'
        )}
        
        ${this._createMetricCard(
          'Target Meet Rate',
          summary?.targetMeetRate ? `${summary.targetMeetRate}%` : 'N/A',
          summary?.targetMeetRate < 90 ? '#f59e0b' : '#10b981'
        )}
        
        ${this._createMetricCard(
          'Recent Operations',
          summary?.recentOperations || '0',
          '#6b7280'
        )}
      </div>
    `;
  }

  /**
   * Create a metric card HTML
   * @private
   * @param {string} label - Metric label
   * @param {string} value - Metric value
   * @param {string} color - Color for the value
   * @returns {string} HTML string
   */
  _createMetricCard(label, value, color) {
    return `
      <div style="
        padding: 12px;
        background: #f8f9fa;
        border-radius: 6px;
        text-align: center;
      ">
        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${label}</div>
        <div style="font-size: 18px; font-weight: 600; color: ${color};">${value}</div>
      </div>
    `;
  }

  /**
   * Update cache statistics section
   * @private
   * @param {Object} optimizationMetrics - Optimization metrics
   */
  _updateCacheStatistics(optimizationMetrics) {
    const section = this.container.querySelector('#cache-statistics');
    if (!section) return;

    const cachingStats = optimizationMetrics?.advancedCaching?.summary;
    const indexSize = optimizationMetrics?.summary?.indexSize;

    if (!cachingStats && !indexSize) {
      section.innerHTML = `
        <h4 style="margin: 0 0 12px 0; color: #333;">Cache Statistics</h4>
        <div style="padding: 12px; background: #f8f9fa; border-radius: 6px; text-align: center; color: #666;">
          Cache statistics not available
        </div>
      `;
      return;
    }

    section.innerHTML = `
      <h4 style="margin: 0 0 12px 0; color: #333;">Cache Statistics</h4>
      <div style="background: #f8f9fa; border-radius: 6px; padding: 12px;">
        ${
          cachingStats
            ? `
          <div style="margin-bottom: 8px;">
            <strong>Advanced Cache:</strong> ${cachingStats.hitRate} hit rate
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Memory Usage:</strong> ${cachingStats.memoryEstimate}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Total Requests:</strong> ${cachingStats.totalRequests}
          </div>
        `
            : ''
        }
        
        ${
          indexSize
            ? `
          <div style="margin-bottom: 8px;">
            <strong>Index Sizes:</strong>
          </div>
          <div style="margin-left: 16px; font-size: 12px;">
            Categories: ${indexSize.categories} | 
            Content: ${indexSize.content} | 
            Search Terms: ${indexSize.searchTerms}
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  /**
   * Update performance charts section
   * @private
   * @param {Object} dashboardData - Dashboard data
   */
  _updatePerformanceCharts(dashboardData) {
    const section = this.container.querySelector('#performance-charts');
    if (!section) return;

    const realtimeMetrics = dashboardData?.realTimeMetrics || [];

    // Update chart data
    this._updateChartData(realtimeMetrics);

    section.innerHTML = `
      <h4 style="margin: 0 0 12px 0; color: #333;">Performance Trends</h4>
      <div style="background: #f8f9fa; border-radius: 6px; padding: 12px;">
        ${this._renderMiniChart('Response Time', this.chartData.performance, 'ms')}
        ${this._renderMiniChart('Cache Hit Rate', this.chartData.cacheHitRate, '%')}
      </div>
    `;
  }

  /**
   * Update chart data arrays
   * @private
   * @param {Array} realtimeMetrics - Real-time metrics data
   */
  _updateChartData(realtimeMetrics) {
    if (realtimeMetrics.length === 0) return;

    const latest = realtimeMetrics[realtimeMetrics.length - 1];
    const operations = latest.operations || {};

    // Calculate average performance across all operation types
    const avgPerformance =
      Object.values(operations).length > 0
        ? Object.values(operations).reduce(
            (sum, op) => sum + (op.avgDuration || 0),
            0
          ) / Object.values(operations).length
        : 0;

    // Calculate average cache hit rate
    const avgCacheHitRate =
      Object.values(operations).length > 0
        ? Object.values(operations).reduce(
            (sum, op) => sum + (op.cacheHitRate || 0),
            0
          ) / Object.values(operations).length
        : 0;

    // Add to chart data
    this.chartData.performance.push(avgPerformance);
    this.chartData.cacheHitRate.push(avgCacheHitRate);

    // Keep only recent data points
    if (this.chartData.performance.length > this.config.maxDataPoints) {
      this.chartData.performance.shift();
      this.chartData.cacheHitRate.shift();
    }
  }

  /**
   * Render a mini chart
   * @private
   * @param {string} title - Chart title
   * @param {Array} data - Chart data
   * @param {string} unit - Data unit
   * @returns {string} HTML string
   */
  _renderMiniChart(title, data, unit) {
    if (data.length === 0) {
      return `
        <div style="margin-bottom: 12px;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${title}</div>
          <div style="height: 40px; background: #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;">
            No data available
          </div>
        </div>
      `;
    }

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    // Create simple bar chart
    const bars = data
      .slice(-20)
      .map((value, index) => {
        const height = ((value - min) / range) * 30 + 5; // 5-35px height
        const color =
          value > min + range * 0.7
            ? '#ef4444'
            : value > min + range * 0.4
              ? '#f59e0b'
              : '#10b981';

        return `<div style="
        width: 8px;
        height: ${height}px;
        background: ${color};
        margin: 0 1px;
        border-radius: 2px;
        align-self: flex-end;
      "></div>`;
      })
      .join('');

    const currentValue = data[data.length - 1];

    return `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 12px; color: #666;">${title}</span>
          <span style="font-size: 12px; font-weight: 600;">${currentValue.toFixed(1)}${unit}</span>
        </div>
        <div style="
          height: 40px;
          display: flex;
          align-items: flex-end;
          padding: 2px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
        ">
          ${bars}
        </div>
      </div>
    `;
  }

  /**
   * Update alerts section
   * @private
   * @param {Object} dashboardData - Dashboard data
   */
  _updateAlerts(dashboardData) {
    const section = this.container.querySelector('#alerts-section');
    if (!section) return;

    const alerts = dashboardData?.alerts || [];
    const recentAlerts = alerts.filter(
      alert => Date.now() - alert.timestamp < 300000 && !alert.acknowledged
    );

    if (recentAlerts.length === 0) {
      section.innerHTML = `
        <h4 style="margin: 0 0 12px 0; color: #333;">Alerts</h4>
        <div style="padding: 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; color: #0369a1;">
          ✅ No active alerts
        </div>
      `;
      return;
    }

    const alertsHtml = recentAlerts
      .map(alert => {
        const severityColor =
          {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#6b7280',
          }[alert.severity] || '#6b7280';

        const severityIcon =
          {
            high: '🚨',
            medium: '⚠️',
            low: 'ℹ️',
          }[alert.severity] || 'ℹ️';

        return `
        <div style="
          padding: 8px 12px;
          background: ${severityColor}15;
          border: 1px solid ${severityColor}30;
          border-radius: 4px;
          margin-bottom: 8px;
        ">
          <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="margin-right: 8px;">${severityIcon}</span>
            <span style="font-weight: 600; color: ${severityColor};">
              ${alert.type.toUpperCase()} Alert
            </span>
            <span style="margin-left: auto; font-size: 11px; color: #666;">
              ${new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div style="font-size: 12px; color: #333;">
            ${this._formatAlertMessage(alert)}
          </div>
        </div>
      `;
      })
      .join('');

    section.innerHTML = `
      <h4 style="margin: 0 0 12px 0; color: #333;">Active Alerts (${recentAlerts.length})</h4>
      <div>${alertsHtml}</div>
    `;
  }

  /**
   * Format alert message for display
   * @private
   * @param {Object} alert - Alert object
   * @returns {string} Formatted message
   */
  _formatAlertMessage(alert) {
    switch (alert.type) {
      case 'performance':
        return `${alert.operationType} operation took ${alert.actualDuration}ms (threshold: ${alert.threshold}ms)`;
      case 'memory':
        return `Memory usage: ${alert.actualUsage}MB (threshold: ${alert.threshold}MB)`;
      default:
        return alert.message || 'Unknown alert';
    }
  }

  /**
   * Update recommendations section
   * @private
   * @param {Object} dashboardData - Dashboard data
   */
  _updateRecommendations(dashboardData) {
    const section = this.container.querySelector('#recommendations');
    if (!section) return;

    // Get performance report with recommendations
    const report = this.performanceMonitoringService
      ? this.performanceMonitoringService.getPerformanceReport({
          timeWindow: 300000,
        })
      : null;

    const recommendations = report?.recommendations || [];

    if (recommendations.length === 0) {
      section.innerHTML = `
        <h4 style="margin: 0 0 12px 0; color: #333;">Recommendations</h4>
        <div style="padding: 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; color: #0369a1;">
          💡 No recommendations at this time
        </div>
      `;
      return;
    }

    const recommendationsHtml = recommendations
      .slice(0, 3)
      .map(rec => {
        const priorityColor =
          {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#6b7280',
          }[rec.priority] || '#6b7280';

        return `
        <div style="
          padding: 8px 12px;
          background: ${priorityColor}15;
          border: 1px solid ${priorityColor}30;
          border-radius: 4px;
          margin-bottom: 8px;
        ">
          <div style="font-weight: 600; color: ${priorityColor}; margin-bottom: 4px;">
            ${rec.type.toUpperCase()} - ${rec.priority.toUpperCase()} Priority
          </div>
          <div style="font-size: 12px; color: #333; margin-bottom: 4px;">
            <strong>Issue:</strong> ${rec.issue}
          </div>
          <div style="font-size: 12px; color: #333;">
            <strong>Suggestion:</strong> ${rec.suggestion}
          </div>
        </div>
      `;
      })
      .join('');

    section.innerHTML = `
      <h4 style="margin: 0 0 12px 0; color: #333;">Recommendations</h4>
      <div>${recommendationsHtml}</div>
    `;
  }

  /**
   * Show error message in dashboard
   * @private
   * @param {string} message - Error message
   */
  _showError(message) {
    if (!this.container) return;

    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: absolute;
      top: 60px;
      left: 16px;
      right: 16px;
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: #dc2626;
      font-size: 12px;
      z-index: 1;
    `;
    errorDiv.textContent = message;

    this.container.appendChild(errorDiv);

    // Auto-remove error after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  /**
   * Start auto-update interval
   * @private
   */
  _startAutoUpdate() {
    this._stopAutoUpdate(); // Clear any existing interval

    this.updateInterval = setInterval(() => {
      if (this.isVisible) {
        this._updateDashboard();
      }
    }, this.config.updateIntervalMs);
  }

  /**
   * Stop auto-update interval
   * @private
   */
  _stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Configure dashboard settings
   * @param {Object} newConfig - New configuration
   */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // Restart auto-update if interval changed
    if (newConfig.updateIntervalMs && this.isVisible) {
      this._startAutoUpdate();
    }
  }

  /**
   * Cleanup and destroy dashboard
   */
  destroy() {
    this.hide();
    this._stopAutoUpdate();
  }
}

export default PerformanceDashboard;
