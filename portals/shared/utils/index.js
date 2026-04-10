import { format } from 'date-fns';

/**
 * Format a Unix millisecond timestamp to "HH:mm"
 * @param {number} timestamp - Unix ms
 * @returns {string} e.g. "14:32"
 */
export function formatTime(timestamp) {
  if (!timestamp) return '';
  return format(new Date(timestamp), 'HH:mm');
}

/**
 * Convert a string to Title Case.
 * Used for patient names received from driver input.
 * @param {string} str
 * @returns {string} e.g. "rahul sharma" → "Rahul Sharma"
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Return the CSS variable name for a condition's primary color.
 * Use in className: `text-[${getConditionColor('CRITICAL')}]`
 * @param {'CRITICAL'|'SERIOUS'|'STABLE'} condition
 * @returns {string} CSS variable reference e.g. "var(--color-critical)"
 */
export function getConditionColor(condition) {
  const map = {
    CRITICAL: 'var(--color-critical)',
    SERIOUS:  'var(--color-serious)',
    STABLE:   'var(--color-stable)',
  };
  return map[condition] ?? 'var(--color-text-muted)';
}

/**
 * Return the CSS variable name for a condition's light background color.
 * @param {'CRITICAL'|'SERIOUS'|'STABLE'} condition
 * @returns {string} CSS variable reference e.g. "var(--color-critical-light)"
 */
export function getConditionLightColor(condition) {
  const map = {
    CRITICAL: 'var(--color-critical-light)',
    SERIOUS:  'var(--color-serious-light)',
    STABLE:   'var(--color-stable-light)',
  };
  return map[condition] ?? 'var(--color-bg-secondary)';
}

/**
 * Format ETA for display. Always appends "min".
 * @param {number} minutes
 * @returns {string} e.g. "8 min"
 */
export function formatETA(minutes) {
  if (minutes == null) return '';
  return `${minutes} min`;
}

/**
 * Validate and format a blood pressure string.
 * Accepts "90/60" style input. Returns as-is if already valid,
 * or an empty string if falsy.
 * @param {string} bp - e.g. "90/60"
 * @returns {string}
 */
export function formatBP(bp) {
  if (!bp) return '';
  // Normalize spacing around slash
  return bp.replace(/\s*\/\s*/, '/').trim();
}
