# Browser Storage Explorer (Chrome/Edge Extension)

Browser Storage Explorer is a modern, developer-focused browser extension built using Manifest V3. It provides a visual dashboard to inspect, search, manage, and analyze LocalStorage, SessionStorage, Cookies, and IndexedDB data on any currently active web tab.

## Features

- **Storage Dashboard**: Quick statistics on counts, sizes, and layout distributions via an interactive storage pie chart.
- **Data Tables**: Search keys and values instantly, filter by Case Sensitivity or Pinned items, and display exact storage values.
- **CRUD Operations**: View, add, edit, or delete items instantly. Modify expiration dates, paths, domains, and security flags for cookies.
- **JSON Formatter**: Interactive collapsible tree viewer for nested JSON objects.
- **Snapshots & Compare**: Capture current storage states and perform side-by-side comparisons highlighting added, modified, or deleted records.
- **Backup Logs**: Automatically maintains backups of previously exported data, allowing quick restoration.
- **Options and Customizations**: Light / Dark UI themes, live auto-refresh rates (1s, 5s, 10s, manual), and default export configurations (JSON / CSV).
- **Keyboard Shortcuts**: Focus search using `Ctrl + F`, cancel modals using `Escape`.

---

## Folder Structure

```
browser-storage-explorer/
├── manifest.json       # Manifest V3 configuration
├── background.js      # Relays cookie APIs and messages
├── content-script.js  # Accesses LocalStorage, SessionStorage, IndexedDB in tab context
├── popup.html         # Compact stats dropdown
├── popup.css
├── popup.js
├── dashboard.html     # Main DevTools developer workspace
├── dashboard.css
├── dashboard.js
├── options.html       # Setting configurations
├── options.css
├── options.js
├── assets/
│   └── icons/         # Generated PNG icons
└── README.md
```

---

## Installation Guide

### Install in Google Chrome or Microsoft Edge

1. **Download or clone** this repository to your local system.
2. Open your browser and navigate to the extensions management page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Toggle the **Developer Mode** switch at the top-right (Chrome) or bottom-left (Edge) to **ON**.
4. Click the **Load unpacked** button.
5. Select the `browser-storage-explorer` folder containing `manifest.json`.
6. The extension is now loaded! Pin it to your browser toolbar for easy access.

---

## Developer Guide

1. Navigate to any website you want to inspect (e.g., `https://github.com` or `https://google.com`).
2. Click the **Browser Storage Explorer** icon in your browser toolbar to view quick statistics.
3. Click **Open Full Dashboard** to load the comprehensive workspace.
4. Interact with the storage sections, capture snapshots, pin favorites, or edit values.
