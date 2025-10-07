/**
 * SpecializationIndicator Component
 * 
 * Displays the current specialization in the navigation bar with
 * quick switching functionality.
 * 
 * Features:
 * - Current specialization display with icon and name
 * - Quick specialization switching dropdown
 * - Visual specialization identifier (icon and color)
 * - Accessible keyboard navigation
 * - Enhanced confirmation dialog for specialization changes
 * - Progress preservation across switches
 * - User feedback notifications
 */
class SpecializationIndicator {
  constructor(specializationService, onSpecializationChange) {
    this.specializationService = specializationService;
    this.onSpecializationChange = onSpecializationChange || (() => {});
    this.currentSpecialization = null;
    this.isDropdownOpen = false;
    this.container = null;
    
    // Bind methods
    this.render = this.render.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.closeDropdown = this.closeDropdown.bind(this);
    this.handleSpecializationSelect = this.handleSpecializationSelect.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    
    // Initialize
    this.init();
  }

  /**
   * Initialize the component
   */
  async init() {
    try {
      // Get current specialization
      this.currentSpecialization = this.specializationService.getCurrentSpecialization();
      
      // Listen for specialization changes
      document.addEventListener('specialization-changed', (event) => {
        this.currentSpecialization = event.detail.specializationId;
        this.updateDisplay();
      });
      
    } catch (error) {
      console.error('Error initializing SpecializationIndicator:', error);
    }
  }

  /**
   * Render the specialization indicator
   */
  render() {
    if (!this.currentSpecialization) {
      return this.renderPlaceholder();
    }

    const specialization = this.specializationService.getSpecializationConfig(this.currentSpecialization);
    if (!specialization) {
      return this.renderPlaceholder();
    }

    this.container = document.createElement('div');
    this.container.className = 'specialization-indicator';
    
    // Main button
    const button = document.createElement('button');
    button.className = 'specialization-button';
    button.setAttribute('aria-label', `Aktuelle Fachrichtung: ${specialization.name}. Klicken zum Wechseln`);
    button.setAttribute('aria-expanded', this.isDropdownOpen ? 'true' : 'false');
    button.setAttribute('aria-haspopup', 'true');
    button.addEventListener('click', this.toggleDropdown);
    button.addEventListener('keydown', this.handleKeyDown);
    
    // Button content
    const icon = document.createElement('span');
    icon.className = 'specialization-icon';
    icon.style.color = specialization.color;
    icon.textContent = specialization.icon;
    
    const content = document.createElement('div');
    content.className = 'specialization-content';
    
    const label = document.createElement('span');
    label.className = 'specialization-label';
    label.textContent = 'Fachrichtung:';
    
    const name = document.createElement('span');
    name.className = 'specialization-name';
    name.textContent = specialization.shortName;
    
    const chevron = document.createElement('span');
    chevron.className = 'specialization-chevron';
    chevron.innerHTML = '▼';
    
    content.appendChild(label);
    content.appendChild(name);
    
    button.appendChild(icon);
    button.appendChild(content);
    button.appendChild(chevron);
    
    // Dropdown menu
    const dropdown = this.renderDropdown();
    
    this.container.appendChild(button);
    this.container.appendChild(dropdown);
    
    return this.container;
  }

  /**
   * Render placeholder when no specialization is selected
   */
  renderPlaceholder() {
    const container = document.createElement('div');
    container.className = 'specialization-indicator specialization-placeholder';
    
    const button = document.createElement('button');
    button.className = 'specialization-button';
    button.setAttribute('aria-label', 'Fachrichtung auswählen');
    button.addEventListener('click', () => {
      // Trigger specialization selection modal
      this.onSpecializationChange('show-modal');
    });
    
    const icon = document.createElement('span');
    icon.className = 'specialization-icon';
    icon.textContent = '⚙️';
    
    const content = document.createElement('div');
    content.className = 'specialization-content';
    
    const label = document.createElement('span');
    label.className = 'specialization-label';
    label.textContent = 'Fachrichtung:';
    
    const name = document.createElement('span');
    name.className = 'specialization-name';
    name.textContent = 'Auswählen';
    
    content.appendChild(label);
    content.appendChild(name);
    
    button.appendChild(icon);
    button.appendChild(content);
    
    container.appendChild(button);
    
    return container;
  }

