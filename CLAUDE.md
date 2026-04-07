# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Hemlock v3.0.0 — Chrome MV3 extension that removes web page references to specified people/keywords. Pure vanilla JavaScript, zero runtime dependencies.

## Commands

```
npm install                      # install dev deps (Playwright only)
npx playwright install chromium  # install test browser
npx playwright test              # run all E2E tests
npx playwright test -g "basic"   # run single test by name
```

Manual testing: load as unpacked extension at `chrome://extensions` with Developer mode enabled.

## Architecture

**Message flow**: Content script filters DOM → sends hit counts to service worker → service worker updates badge → popup reads stats from storage.

**Content script loading order** (defined in manifest.json `content_scripts.js`):
`lib/sanitize.js` → `lib/filter-engine.js` → `lib/defaults.js` → `lib/storage.js` → `content-script.js`

Each lib file uses IIFE module pattern, attaching to `globalThis` (e.g. `globalThis.Sanitize`, `globalThis.FilterEngine`).

**Core filtering pipeline** (`content-script.js`):
1. `init()` loads buckets from storage, compiles regex via FilterEngine
2. `baseFilter()` does a single TreeWalker pass (TEXT_NODE + ELEMENT), removes matches
3. `startObserver()` watches DOM mutations for SPA-injected content
4. `findRemovableParent()` climbs to nearest container (ARTICLE, LI, TR, BLOCKQUOTE, FIGURE, SECTION) bounded by stop tags (BODY, MAIN, NAV, HEADER, FOOTER, ASIDE)

**Storage schema** (`chrome.storage.local`):
- `hemlock`: array of bucket objects, each with `{id, name, enabled, preset, entries: [{name, enabled}]}`
- `hemlock_stats`: object keyed by ISO date string, 7-day rolling window of per-entry hit counts

**Popup** (`popup/`): two-tab UI (Stats / Blocklist), supports import/export JSON, live re-filtering via `{type: 'refilter'}` message to content script.

**Service worker** (`service-worker.js`): badge updates, context menu ("Block [name] with Hemlock"), message relay.

## Testing

Playwright E2E tests in `tests/hemlock.spec.js` load the extension into Chromium and test against static HTML fixtures in `tests/fixtures/`. Tests cover: basic article removal, nested DOM climbing, dynamic/SPA content, image/link attribute filtering, table row removal, and input sanitization.

## Key Patterns

- All user input validated through `Sanitize.isValidName()` before regex compilation — allowed chars: `[a-zA-Z\s\w'-]`, max 100 chars
- FilterEngine compiles a single alternation regex from all enabled entries: `/(name1|name2|...)/gi`
- Stats use 7-day rotation to stay within storage quota
- `{type: 'refilter'}` message triggers full re-scan from popup or context menu changes
