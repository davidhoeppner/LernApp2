/**
 * ProgressBar Component
 * Reusable progress bar component with consistent styling and accessibility
 */

import { getPercentageColor } from '../utils/mathUtils.js';

/**
 * Create a standard progress bar element
 * @param {Object} options - Progress bar configuration
 * @param {number} options.percentage - Progress percentage (0-100)
 * @param {string} options.label - Accessible label for the progress bar
 * @param {string} options.className - Additional CSS class names
 * @param {string} options.color - Custom color (optional, auto-calculated if not provided)
 * @param {boolean} options.showPercentage - Whether to show percentage text
 * @returns {HTMLElement} Progress bar element
 */
export function createProgressBar(options = {}) {
  const {
    percentage = 0,
    label = 'Progress',
    className = '',
    color = null,
    showPercentage = false,
  } = options;

  const container = document.createElement('div');
  container.className = `progress-bar-container ${className}`.trim();

  if (showPercentage) {
    const header = document.createElement('div');
    header.className = 'progress-bar-header';
    header.innerHTML = `
      <span class="progress-bar-label">${label}</span>
      <span class="progress-bar-percentage">${percentage}%</span>
    `;
    container.appendChild(header);
  }

  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressBar.setAttribute('role', 'progressbar');
  progressBar.setAttribute('aria-label', label);
  progressBar.setAttribute('aria-valuenow', percentage);
  progressBar.setAttribute('aria-valuemin', '0');
  progressBar.setAttribute('aria-valuemax', '100');

  const progressFill = document.createElement('div');
  progressFill.className = 'progress-fill';
  progressFill.style.width = `${percentage}%`;

  if (color) {
    progressFill.style.backgroundColor = color;
  }

  progressBar.appendChild(progressFill);
  container.appendChild(progressBar);

  return container;
}

/**
 * Create a progress bar with icon and label
 * @param {Object} options - Progress bar configuration
 * @param {string} options.icon - Icon/emoji to display
 * @param {string} options.label - Label text
 * @param {number} options.percentage - Progress percentage (0-100)
 * @param {Object} options.colorThresholds - Custom color thresholds
 * @returns {string} HTML string for progress bar
 */
export function renderProgressBarWithIcon(options = {}) {
  const { icon = '', label = '', percentage = 0, colorThresholds } = options;

  const color = getPercentageColor(percentage, colorThresholds);

  return `
    <div class="progress-bar-item">
      <div class="progress-bar-header">
        ${icon ? `<span class="progress-bar-icon">${icon}</span>` : ''}
        <span class="progress-bar-label">${label}</span>
        <span class="progress-bar-value">${percentage}%</span>
      </div>
      <div class="progress-bar-track">
        <div 
          class="progress-bar-fill" 
          style="width: ${percentage}%; background-color: ${color};"
          role="progressbar"
          aria-label="${label} progress"
          aria-valuenow="${percentage}"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
    </div>
  `;
}

/**
 * Create a simple inline progress bar (HTML string)
 * @param {Object} options - Progress bar configuration
 * @param {number} options.percentage - Progress percentage (0-100)
 * @param {string} options.label - Accessible label
 * @param {string} options.className - Additional CSS classes
 * @returns {string} HTML string for progress bar
 */
export function renderProgressBar(options = {}) {
  const { percentage = 0, label = 'Progress', className = '' } = options;

  return `
    <div class="progress-bar ${className}" 
         role="progressbar" 
         aria-label="${label}"
         aria-valuenow="${percentage}" 
         aria-valuemin="0" 
         aria-valuemax="100">
      <div class="progress-fill" style="width: ${percentage}%"></div>
    </div>
  `;
}

/**
 * Update an existing progress bar's value
 * @param {HTMLElement} progressBar - Progress bar element
 * @param {number} percentage - New percentage value
 */
export function updateProgressBar(progressBar, percentage) {
  if (!progressBar) return;

  const fill = progressBar.querySelector('.progress-fill');
  if (fill) {
    fill.style.width = `${percentage}%`;
  }

  progressBar.setAttribute('aria-valuenow', percentage);
}

/**
 * Create a circular progress indicator (SVG)
 * @param {Object} options - Progress configuration
 * @param {number} options.percentage - Progress percentage (0-100)
 * @param {number} options.size - Size in pixels (default: 100)
 * @param {string} options.color - Stroke color
 * @returns {string} SVG HTML string
 */
export function renderCircularProgress(options = {}) {
  const {
    percentage = 0,
    size = 100,
    color = 'var(--color-primary)',
  } = options;

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference}, ${circumference}`;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" class="circular-progress">
      <circle
        cx="50"
        cy="50"
        r="${radius}"
        class="progress-background"
        fill="none"
        stroke="var(--color-bg-tertiary)"
        stroke-width="10"
      ></circle>
      <circle
        cx="50"
        cy="50"
        r="${radius}"
        class="progress-bar"
        fill="none"
        stroke="${color}"
        stroke-width="10"
        stroke-linecap="round"
        style="stroke-dasharray: ${strokeDasharray}"
        transform="rotate(-90 50 50)"
      ></circle>
      <text x="50" y="50" text-anchor="middle" dy="7" class="progress-text">
        ${percentage}%
      </text>
    </svg>
  `;
}

export default {
  createProgressBar,
  renderProgressBar,
  renderProgressBarWithIcon,
  updateProgressBar,
  renderCircularProgress,
};
