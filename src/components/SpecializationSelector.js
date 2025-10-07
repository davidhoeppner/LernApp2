// Import removed - unused imports

/**
 * SpecializationSelector Component
 *
 * Provides a modal dialog for initial specialization selection and
 * specialization switching functionality in navigation.
 *
 * Features:
 * - Modal dialog for first-time users
 * - Specialization switching for existing users
 * - Visual indicators and descriptions for each option
 * - Confirmation dialog for specialization changes
 */
class SpecializationSelector {
  constructor(specializationService, onSelectionChange) {
    this.specializationService = specializationService;
    this.onSelectionChange = onSelectionChange || (() => {});
    this.isModalOpen = false;
    this.isFirstTime = false;
    this.currentSpecialization = null;

    // Bind methods
    this.render = this.render.bind(this);
    this.showSpecializationModal = this.showSpecializationModal.bind(this);
    this.hideSpecializationModal = this.hideSpecializationModal.bind(this);
    this.handleSpecializationChange =
      this.handleSpecializationChange.bind(this);
    this.handleModalClick = this.handleModalClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    // Initialize
    this.init();
  }

  /**
   * Initialize the component
   */
  async init() {
    try {
      // Get current specialization
      this.currentSpecialization =
        this.specializationService.getCurrentSpecialization();

      // Check if this is a first-time user (no specialization selected)
      this.isFirstTime =
        !this.specializationService.hasSelectedSpecialization();

      // Do NOT auto-show the modal; users can open it manually via navigation
      // Keep isFirstTime flag for optional UX hints, but suppress automatic popup
    } catch (error) {
      console.error('Error initializing SpecializationSelector:', error);
    }
  }

  /**
   * Check if user needs to select a specialization
   * @returns {boolean} True if user needs to select specialization
   */
  needsSpecializationSelection() {
    return !this.specializationService.hasSelectedSpecialization();
  }

  /**
   * Render the specialization selector
   */
  render() {
    const container = document.createElement('div');
    container.className = 'specialization-selector';

    // Render modal if open
    if (this.isModalOpen) {
      container.appendChild(this.renderModal());
    }

    return container;
  }

  /**
   * Render the specialization selection modal
   */
  renderModal() {
    const specializations =
      this.specializationService.getAvailableSpecializations();

    const modal = document.createElement('div');
    modal.className = 'specialization-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'specialization-modal-title');
    modal.addEventListener('click', this.handleModalClick);

    const modalContent = document.createElement('div');
    modalContent.className = 'specialization-modal-content';

    // Modal header
    const header = document.createElement('div');
    header.className = 'specialization-modal-header';

    const title = document.createElement('h2');
    title.id = 'specialization-modal-title';
    title.className = 'specialization-modal-title';
    title.textContent = this.isFirstTime
      ? 'Wähle deine Fachrichtung'
      : 'Fachrichtung wechseln';

    const subtitle = document.createElement('p');
    subtitle.className = 'specialization-modal-subtitle';
    subtitle.textContent = this.isFirstTime
      ? 'Wähle deine Spezialisierung, um relevante Lerninhalte zu erhalten.'
      : 'Du kannst jederzeit zwischen den Fachrichtungen wechseln.';

    header.appendChild(title);
    header.appendChild(subtitle);

    // Specialization options
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'specialization-options';

    specializations.forEach(spec => {
      const option = this.renderSpecializationOption(spec);
      optionsContainer.appendChild(option);
    });

    // Modal footer (only for non-first-time users)
    const footer = document.createElement('div');
    footer.className = 'specialization-modal-footer';

    if (!this.isFirstTime) {
      const cancelButton = document.createElement('button');
      cancelButton.className = 'btn btn-secondary';
      cancelButton.textContent = 'Abbrechen';
      cancelButton.addEventListener('click', this.hideSpecializationModal);
      footer.appendChild(cancelButton);
    }

    // Close button (only for non-first-time users)
    if (!this.isFirstTime) {
      const closeButton = document.createElement('button');
      closeButton.className = 'specialization-modal-close';
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Modal schließen');
      closeButton.addEventListener('click', this.hideSpecializationModal);
      header.appendChild(closeButton);
    }

    modalContent.appendChild(header);
    modalContent.appendChild(optionsContainer);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);

