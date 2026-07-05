# Human Review

## Hemlock v1.0.0 Ship Checklist — 2026-04-07
Session: current
Commit: `2344216`

### 1. Load Extension
- [ ] Open `chrome://extensions`, enable Developer mode
- [ ] Click "Load unpacked", select `Hemlock/` directory
- [ ] Confirm no manifest errors
- [ ] Confirm extension icon appears in toolbar

### 2. Content Filtering — Static Pages
- [ ] Visit CNN — confirm card-level removal (`.card.container__item` override)
- [ ] Visit BBC — confirm `data-testid` R-rule catches story cards
- [ ] Visit NPR or Fox News — confirm `<article>` tag removal
- [ ] Visit The Verge — confirm `role="article"` R-rule fires
- [ ] Inspect DOM after removal: no empty ghost divs remaining (E-rule)

### 3. Content Filtering — Dynamic / SPA
- [ ] Visit Reddit home — confirm posts with blocked names are removed
- [ ] Scroll down to trigger infinite scroll, confirm new posts get filtered
- [ ] Visit a news site with lazy-loading, confirm MutationObserver catches late content
- [ ] Reddit override: verify `faceplate-tracker[source="post"]` catches new Reddit cards

### 4. False Positive Check
- [ ] Search for a coffee shop or fragrance — "musk" should NOT trigger (word boundary)
- [ ] Visit a page about fruit/recipes — "Apple" should NOT trigger (disabled by default)
- [ ] Visit a page about Santa Cruz — "Ted Cruz" requires full match, "Cruz" alone should not fire
- [ ] Open Google and search for something — page should not break

### 5. Badge & Hit Counts
- [ ] Badge shows count > 0 on a filtered page
- [ ] Navigate to a clean page — badge should show 0 or disappear
- [ ] Reload a filtered page, confirm counts are reasonable (not inflated)

### 6. Popup — Stats Tab
- [ ] "This page" toggle: shows only current tab's hits grouped by bucket
- [ ] "All pages" toggle: shows 7-day aggregate grouped by bucket
- [ ] Click a bucket header to expand — individual names and counts visible
- [ ] Buckets start collapsed (no names visible by default)
- [ ] Case variants collapsed (e.g., "TRUMP" and "Trump" counted together)

### 7. Popup — Blocklist Tab
- [ ] 5 buckets visible: Politicians, Tech Bros, Billionaires, Companies, Celebrities
- [ ] All buckets start collapsed
- [ ] Master checkbox toggles all entries in bucket on/off
- [ ] Toggling a bucket off → refresh page → blocked content reappears
- [ ] Delete button appears on hover, removes entry
- [ ] Import JSON — verify round-trip with exported file
- [ ] Export JSON — verify file downloads
- [ ] Reset button shows confirmation dialog
- [ ] Cancel dismisses dialog, Reset wipes to defaults

### 8. Popup — Add Tab
- [ ] Bucket dropdown populated with all buckets
- [ ] "New" button creates a custom bucket, selects it in dropdown
- [ ] Add a name — feedback shows "added to [bucket]"
- [ ] Duplicate name — feedback shows "Already blocked"
- [ ] Invalid name (special chars) — feedback shows "Invalid name"
- [ ] Added name appears in Blocklist tab and filters on next page load
- [ ] "Robert F. Kennedy" accepted (period in name allowed)

### 9. Context Menu
- [ ] Select text on any page → right-click → "Block [name] with Hemlock"
- [ ] Name added to Custom bucket
- [ ] Page re-filters immediately without reload

### 10. Theme
- [ ] Dark mode (default): dark apothecary palette, Cormorant Garamond header
- [ ] Light mode: switch system theme, confirm light palette applies
- [ ] Footer link "Site not working? Report it" → opens GitHub issue on eighteyes/Hemlock

### 11. Playwright Tests
```bash
cd /Users/god/projects/Hemlock
npm install
npx playwright install chromium
npx playwright test
```
- [ ] All 8 tests pass (basic, nested, dynamic, images, links, div-soup, unicode, sanitization)

---

## Bug Fix Batch — 2026-07-04
Session: subagent-bug-fix-12
Commit: pending

### Fixes Applied
12 bugs fixed. Test count: 8 passing.

**Quick smoke checks:**

#### Unicode filtering
- [ ] Visit a page mentioning "Orbán" — article should be removed
- [ ] Check badge count increments

#### Stats key normalization
- [ ] Open popup → Stats tab → "All pages"
- [ ] Confirm "Jim Jordan" appears as "Jim Jordan" not "Jim jordan"
- [ ] Confirm "TRUMP" hits normalize to "Trump"

#### Popup import hardening
- [ ] Import a JSON with >100 buckets — should show error feedback
- [ ] Import a JSON with a bucket containing >1000 entries — error feedback
- [ ] Import a malformed JSON string — error feedback

#### Delete entry stability
- [ ] In Blocklist tab, rapidly click delete on multiple entries in one bucket
- [ ] Verify correct entries are removed (none skipped, none doubled)

#### Popup hang guard
- [ ] Disable extension, open popup → Stats tab should load within 2 seconds (not hang)

#### Reset dialog (no innerHTML)
- [ ] Click Reset → confirm dialog appears with Cancel and Reset buttons
- [ ] Cancel dismisses; Reset wipes to defaults; no XSS vector in dialog

#### Init hardening
- [ ] With storage cleared, reload a filtered page — filtering runs cleanly
- [ ] Send a refilter message during page load — no race crash, filtering completes

#### Container climbing (findRemovableParent fix)
- [ ] Visit a busy news site — whole articles/cards are removed, not just headlines
- [ ] Confirm no over-removal: unrelated sibling articles survive

#### Manifest scope
- [ ] Open `chrome://extensions` → Hemlock details — no "read files on your computer" access requested
- [ ] `manifest.json` content_scripts matches contain only `http://*/*` and `https://*/*`

#### Test infrastructure
- [ ] `npx playwright test` — fixtures served over `http://127.0.0.1` (ephemeral port), no file:// URLs

### 12. Pre-Publish
- [ ] Update README.md with v3 feature list
- [ ] Verify `manifest.json` and `package.json` versions are `3.0.0`
- [ ] Screenshot popup for Chrome Web Store listing
- [ ] Write store description emphasizing user-configurable filtering (not the preset names)
- [ ] Zip extension directory (exclude: node_modules, tests, .ai, .claude, test-results)

```bash
cd /Users/god/projects/Hemlock
zip -r hemlock-v3.zip manifest.json content-script.js service-worker.js lib/ popup/ icons/ -x "*.DS_Store"
```

- [ ] Upload to Chrome Web Store developer dashboard
- [ ] Push to GitHub

```bash
git push origin master
```
