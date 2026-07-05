# Hemlock

A precise dose of silence.

Chrome extension that removes references to specified public figures, companies, and organizations from web pages. You choose who you don't want to hear about. Hemlock removes them from your feed.

## Install

### From source

```
git clone https://github.com/eighteyes/Hemlock.git
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `Hemlock` directory

### From Chrome Web Store

Coming soon.

## How it works

Hemlock scans page content as it loads and removes elements that mention names on your blocklist. It handles both static pages and dynamically loaded content (infinite scroll, SPAs). Removed elements include the surrounding card, article, or list item — not just the text.

## Features

- **Preset blocklists** across several categories, fully customizable
- **Custom entries** — add anyone or anything you want to filter
- **Custom buckets** — organize your blocklist however you like
- **Per-page and aggregate stats** — see what was filtered, without showing you the names
- **Context menu** — highlight text, right-click, block it
- **Import/Export** — back up and share your blocklist as JSON
- **Smart container removal** — removes the whole card, not just the name, and cleans up empty wrappers
- **Light and dark theme** — follows your system preference

## A note on defaults

The preset blocklists are aggressive. If you find yourself missing someone you actually want to hear from, open the popup, find them in the Blocklist tab, and uncheck them. You can also disable entire categories at once.

## Popup

The popup has three tabs:

- **Stats** — toggle between current page and 7-day aggregate, grouped by category
- **Blocklist** — view, toggle, and delete entries
- **Add** — select a bucket and add new names

## Permissions

- `storage` — save your blocklist and stats locally
- `activeTab` — filter the page you're viewing
- `contextMenus` — right-click to block selected text

No data leaves your browser. No analytics. No remote servers.

## Bugs & Feature Requests

If a site doesn't filter correctly, [open an issue](https://github.com/eighteyes/Hemlock/issues/new).

## License

MIT
