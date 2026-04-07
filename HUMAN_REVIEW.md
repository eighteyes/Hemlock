# Human Review

## Hemlock V3 Rewrite — 2026-02-21
Session: `1afc57d2-9b90-48e1-97c4-5170501ed93f` (plan), current session (implementation)

### Load Extension
- [ ] Open `chrome://extensions`, enable Developer mode
- [ ] Click "Load unpacked", select `Hemlock/` directory

```bash
# Verify no manifest errors in the extensions page
```

- [ ] Confirm extension icon appears in toolbar

### Content Filtering
- [ ] Visit a news site (e.g., cnn.com, reddit.com)
- [ ] Confirm articles mentioning default blocklist names (Trump, Musk, etc.) are removed
- [ ] Confirm badge shows a count > 0
- [ ] Scroll / load more content, confirm MutationObserver catches dynamic additions
- [ ] Verify div-soup cleanup: on CNN, entire card wrappers should be removed (no empty ghost divs left behind)
- [ ] Verify company name filtering: search for "OpenAI" or "Tesla" content and confirm removal

### Popup UI
- [ ] Click extension icon to open popup
- [ ] Stats tab: confirm filter counts display
- [ ] Switch to Blocklist tab: confirm 5 buckets render (Politicians, Tech Bros, Billionaires, Companies, Celebrities)
- [ ] Toggle a bucket off, confirm content reappears on page refresh
- [ ] Add a custom name, confirm it appears and filters on next page load
- [ ] Delete an entry, confirm removal
- [ ] Export JSON, verify file downloads
- [ ] Import the exported JSON, confirm round-trip

### Context Menu
- [ ] Highlight text on any page
- [ ] Right-click, select "Block [name] with Hemlock"
- [ ] Confirm name appears in Custom bucket in popup
- [ ] Confirm page re-filters without reload

### Dark Mode
- [ ] Toggle system to dark mode
- [ ] Open popup, confirm dark theme applies

### Playwright Tests
```bash
cd /Users/god/projects/Hemlock && npm install && npx playwright install chromium && npx playwright test
```

- [ ] All tests pass (including new `div-soup` test)

## S+E+R Div Removal & Updated Defaults — 2026-04-07

### Div Removal Strategy (S+E+R)
- [ ] CNN: verify `.card.container__item` override removes entire card, no empty wrappers remain
- [ ] Reddit: verify `.thing` / `shreddit-post` override catches post containers
- [ ] BBC: verify `data-testid` R-rule catches story cards via data attributes
- [ ] The Verge: verify `role="article"` R-rule catches article containers
- [ ] NPR/Fox News: verify `<article>` CONTAINER_TAG catches stories (existing behavior)
- [ ] Any div-heavy site: verify single-child div chains collapse upward (S-rule)
- [ ] After removal: inspect DOM for orphaned empty divs — E-rule should prune them

### Companies Bucket
- [ ] Open popup, confirm "Companies" bucket appears between Billionaires and Celebrities
- [ ] Toggle Companies bucket off, refresh a tech news page, confirm company names no longer filtered
- [ ] Verify "DOGE" filtering doesn't false-positive on non-government "doge" references (case-sensitive regex)

### Curl Analysis Script
```bash
node .ai/tmp/test-container-rules.js
```
- [ ] Review output to identify sites where R-rules don't fire — candidates for SITE_OVERRIDES
