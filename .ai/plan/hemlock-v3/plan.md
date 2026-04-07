# Hemlock V3 Rewrite Plan

Tagline: **Hemlock — a measured dose of silence.**

Chrome extension that removes references to specified people/keywords from web pages. Full rewrite from dead MV2+jQuery to MV3 vanilla JS.

## File Structure

```
Hemlock/
  manifest.json                 # MV3 manifest
  service-worker.js             # Background: badge, context menu, messaging
  content-script.js             # Core filtering: baseFilter + mutationFilter
  lib/
    storage.js                  # chrome.storage abstraction, stats rotation
    sanitize.js                 # Input validation, regex escaping
    filter-engine.js            # Blocklist → RegExp builder
    defaults.js                 # Preset buckets (Politicians, Tech Bros, etc.)
  popup/
    popup.html                  # Single popup: stats + blocklist management
    popup.js                    # Popup logic
    popup.css                   # Styles (prefers-color-scheme aware)
  icons/
    icon-16.png
    icon-48.png
    icon-128.png
  tests/
    fixtures/                   # Static HTML pages for Playwright
      basic.html
      nested.html
      dynamic.html
      images.html
      links.html
    hemlock.spec.js
    playwright.config.js
  package.json                  # devDependencies: @playwright/test only
```

**Delete:** jquery.js, lodash.js, js-yaml.js, royalEraser.js, style.css, panel.html, panel.js, old popup.html, old popup.js, icon.jpg

## Phases

### Phase 1: Foundation
Loadable extension with correct plumbing, no UI yet.

- **manifest.json** → MV3: `manifest_version: 3`, `action`, `background.service_worker`, permissions: `storage`, `activeTab`, `contextMenus`
- **lib/storage.js** → Promise wrappers around chrome.storage.sync. Schema:
  - `buckets: [{id, name, enabled, entries: [{name, enabled}]}]`
  - `stats.daily: {"2026-01-30": {total, byEntry}}` — 7-day rotation
- **lib/sanitize.js** → `validateEntry()` enforces `/^[a-zA-Z\s\w'-]+$/`, `escapeRegExp()`, `buildRegex()`
- **lib/filter-engine.js** → `buildFilters(blocklist)` returns `{names: RegExp, urls: RegExp}`, only processes enabled entries
- **lib/defaults.js** → Preset buckets, each toggleable as a group:
  - **Politicians**: Trump, Biden, DeSantis, Newsom, MTG, AOC, McConnell, Pelosi, etc.
  - **Tech Bros**: Musk, Zuckerberg, Altman, Nadella, Pichai, etc.
  - **Billionaires**: Bezos, Gates, Buffett, Thiel, etc.
  - **Celebrities**: Kardashian, Swift, Rogan, etc.
  - Users can enable/disable entire buckets or individual entries within them
  - Users can create custom buckets and add entries to any bucket

### Phase 2: Content Script Rewrite
Core filtering works on static and dynamic pages, zero dependencies.

- **content-script.js** — Port two-pass approach:
  - `baseFilter()`: TreeWalker (single DOM pass replacing 5+ jQuery selector calls). Generalized parent-climbing for removal (article/li/tr/div heuristic replaces HN-specific `tr:first`).
  - `mutationFilter()`: MutationObserver with `{childList: true, subtree: true}` (current code only watches attributes — misses SPA-injected nodes).
  - Sends counts to service worker via `chrome.runtime.sendMessage`
- **service-worker.js** — `chrome.action.setBadgeText()`, message listener, context menu registration

### Phase 3: Popup UI
Single popup replaces both old popup and options page.

- **Stats view** (default): page count, per-entry breakdown, weekly aggregate, site on/off toggle
- **Blocklist view** (tab): collapsible buckets (Politicians, Tech Bros, etc.), each with bucket-level toggle + per-entry toggles. Add entry to any bucket, create custom buckets, delete entries/buckets. Import/export (JSON blob), reset to preset defaults.
- 350px wide, max 500px tall, scrollable. `textContent` only (no innerHTML with user data).

### Phase 4: Context Menu
Right-click "Block this person" on highlighted text.

- Service worker: `chrome.contextMenus.create()` on install
- On click: sanitize `selectionText`, save to blocklist, message content script to rebuild filters and re-run baseFilter

### Phase 5: Playwright Tests
Local HTML fixtures, deterministic.

- Fixtures: basic text, nested DOM, dynamic injection (500ms delay), image attributes, link href/text
- Tests: element removal, non-target survival, badge count, popup stats, input sanitization rejects `.*` and `(evil)`, import/export round-trip
- Load extension via `--load-extension` flag

### Phase 6: Cleanup + Polish
- Delete dead files
- Update README.md, manifest description
- Generate icon sizes from existing icon.png
- Verify sync quota < 100KB with realistic data

## Key Decisions

1. **No build system.** Lib files loaded via manifest `content_scripts.js` array in order.
2. **TreeWalker over querySelectorAll.** Single DOM pass instead of 5+ selector calls.
3. **Generalized parent-climbing.** Walk up from match to nearest removable container (article/li/tr/similar-sibling div).
4. **7-day stats rotation.** Keeps storage well under 100KB sync quota.
5. **Input sanitization at entry point.** `[a-zA-Z\s\w'-]` with regex escaping. No raw user input in RegExp.
