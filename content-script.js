/**
 * content-script.js — Core page filtering engine
 * Responsibilities:
 *   - Run a single TreeWalker pass to find and remove matching elements (baseFilter)
 *   - Observe DOM mutations and filter dynamically inserted content (mutationFilter)
 *   - Climb parent elements to remove containing article/card/row structures
 *   - Report hit counts to the service worker for badge updates
 */

(() => {
  let regex = null;
  let hitMap = {};
  let totalRemoved = 0;
  let flushedHits = {};

  const CONTAINER_TAGS = new Set([
    'ARTICLE', 'LI', 'TR', 'BLOCKQUOTE', 'FIGURE', 'SECTION'
  ]);

  const STOP_TAGS = new Set([
    'BODY', 'HTML', 'MAIN', 'NAV', 'HEADER', 'FOOTER', 'ASIDE'
  ]);

  // R: Semantic role/attribute patterns indicating removable containers
  const ROLE_VALUES = new Set(['article', 'listitem', 'feed']);
  const ITEMTYPE_RE = /Article|NewsArticle|BlogPosting|SocialMediaPosting/;
  const DATA_ATTR_RE = /story|card|post|feed.?item|article|result/i;
  const CLASS_RE = /\b(card|story|post|feed-item|result|news-item)\b/i;

  // Site-specific override selectors (keyed by hostname substring)
  const SITE_OVERRIDES = {
    'cnn.com':    '.card.container__item',
    'reddit.com': '.thing, shreddit-post, div:has(> faceplate-tracker[source="post"])',
  };

  function matchesRole(el) {
    const role = el.getAttribute('role');
    if (role && ROLE_VALUES.has(role)) return true;
    const itemtype = el.getAttribute('itemtype');
    if (itemtype && ITEMTYPE_RE.test(itemtype)) return true;
    const cls = el.className;
    if (typeof cls === 'string' && CLASS_RE.test(cls)) return true;
    for (const attr of el.attributes) {
      if (attr.name.startsWith('data-') && DATA_ATTR_RE.test(attr.name + '=' + attr.value)) return true;
    }
    return false;
  }

  function getSiteOverrideSelector() {
    const host = location.hostname;
    for (const key in SITE_OVERRIDES) {
      if (host.includes(key)) return SITE_OVERRIDES[key];
    }
    return null;
  }

  function findRemovableParent(node) {
    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    let candidate = el;

    // Site-specific override: walk up to matching selector
    const overrideSel = getSiteOverrideSelector();
    if (overrideSel) {
      const override = el.closest(overrideSel);
      if (override && !STOP_TAGS.has(override.tagName)) return override;
    }

    // Walk up looking for semantic container or role match
    while (el && !STOP_TAGS.has(el.tagName)) {
      if (CONTAINER_TAGS.has(el.tagName)) {
        candidate = el;
        break;
      }
      // R: role/data-attribute match
      if (matchesRole(el)) {
        candidate = el;
        break;
      }
      if (el.parentElement && el.parentElement.children.length > 1) {
        candidate = el;
        break;
      }
      el = el.parentElement;
    }

    // S: Collapse single-child div chains upward
    while (
      candidate.parentElement &&
      !STOP_TAGS.has(candidate.parentElement.tagName) &&
      !CONTAINER_TAGS.has(candidate.parentElement.tagName) &&
      candidate.parentElement.children.length === 1 &&
      candidate.parentElement.tagName === 'DIV'
    ) {
      candidate = candidate.parentElement;
    }

    return candidate;
  }

  // E: Prune empty ancestors after removal
  function cleanEmptyAncestors(parent) {
    while (parent && !STOP_TAGS.has(parent.tagName)) {
      const hasContent = Array.from(parent.childNodes).some(n =>
        n.nodeType === Node.ELEMENT_NODE ||
        (n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0)
      );
      if (hasContent) break;
      const next = parent.parentElement;
      parent.remove();
      parent = next;
    }
  }

  function recordHit(matchText) {
    hitMap[matchText] = (hitMap[matchText] || 0) + 1;
    totalRemoved++;
  }

  function removeNode(node) {
    const target = findRemovableParent(node);
    if (target && target.parentNode) {
      const parent = target.parentNode;
      parent.removeChild(target);
      cleanEmptyAncestors(parent);
    }
  }

  function checkAndRemove(textNode) {
    if (!regex) return false;
    const text = textNode.textContent;
    regex.lastIndex = 0;
    const match = regex.exec(text);
    if (match) {
      const target = findRemovableParent(textNode);
      if (target && target.parentNode) {
        recordHit(match[1]);
        const parent = target.parentNode;
        parent.removeChild(target);
        cleanEmptyAncestors(parent);
        return true;
      }
    }
    return false;
  }

  const TEXT_ATTRS = new Set(['alt', 'title', 'aria-label', 'aria-description']);

  function checkAttributes(el) {
    if (!regex || !el.attributes) return false;
    for (const attr of el.attributes) {
      if (!TEXT_ATTRS.has(attr.name)) continue;
      regex.lastIndex = 0;
      const match = regex.exec(attr.value);
      if (match) return match[1];
    }
    return false;
  }

  function baseFilter() {
    if (!regex) return;
    const removed = new Set();

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null
    );

    const toRemove = [];

    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) {
        regex.lastIndex = 0;
        const match = regex.exec(node.textContent);
        if (match) {
          const target = findRemovableParent(node);
          if (target && !removed.has(target)) {
            removed.add(target);
            recordHit(match[1]);
            toRemove.push(target);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (removed.has(node)) continue;
        if (node.tagName === 'IMG' || node.tagName === 'A') {
          const matchName = checkAttributes(node);
          if (matchName) {
            const target = findRemovableParent(node);
            if (target && !removed.has(target)) {
              removed.add(target);
              recordHit(matchName);
              toRemove.push(target);
            }
          }
        }
      }
    }

    for (const el of toRemove) {
      if (el.parentNode) {
        const parent = el.parentNode;
        parent.removeChild(el);
        cleanEmptyAncestors(parent);
      }
    }
  }

  function mutationFilter(mutations) {
    if (!regex) return;
    for (const mutation of mutations) {
      for (const added of mutation.addedNodes) {
        if (added.nodeType === Node.TEXT_NODE) {
          checkAndRemove(added);
        } else if (added.nodeType === Node.ELEMENT_NODE) {
          const matchName = checkAttributes(added);
          if (matchName) {
            recordHit(matchName);
            removeNode(added);
            continue;
          }
          const walker = document.createTreeWalker(
            added,
            NodeFilter.SHOW_TEXT,
            null
          );
          let textNode;
          while ((textNode = walker.nextNode())) {
            checkAndRemove(textNode);
          }
        }
      }
    }
    flushStats();
  }

  let flushedTotal = 0;

  function flushStats() {
    if (totalRemoved === flushedTotal) return;
    const delta = {};
    for (const [name, count] of Object.entries(hitMap)) {
      delta[name] = count - (flushedHits[name] || 0);
      if (delta[name] <= 0) delete delta[name];
    }
    const flushedCopy = { ...hitMap };
    flushedHits = flushedCopy;
    flushedTotal = totalRemoved;
    chrome.runtime.sendMessage({
      type: 'hits',
      hitMap: delta,
      total: totalRemoved
    });
  }

  let observer = null;

  function startObserver() {
    observer = new MutationObserver(mutationFilter);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async function init() {
    const buckets = await Storage.load();
    regex = FilterEngine.compile(buckets);
    if (!regex) return;

    baseFilter();
    flushStats();
    startObserver();
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'refilter') {
      if (observer) observer.disconnect();
      hitMap = {};
      totalRemoved = 0;
      flushedHits = {};
      flushedTotal = 0;
      Storage.load().then(buckets => {
        regex = FilterEngine.compile(buckets);
        if (!regex) return;
        baseFilter();
        flushStats();
        startObserver();
      });
    }
  });

  init();
})();
