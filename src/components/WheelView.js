/**
 * WheelView - Random module selector with spinning animation
 * Provides a gamified way to discover learning modules
 */

/* global setTimeout */

import accessibilityHelper from '../utils/AccessibilityHelper.js';
import LoadingSpinner from './LoadingSpinner.js';
import EmptyState from './EmptyState.js';
import toastNotification from './ToastNotification.js';

class WheelView {
  constructor(services) {
    this.services = services;
    this.ihkContentService = services.ihkContentService;
    this.stateManager = services.stateManager;
    this.router = services.router;
    this.modules = [];
    this.selectedModule = null;
    this.isSpinning = false;
  }

  /**
   * Render the wheel view
   */
  async render() {
    const container = document.createElement('div');
    container.className = 'wheel-view';
    container.innerHTML = LoadingSpinner.render('Loading modules...');

    // Load modules asynchronously
    setTimeout(async () => {
      try {
        await this.loadModules();

        // Check if we have enough modules
        if (this.modules.length < 2) {
          container.innerHTML = '';
          container.appendChild(this.renderInsufficientModules());
          return;
        }

        container.innerHTML = '';
        container.appendChild(this.renderContent());

        // Load last selected module from state
        this.loadLastSelection();

        accessibilityHelper.announce('Wheel of Fortune loaded');
      } catch (error) {
        console.error('Error loading wheel:', error);
        const errorState = EmptyState.create({
          icon: '⚠️',
          title: 'Error Loading Wheel',
          message: 'Failed to load modules. Please try again.',
          action: {
            label: 'Retry',
            onClick: () => this.render(),
          },
        });
        container.innerHTML = '';
        container.appendChild(errorState);
        toastNotification.error('Failed to load wheel');
      }
    }, 0);

    return container;
  }

  /**
   * Load modules from IHKContentService
   */
  async loadModules() {
    try {
      // Load all modules from IHKContentService
      const result = await this.ihkContentService.searchContent('', {});

      // Ensure we have a valid array
      if (Array.isArray(result) && result.length > 0) {
        this.modules = result;
      } else {
        // Fallback to static list if service fails or returns empty
        console.warn('IHKContentService returned no modules, using fallback');
        this.modules = this.getFallbackModules();
      }
    } catch (error) {
      console.error('Error loading modules:', error);
      // Use fallback modules
      this.modules = this.getFallbackModules();
    }

    // Final safety check
    if (!Array.isArray(this.modules)) {
      console.error('Modules is not an array, using fallback');
      this.modules = this.getFallbackModules();
    }
  }

  /**
   * Get fallback modules if service fails
   */
  getFallbackModules() {
    return [
      {
        id: 'bp-03-tdd',
        title: 'Test-Driven Development (TDD)',
        category: 'BP-03',
      },
      { id: 'bp-04-scrum', title: 'Scrum', category: 'BP-04' },
      { id: 'bp-05-sorting', title: 'Sortierverfahren', category: 'BP-05' },
      { id: 'bp-01-kerberos', title: 'Kerberos', category: 'BP-01' },
      { id: 'bp-03-rest-api', title: 'REST API', category: 'BP-03' },
    ];
  }

  /**
   * Load last selected module from state
   */
  loadLastSelection() {
    const lastModule = this.stateManager.getState('lastWheelModule');
    if (lastModule) {
      this.selectedModule = lastModule;
      this.updateDisplay();
    }
  }

  /**
   * Render insufficient modules state
   */
  renderInsufficientModules() {
    return EmptyState.create({
      icon: '🎯',
      title: 'Nicht genügend Module verfügbar',
      message:
        'Mindestens 2 Module werden benötigt, um das Glücksrad zu nutzen.',
    });
  }

  /**
   * Render main content
   */
  renderContent() {
    const content = document.createElement('div');
    content.className = 'wheel-content';

    // Header
    const header = this.renderHeader();
    content.appendChild(header);

    // Wheel container
    const wheelContainer = this.renderWheelContainer();
    content.appendChild(wheelContainer);

    // Controls
    const controls = this.renderControls();
    content.appendChild(controls);

    // Selected module display
    const selectedDisplay = this.renderSelectedDisplay();
    content.appendChild(selectedDisplay);

    return content;
  }

