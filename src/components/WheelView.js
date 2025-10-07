/**
 * WheelView - Random module selector with spinning animation
 * Provides a gamified way to discover learning modules
 */

import accessibilityHelper from '../utils/AccessibilityHelper.js';
import LoadingSpinner from './LoadingSpinner.js';
import EmptyState from './EmptyState.js';
import toastNotification from './ToastNotification.js';
import WheelModuleValidator from '../utils/WheelModuleValidator.js';

class WheelView {
  constructor(services) {
    this.services = services;
    this.ihkContentService = services.ihkContentService;
    this.stateManager = services.stateManager;
    this.router = services.router;
    this.modules = [];
    this.selectedModule = null;
    this.isSpinning = false;
    this.validator = new WheelModuleValidator();
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

        // Check if we have enough valid modules
        if (this.modules.length === 0) {
          container.innerHTML = '';
          container.appendChild(this.showNoModulesMessage());
          return;
        }

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
        console.error('WheelView: Critical error during render:', error);
        this.logCriticalError('render', error);

        const errorState = EmptyState.create({
          icon: '⚠️',
          title: 'Fehler beim Laden des Glücksrads',
          message:
            'Die Module konnten nicht geladen werden. Bitte versuchen Sie es erneut.',
          action: {
            label: 'Erneut versuchen',
            onClick: () => {
              // Force reload with fresh state
              this.modules = [];
              this.selectedModule = null;
              this.render()
                .then(newContainer => {
                  const currentContainer =
                    document.querySelector('.wheel-view');
                  if (currentContainer && currentContainer.parentNode) {
                    currentContainer.parentNode.replaceChild(
                      newContainer,
                      currentContainer
                    );
                  }
                })
                .catch(retryError => {
                  console.error('WheelView: Retry also failed:', retryError);
                  toastNotification.error('Wiederholung fehlgeschlagen');
                });
            },
          },
        });
        container.innerHTML = '';
        container.appendChild(errorState);
        toastNotification.error('Glücksrad konnte nicht geladen werden');
      }
    }, 0);

    return container;
  }

  /**
   * Load modules from IHKContentService with comprehensive error handling
   */
  async loadModules() {
    let rawModules = [];
    let loadingSource = 'unknown';

    try {
  console.warn('WheelView: Starting module loading...');

      // Attempt to load modules from IHKContentService
      try {
        const result = await this.ihkContentService.searchContent('', {});

        if (Array.isArray(result) && result.length > 0) {
          rawModules = result;
          loadingSource = 'IHKContentService';
          console.warn(
            `WheelView: Successfully loaded ${result.length} modules from IHKContentService`
          );
        } else {
          console.warn(
            'WheelView: IHKContentService returned empty or invalid result:',
            result
          );
          throw new Error('IHKContentService returned no valid modules');
        }
      } catch (serviceError) {
        console.error('WheelView: IHKContentService failed:', serviceError);

        // Fallback to validator's fallback modules
        console.warn(
          'WheelView: Using fallback modules due to service failure'
        );
        rawModules = this.validator.getFallbackModules();
        loadingSource = 'fallback';
      }

      // Validate and filter modules
      try {
        console.warn(`WheelView: Validating ${rawModules.length} raw modules...`);
        this.modules = this.validator.filterValidModules(rawModules);

        if (this.modules.length === 0) {
          console.error(
            'WheelView: All modules failed validation, using emergency fallback'
          );
          this.modules = this.validator.getFallbackModules();
          loadingSource = 'emergency-fallback';
        }

        console.warn(
          `WheelView: Successfully validated ${this.modules.length} modules from ${loadingSource}`
        );
      } catch (validationError) {
        console.error('WheelView: Module validation failed:', validationError);

        // Last resort - use emergency fallback
        try {
          this.modules = this.validator.getFallbackModules();
          loadingSource = 'emergency-fallback';
          console.warn('WheelView: Using emergency fallback modules');
        } catch (fallbackError) {
          console.error(
            'WheelView: Even fallback modules failed:',
            fallbackError
          );
          // Create minimal valid module as absolute last resort
          this.modules = [
            {
              id: 'emergency-module',
              title: 'Learning Module',
              category: 'general',
            },
          ];
          loadingSource = 'absolute-emergency';
        }
      }
    } catch (criticalError) {
      console.error(
        'WheelView: Critical error during module loading:',
        criticalError
      );

      // Absolute last resort - create a single valid module
      this.modules = [
        {
          id: 'critical-error-fallback',
          title: 'Learning Module',
          category: 'general',
        },
      ];
      loadingSource = 'critical-error-fallback';

      // Log the critical error for debugging
      this.logCriticalError('loadModules', criticalError);
    }

    // Final validation and logging
    const finalValidation = this.modules.every(module =>
      this.validator.validateModule(module)
    );
    if (!finalValidation) {
      console.error(
        'WheelView: Final validation failed - some modules are still invalid'
      );
      this.modules = this.validator.getFallbackModules();
      loadingSource = 'final-validation-fallback';
    }

    console.warn(
      `WheelView: Module loading complete - ${this.modules.length} valid modules from ${loadingSource}`
    );
  }

  /**
   * Show message when no modules are available
   */
  showNoModulesMessage() {
    return EmptyState.create({
      icon: '🎯',
      title: 'Keine Module verfügbar',
      message:
        'Es sind derzeit keine gültigen Module zum Lernen verfügbar. Bitte versuchen Sie es später erneut.',
      action: {
        label: 'Erneut laden',
        onClick: () => {
          // Reload the entire wheel view
          this.render().then(newContainer => {
            const currentContainer = document.querySelector('.wheel-view');
            if (currentContainer && currentContainer.parentNode) {
              currentContainer.parentNode.replaceChild(
                newContainer,
                currentContainer
              );
            }
          });
        },
      },
    });
  }

  /**
   * Load last selected module from state with validation
   */
  loadLastSelection() {
    try {
      const lastModule = this.stateManager.getState('lastWheelModule');

      if (lastModule && this.validator.validateModule(lastModule)) {
        this.selectedModule = lastModule;
        this.updateDisplay();
        console.log(
          'WheelView: Restored last wheel selection:',
          lastModule.title
        );
      } else if (lastModule) {
        console.warn(
          'WheelView: Last saved module is invalid, ignoring:',
          lastModule
        );
        // Clear invalid saved state
        try {
          this.stateManager.setState('lastWheelModule', null);
        } catch (clearError) {
          console.error(
            'WheelView: Failed to clear invalid saved state:',
            clearError
          );
        }
      }
    } catch (error) {
      console.error('WheelView: Error loading last selection:', error);
      this.logCriticalError('loadLastSelection', error);
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
          <div class="wheel-result-text">Klicke auf das Rad zum Drehen</div>
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

    // Additional validation - filter modules again before rendering
    const validModules = this.validator.filterValidModules(this.modules);

    if (validModules.length === 0) {
      console.error('WheelView: No valid modules to render in wheel');
      return '<div class="wheel-placeholder">No valid modules available</div>';
    }

    // Use validated modules for rendering
    const modulesToRender = validModules;

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

    const segmentAngle = 360 / modulesToRender.length;
    const radius = 380; // Increased for longer text
    const centerX = 400; // Increased
    const centerY = 400; // Increased

    let segments = '';

    modulesToRender.forEach((module, index) => {
      // Modules are already validated, but add extra safety check
      if (!this.validator.validateModule(module)) {
        console.warn(
          'WheelView: Invalid module found during rendering, skipping:',
          module
        );
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
      <div class="selected-module-container" id="selected-module-container">
        <p class="selected-module" id="selected-module-text">Noch kein Modul ausgewählt</p>
        <p class="click-hint" id="click-hint" style="display: none;">👆 Klicken zum Öffnen</p>
      </div>
    `;

    return display;
  }

  /**
   * Spin the wheel and select a random module
   */
  async spin() {
    if (this.isSpinning) return;

    // Validate modules before spinning
    const validModules = this.validator.filterValidModules(this.modules);

    if (validModules.length === 0) {
      console.error('WheelView: No valid modules available for spinning');
      toastNotification.error('Keine gültigen Module zum Drehen verfügbar');
      return;
    }

    this.isSpinning = true;

    // Hide buttons and overlay during spin
    const spinOverlay = document.querySelector('#wheel-spin-overlay');
    const againBtn = document.querySelector('#btn-again');
    const gotoBtn = document.querySelector('#btn-goto');

    if (spinOverlay) spinOverlay.style.display = 'none';
    if (againBtn) againBtn.style.display = 'none';
    if (gotoBtn) gotoBtn.style.display = 'none';

    // Select random module from valid modules only
    const selectedIndex = Math.floor(Math.random() * validModules.length);
    this.selectedModule = validModules[selectedIndex];

    // Validate the selected module
    if (!this.validator.validateModule(this.selectedModule)) {
      console.error(
        'WheelView: Selected module is invalid:',
        this.selectedModule
      );
      // Fallback to first valid module
      this.selectedModule = validModules[0];
    }

    console.warn('🎯 Spinning wheel:');
    console.warn('  Selected index:', selectedIndex);
    console.warn('  Selected module:', this.selectedModule.title);

    // Find the index of selected module in the original modules array for animation
    const animationIndex = this.modules.findIndex(
      m => m.id === this.selectedModule.id
    );
    const indexToUse = animationIndex >= 0 ? animationIndex : selectedIndex;

    // Animate the selection
    await this.animateSelection(indexToUse);

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

    console.warn('🎲 Animation calculation:');
    console.warn('  Segment angle:', segmentAngle);
    console.warn('  Target segment center:', targetSegmentCenter);
    console.warn('  Target angle:', targetAngle);
    console.warn('  Total rotation:', totalRotation);
    console.warn('  Final module:', this.selectedModule.title);

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
      resultDisplay.innerHTML =
        '<div class="wheel-result-text">Spinning...</div>';
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

      console.warn('🏆 Winner verification:');
      console.warn('  Final index (selected):', finalIndex);
      console.warn('  Winner module:', winnerModule.title);
      console.warn('  Total rotation:', totalRotation);
      console.warn('  Final rotation (mod 360):', finalRotation);
      console.warn(
        '  Segment 0 center after rotation:',
        segment0CenterAfterRotation
      );
      console.warn('  Calculated segment at pointer:', actualSegmentAtPointer);

      resultDisplay.innerHTML = `
        <span class="winner-text">${winnerModule.title}</span>
        <span class="winner-click-icon">🎯</span>
      `;
      resultDisplay.style.opacity = '1';
      resultDisplay.classList.add('wheel-result-highlight');

      // Make the result display clickable
      const resultContainer = resultDisplay.parentElement;
      if (resultContainer) {
        resultContainer.style.cursor = 'pointer';
        resultContainer.classList.add('clickable-result');
        resultContainer.setAttribute('role', 'button');
        resultContainer.setAttribute('tabindex', '0');
        resultContainer.setAttribute(
          'aria-label',
          `Open winning module: ${winnerModule.title}`
        );

        // Remove existing event listeners to avoid duplicates
        const newResultContainer = resultContainer.cloneNode(true);
        resultContainer.parentNode.replaceChild(
          newResultContainer,
          resultContainer
        );

        // Add click event listener to the new container
        newResultContainer.addEventListener('click', () => {
          this.navigateToModule();
        });

        // Add keyboard support
        newResultContainer.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.navigateToModule();
          }
        });
      }

      // Remove highlight after animation
      setTimeout(() => {
        const currentResultDisplay = document.querySelector(
          '.wheel-result-display .wheel-result-text'
        );
        if (currentResultDisplay) {
          currentResultDisplay.classList.remove('wheel-result-highlight');
        }
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
    const selectedContainer = document.querySelector(
      '#selected-module-container'
    );
    const clickHint = document.querySelector('#click-hint');

    if (selectedText && this.selectedModule) {
      selectedText.textContent = `${this.selectedModule.title} (${this.selectedModule.category || 'N/A'})`;

      // Make the selected module clickable
      if (selectedContainer) {
        selectedContainer.style.cursor = 'pointer';
        selectedContainer.classList.add('clickable-module');
        selectedContainer.setAttribute('role', 'button');
        selectedContainer.setAttribute('tabindex', '0');
        selectedContainer.setAttribute(
          'aria-label',
          `Open module: ${this.selectedModule.title}`
        );

        // Show click hint
        if (clickHint) {
          clickHint.style.display = 'block';
        }

        // Remove existing event listeners to avoid duplicates
        const newContainer = selectedContainer.cloneNode(true);
        selectedContainer.parentNode.replaceChild(
          newContainer,
          selectedContainer
        );

        // Add click event listener
        newContainer.addEventListener('click', () => {
          this.navigateToModule();
        });

        // Add keyboard support
        newContainer.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.navigateToModule();
          }
        });

        // Add hover effect
        newContainer.addEventListener('mouseenter', () => {
          newContainer.classList.add('hover');
        });

        newContainer.addEventListener('mouseleave', () => {
          newContainer.classList.remove('hover');
        });
      }
    }
  }

  /**
   * Save selection to state with error handling
   */
  saveSelection() {
    try {
      // Validate selected module before saving
      if (!this.validator.validateModule(this.selectedModule)) {
        console.warn(
          'WheelView: Cannot save invalid selected module:',
          this.selectedModule
        );
        return;
      }

      const stateData = {
        id: this.selectedModule.id,
        title: this.selectedModule.title,
        category: this.selectedModule.category,
        selectedAt: new Date().toISOString(),
      };

  this.stateManager.setState('lastWheelModule', stateData);
  console.warn('WheelView: Successfully saved wheel selection to state');
    } catch (error) {
      console.error('WheelView: Failed to save wheel state:', error);
      // Non-critical error, log but continue
      this.logCriticalError('saveSelection', error);
    }
  }

  /**
   * Navigate to the selected module with error handling
   */
  navigateToModule() {
    if (!this.selectedModule) {
      toastNotification.warning('Bitte wähle zuerst ein Modul aus');
      return;
    }

    // Validate selected module before navigation
    if (!this.validator.validateModule(this.selectedModule)) {
      console.error(
        'WheelView: Cannot navigate to invalid module:',
        this.selectedModule
      );
      toastNotification.error('Das ausgewählte Modul ist ungültig');
      return;
    }

    try {
  console.warn('WheelView: Navigating to module:', this.selectedModule.id);
      window.location.hash = `#/modules/${this.selectedModule.id}`;
    } catch (error) {
      console.error('WheelView: Navigation failed:', error);
      this.logCriticalError('navigateToModule', error);
      toastNotification.error('Modul konnte nicht geöffnet werden');
    }
  }

  /**
   * Log critical errors for debugging
   * @param {string} operation - The operation that failed
   * @param {Error} error - The error that occurred
   */
  logCriticalError(operation, error) {
    const errorInfo = {
      operation: operation,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      timestamp: new Date().toISOString(),
      modules: this.modules ? this.modules.length : 'undefined',
      selectedModule: this.selectedModule ? this.selectedModule.id : 'none',
    };

    console.error('WheelView: Critical Error Log:', errorInfo);

    // Could also send to error tracking service here
    // errorTrackingService.logError(errorInfo);
  }

  /**
   * Safe method to get module count with error handling
   * @returns {number} - Number of valid modules
   */
  getValidModuleCount() {
    try {
      if (!Array.isArray(this.modules)) {
        return 0;
      }

      const validModules = this.validator.filterValidModules(this.modules);
      return validModules.length;
    } catch (error) {
      console.error('WheelView: Error getting module count:', error);
      return 0;
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
