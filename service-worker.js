/**
 * service-worker.js — Background service worker
 * Responsibilities:
 *   - Update badge text with filter hit counts
 *   - Register and handle context menu for blocking selected text
 *   - Relay messages between popup and content scripts
 */

importScripts('lib/sanitize.js', 'lib/defaults.js', 'lib/storage.js');

const tabCounts = {};

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'hits' && sender.tab) {
    const tabId = sender.tab.id;
    tabCounts[tabId] = msg.total;
    chrome.action.setBadgeText({ text: String(msg.total), tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#4a7c59', tabId });
    Storage.recordHits(msg.hitMap);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabCounts[tabId];
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

  chrome.tabs.sendMessage(tab.id, { type: 'refilter' });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'hemlock-block',
    title: 'Block "%s" with Hemlock',
    contexts: ['selection']
  });
});
