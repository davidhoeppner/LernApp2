const ModuleService = require('../src/services/ModuleService').default || require('../src/services/ModuleService');
const fs = require('fs');

// Simple in-memory state manager stub
class StateManager {
  constructor() {
    this.state = {};
  }
  getState(key) {
    const parts = key.split('.');
    let cur = this.state;
    for (const p of parts) {
      if (!cur) return undefined;
      cur = cur[p];
    }
    return cur;
  }
  setState(key, value) {
    const parts = key.split('.');
    let cur = this.state;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }
}

// Stubbed IHKContentService that returns module when asked
class IHKContentServiceStub {
  constructor() {
    this.modules = {
      'fue-01-planning': { id: 'fue-01-planning', title: 'stub', description: 'stub' },
    };
  }
  async getModuleById(id) {
    if (this.modules[id]) return this.modules[id];
    throw new Error('not found');
  }
}

(async () => {
  try {
    const stateManager = new StateManager();
    const moduleService = new ModuleService(stateManager, null, new IHKContentServiceStub(), null);

    const res = await moduleService.markModuleComplete('fue-01-planning');
    console.log('Result:', res);
    console.log('State:', JSON.stringify(stateManager.state, null, 2));
  } catch (e) {
    console.error('Test error', e);
  }
})();
