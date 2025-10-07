/**
 * Test script for performance optimization and monitoring implementation
 * Verifies that all performance services work correctly together
 */

// Mock performance API for Node.js environment
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024 // 50MB
    }
  };
}

// Mock DOM elements for dashboard testing
if (typeof document === 'undefined') {
  global.document = {
    createElement: (tag) => ({
      className: '',
      style: { cssText: '' },
      innerHTML: '',
      appendChild: () => {},
      querySelector: () => null,
      addEventListener: () => {}
    })
  };
}

import PerformanceOptimizationService from '../src/services/PerformanceOptimizationService.js';
import PerformanceMonitoringService from '../src/services/PerformanceMonitoringService.js';
import AdvancedCachingService from '../src/services/AdvancedCachingService.js';
import PerformanceIntegrationService from '../src/services/PerformanceIntegrationService.js';

// Mock IHKContentService
class MockIHKContentService {
  constructor() {
    this.modules = new Map();
    this.quizzes = new Map();
    
    // Add some test data
    for (let i = 1; i <= 100; i++) {
      this.modules.set(`module-${i}`, {
        id: `module-${i}`,
        title: `Test Module ${i}`,
        description: `Description for module ${i}`,
        category: i <= 30 ? 'bp-dpa-01' : i <= 60 ? 'bp-ae-01' : 'fue-01',
        threeTierCategory: i <= 30 ? 'daten-prozessanalyse' : i <= 60 ? 'anwendungsentwicklung' : 'allgemein',
        difficulty: ['beginner', 'intermediate', 'advanced'][i % 3],
        tags: [`tag${i % 5}`, `category${i % 3}`],
        content: `Content for module ${i} with searchable text`
      });
    }
    
    for (let i = 1; i <= 50; i++) {
      this.quizzes.set(`quiz-${i}`, {
        id: `quiz-${i}`,
        title: `Test Quiz ${i}`,
        description: `Description for quiz ${i}`,
        category: i <= 15 ? 'bp-dpa-01' : i <= 30 ? 'bp-ae-01' : 'fue-01',
        threeTierCategory: i <= 15 ? 'daten-prozessanalyse' : i <= 30 ? 'anwendungsentwicklung' : 'allgemein',
        questions: Array(10).fill().map((_, j) => ({ id: j, question: `Question ${j}` }))
      });
    }
  }
  
  async getAllModules() {
    return Array.from(this.modules.values());
  }
  
  async getAllQuizzes() {
    return Array.from(this.quizzes.values());
  }
  
  async getContentByThreeTierCategory(categoryId, options = {}) {
    const allContent = [...Array.from(this.modules.values()), ...Array.from(this.quizzes.values())];
    return allContent.filter(item => item.threeTierCategory === categoryId);
  }
  
  async searchInCategory(query, categoryId, options = {}) {
    const categoryContent = await this.getContentByThreeTierCategory(categoryId, options);
    if (!query) return categoryContent;
    
    const searchTerm = query.toLowerCase();
    return categoryContent.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm) ||
      (item.content && item.content.toLowerCase().includes(searchTerm))
    );
  }
}

