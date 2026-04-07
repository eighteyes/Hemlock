# Hemlock V3 — Tasks

## Phase 1: Foundation
- [x] Write manifest.json (MV3)
- [x] Write lib/storage.js (chrome.storage abstraction + stats rotation)
- [x] Write lib/sanitize.js (input validation + regex escaping)
- [x] Write lib/filter-engine.js (blocklist → RegExp builder)
- [x] Write lib/defaults.js (preset buckets: Politicians, Tech Bros, Billionaires, Celebrities)
- [ ] Verify extension loads in Chrome

## Phase 2: Content Script
- [x] Write content-script.js (baseFilter + mutationFilter, TreeWalker)
- [x] Write service-worker.js (badge, messaging)
- [ ] Test filtering works on manual test page

## Phase 3: Popup UI
- [x] Write popup/popup.html
- [x] Write popup/popup.css
- [x] Write popup/popup.js — stats view
- [x] Write popup/popup.js — blocklist management view
- [x] Write popup/popup.js — import/export
- [ ] Verify popup interactions end-to-end

## Phase 4: Context Menu
- [x] Add context menu registration to service-worker.js
- [x] Add selection → blocklist flow
- [x] Add re-filter messaging to content-script.js

## Phase 5: Playwright Tests
- [x] Write package.json (playwright dep)
- [x] Write test fixtures (basic, nested, dynamic, images, links)
- [x] Write playwright.config.js
- [x] Write hemlock.spec.js (filtering, badge, popup, sanitization, import/export)

## Phase 6: Cleanup
- [x] Delete dead files (jquery, lodash, js-yaml, royalEraser, style.css, panel.*, old popup.*, icon.jpg)
- [ ] Update README.md
- [x] Update manifest description with tagline
- [x] Generate icon sizes (16, 48, 128 from icon.png via sips)
- [ ] Verify storage quota

## Bug Fixes During Implementation
- [x] Fix dynamic.html fixture: Kardashian → Jeff Bezos (Celebrities bucket disabled by default)
- [x] Fix service-worker.js: added importScripts for lib files
- [x] Simplified badge count tracking (removed redundant prev tracking)
