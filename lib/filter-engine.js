/**
 * filter-engine.js — Blocklist to RegExp builder
 * Responsibilities:
 *   - Flatten enabled entries from enabled buckets into a name list
 *   - Produce a single compiled RegExp for content matching
 */

const FilterEngine = (() => {
  function getActiveNames(buckets) {
    if (!Array.isArray(buckets)) return [];
    const names = [];
    for (const bucket of buckets) {
      if (!bucket?.enabled) continue;
      for (const entry of bucket.entries || []) {
        if (entry?.enabled) names.push(entry.name);
      }
    }
    return names;
  }

  function compile(buckets) {
    if (!Array.isArray(buckets)) return null;
    const names = getActiveNames(buckets);
    return Sanitize.buildRegex(names);
  }

  return { getActiveNames, compile };
})();

if (typeof module !== 'undefined') module.exports = FilterEngine;
