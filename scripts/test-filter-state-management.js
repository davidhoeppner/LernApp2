// @ts-nocheck
/* eslint-env node */
#!/usr/bin/env node

/**
 * Test script for filter state management
 */

// Mock DOM environment
global.window = {
  setTimeout: setTimeout,
  location: { hash: '' },
};

global.document = {
  createElement: tag => ({
    className: '',
    innerHTML: '',
    appendChild: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false,
    },
    querySelectorAll: () => [],
    querySelector: () => null,
    replaceWith: () => {},
  }),
  querySelectorAll: () => [],
  querySelector: () => null,
};

// Mock services
const mockServices = {
  ihkContentService: {
    async getAllQuizzes() {
      return [
        {
          id: 'test-quiz-1',
          title: 'Test Quiz 1',
          description: 'Test description',
          threeTierCategory: 'daten-prozessanalyse',
          questions: [{ id: 1 }],
          difficulty: 'beginner',
        },
        {
          id: 'test-quiz-2',
          title: 'Test Quiz 2',
          description: 'Test description',
          threeTierCategory: 'anwendungsentwicklung',
          questions: [{ id: 1 }],
          difficulty: 'intermediate',
        },
      ];
    },
  },
  specializationService: {
    getCurrentSpecialization() {
      return 'fachinformatiker-anwendungsentwicklung';
    },
  },
  categoryMappingService: {
    mapToThreeTierCategory(quiz) {
      return {
        threeTierCategory: quiz.threeTierCategory || 'allgemein',
        confidence: 'high',
        mappingSource: 'direct',
      };
    },
  },
  stateManager: {
    getState() {
      return { progress: { quizAttempts: [] } };
    },
  },
  router: {},
};

// Mock accessibility helper
global.accessibilityHelper = {
  announce: message => console.log(`📢 Accessibility: ${message}`),
};

// Mock toast notification
global.toastNotification = {
  error: message => console.log(`❌ Toast Error: ${message}`),
  success: message => console.log(`✅ Toast Success: ${message}`),
};

async function testFilterStateManagement() {
  console.log('🚀 Starting Filter State Management Test...');

  try {
    // Import the component
    const { default: IHKQuizListView } = await import(
      '../src/components/IHKQuizListView.js'
    );

    // Create instance
    const quizListView = new IHKQuizListView(mockServices);

    console.log('✅ Component created successfully');

    // Test initial state
    console.log('🔍 Testing initial filter states...');
    console.log(
      `  Initial category filter: ${quizListView.currentCategoryFilter}`
    );
    console.log(`  Initial status filter: ${quizListView.currentStatusFilter}`);

    if (
      quizListView.currentCategoryFilter === 'all' &&
      quizListView.currentStatusFilter === 'all'
    ) {
      console.log('✅ SUCCESS: Initial filter states are correct');
    } else {
      console.log('❌ FAIL: Initial filter states are incorrect');
    }

    // Test rendering
    console.log('🎨 Testing component rendering...');
    const rendered = await quizListView.render();

    if (rendered && rendered.className === 'ihk-quiz-list-view') {
      console.log('✅ SUCCESS: Component renders correctly');
    } else {
      console.log('❌ FAIL: Component rendering failed');
    }

    // Wait for async loading
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test filter button initialization
    console.log('🔘 Testing filter button initialization...');
    const categoryButtons = rendered.querySelectorAll('[data-category]');
    const statusButtons = rendered.querySelectorAll('[data-status]');

    console.log(`  Found ${categoryButtons.length} category buttons`);
    console.log(`  Found ${statusButtons.length} status buttons`);

    // Check if "All Categories" button is active
    const allCategoriesBtn = Array.from(categoryButtons).find(
      btn => btn.dataset.category === 'all'
    );
    if (allCategoriesBtn) {
      const isActive = allCategoriesBtn.classList.contains('active');
      const ariaPressed = allCategoriesBtn.getAttribute('aria-pressed');

      console.log(`  "All Categories" button active: ${isActive}`);
      console.log(`  "All Categories" aria-pressed: ${ariaPressed}`);

      if (isActive && ariaPressed === 'true') {
        console.log(
          '✅ SUCCESS: "All Categories" button is properly initialized'
        );
      } else {
        console.log('❌ FAIL: "All Categories" button initialization failed');
      }
    }

    // Check if "All Quizzes" status button is active
    const allQuizzesBtn = Array.from(statusButtons).find(
      btn => btn.dataset.status === 'all'
    );
    if (allQuizzesBtn) {
      const isActive = allQuizzesBtn.classList.contains('active');
      const ariaPressed = allQuizzesBtn.getAttribute('aria-pressed');

      console.log(`  "All Quizzes" button active: ${isActive}`);
      console.log(`  "All Quizzes" aria-pressed: ${ariaPressed}`);

      if (isActive && ariaPressed === 'true') {
        console.log('✅ SUCCESS: "All Quizzes" button is properly initialized');
      } else {
        console.log('❌ FAIL: "All Quizzes" button initialization failed');
      }
    }

    console.log('✅ Filter State Management Test completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testFilterStateManagement();
