// Assessment i18n loader (Req 7.8)
import en from './assessment.en.json';
import de from './assessment.de.json';
import { emitEvent } from '../event/EventBus.js';

const locales = { en, de };
let currentLocale = 'en';

export function setAssessmentLocale(locale) {
  if (locales[locale]) currentLocale = locale;
  else currentLocale = 'en';
}

export function tAssessment(key) {
  const loc = locales[currentLocale] || locales.en;
  if (loc[key]) return loc[key];
  if (locales.en[key]) return locales.en[key];
  // Emit missing key event
  try {
    emitEvent('i18n.missing', { key, locale: currentLocale });
  } catch (err) {
    // Non-critical: if event bus is not available, log a warning for diagnostics
    // Use console.warn which is allowed by our ESLint config
    console.warn('Could not emit i18n.missing event', err);
  }
  return key; // Debug fallback
}