  /**
   * Render header
   */
  renderHeader() {
    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `
      <h1>🎯 Lern-Modul</h1>
      <p class="subtitle">Lass das Glücksrad entscheiden, welches Modul du als nächstes lernst!</p>
    `;
    return header;
  }

  /**
   * Render wheel container with animation
   */
  renderWheelContainer() {
    const container = document.createElement('div');
    container.className = 'wheel-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Module selection wheel');

    // Create SVG wheel
    const wheelSVG = this.createWheelSVG();

    container.innerHTML = `
      <div class="wheel-display">
        <div class="wheel-svg-container" id="wheel-svg-container">
          ${wheelSVG}
          <div class="wheel-pointer">▼</div>
          <button class="wheel-spin-overlay" id="wheel-spin-overlay" aria-label="Click wheel to spin">
            <span class="spin-icon">🎲</span>
            <span class="spin-text">DREHEN</span>
          </button>
        </div>
        <div class="wheel-result-display" id="wheel-result-display">
          <span class="wheel-result-text">Klicke auf das Rad zum Drehen</span>
        </div>
      </div>
    `;

    // Make wheel clickable
    setTimeout(() => {
      const wheelContainer = container.querySelector('#wheel-svg-container');
      const spinOverlay = container.querySelector('#wheel-spin-overlay');

      if (wheelContainer) {
        wheelContainer.style.cursor = 'pointer';
        wheelContainer.addEventListener('click', () => this.spin());
      }

      if (spinOverlay) {
        spinOverlay.addEventListener('click', e => {
          e.stopPropagation();
          this.spin();
        });
      }
    }, 0);

