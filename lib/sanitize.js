/**
 * sanitize.js — Input validation and regex escaping
 * Responsibilities:
 *   - Validate blocklist entry names against allowed character set
 *   - Escape special regex characters in user input
 *   - Build word-boundary regex from a validated name
 */

const Sanitize = (() => {
  const ALLOWED_NAME = /^[a-zA-Z\s\w'.\-]+$/;
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
    return new RegExp(`\\b(${pattern})\\b`, 'gi');
  }

  return { isValidName, escapeRegExp, buildRegex };
})();

if (typeof module !== 'undefined') module.exports = Sanitize;
