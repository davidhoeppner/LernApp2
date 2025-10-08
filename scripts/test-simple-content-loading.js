// @ts-nocheck
/* eslint-env node */
/**
 * Simple test to verify content loading works
 */

console.log('Starting simple content loading test...');

try {
  // Test basic imports
  console.log('Testing imports...');

  const { default: IHKContentService } = await import(
    '../src/services/IHKContentService.js'
  );
  console.log('✓ IHKContentService imported successfully');

  const { default: CategoryMappingService } = await import(
    '../src/services/CategoryMappingService.js'
  );
  console.log('✓ CategoryMappingService imported successfully');

  // Test service instantiation
  console.log('Testing service instantiation...');

  class MockStateManager {
    constructor() {
      this.state = {
        progress: { modulesCompleted: [], modulesInProgress: [] },
      };
    }
    getState(key) {
      return key ? this.state[key] : this.state;
    }
    setState(key, value) {
      this.state[key] = value;
    }
    subscribe() {
      return () => {};
    }
  }

  class MockStorageService {
    constructor() {
      this.storage = new Map();
    }
    get(key) {
      return this.storage.get(key);
    }
    set(key, value) {
      this.storage.set(key, value);
    }
    remove(key) {
      this.storage.delete(key);
    }
  }

  class MockSpecializationService {
    getCategoryRelevance() {
      return 'medium';
    }
  }

  const mockStateManager = new MockStateManager();
  const mockStorageService = new MockStorageService();
  const mockSpecializationService = new MockSpecializationService();

  const categoryMappingService = new CategoryMappingService(
    mockSpecializationService
  );
  console.log('✓ CategoryMappingService instantiated successfully');

  const contentService = new IHKContentService(
    mockStateManager,
    mockStorageService,
    mockSpecializationService,
    categoryMappingService
  );
  console.log('✓ IHKContentService instantiated successfully');

  // Test basic functionality
  console.log('Testing basic functionality...');

  const startTime = performance.now();
  const allModules = await contentService.getAllModules();
  const endTime = performance.now();

  console.log(
    `✓ Loaded ${allModules.length} modules in ${(endTime - startTime).toFixed(2)}ms`
  );

  if (allModules.length > 0) {
    const sampleModule = allModules[0];
    console.log(`✓ Sample module: ${sampleModule.id} - ${sampleModule.title}`);
    console.log(
      `✓ Has three-tier category: ${sampleModule.threeTierCategory || 'No'}`
    );
  }

  console.log('\n🎉 Simple content loading test completed successfully!');
} catch (error) {
  console.error('❌ Error in simple content loading test:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