  /**
   * Render the dropdown menu
   */
  renderDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = `specialization-dropdown ${this.isDropdownOpen ? 'open' : ''}`;
    dropdown.setAttribute('role', 'menu');
    dropdown.setAttribute('aria-label', 'Fachrichtung wechseln');
    
    const specializations = this.specializationService.getAvailableSpecializations();
    
    specializations.forEach((spec, index) => {
      const option = document.createElement('button');
      option.className = `specialization-dropdown-option ${
        this.currentSpecialization === spec.id ? 'selected' : ''
      }`;
      option.setAttribute('role', 'menuitem');
      option.setAttribute('tabindex', this.isDropdownOpen ? '0' : '-1');
      option.setAttribute('aria-label', `Wechseln zu ${spec.description}`);
      
      // Add click and keyboard event listeners
      option.addEventListener('click', () => this.handleSpecializationSelect(spec.id));
      option.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleSpecializationSelect(spec.id);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.focusNextOption(index);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.focusPreviousOption(index);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.closeDropdown();
        }
      });
      
      // Option content
      const optionIcon = document.createElement('span');
      optionIcon.className = 'option-icon';
      optionIcon.style.color = spec.color;
      optionIcon.textContent = spec.icon;
      
      const optionContent = document.createElement('div');
      optionContent.className = 'option-content';
      
      const optionName = document.createElement('span');
      optionName.className = 'option-name';
      optionName.textContent = spec.name;
      
      const optionShort = document.createElement('span');
      optionShort.className = 'option-short';
      optionShort.textContent = spec.shortName;
      
      optionContent.appendChild(optionName);
      optionContent.appendChild(optionShort);
      
      // Selection indicator
      const indicator = document.createElement('span');
      indicator.className = 'option-indicator';
      if (this.currentSpecialization === spec.id) {
        indicator.textContent = '✓';
      }
      
      option.appendChild(optionIcon);
      option.appendChild(optionContent);
      option.appendChild(indicator);
      
      dropdown.appendChild(option);
    });
    
    return dropdown;
  }

  /**
   * Toggle dropdown visibility
   */
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    
    if (this.isDropdownOpen) {
      this.openDropdown();
    } else {
      this.closeDropdown();
    }
  }

  /**
   * Open dropdown
   */
  openDropdown() {
    this.isDropdownOpen = true;
    
    if (this.container) {
      const button = this.container.querySelector('.specialization-button');
      const dropdown = this.container.querySelector('.specialization-dropdown');
      
      if (button && dropdown) {
        button.setAttribute('aria-expanded', 'true');
        dropdown.classList.add('open');
        
        // Enable tabindex for dropdown options
        const options = dropdown.querySelectorAll('.specialization-dropdown-option');
        options.forEach(option => {
          option.setAttribute('tabindex', '0');
        });
        
        // Focus first option
        if (options.length > 0) {
          options[0].focus();
        }
      }
    }
    
    // Add click outside listener
    setTimeout(() => {
      document.addEventListener('click', this.handleClickOutside);
    }, 0);
  }

  /**
   * Close dropdown
   */
  closeDropdown() {
    this.isDropdownOpen = false;
    
    if (this.container) {
      const button = this.container.querySelector('.specialization-button');
      const dropdown = this.container.querySelector('.specialization-dropdown');
      
      if (button && dropdown) {
        button.setAttribute('aria-expanded', 'false');
        dropdown.classList.remove('open');
        
        // Disable tabindex for dropdown options
        const options = dropdown.querySelectorAll('.specialization-dropdown-option');
        options.forEach(option => {
          option.setAttribute('tabindex', '-1');
        });
        
        // Return focus to button
        button.focus();
      }
    }
    
    // Remove click outside listener
    document.removeEventListener('click', this.handleClickOutside);
  }

  /**
   * Handle specialization selection from dropdown
   */
  async handleSpecializationSelect(specializationId) {
    try {
      if (specializationId === this.currentSpecialization) {
        // Same specialization selected, just close dropdown
        this.closeDropdown();
        return;
      }

      // Close dropdown first
      this.closeDropdown();

      // Show confirmation dialog for specialization change
      const confirmed = await this.showSpecializationChangeConfirmation(specializationId);
      
      if (confirmed) {
        // Perform the specialization change
        const success = await this.specializationService.setSpecialization(specializationId);
        
        if (success) {
          this.currentSpecialization = specializationId;
          this.updateDisplay();
          
          // Show success notification
          this.showSpecializationChangeSuccess(specializationId);
          
          // Notify parent component
          this.onSpecializationChange(specializationId);
          
          // Trigger app-wide specialization change event with category update signal
          const event = new CustomEvent('specialization-changed', {
            detail: { 
              specializationId,
              updateCategories: true // Signal that three-tier category relevance should be recalculated
            },
            bubbles: true
          });
          document.dispatchEvent(event);
        } else {
          this.showSpecializationChangeError('Fehler beim Wechseln der Fachrichtung');
        }
      }

    } catch (error) {
      console.error('Error selecting specialization:', error);
      this.showSpecializationChangeError('Ein unerwarteter Fehler ist aufgetreten');
    }
  }

  /**
   * Show confirmation dialog for specialization change
   */
  async showSpecializationChangeConfirmation(newSpecializationId) {
    return new Promise((resolve) => {
      const currentSpec = this.specializationService.getSpecializationConfig(this.currentSpecialization);
      const newSpec = this.specializationService.getSpecializationConfig(newSpecializationId);
      
      // Create confirmation dialog
      const dialog = document.createElement('div');
      dialog.className = 'specialization-change-confirmation';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'change-confirmation-title');
      
      // Create dialog content using DOM methods
      const overlay = document.createElement('div');
      overlay.className = 'confirmation-overlay';
      
      const dialogContent = document.createElement('div');
      dialogContent.className = 'confirmation-dialog';
      
      // Header
      const header = document.createElement('div');
      header.className = 'confirmation-header';
      
      const title = document.createElement('h3');
      title.id = 'change-confirmation-title';
      title.textContent = 'Fachrichtung wechseln?';
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'confirmation-close';
      closeBtn.setAttribute('aria-label', 'Dialog schließen');
      closeBtn.innerHTML = '&times;';
      
      header.appendChild(title);
      header.appendChild(closeBtn);
      
      // Body
      const body = document.createElement('div');
      body.className = 'confirmation-body';
      
      const comparison = document.createElement('div');
      comparison.className = 'specialization-comparison';
      
      // Current spec
      const currentDiv = document.createElement('div');
      currentDiv.className = 'current-spec';
      
      const currentLabel = document.createElement('div');
      currentLabel.className = 'spec-label';
      currentLabel.textContent = 'Aktuell:';
      
      const currentDisplay = document.createElement('div');
      currentDisplay.className = 'spec-display';
      
      const currentIcon = document.createElement('span');
      currentIcon.className = 'spec-icon';
      currentIcon.style.color = currentSpec.color;
      currentIcon.textContent = currentSpec.icon;
      
      const currentName = document.createElement('span');
      currentName.className = 'spec-name';
      currentName.textContent = currentSpec.name;
      
      currentDisplay.appendChild(currentIcon);
      currentDisplay.appendChild(currentName);
      currentDiv.appendChild(currentLabel);
      currentDiv.appendChild(currentDisplay);
      
      // Arrow
      const arrow = document.createElement('div');
      arrow.className = 'change-arrow';
      arrow.textContent = '→';
      
      // New spec
      const newDiv = document.createElement('div');
      newDiv.className = 'new-spec';
      
      const newLabel = document.createElement('div');
      newLabel.className = 'spec-label';
      newLabel.textContent = 'Neu:';
      
      const newDisplay = document.createElement('div');
      newDisplay.className = 'spec-display';
      
      const newIcon = document.createElement('span');
      newIcon.className = 'spec-icon';
      newIcon.style.color = newSpec.color;
      newIcon.textContent = newSpec.icon;
      
      const newName = document.createElement('span');
      newName.className = 'spec-name';
      newName.textContent = newSpec.name;
      
      newDisplay.appendChild(newIcon);
      newDisplay.appendChild(newName);
      newDiv.appendChild(newLabel);
      newDiv.appendChild(newDisplay);
      
      comparison.appendChild(currentDiv);
      comparison.appendChild(arrow);
      comparison.appendChild(newDiv);
      
      // Info
      const info = document.createElement('div');
      info.className = 'confirmation-info';
      
      const infoTitle = document.createElement('p');
      infoTitle.innerHTML = '<strong>Was passiert beim Wechsel?</strong>';
      
      const infoList = document.createElement('ul');
      const benefits = [
        '✅ Dein Lernfortschritt bleibt vollständig erhalten',
        '📚 Die Inhalte werden an deine neue Fachrichtung angepasst',
        '🎯 Relevante Module werden priorisiert angezeigt'
      ];
      
      benefits.forEach(benefit => {
        const li = document.createElement('li');
        li.textContent = benefit;
        infoList.appendChild(li);
      });
      
      info.appendChild(infoTitle);
      info.appendChild(infoList);
      
      body.appendChild(comparison);
      body.appendChild(info);
      
      // Footer
      const footer = document.createElement('div');
      footer.className = 'confirmation-footer';
      
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn btn-secondary cancel-btn';
      cancelBtn.textContent = 'Abbrechen';
      
      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'btn btn-primary confirm-btn';
      confirmBtn.textContent = 'Wechseln';
      
      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);
      
      // Assemble dialog
      dialogContent.appendChild(header);
      dialogContent.appendChild(body);
      dialogContent.appendChild(footer);
      
      dialog.appendChild(overlay);
      dialog.appendChild(dialogContent);
      
      document.body.appendChild(dialog);
      document.body.style.overflow = 'hidden';
      
      // Event handlers
      const cleanup = () => {
        dialog.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeydown);
      };
      
      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };
      
      const handleCancel = () => {
        cleanup();
        resolve(false);
      };
      
      const handleKeydown = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
        }
      };
      
      // Attach event listeners
      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      closeBtn.addEventListener('click', handleCancel);
      overlay.addEventListener('click', handleCancel);
      document.addEventListener('keydown', handleKeydown);
      
      // Focus cancel button for safety
      setTimeout(() => {
        cancelBtn.focus();
      }, 100);
    });
  }

  /**
   * Show success notification for specialization change
   */
  showSpecializationChangeSuccess(specializationId) {
    const specialization = this.specializationService.getSpecializationConfig(specializationId);
    
    // Create success toast
    const toast = document.createElement('div');
    toast.className = 'specialization-change-success-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    // Toast content
    const content = document.createElement('div');
    content.className = 'toast-content';
    
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'toast-icon-wrapper';
    
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = specialization.icon;
    
    iconWrapper.appendChild(icon);
    
    const message = document.createElement('div');
    message.className = 'toast-message';
    
    const title = document.createElement('div');
    title.className = 'toast-title';
    title.textContent = 'Fachrichtung gewechselt!';
    
    const subtitle = document.createElement('div');
    subtitle.className = 'toast-subtitle';
    subtitle.textContent = `Du lernst jetzt für ${specialization.name}`;
    
    message.appendChild(title);
    message.appendChild(subtitle);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Benachrichtigung schließen');
    closeBtn.innerHTML = '&times;';
    
    content.appendChild(iconWrapper);
    content.appendChild(message);
    content.appendChild(closeBtn);
    
    toast.appendChild(content);
    
    // Style the toast
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 1px solid #e5e7eb;
      border-left: 4px solid ${specialization.color};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 16px;
      max-width: 350px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideInFromRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    // Add event listeners
    const removeToast = () => {
      toast.style.animation = 'slideOutToRight 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    };
    
    closeBtn.addEventListener('click', removeToast);
    
    // Auto-remove after 5 seconds
    setTimeout(removeToast, 5000);
    
    // Add CSS animations if not already present
    this._addToastStyles();
  }

  /**
   * Show error notification for specialization change
   */
  showSpecializationChangeError(message) {
    const toast = document.createElement('div');
    toast.className = 'specialization-change-error-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    // Toast content
    const content = document.createElement('div');
    content.className = 'toast-content';
    
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'toast-icon-wrapper error';
    
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = '⚠️';
    
    iconWrapper.appendChild(icon);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'toast-message';
    
    const title = document.createElement('div');
    title.className = 'toast-title';
    title.textContent = 'Fehler';
    
    const subtitle = document.createElement('div');
    subtitle.className = 'toast-subtitle';
    subtitle.textContent = message;
    
    messageDiv.appendChild(title);
    messageDiv.appendChild(subtitle);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Benachrichtigung schließen');
    closeBtn.innerHTML = '&times;';
    
    content.appendChild(iconWrapper);
    content.appendChild(messageDiv);
    content.appendChild(closeBtn);
    
    toast.appendChild(content);
    
    // Style the toast
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 16px;
      max-width: 350px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideInFromRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    // Add event listeners
    const removeToast = () => {
      toast.style.animation = 'slideOutToRight 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    };
    
    closeBtn.addEventListener('click', removeToast);
    
    // Auto-remove after 7 seconds (longer for error messages)
    setTimeout(removeToast, 7000);
    
    // Add CSS animations if not already present
    this._addToastStyles();
  }

  /**
   * Focus next option in dropdown
   */
  focusNextOption(currentIndex) {
    if (!this.container) return;
    
    const options = this.container.querySelectorAll('.specialization-dropdown-option');
    const nextIndex = (currentIndex + 1) % options.length;
    options[nextIndex].focus();
  }

  /**
   * Focus previous option in dropdown
   */
  focusPreviousOption(currentIndex) {
    if (!this.container) return;
    
    const options = this.container.querySelectorAll('.specialization-dropdown-option');
    const prevIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
    options[prevIndex].focus();
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyDown(event) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleDropdown();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isDropdownOpen) {
          this.openDropdown();
        }
        break;
      case 'Escape':
        if (this.isDropdownOpen) {
          event.preventDefault();
          this.closeDropdown();
        }
        break;
    }
  }

  /**
   * Handle clicks outside the component
   */
  handleClickOutside(event) {
    if (this.container && !this.container.contains(event.target)) {
      this.closeDropdown();
    }
  }

  /**
   * Update the display when specialization changes
   */
  updateDisplay() {
    if (!this.container) return;
    
    // Re-render the component
    const parent = this.container.parentNode;
    if (parent) {
      const newContainer = this.render();
      parent.replaceChild(newContainer, this.container);
    }
  }

  /**
   * Get current specialization
   */
  getCurrentSpecialization() {
    return this.currentSpecialization;
  }

  /**
   * Check if dropdown is open
   */
  isDropdownVisible() {
    return this.isDropdownOpen;
  }

  /**
   * Add toast styles if not already present
   * @private
   */
  _addToastStyles() {
    // Styles are now in the main CSS file, so this method is simplified
    if (!document.querySelector('#specialization-indicator-animations')) {
      const styles = document.createElement('style');
      styles.id = 'specialization-indicator-animations';
      styles.textContent = `
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutToRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    this.closeDropdown();
    
    // Remove event listeners
    document.removeEventListener('click', this.handleClickOutside);
    
    if (this.container) {
      this.container.remove();
    }
  }
}

export default SpecializationIndicator;