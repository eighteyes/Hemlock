/**
 * service-worker.js — Background service worker
 * Responsibilities:
 *   - Update badge text with filter hit counts
 *   - Register and handle context menu for blocking selected text
 *   - Relay messages between popup and content scripts
 */

importScripts('lib/sanitize.js', 'lib/defaults.js', 'lib/storage.js');

const tabCounts = {};
const tabHitMaps = {};

// Max number of tabs to track; oldest entries pruned when exceeded
const TAB_CAP = 100;

// Canonical implementation lives in Sanitize.normalizeStatKey (lib/sanitize.js).
// Duplicated here because the service worker shares the Sanitize global via importScripts.
function normalizeStatKey(name) {
  return Sanitize.normalizeStatKey(name);
}

function pruneTabMaps() {
  const keys = Object.keys(tabCounts);
  if (keys.length <= TAB_CAP) return;
  const toDelete = keys.slice(0, keys.length - TAB_CAP);
  for (const k of toDelete) {
    delete tabCounts[k];
    delete tabHitMaps[k];
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'hits' && sender.tab) {
    const tabId = sender.tab.id;
    if (!tabHitMaps[tabId]) tabHitMaps[tabId] = {};
    for (const [name, count] of Object.entries(msg.hitMap)) {
      const key = normalizeStatKey(name);
      tabHitMaps[tabId][key] = (tabHitMaps[tabId][key] || 0) + count;
    }
    tabCounts[tabId] = msg.total;
    pruneTabMaps();
    chrome.action.setBadgeText({ text: String(msg.total), tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#4a7c59', tabId });
    Storage.recordHits(msg.hitMap);
    return false;
  }

  if (msg.type === 'getPageStats') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
        sendResponse({ hitMap: {}, total: 0 });
        return;
      }
      const tabId = tabs[0]?.id;
      sendResponse({
        hitMap: tabHitMaps[tabId] || {},
        total: tabCounts[tabId] || 0
      });
    });
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabCounts[tabId];
  delete tabHitMaps[tabId];
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'hemlock-block' || !info.selectionText) return;
  const name = info.selectionText.trim();
  if (!Sanitize.isValidName(name)) return;

  const buckets = await Storage.load();
  let custom = buckets.find(b => b.id === 'custom');
  if (!custom) {
    custom = { id: 'custom', name: 'Custom', enabled: true, preset: false, entries: [] };
    buckets.push(custom);
  }
  const exists = custom.entries.some(e => e.name.toLowerCase() === name.toLowerCase());
  if (!exists) {
    custom.entries.push({ name, enabled: true });
    await Storage.save(buckets);
  }

  chrome.tabs.sendMessage(tab.id, { type: 'refilter' }, () => {
    if (chrome.runtime.lastError) {
      console.debug('[Hemlock] sendMessage refilter:', chrome.runtime.lastError.message);
    }
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'hemlock-block',
    title: 'Block "%s" with Hemlock',
    contexts: ['selection']
  });
});
