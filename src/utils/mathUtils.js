/**
 * Math Utilities
 * Helper functions for mathematical operations and calculations
 */

/**
 * Get CSS custom property value from root
 * @param {string} propertyName - CSS custom property name (e.g., '--color-success')
 * @returns {string} Color value
 */
function getCSSVariable(propertyName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(propertyName)
    .trim();
}

/**
 * Get color based on percentage value
 * @param {number} percentage - Percentage value (0-100)
 * @param {Object} thresholds - Custom color thresholds (optional)
 * @returns {string} Color value (CSS custom property or hex)
 */
export function getPercentageColor(percentage, thresholds = null) {
  const defaultThresholds = {
    excellent: { min: 90, color: 'var(--color-success)' },
    good: { min: 70, color: 'var(--color-primary)' },
    average: { min: 50, color: 'var(--color-warning)' },
    poor: { min: 0, color: 'var(--color-error)' },
  };

  const colorThresholds = thresholds || defaultThresholds;

  if (percentage >= colorThresholds.excellent.min) {
    return colorThresholds.excellent.color;
  } else if (percentage >= colorThresholds.good.min) {
    return colorThresholds.good.color;
  } else if (percentage >= colorThresholds.average.min) {
    return colorThresholds.average.color;
  } else {
    return colorThresholds.poor.color;
  }
}

/**
 * Clamp a number between min and max values
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
export function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Round to specified decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded value
 */
export function roundTo(value, decimals = 2) {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

export default {
  getPercentageColor,
  clamp,
  calculatePercentage,
  roundTo,
};
