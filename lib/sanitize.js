/**
 * sanitize.js — Input validation and regex escaping
 * Responsibilities:
 *   - Validate blocklist entry names against allowed character set (Unicode-aware)
 *   - Escape special regex characters in user input
 *   - Build Unicode-boundary regex from a validated name list
 *   - Normalize stat keys so multi-word names capitalize each word consistently
 */

const Sanitize = (() => {
  // Unicode-aware: allow letters (any script), digits, spaces, apostrophes, periods, hyphens
  const ALLOWED_NAME = /^[\p{L}\p{N}\s'.\-]+$/u;
  const REGEX_SPECIAL = /[.*+?^${}()|[\]\\]/g;

  function isValidName(name) {
    if (typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length > 0 && trimmed.length <= 100 && ALLOWED_NAME.test(trimmed);
  }

  function escapeRegExp(str) {
    return str.replace(REGEX_SPECIAL, '\\$&');
  }

  function buildRegex(names) {
    if (!names.length) return null;
    const escaped = names.map(n => escapeRegExp(n.trim()));
    const pattern = escaped.join('|');
    // Unicode-aware word boundaries: no adjacent Unicode letter on either side
    return new RegExp(`(?<!\\p{L})(${pattern})(?!\\p{L})`, 'giu');
  }

  // Capitalize the first letter of each word, lowercase the rest.
  // "jim jordan" → "Jim Jordan", "TRUMP" → "Trump"
  function normalizeStatKey(name) {
    if (typeof name !== 'string') return name;
    return name.replace(/\S+/g, word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  }

  return { isValidName, escapeRegExp, buildRegex, normalizeStatKey };
})();

if (typeof module !== 'undefined') module.exports = Sanitize;
