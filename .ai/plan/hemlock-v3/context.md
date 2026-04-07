# Hemlock V3 — Context

## Key Files (current state)

| File | Role | Disposition |
|------|------|------------|
| manifest.json | MV2 manifest | Rewrite to MV3 |
| contentScript.js | Core filtering (230 lines) | Rewrite as content-script.js |
| defaults.js | Hardcoded blocklist + regex builder | Replace with lib/filter-engine.js |
| background.js | Badge text listener (11 lines) | Replace with service-worker.js |
| popup.html/popup.js | Raw JSON dump | Replace with popup/* |
| panel.html/panel.js | Textarea options page | Delete (popup absorbs this) |
| jquery.js | 96KB bundled | Delete |
| lodash.js | 516KB bundled | Delete |
| js-yaml.js | 42KB bundled, never used | Delete |
| royalEraser.js | Unused legacy | Delete |
| style.css | Empty | Delete |
| icon.jpg | Duplicate icon | Delete |

## Architecture Notes

- contentScript.js baseFilter() pattern is sound — scan DOM, remove matches, count
- mutationFilter() only watches `attributes` — needs `childList: true` for SPA content
- HN-specific `.parents('tr:first')` needs generalizing
- `_.isUndefined`/`_.isNull` → optional chaining
- `chrome.browserAction` → `chrome.action` (MV3)
- `background.persistent: false` already correct pattern → service worker
- chrome.storage.sync quota: 100KB total, 8KB per item

## Decisions Made

- Popup-only UI (no separate options page)
- Vanilla JS + CSS (zero dependencies)
- Playwright with local HTML fixtures (no live site tests)
- Input restricted to `[a-zA-Z\s\w'-]` per entry
- Tagline: "Hemlock — a measured dose of silence"

## Storage Schema

```js
{
  buckets: [
    {
      id: "politicians",
      name: "Politicians",
      enabled: true,
      preset: true,       // preset buckets can be reset, custom cannot
      entries: [
        { name: "Trump", enabled: true },
        { name: "Biden", enabled: true },
        ...
      ]
    },
    {
      id: "tech-bros",
      name: "Tech Bros",
      enabled: true,
      preset: true,
      entries: [...]
    },
    {
      id: "billionaires",
      name: "Billionaires",
      ...
    },
    {
      id: "celebrities",
      name: "Celebrities",
      ...
    },
    {
      id: "custom-abc123",
      name: "My Custom Bucket",
      enabled: true,
      preset: false,
      entries: [...]
    }
  ],
  stats: {
    daily: {
      "2026-01-30": { total: 47, byEntry: { "Trump": 12, "Musk": 8 } }
    }
  }
}
```

Filter engine flattens all enabled entries from enabled buckets into a single RegExp.