    // Add keyboard event listener
    document.addEventListener('keydown', this.handleKeyDown);

    return modal;
  }

  /**
   * Render a single specialization option
   */
  renderSpecializationOption(specialization) {
    const option = document.createElement('div');
    option.className = `specialization-option ${
      this.currentSpecialization === specialization.id ? 'selected' : ''
    }`;
    option.setAttribute('role', 'button');
    option.setAttribute('tabindex', '0');
    option.setAttribute(
      'aria-label',
      `${specialization.description} auswählen`
    );

    // Add click and keyboard event listeners
    const selectSpecialization = () => {
      this.handleSpecializationChange(specialization.id);
    };

    option.addEventListener('click', selectSpecialization);
    option.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectSpecialization();
      }
    });

    // Option content
    const iconContainer = document.createElement('div');
    iconContainer.className = 'specialization-icon';
    iconContainer.style.color = specialization.color;
    iconContainer.textContent = specialization.icon;

    const contentContainer = document.createElement('div');
    contentContainer.className = 'specialization-content';

    const name = document.createElement('h3');
    name.className = 'specialization-name';
    name.textContent = specialization.name;

    const fullName = document.createElement('p');
    fullName.className = 'specialization-full-name';
    fullName.textContent = specialization.description;

    const description = document.createElement('p');
    description.className = 'specialization-description';
    description.textContent = specialization.description;

    const examCode = document.createElement('span');
    examCode.className = 'specialization-exam-code';
    examCode.textContent = `Prüfung: ${specialization.examCode}`;

    contentContainer.appendChild(name);
    contentContainer.appendChild(fullName);
    contentContainer.appendChild(description);
    contentContainer.appendChild(examCode);

    // Selection indicator
    const indicator = document.createElement('div');
    indicator.className = 'specialization-indicator';
    if (this.currentSpecialization === specialization.id) {
      indicator.innerHTML = '✓';
    }

    option.appendChild(iconContainer);
    option.appendChild(contentContainer);
    option.appendChild(indicator);

    return option;
  }

  /**
   * Show the specialization selection modal
   */
  showSpecializationModal(isFirstTime = false) {
    this.isFirstTime = isFirstTime;
    this.isModalOpen = true;

    // Re-render if already in DOM
    const existingModal = document.querySelector(
      '.specialization-modal-overlay'
    );
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    const modal = this.renderModal();
    document.body.appendChild(modal);

    // Focus first option for accessibility
    setTimeout(() => {
      const firstOption = modal.querySelector('.specialization-option');
      if (firstOption) {
        firstOption.focus();
      }
    }, 100);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hide the specialization selection modal
   */
  hideSpecializationModal() {
    this.isModalOpen = false;

    // Remove modal from DOM
    const modal = document.querySelector('.specialization-modal-overlay');
    if (modal) {
      modal.remove();
    }

    // Remove keyboard event listener
    document.removeEventListener('keydown', this.handleKeyDown);

    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Handle specialization selection
   */
  async handleSpecializationChange(specializationId) {
    try {
      if (!specializationId) {
        throw new Error('Invalid specialization ID');
      }

      // Show confirmation dialog for existing users (unless first time)
      if (
        !this.isFirstTime &&
        this.currentSpecialization &&
        this.currentSpecialization !== specializationId
      ) {
        const confirmed = await this.showConfirmationDialog(specializationId);
        if (!confirmed) {
          return;
        }
      }

      // Set the new specialization
      await this.specializationService.setSpecialization(specializationId);
      this.currentSpecialization = specializationId;

      // Hide modal
      this.hideSpecializationModal();

      // Show success notification
      this.showSuccessNotification(specializationId);

      // Notify parent component
      this.onSelectionChange(specializationId);

      // Trigger app refresh to update content and three-tier category relevance
      window.dispatchEvent(
        new CustomEvent('specialization-changed', {
          detail: {
            specializationId,
            updateCategories: true, // Signal that category relevance should be recalculated
          },
        })
      );
    } catch (error) {
      console.error('Error changing specialization:', error);
      this.showErrorNotification('Fehler beim Wechseln der Fachrichtung');
    }
  }

  /**
   * Show confirmation dialog for specialization change
   */
  async showConfirmationDialog(newSpecializationId) {
    return new Promise(resolve => {
      const specialization =
        this.specializationService.getSpecializationConfig(newSpecializationId);
      const currentSpecialization =
        this.specializationService.getSpecializationConfig(
          this.currentSpecialization
        );

      // Create custom confirmation dialog
      const confirmDialog = this.createConfirmationDialog(
        currentSpecialization,
        specialization
      );
      document.body.appendChild(confirmDialog);

      // Handle confirmation
      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        confirmDialog.remove();
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };

      const handleEscape = e => {
        if (e.key === 'Escape') {
          handleCancel();
        }
      };

      // Add event listeners
      confirmDialog
        .querySelector('.confirm-btn')
        .addEventListener('click', handleConfirm);
      confirmDialog
        .querySelector('.cancel-btn')
        .addEventListener('click', handleCancel);
      confirmDialog
        .querySelector('.confirmation-close')
        .addEventListener('click', handleCancel);
      document.addEventListener('keydown', handleEscape);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Focus the cancel button by default for safety
      setTimeout(() => {
        confirmDialog.querySelector('.cancel-btn').focus();
      }, 100);
    });
  }

  /**
   * Create custom confirmation dialog
   */
  createConfirmationDialog(currentSpec, newSpec) {
    const dialog = document.createElement('div');
    dialog.className = 'confirmation-modal-overlay';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'confirmation-title');

    dialog.innerHTML = `
      <div class="confirmation-modal-content">
        <div class="confirmation-modal-header">
          <h3 id="confirmation-title" class="confirmation-title">
            Fachrichtung wechseln?
          </h3>
          <button class="confirmation-close" aria-label="Dialog schließen">&times;</button>
        </div>
        
        <div class="confirmation-modal-body">
          <div class="specialization-change-preview">
            <div class="current-spec">
              <div class="spec-label">Aktuell:</div>
              <div class="spec-info">
                <span class="spec-icon" style="color: ${currentSpec.color}">${currentSpec.icon}</span>
                <span class="spec-name">${currentSpec.name}</span>
              </div>
            </div>
            
            <div class="change-arrow">→</div>
            
            <div class="new-spec">
              <div class="spec-label">Neu:</div>
              <div class="spec-info">
                <span class="spec-icon" style="color: ${newSpec.color}">${newSpec.icon}</span>
                <span class="spec-name">${newSpec.name}</span>
              </div>
            </div>
          </div>
          
          <div class="confirmation-message">
            <p><strong>Was passiert beim Wechsel?</strong></p>
            <ul class="confirmation-details">
              <li>✅ Dein gesamter Lernfortschritt bleibt erhalten</li>
              <li>✅ Allgemeine IT-Inhalte bleiben verfügbar</li>
              <li>🔄 Die angezeigten Module werden an deine neue Fachrichtung angepasst</li>
              <li>📊 Deine Fortschrittsstatistiken werden entsprechend aktualisiert</li>
            </ul>
          </div>
        </div>
        
        <div class="confirmation-modal-footer">
          <button class="btn btn-secondary cancel-btn">Abbrechen</button>
          <button class="btn btn-primary confirm-btn">Fachrichtung wechseln</button>
        </div>
      </div>
    `;

    return dialog;
  }

  /**
   * Show success notification
   */
  showSuccessNotification(specializationId) {
    const specialization =
      this.specializationService.getSpecializationConfig(specializationId);

    // Create enhanced success notification
    const notification = document.createElement('div');
    notification.className = 'specialization-success-notification';
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');

    notification.innerHTML = `
      <div class="success-notification-content">
        <div class="success-header">
          <span class="success-icon">${specialization.icon}</span>
          <div class="success-text">
            <h4 class="success-title">Fachrichtung erfolgreich gewechselt!</h4>
            <p class="success-subtitle">Du lernst jetzt für ${specialization.name}</p>
          </div>
          <button class="success-close" aria-label="Benachrichtigung schließen">&times;</button>
        </div>
        
        <div class="success-details">
          <div class="success-benefits">
            <div class="benefit-item">
              <span class="benefit-icon">✅</span>
              <span class="benefit-text">Dein Fortschritt wurde vollständig übernommen</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">📚</span>
              <span class="benefit-text">Inhalte wurden an deine Fachrichtung angepasst</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🎯</span>
              <span class="benefit-text">Relevante Module werden jetzt priorisiert</span>
            </div>
          </div>
          
          <div class="success-actions">
            <button class="btn btn-primary btn-sm explore-content">
              Inhalte erkunden
            </button>
          </div>
        </div>
      </div>
    `;

    // Position notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      background: white;
      border: 1px solid #e5e7eb;
      border-left: 4px solid ${specialization.color};
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Add event listeners
    const closeBtn = notification.querySelector('.success-close');
    const exploreBtn = notification.querySelector('.explore-content');

    const removeNotification = () => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    };

    closeBtn.addEventListener('click', removeNotification);

    exploreBtn.addEventListener('click', () => {
      removeNotification();
      // Navigate to modules page to explore new content
      window.location.hash = '#/modules';
    });

    // Auto-remove after 8 seconds (longer for more detailed notification)
    setTimeout(removeNotification, 8000);

    // Add CSS animations if not already present
    this._addNotificationStyles();
  }

  /**
   * Add notification styles if not already present
   * @private
   */
  _addNotificationStyles() {
    if (document.querySelector('#specialization-notification-styles')) {
      return;
    }

    const styles = document.createElement('style');
    styles.id = 'specialization-notification-styles';
    styles.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .specialization-success-notification {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .success-notification-content {
        padding: 16px;
      }
      
      .success-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 12px;
      }
      
      .success-icon {
        font-size: 24px;
        flex-shrink: 0;
      }
      
      .success-text {
        flex: 1;
      }
      
      .success-title {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: #111827;
      }
      
      .success-subtitle {
        margin: 0;
        font-size: 14px;
        color: #6b7280;
      }
      
      .success-close {
        background: none;
        border: none;
        font-size: 20px;
        color: #9ca3af;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        flex-shrink: 0;
      }
      
      .success-close:hover {
        background: #f3f4f6;
        color: #374151;
      }
      
      .success-details {
        border-top: 1px solid #f3f4f6;
        padding-top: 12px;
      }
      
      .success-benefits {
        margin-bottom: 12px;
      }
      
      .benefit-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        font-size: 13px;
        color: #374151;
      }
      
      .benefit-item:last-child {
        margin-bottom: 0;
      }
      
      .benefit-icon {
        font-size: 14px;
        flex-shrink: 0;
      }
      
      .success-actions {
        display: flex;
        justify-content: flex-end;
      }
      
      .btn {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .btn-primary {
        background: #3b82f6;
        color: white;
      }
      
      .btn-primary:hover {
        background: #2563eb;
      }
      
      .btn-sm {
        padding: 4px 8px;
        font-size: 12px;
      }
      
      @media (max-width: 480px) {
        .specialization-success-notification {
          left: 10px;
          right: 10px;
          max-width: none;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Show error notification
   */
  showErrorNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">⚠️</span>
        <span class="toast-message">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  /**
   * Handle modal overlay clicks (close modal if clicking outside)
   */
  handleModalClick(event) {
    if (event.target.classList.contains('specialization-modal-overlay')) {
      // Only allow closing if not first time
      if (!this.isFirstTime) {
        this.hideSpecializationModal();
      }
    }
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(event) {
    if (event.key === 'Escape' && !this.isFirstTime) {
      this.hideSpecializationModal();
    }
  }

  /**
   * Get current specialization
   */
  getCurrentSpecialization() {
    return this.currentSpecialization;
  }

  /**
   * Check if modal is currently open
   */
  isModalVisible() {
    return this.isModalOpen;
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    this.hideSpecializationModal();

    // Remove any remaining event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}

export default SpecializationSelector;
