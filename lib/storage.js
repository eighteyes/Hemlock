/**
 * storage.js — Chrome storage abstraction with stats rotation
 * Responsibilities:
 *   - Load/save buckets from chrome.storage.local
 *   - Initialize defaults on first run
 *   - Record per-entry filter stats with 7-day rotation
 *   - Provide stats aggregation for popup display
 */

const Storage = (() => {
  const STORAGE_KEY = 'hemlock';
  const STATS_KEY = 'hemlock_stats';
  const MAX_DAYS = 7;

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  async function load() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (result[STORAGE_KEY]) return result[STORAGE_KEY];
    const defaults = Defaults.getDefaults();
    await save(defaults);
    return defaults;
  }

  async function save(buckets) {
    await chrome.storage.local.set({ [STORAGE_KEY]: buckets });
  }

  async function loadStats() {
    const result = await chrome.storage.local.get(STATS_KEY);
    return result[STATS_KEY] || {};
  }

  async function recordHit(name) {
    const stats = await loadStats();
    const day = todayKey();
    if (!stats[day]) stats[day] = {};
    stats[day][name] = (stats[day][name] || 0) + 1;
    rotateStats(stats);
    await chrome.storage.local.set({ [STATS_KEY]: stats });
  }

  async function recordHits(hitMap) {
    if (!hitMap || Object.keys(hitMap).length === 0) return;
    const stats = await loadStats();
    const day = todayKey();
    if (!stats[day]) stats[day] = {};
    for (const [name, count] of Object.entries(hitMap)) {
      const key = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      stats[day][key] = (stats[day][key] || 0) + count;
    }
    rotateStats(stats);
    await chrome.storage.local.set({ [STATS_KEY]: stats });
  }

  function rotateStats(stats) {
    const keys = Object.keys(stats).sort();
    while (keys.length > MAX_DAYS) {
      delete stats[keys.shift()];
    }
  }

  async function getAggregatedStats() {
    const stats = await loadStats();
    const buckets = await load();
    const totals = {};
    let pageTotal = 0;
    for (const day of Object.values(stats)) {
      for (const [name, count] of Object.entries(day)) {
        totals[name] = (totals[name] || 0) + count;
        pageTotal += count;
      }
    }

    const byBucket = [];
    for (const bucket of buckets) {
      const entries = {};
      let bucketTotal = 0;
      for (const entry of bucket.entries) {
        const key = entry.name.charAt(0).toUpperCase() + entry.name.slice(1).toLowerCase();
        for (const [name, count] of Object.entries(totals)) {
          if (name.toLowerCase() === key.toLowerCase()) {
            entries[entry.name] = (entries[entry.name] || 0) + count;
            bucketTotal += count;
          }
        }
      }
      if (bucketTotal > 0) {
        byBucket.push({ name: bucket.name, total: bucketTotal, entries });
      }
    }

    return { totals, byBucket, pageTotal, days: Object.keys(stats).length };
  }

  return { load, save, loadStats, recordHit, recordHits, getAggregatedStats };
})();

if (typeof module !== 'undefined') module.exports = Storage;