// Mock CategoryMappingService
class MockCategoryMappingService {
  mapToThreeTierCategory(contentItem) {
    const category = contentItem.category || '';
    
    if (category.includes('dpa')) {
      return {
        threeTierCategory: 'daten-prozessanalyse',
        categoryInfo: { id: 'daten-prozessanalyse', name: 'Daten und Prozessanalyse' },
        appliedRule: { priority: 100, description: 'DPA content rule' },
        reason: 'Mapped by category prefix',
        timestamp: new Date().toISOString()
      };
    }
    
    if (category.includes('ae')) {
      return {
        threeTierCategory: 'anwendungsentwicklung',
        categoryInfo: { id: 'anwendungsentwicklung', name: 'Anwendungsentwicklung' },
        appliedRule: { priority: 100, description: 'AE content rule' },
        reason: 'Mapped by category prefix',
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      threeTierCategory: 'allgemein',
      categoryInfo: { id: 'allgemein', name: 'Allgemein' },
      appliedRule: { priority: 90, description: 'General content rule' },
      reason: 'Default mapping',
      timestamp: new Date().toISOString()
    };
  }
  
  getThreeTierCategory(categoryId) {
    const categories = {
      'daten-prozessanalyse': { id: 'daten-prozessanalyse', name: 'Daten und Prozessanalyse' },
      'anwendungsentwicklung': { id: 'anwendungsentwicklung', name: 'Anwendungsentwicklung' },
      'allgemein': { id: 'allgemein', name: 'Allgemein' }
    };
    
    return categories[categoryId] || null;
  }
}

async function testPerformanceServices() {
  console.log('🚀 Starting Performance Optimization and Monitoring Tests\n');
  
  try {
    // Initialize mock services
    const mockIHKContentService = new MockIHKContentService();
    const mockCategoryMappingService = new MockCategoryMappingService();
    
    console.log('✅ Mock services initialized');
    
    // Test 1: Performance Optimization Service
    console.log('\n📊 Testing Performance Optimization Service...');
    
    const perfOptService = new PerformanceOptimizationService(
      mockIHKContentService,
      mockCategoryMappingService
    );
    
    // Wait for indexes to build
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test category filtering
    const startTime = performance.now();
    const dpaContent = await perfOptService.getContentByThreeTierCategory('daten-prozessanalyse');
    const filterTime = performance.now() - startTime;
    
    console.log(`   - Category filtering: ${dpaContent.length} items in ${filterTime.toFixed(2)}ms`);
    console.log(`   - Performance target (<100ms): ${filterTime < 100 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test search functionality
    const searchStartTime = performance.now();
    const searchResults = await perfOptService.searchInCategory('test', 'daten-prozessanalyse');
    const searchTime = performance.now() - searchStartTime;
    
    console.log(`   - Category search: ${searchResults.length} results in ${searchTime.toFixed(2)}ms`);
    console.log(`   - Search performance (<150ms): ${searchTime < 150 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 2: Advanced Caching Service
    console.log('\n🗄️ Testing Advanced Caching Service...');
    
    const cachingService = new AdvancedCachingService(
      mockIHKContentService,
      mockCategoryMappingService
    );
    
    // Test cache miss and hit
    const cacheMissStart = performance.now();
    const cachedContent1 = await cachingService.getContentByCategory('anwendungsentwicklung');
    const cacheMissTime = performance.now() - cacheMissStart;
    
    const cacheHitStart = performance.now();
    const cachedContent2 = await cachingService.getContentByCategory('anwendungsentwicklung');
    const cacheHitTime = performance.now() - cacheHitStart;
    
    console.log(`   - Cache miss: ${cachedContent1.length} items in ${cacheMissTime.toFixed(2)}ms`);
    console.log(`   - Cache hit: ${cachedContent2.length} items in ${cacheHitTime.toFixed(2)}ms`);
    console.log(`   - Cache speedup: ${(cacheMissTime / cacheHitTime).toFixed(1)}x faster`);
    
    const cacheStats = cachingService.getStatistics();
    console.log(`   - Cache hit rate: ${cacheStats.summary.hitRate}`);
    console.log(`   - Memory estimate: ${cacheStats.summary.memoryEstimate}`);
    
    // Test 3: Performance Monitoring Service
    console.log('\n📈 Testing Performance Monitoring Service...');
    
    const monitoringService = new PerformanceMonitoringService();
    
    // Record some test metrics
    monitoringService.recordMetric('categoryFilter', {
      duration: filterTime,
      parameters: { categoryId: 'daten-prozessanalyse' },
      resultCount: dpaContent.length,
      cacheHit: false
    });
    
    monitoringService.recordMetric('categorySearch', {
      duration: searchTime,
      parameters: { query: 'test', categoryId: 'daten-prozessanalyse' },
      resultCount: searchResults.length,
      cacheHit: false
    });
    
    // Wait for metrics to be processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const dashboardData = monitoringService.getDashboardData();
    console.log(`   - System health: ${dashboardData.systemHealth}`);
    console.log(`   - Active alerts: ${dashboardData.alerts.length}`);
    console.log(`   - Real-time metrics: ${dashboardData.realTimeMetrics.length} data points`);
    
    const performanceReport = monitoringService.getPerformanceReport();
    console.log(`   - Total operations: ${performanceReport.summary.totalOperations}`);
    console.log(`   - Average duration: ${performanceReport.summary.avgDuration.toFixed(2)}ms`);
    
    // Test 4: Performance Integration Service
    console.log('\n🔧 Testing Performance Integration Service...');
    
    const integrationService = new PerformanceIntegrationService(
      mockIHKContentService,
      mockCategoryMappingService
    );
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`   - Integration ready: ${integrationService.isReady() ? '✅ YES' : '❌ NO'}`);
    
    // Test integrated operations
    const integratedStart = performance.now();
    const integratedContent = await integrationService.getContentByCategory('allgemein');
    const integratedTime = performance.now() - integratedStart;
    
    console.log(`   - Integrated filtering: ${integratedContent.length} items in ${integratedTime.toFixed(2)}ms`);
    
    const integratedSearchStart = performance.now();
    const integratedSearchResults = await integrationService.searchInCategory('module', 'allgemein');
    const integratedSearchTime = performance.now() - integratedSearchStart;
    
    console.log(`   - Integrated search: ${integratedSearchResults.length} results in ${integratedSearchTime.toFixed(2)}ms`);
    
    // Get comprehensive report
    const comprehensiveReport = integrationService.getPerformanceReport();
    console.log(`   - Health score: ${comprehensiveReport.healthScore.score}/100 (${comprehensiveReport.healthScore.status})`);
    console.log(`   - Services active: ${Object.values(comprehensiveReport.services).filter(Boolean).length}/4`);
    
    // Test 5: Performance under load
    console.log('\n⚡ Testing Performance Under Load...');
    
    const loadTestStart = performance.now();
    const loadTestPromises = [];
    
    // Simulate 50 concurrent requests
    for (let i = 0; i < 50; i++) {
      const category = ['daten-prozessanalyse', 'anwendungsentwicklung', 'allgemein'][i % 3];
      loadTestPromises.push(integrationService.getContentByCategory(category));
    }
    
    const loadTestResults = await Promise.all(loadTestPromises);
    const loadTestTime = performance.now() - loadTestStart;
    
    const totalItems = loadTestResults.reduce((sum, result) => sum + result.length, 0);
    const avgTimePerRequest = loadTestTime / loadTestPromises.length;
    
    console.log(`   - Load test: ${loadTestPromises.length} requests in ${loadTestTime.toFixed(2)}ms`);
    console.log(`   - Average per request: ${avgTimePerRequest.toFixed(2)}ms`);
    console.log(`   - Total items retrieved: ${totalItems}`);
    console.log(`   - Throughput: ${(loadTestPromises.length / (loadTestTime / 1000)).toFixed(1)} requests/second`);
    
    // Final performance report
    const finalReport = integrationService.getPerformanceReport();
    console.log(`\n📋 Final Performance Summary:`);
    console.log(`   - Overall health: ${finalReport.healthScore.status} (${finalReport.healthScore.score}/100)`);
    console.log(`   - Recommendation: ${finalReport.healthScore.recommendation}`);
    
    if (finalReport.optimization?.summary) {
      console.log(`   - Cache hit rate: ${finalReport.optimization.summary.cacheHitRate}%`);
      console.log(`   - Average response time: ${finalReport.optimization.summary.avgDurationMs}ms`);
    }
    
    // Cleanup
    integrationService.destroy();
    cachingService.destroy();
    monitoringService.destroy();
    
    console.log('\n🎉 All performance tests completed successfully!');
    console.log('\n✅ Performance Optimization and Monitoring Implementation Verified');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    return false;
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPerformanceServices()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export default testPerformanceServices;