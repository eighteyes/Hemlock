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
  const PAUSED_KEY = 'hemlock_paused';
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
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: buckets });
    } catch (e) {
      console.warn('[Hemlock] storage save failed:', e);
    }
  }

  async function loadStats() {
    const result = await chrome.storage.local.get(STATS_KEY);
    return result[STATS_KEY] || {};
  }

  async function recordHits(hitMap) {
    if (!hitMap || Object.keys(hitMap).length === 0) return;
    const stats = await loadStats();
    const day = todayKey();
    if (!stats[day]) stats[day] = {};
    for (const [name, count] of Object.entries(hitMap)) {
      const key = Sanitize.normalizeStatKey(name);
      stats[day][key] = (stats[day][key] || 0) + count;
    }
    rotateStats(stats);
    try {
      await chrome.storage.local.set({ [STATS_KEY]: stats });
    } catch (e) {
      console.warn('[Hemlock] stats save failed:', e);
    }
  }

  function rotateStats(stats) {
    const keys = Object.keys(stats).sort();
    while (keys.length > MAX_DAYS) {
      delete stats[keys.shift()];
    }
  }

  async function getAggregatedStats() {
    const stats = await loadStats();
    const totals = {};
    let pageTotal = 0;
    for (const day of Object.values(stats)) {
      for (const [name, count] of Object.entries(day)) {
        totals[name] = (totals[name] || 0) + count;
        pageTotal += count;
      }
    }
    return { totals, pageTotal, days: Object.keys(stats).length };
  }

  async function getPaused() {
    const result = await chrome.storage.local.get(PAUSED_KEY);
    return result[PAUSED_KEY] || false;
  }

  async function setPaused(paused) {
    try {
      await chrome.storage.local.set({ [PAUSED_KEY]: paused });
    } catch (e) {
      console.warn('[Hemlock] paused save failed:', e);
    }
  }

  return { load, save, loadStats, recordHits, getAggregatedStats, getPaused, setPaused };
})();

if (typeof module !== 'undefined') module.exports = Storage;