    return container;
  }

  /**
   * Create SVG wheel with module segments
   */
  createWheelSVG() {
    if (!this.modules || this.modules.length === 0) {
      return '<div class="wheel-placeholder">Loading...</div>';
    }

    const colors = [
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#f59e0b',
      '#10b981',
      '#06b6d4',
      '#6366f1',
      '#f97316',
    ];

    const segmentAngle = 360 / this.modules.length;
    const radius = 380; // Increased for longer text
    const centerX = 400; // Increased
    const centerY = 400; // Increased

    let segments = '';

    this.modules.forEach((module, index) => {
      // Safety check for module object
      if (!module || !module.title) {
        // Skip invalid modules silently
        return;
      }

      const startAngle = index * segmentAngle - 90;
      const endAngle = (index + 1) * segmentAngle - 90;
      const color = colors[index % colors.length];

      // Calculate path for segment
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArc = segmentAngle > 180 ? 1 : 0;

      const pathData = `
        M ${centerX} ${centerY}
        L ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
        Z
      `;

      // Calculate text position (middle of segment)
      const midAngle = (startAngle + endAngle) / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const textRadius = radius * 0.7;
      const textX = centerX + textRadius * Math.cos(midRad);
      const textY = centerY + textRadius * Math.sin(midRad);

      // Truncate long titles - keep it short for readability
      const title =
        module.title.length > 25
          ? module.title.substring(0, 23) + '...'
          : module.title;

      segments += `
        <path 
          d="${pathData}" 
          fill="${color}" 
          stroke="#fff" 
          stroke-width="4"
          class="wheel-segment"
        />
        <text 
          x="${textX}" 
          y="${textY}" 
          text-anchor="middle" 
          dominant-baseline="middle"
          fill="#fff" 
          font-size="20" 
          font-weight="bold"
          class="wheel-text"
          transform="rotate(${midAngle}, ${textX}, ${textY})"
        >
          ${title}
        </text>
      `;
    });

    return `
      <svg 
        id="wheel-svg" 
        width="800" 
        height="800" 
        viewBox="0 0 800 800"
        class="wheel-svg"
      >
        <g id="wheel-group">
          ${segments}
          <!-- Center circle -->
          <circle 
            cx="${centerX}" 
            cy="${centerY}" 
            r="50" 
            fill="#1f2937" 
            stroke="#fff" 
            stroke-width="5"
          />
          <text 
            x="${centerX}" 
            y="${centerY}" 
            text-anchor="middle" 
            dominant-baseline="middle"
            fill="#fff" 
            font-size="60"
          >
            🎯
          </text>
        </g>
      </svg>
    `;
  }

  /**
   * Render control buttons
   */
  renderControls() {
    const controls = document.createElement('div');
    controls.className = 'wheel-controls';

    controls.innerHTML = `
      <button 
        class="btn btn-secondary btn-again" 
        id="btn-again"
        aria-label="Spin again"
        style="display: none;"
      >
        🔄 Nochmal drehen
      </button>
      <button 
        class="btn btn-primary btn-goto" 
        id="btn-goto"
        aria-label="Go to selected module"
        style="display: none;"
      >
        ➡️ Zum Modul
      </button>
    `;

    // Attach event listeners
    setTimeout(() => {
      const againBtn = controls.querySelector('#btn-again');
      const gotoBtn = controls.querySelector('#btn-goto');

      if (againBtn) {
        againBtn.addEventListener('click', () => this.spin());
      }

      if (gotoBtn) {
        gotoBtn.addEventListener('click', () => this.navigateToModule());
      }
    }, 0);

    return controls;
  }

  /**
   * Render selected module display
   */
  renderSelectedDisplay() {
    const display = document.createElement('div');
    display.className = 'selected-module-display';
    display.id = 'selected-module-display';
    display.setAttribute('role', 'status');
    display.setAttribute('aria-live', 'polite');
    display.setAttribute('aria-atomic', 'true');

    display.innerHTML = `
      <p class="selected-label">Ausgewähltes Modul:</p>
      <p class="selected-module" id="selected-module-text">Noch kein Modul ausgewählt</p>
    `;

    return display;
  }

  /**
   * Spin the wheel and select a random module
   */
  async spin() {
    if (this.isSpinning) return;

    this.isSpinning = true;

    // Hide buttons and overlay during spin
    const spinOverlay = document.querySelector('#wheel-spin-overlay');
    const againBtn = document.querySelector('#btn-again');
    const gotoBtn = document.querySelector('#btn-goto');

    if (spinOverlay) spinOverlay.style.display = 'none';
    if (againBtn) againBtn.style.display = 'none';
    if (gotoBtn) gotoBtn.style.display = 'none';

    // Select random module
    const selectedIndex = Math.floor(Math.random() * this.modules.length);
    this.selectedModule = this.modules[selectedIndex];

    console.log('🎯 Spinning wheel:');
    console.log('  Selected index:', selectedIndex);
    console.log('  Selected module:', this.selectedModule.title);

    // Animate the selection
    await this.animateSelection(selectedIndex);

    // Update display
    this.updateDisplay();

    // Save to state
    this.saveSelection();

    // Update buttons - show action buttons, keep overlay hidden
    if (againBtn) againBtn.style.display = 'inline-block';
    if (gotoBtn) gotoBtn.style.display = 'inline-block';

    // Announce result
    accessibilityHelper.announce(
      `Selected module: ${this.selectedModule.title}`
    );

    this.isSpinning = false;

    // Return focus to spin again button
    if (againBtn) {
      setTimeout(() => againBtn.focus(), 100);
    }
  }

  /**
   * Animate the module selection
   * Spins the wheel with acceleration/deceleration
   * Total animation time: ~3-4 seconds
   */
  async animateSelection(finalIndex) {
    const wheelGroup = document.querySelector('#wheel-group');
    const resultDisplay = document.querySelector(
      '#wheel-result-display .wheel-result-text'
    );

    if (!wheelGroup) return;

    // Calculate target rotation
    // The pointer is at top (90 degrees), segments start at -90 degrees (bottom)
    // We need to rotate so the selected segment's CENTER is at the top
    const segmentAngle = 360 / this.modules.length;

    // Calculate the angle to the CENTER of the target segment
    // Segments start at -90°, so segment i starts at: -90 + (i * segmentAngle)
    // And its center is at: -90 + (i * segmentAngle) + (segmentAngle / 2)
    const targetSegmentCenter =
      -90 + finalIndex * segmentAngle + segmentAngle / 2;

    // We want this center to be at 90 degrees (top, where pointer is)
    // So we need to rotate by: 90 - targetSegmentCenter
    // Add 180° because the visual alignment is opposite
    const targetAngle = 90 - targetSegmentCenter + 180;

    // Spin 3-5 full rotations plus the target angle
    // Use Math.floor to ensure we do COMPLETE rotations only
    const fullRotations = Math.floor(3 + Math.random() * 3); // 3, 4, or 5 complete rotations
    const totalRotation = fullRotations * 360 + targetAngle;

    console.log('🎲 Animation calculation:');
    console.log('  Segment angle:', segmentAngle);
    console.log('  Target segment center:', targetSegmentCenter);
    console.log('  Target angle:', targetAngle);
    console.log('  Total rotation:', totalRotation);
    console.log('  Final module:', this.selectedModule.title);

    // Animation using CSS transition
    wheelGroup.style.transition = 'none';
    wheelGroup.style.transform = 'rotate(0deg)';

    // Force reflow
    wheelGroup.offsetHeight;

    // Apply rotation with easing
    wheelGroup.style.transition =
      'transform 3.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    wheelGroup.style.transform = `rotate(${totalRotation}deg)`;

    // Update result display during spin
    if (resultDisplay) {
      resultDisplay.textContent = 'Spinning...';
      resultDisplay.style.opacity = '0.5';
    }

    // Wait for animation to complete
    await this.sleep(3500);

    // Show result
    if (resultDisplay) {
      const winnerModule = this.modules[finalIndex];

      // Verify which segment is actually at the pointer (top = 90°, but with 180° offset)
      const finalRotation = totalRotation % 360;

      // After rotation, where is segment 0's center?
      // Originally at -84° (for first segment), after rotation it's at:
      const segment0CenterAfterRotation =
        (-90 + segmentAngle / 2 + finalRotation) % 360;

      // Which segment center is now closest to 90° + 180° = 270° (pointer with offset)?
      // We need to find which segment index i has its center at 270°
      // Segment i center after rotation: (-90 + i * segmentAngle + segmentAngle/2 + finalRotation) % 360
      // We want this to equal 270°, so:
      // -90 + i * segmentAngle + segmentAngle/2 + finalRotation = 270 (mod 360)
      // i * segmentAngle = 270 + 90 - segmentAngle/2 - finalRotation
      // i = (360 - segmentAngle/2 - finalRotation) / segmentAngle

      const segmentAtPointer =
        Math.round((360 - segmentAngle / 2 - finalRotation) / segmentAngle) %
        this.modules.length;
      const actualSegmentAtPointer =
        segmentAtPointer < 0
          ? segmentAtPointer + this.modules.length
          : segmentAtPointer;

      console.log('🏆 Winner verification:');
      console.log('  Final index (selected):', finalIndex);
      console.log('  Winner module:', winnerModule.title);
      console.log('  Total rotation:', totalRotation);
      console.log('  Final rotation (mod 360):', finalRotation);
      console.log(
        '  Segment 0 center after rotation:',
        segment0CenterAfterRotation
      );
      console.log('  Calculated segment at pointer:', actualSegmentAtPointer);
      

      resultDisplay.textContent = winnerModule.title;
      resultDisplay.style.opacity = '1';
      resultDisplay.classList.add('wheel-result-highlight');

      // Remove highlight after animation
      setTimeout(() => {
        resultDisplay.classList.remove('wheel-result-highlight');
      }, 1000);
    }
  }

  /**
   * Sleep helper for animation
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update the selected module display
   */
  updateDisplay() {
    const selectedText = document.querySelector('#selected-module-text');
    if (selectedText && this.selectedModule) {
      selectedText.textContent = `${this.selectedModule.title} (${this.selectedModule.category || 'N/A'})`;
    }
  }

  /**
   * Save selection to state
   */
  saveSelection() {
    try {
      this.stateManager.setState('lastWheelModule', {
        id: this.selectedModule.id,
        title: this.selectedModule.title,
        category: this.selectedModule.category,
        selectedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save wheel state:', error);
      // Non-critical, continue anyway
    }
  }

  /**
   * Navigate to the selected module
   */
  navigateToModule() {
    if (!this.selectedModule) {
      toastNotification.warning('Bitte wähle zuerst ein Modul aus');
      return;
    }

    try {
      window.location.hash = `#/modules/${this.selectedModule.id}`;
    } catch (error) {
      console.error('Navigation failed:', error);
      toastNotification.error('Modul konnte nicht geöffnet werden');
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Cleanup if needed
  }
}

export default WheelView;
