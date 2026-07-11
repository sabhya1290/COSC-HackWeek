// dashboard.js - Core application logic for Browser Storage Explorer

// State management
let state = {
  activeTab: null,
  activeHost: '',
  activeUrl: '',
  activeView: 'overview', // 'overview', 'local', 'session', 'cookies', 'indexeddb', 'snapshots', 'backups', 'settings'
  
  // Storage raw items
  localStorage: [],
  sessionStorage: [],
  cookies: [],
  indexedDB: [], // databases list
  
  // IndexedDB active selection
  selectedDb: null,
  selectedStore: null,
  
  // Configuration settings (loaded from chrome.storage.sync)
  settings: {
    theme: 'dark',
    autoRefresh: '1',
    exportFormat: 'json',
    maxSnapshots: 10
  },
  
  // Pinned keys dictionary: { [domain]: { localStorage: [keys], sessionStorage: [keys], cookies: [keys], indexeddb: [keys] } }
  pinnedKeys: {},
  
  // Snapshot history: array of { id, timestamp, title, host, localStorage, sessionStorage, cookies, idbMeta }
  snapshots: [],
  
  // Backup logs: array of { timestamp, host, count, type }
  backups: [],

  // Live auto refresh interval pointer
  refreshInterval: null
};

// DOM references
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const inspectingHostEl = document.getElementById('inspecting-host');
const refreshModeEl = document.getElementById('refresh-mode-text');
const toastEl = document.getElementById('toast');

// Views
const viewOverview = document.getElementById('view-overview');
const viewStorageInspector = document.getElementById('view-storage-inspector');
const viewSnapshots = document.getElementById('view-snapshots');
const viewBackups = document.getElementById('view-backups');
const viewSettings = document.getElementById('view-settings');

// Inspector DOMs
const inspectorTitle = document.getElementById('inspector-title');
const inspectorSubtitle = document.getElementById('inspector-subtitle');
const searchInput = document.getElementById('search-input');
const chkCaseSensitive = document.getElementById('chk-case-sensitive');
const chkShowFavorites = document.getElementById('chk-show-favorites');
const storageTable = document.getElementById('storage-table');
const tableHeaders = document.getElementById('table-headers');
const tableBody = document.getElementById('table-body');
const tableEmptyState = document.getElementById('table-empty-state');
const fileImportInput = document.getElementById('file-import-input');

// IndexedDB selection DOMs
const idbSelectorBar = document.getElementById('idb-selector-bar');
const idbDbSelect = document.getElementById('idb-db-select');
const idbStoreSelect = document.getElementById('idb-store-select');

// Modals
const modalEditEntry = document.getElementById('modal-edit-entry');
const modalEditTitle = document.getElementById('modal-edit-title');
const editKeyInput = document.getElementById('edit-key');
const editValueInput = document.getElementById('edit-value');
const cookieSpecificFields = document.getElementById('cookie-specific-fields');

// Cookie field details
const cookiePath = document.getElementById('cookie-path');
const cookieDomain = document.getElementById('cookie-domain');
const cookieExpiry = document.getElementById('cookie-expiry');
const cookieSamesite = document.getElementById('cookie-samesite');
const cookieSecure = document.getElementById('cookie-secure');
const cookieHttponly = document.getElementById('cookie-httponly');

// Modal: Value Viewer
const modalValueViewer = document.getElementById('modal-value-viewer');
const viewerRawText = document.getElementById('viewer-raw-text');
const jsonTreeContainer = document.getElementById('json-tree-container');

// Modal: Delete
const modalDeleteConfirm = document.getElementById('modal-delete-confirm');
const deleteConfirmText = document.getElementById('delete-confirm-text');
let itemPendingDelete = null; // { key, type, dbName, storeName }

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfigurations();
  await locateActiveTab();
  setupNavigation();
  setupActions();
  setupKeyboardShortcuts();
  setupModals();
  startLiveRefresh();
});

// Load configuration preferences
async function loadConfigurations() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      theme: 'dark',
      autoRefresh: '1',
      exportFormat: 'json',
      maxSnapshots: 10
    }, (config) => {
      state.settings = config;
      applyTheme(config.theme);
      
      // Update config inputs on settings tab
      document.getElementById('dash-theme').value = config.theme;
      document.getElementById('dash-auto-refresh').value = config.autoRefresh;
      document.getElementById('dash-export-format').value = config.exportFormat;
      resolve();
    });
  });
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  } else if (theme === 'dark') {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-theme', prefersDark);
    document.body.classList.toggle('light-theme', !prefersDark);
  }
}

// Find tab to inspect
async function locateActiveTab() {
  return new Promise((resolve) => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryTabId = urlParams.get('tabId');

    if (queryTabId) {
      chrome.tabs.get(parseInt(queryTabId), (tab) => {
        if (chrome.runtime.lastError || !tab) {
          fallbackLocateTab(resolve);
        } else {
          handleSelectedTab(tab);
          resolve();
        }
      });
    } else {
      fallbackLocateTab(resolve);
    }
  });
}

function fallbackLocateTab(resolve) {
  // Query all tabs in current window to find one that is active and not an extension page
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      handleSelectedTab(null);
      resolve();
      return;
    }
    const nonExtensionTab = tabs.find(t => t.active && t.url && !t.url.startsWith('chrome-extension://'));
    if (nonExtensionTab) {
      handleSelectedTab(nonExtensionTab);
    } else {
      // Find any non-extension tab in current window
      const anyNonExtensionTab = tabs.find(t => t.url && !t.url.startsWith('chrome-extension://'));
      if (anyNonExtensionTab) {
        handleSelectedTab(anyNonExtensionTab);
      } else {
        handleSelectedTab(tabs[0]);
      }
    }
    resolve();
  });
}

function handleSelectedTab(tab) {
  if (!tab || !tab.url) {
    inspectingHostEl.textContent = 'No website active';
    return;
  }
  
  state.activeTab = tab;
  state.activeUrl = tab.url;
  
  try {
    const parsed = new URL(tab.url);
    state.activeHost = parsed.hostname;
    inspectingHostEl.textContent = parsed.hostname;
    
    // Load pinned keys and snapshots from local storage for this domain
    chrome.storage.local.get({
      pinnedKeys: {},
      snapshots: [],
      backups: []
    }, (result) => {
      state.pinnedKeys = result.pinnedKeys || {};
      state.snapshots = result.snapshots || [];
      state.backups = result.backups || [];
      
      refreshData();
      renderSnapshotsView();
      renderBackupsView();
    });
  } catch (e) {
    inspectingHostEl.textContent = 'System/Invalid page';
  }
}

// Navigation handling
function setupNavigation() {
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      
      const targetView = item.getAttribute('data-view');
      switchView(targetView);
    });
  });

  // Overview statistics card navigation triggers
  document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
      const link = card.getAttribute('data-link');
      if (link) {
        const navBtn = document.querySelector(`.nav-item[data-view="${link}"]`);
        if (navBtn) navBtn.click();
      }
    });
  });
}

function switchView(viewName) {
  state.activeView = viewName;
  contentSections.forEach(section => section.classList.add('hidden'));
  idbSelectorBar.classList.add('hidden');
  
  if (viewName === 'overview') {
    viewOverview.classList.remove('hidden');
    refreshData();
  } else if (viewName === 'local' || viewName === 'session' || viewName === 'cookies' || viewName === 'indexeddb') {
    viewStorageInspector.classList.remove('hidden');
    
    // Set headers
    if (viewName === 'local') {
      inspectorTitle.textContent = '📦 Local Storage';
      inspectorSubtitle.textContent = `Inspect LocalStorage items for ${state.activeHost}`;
    } else if (viewName === 'session') {
      inspectorTitle.textContent = '🧠 Session Storage';
      inspectorSubtitle.textContent = `Inspect SessionStorage items for ${state.activeHost}`;
    } else if (viewName === 'cookies') {
      inspectorTitle.textContent = '🍪 Cookies';
      inspectorSubtitle.textContent = `Inspect cookies for domain ${state.activeHost}`;
    } else if (viewName === 'indexeddb') {
      inspectorTitle.textContent = '🗂️ IndexedDB Databases';
      inspectorSubtitle.textContent = `Browse IndexedDB client stores for ${state.activeHost}`;
      idbSelectorBar.classList.remove('hidden');
    }
    
    refreshData();
  } else if (viewName === 'snapshots') {
    viewSnapshots.classList.remove('hidden');
    renderSnapshotsView();
  } else if (viewName === 'backups') {
    viewBackups.classList.remove('hidden');
    renderBackupsView();
  } else if (viewName === 'settings') {
    viewSettings.classList.remove('hidden');
  }
}

// Fetch storage data from Active Tab via scripting injections and extension APIs
function refreshData() {
  if (!state.activeTab || !state.activeHost) return;
  
  // 1. Fetch Cookies
  chrome.runtime.sendMessage({ type: 'GET_COOKIES', url: state.activeUrl }, (response) => {
    if (response && response.cookies) {
      state.cookies = response.cookies;
    }
    updateOverviewStats();
    if (state.activeView === 'cookies') {
      renderTable();
    }
  });

  // 2. Fetch Storage (Local / Session / IndexedDB) from page content-script
  chrome.scripting.executeScript({
    target: { tabId: state.activeTab.id },
    files: ['content-script.js']
  }, () => {
    if (chrome.runtime.lastError) {
      // Permission or script injection blocked
      return;
    }

    // Call Content Script
    chrome.tabs.sendMessage(state.activeTab.id, { action: 'GET_STORAGE_DATA' }, (response) => {
      if (response && response.success) {
        state.localStorage = response.localStorage || [];
        state.sessionStorage = response.sessionStorage || [];
        updateOverviewStats();
        
        if (state.activeView === 'local' || state.activeView === 'session') {
          renderTable();
        }
      }
    });

    // Call IndexedDB reader
    chrome.tabs.sendMessage(state.activeTab.id, { action: 'GET_INDEXEDDB_DATA' }, (response) => {
      if (response && response.success) {
        state.indexedDB = response.databases || [];
        updateOverviewStats();
        
        if (state.activeView === 'indexeddb') {
          populateIndexedDBSelector();
          renderTable();
        }
      }
    });
  });
}

// Auto refresh timer
function startLiveRefresh() {
  if (state.refreshInterval) clearInterval(state.refreshInterval);
  
  const seconds = parseInt(state.settings.autoRefresh);
  if (seconds > 0) {
    refreshModeEl.textContent = `Live Refresh (${seconds}s)`;
    state.refreshInterval = setInterval(() => {
      refreshData();
    }, seconds * 1000);
  } else {
    refreshModeEl.textContent = 'Manual Refresh';
  }
}

// Overview rendering
function updateOverviewStats() {
  // Update numbers
  document.getElementById('ov-local-count').textContent = state.localStorage.length;
  document.getElementById('ov-session-count').textContent = state.sessionStorage.length;
  document.getElementById('ov-cookies-count').textContent = state.cookies.length;
  document.getElementById('ov-idb-count').textContent = state.indexedDB.length;

  const localSize = state.localStorage.reduce((acc, item) => acc + (item.size || 0), 0) / 1024;
  const sessionSize = state.sessionStorage.reduce((acc, item) => acc + (item.size || 0), 0) / 1024;

  document.getElementById('ov-local-size').textContent = localSize.toFixed(2) + ' KB';
  document.getElementById('ov-session-size').textContent = sessionSize.toFixed(2) + ' KB';
  document.getElementById('ov-cookies-domain').textContent = state.activeHost;
  document.getElementById('ov-idb-size').textContent = `${state.indexedDB.length} database(s) found`;

  renderStorageChart(localSize, sessionSize, state.cookies.length * 0.1); // approx cookie size
  renderFavoritesList();
}

// Chart visualizer (donut chart)
function renderStorageChart(local, session, cookies) {
  const chartSvg = document.getElementById('storage-pie-chart');
  const legendList = document.getElementById('chart-legend-list');
  legendList.innerHTML = '';

  const total = local + session + cookies;
  
  const data = [
    { label: 'Local Storage', val: local, color: '#8b5cf6' },
    { label: 'Session Storage', val: session, color: '#3b82f6' },
    { label: 'Cookies', val: cookies, color: '#10b981' }
  ];

  if (total === 0) {
    chartSvg.innerHTML = `<circle cx="50" cy="50" r="40" fill="transparent" stroke="#1f2937" stroke-width="15" />`;
    data.forEach(item => {
      legendList.innerHTML += `
        <div class="legend-item">
          <span class="legend-dot" style="background-color: ${item.color}"></span>
          <span>${item.label} (0 KB / 0%)</span>
        </div>
      `;
    });
    return;
  }

  let accumulatedPercent = 0;
  chartSvg.innerHTML = '';

  data.forEach((item) => {
    const percent = item.val / total;
    if (percent === 0) {
      legendList.innerHTML += `
        <div class="legend-item">
          <span class="legend-dot" style="background-color: ${item.color}"></span>
          <span>${item.label} (0 KB / 0%)</span>
        </div>
      `;
      return;
    }

    const strokeLength = 2 * Math.PI * 40; // 2 * PI * r
    const strokeDasharray = `${strokeLength * percent} ${strokeLength * (1 - percent)}`;
    const strokeDashoffset = -strokeLength * accumulatedPercent;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '50');
    circle.setAttribute('cy', '50');
    circle.setAttribute('r', '40');
    circle.setAttribute('fill', 'transparent');
    circle.setAttribute('stroke', item.color);
    circle.setAttribute('stroke-width', '15');
    circle.setAttribute('stroke-dasharray', strokeDasharray);
    circle.setAttribute('stroke-dashoffset', strokeDashoffset);
    chartSvg.appendChild(circle);

    legendList.innerHTML += `
      <div class="legend-item">
        <span class="legend-dot" style="background-color: ${item.color}"></span>
        <span>${item.label} (${item.val.toFixed(2)} KB / ${(percent * 100).toFixed(0)}%)</span>
      </div>
    `;
    accumulatedPercent += percent;
  });
}

// Table rendering engine
function renderTable() {
  const view = state.activeView;
  let items = [];
  
  tableHeaders.innerHTML = '';
  tableBody.innerHTML = '';
  tableEmptyState.classList.add('hidden');

  if (view === 'local') {
    items = state.localStorage;
    tableHeaders.innerHTML = `
      <th style="width: 40px;">Pin</th>
      <th>Key</th>
      <th>Value</th>
      <th style="width: 100px;">Size</th>
      <th style="width: 120px; text-align: center;">Actions</th>
    `;
  } else if (view === 'session') {
    items = state.sessionStorage;
    tableHeaders.innerHTML = `
      <th style="width: 40px;">Pin</th>
      <th>Key</th>
      <th>Value</th>
      <th style="width: 100px;">Size</th>
      <th style="width: 120px; text-align: center;">Actions</th>
    `;
  } else if (view === 'cookies') {
    items = state.cookies;
    tableHeaders.innerHTML = `
      <th style="width: 40px;">Pin</th>
      <th>Name</th>
      <th>Value</th>
      <th>Domain</th>
      <th>Path</th>
      <th>Attributes</th>
      <th style="width: 120px; text-align: center;">Actions</th>
    `;
  } else if (view === 'indexeddb') {
    items = getSelectedIndexedDBItems();
    tableHeaders.innerHTML = `
      <th>Key</th>
      <th>Value</th>
      <th style="width: 100px;">Size</th>
      <th style="width: 100px; text-align: center;">Actions</th>
    `;
  }

  // Filter items
  const query = searchInput.value.trim();
  const caseSensitive = chkCaseSensitive.checked;
  const showFavsOnly = chkShowFavorites.checked;

  let filtered = items.filter(item => {
    const itemKey = view === 'cookies' ? item.name : item.key;
    const itemVal = item.value;
    
    // Check favorites pin
    if (showFavsOnly && !isPinned(itemKey, view)) {
      return false;
    }

    if (!query) return true;

    // Search query matches
    if (caseSensitive) {
      return itemKey.includes(query) || (itemVal && itemVal.includes(query));
    } else {
      return itemKey.toLowerCase().includes(query.toLowerCase()) || (itemVal && itemVal.toLowerCase().includes(query.toLowerCase()));
    }
  });

  if (filtered.length === 0) {
    tableEmptyState.classList.remove('hidden');
    return;
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    
    const key = view === 'cookies' ? item.name : item.key;
    const val = item.value || '';
    const sizeStr = item.size ? (item.size / 1024).toFixed(2) + ' KB' : 'N/A';

    // Highlight query matches
    const displayedKey = highlightMatch(key, query, caseSensitive);
    const displayedVal = highlightMatch(val.length > 80 ? val.substring(0, 80) + '...' : val, query, caseSensitive);

    if (view === 'local' || view === 'session') {
      const isPinnedItem = isPinned(key, view);
      tr.innerHTML = `
        <td style="text-align: center;">
          <button class="action-icon-btn ${isPinnedItem ? 'pin-active' : ''}" data-action="pin" data-key="${key}">⭐</button>
        </td>
        <td class="key-column" title="${key}">${displayedKey}</td>
        <td class="value-column" title="Click to view full value">${displayedVal}</td>
        <td>${sizeStr}</td>
        <td class="action-cell" style="justify-content: center;">
          <button class="btn btn-secondary btn-xs" data-action="view" data-key="${key}">View</button>
          <button class="btn btn-secondary btn-xs" data-action="edit" data-key="${key}">Edit</button>
          <button class="btn btn-danger btn-xs" data-action="delete" data-key="${key}">Delete</button>
        </td>
      `;
    } else if (view === 'cookies') {
      const isPinnedItem = isPinned(key, view);
      // Construct cookie properties badge
      let attrs = [];
      if (item.secure) attrs.push('Secure');
      if (item.httpOnly) attrs.push('HttpOnly');
      if (item.session) attrs.push('Session');
      if (item.sameSite && item.sameSite !== 'no_restriction') attrs.push(`SameSite=${item.sameSite}`);
      
      tr.innerHTML = `
        <td style="text-align: center;">
          <button class="action-icon-btn ${isPinnedItem ? 'pin-active' : ''}" data-action="pin" data-key="${key}">⭐</button>
        </td>
        <td class="key-column" title="${key}">${displayedKey}</td>
        <td class="value-column" title="Click to view full value">${displayedVal}</td>
        <td>${item.domain}</td>
        <td>${item.path}</td>
        <td>${attrs.map(a => `<span class="fav-item-type">${a}</span>`).join(' ')}</td>
        <td class="action-cell" style="justify-content: center;">
          <button class="btn btn-secondary btn-xs" data-action="view" data-key="${key}">View</button>
          <button class="btn btn-secondary btn-xs" data-action="edit" data-key="${key}">Edit</button>
          <button class="btn btn-danger btn-xs" data-action="delete" data-key="${key}">Delete</button>
        </td>
      `;
    } else if (view === 'indexeddb') {
      tr.innerHTML = `
        <td class="key-column" title="${key}">${displayedKey}</td>
        <td class="value-column" title="Click to view full value">${displayedVal}</td>
        <td>${sizeStr}</td>
        <td class="action-cell" style="justify-content: center;">
          <button class="btn btn-secondary btn-xs" data-action="view" data-key="${key}">View</button>
          <button class="btn btn-danger btn-xs" data-action="delete" data-key="${key}">Delete</button>
        </td>
      `;
    }

    // Attach inline events to table rows
    tr.querySelector('.value-column').addEventListener('click', () => {
      openFullscreenViewer(key, val);
    });

    const actionBtns = tr.querySelectorAll('button');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent opening viewer when clicking action buttons
        const action = btn.getAttribute('data-action');
        const itemKey = btn.getAttribute('data-key');
        
        handleTableAction(action, itemKey, val, item);
      });
    });

    tableBody.appendChild(tr);
  });
}

// Table action router
function handleTableAction(action, key, val, rawItem) {
  const type = state.activeView;

  if (action === 'pin') {
    togglePin(key, type);
  } else if (action === 'view') {
    openFullscreenViewer(key, val);
  } else if (action === 'edit') {
    openEditModal(key, val, rawItem);
  } else if (action === 'delete') {
    confirmDelete(key, type);
  }
}

// Regex highlighter
function highlightMatch(text, query, caseSensitive) {
  if (!query) return escapeHtml(text);
  const regexFlags = caseSensitive ? 'g' : 'gi';
  const cleanQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // escape special characters
  const regex = new RegExp(`(${cleanQuery})`, regexFlags);
  
  return escapeHtml(text).replace(regex, '<span class="highlight">$1</span>');
}

function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Favorites Pinning Engine
function isPinned(key, storageType) {
  const domainPins = state.pinnedKeys[state.activeHost];
  if (!domainPins) return false;
  const list = domainPins[storageType];
  return list ? list.includes(key) : false;
}

function togglePin(key, storageType) {
  if (!state.pinnedKeys[state.activeHost]) {
    state.pinnedKeys[state.activeHost] = {
      localStorage: [],
      sessionStorage: [],
      cookies: [],
      indexeddb: []
    };
  }

  const list = state.pinnedKeys[state.activeHost][storageType] || [];
  const idx = list.indexOf(key);

  if (idx > -1) {
    list.splice(idx, 1);
    showToast('Key unpinned');
  } else {
    list.push(key);
    showToast('Key pinned to favorites');
  }

  state.pinnedKeys[state.activeHost][storageType] = list;

  // Persist to local chrome storage
  chrome.storage.local.set({ pinnedKeys: state.pinnedKeys }, () => {
    refreshData();
  });
}

function renderFavoritesList() {
  const container = document.getElementById('favorites-list');
  container.innerHTML = '';
  
  const pins = state.pinnedKeys[state.activeHost];
  if (!pins) {
    container.innerHTML = `<div class="empty-state">No pinned items. Pin storage keys to keep them handy.</div>`;
    return;
  }

  let hasPins = false;
  
  for (const type of ['localStorage', 'sessionStorage', 'cookies']) {
    const list = pins[type] || [];
    list.forEach(key => {
      hasPins = true;
      const typeLabel = type === 'localStorage' ? 'Local' : type === 'sessionStorage' ? 'Session' : 'Cookie';
      
      const itemEl = document.createElement('div');
      itemEl.className = 'fav-item';
      itemEl.innerHTML = `
        <span class="fav-item-key" title="${key}">${key}</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="fav-item-type">${typeLabel}</span>
          <button class="action-icon-btn pin-active" data-key="${key}" data-type="${type}">⭐</button>
        </div>
      `;

      itemEl.querySelector('button').addEventListener('click', () => {
        togglePin(key, type);
      });

      container.appendChild(itemEl);
    });
  }

  if (!hasPins) {
    container.innerHTML = `<div class="empty-state">No pinned items. Pin storage keys to keep them handy.</div>`;
  }
}

// Action button triggers (Add, export, import, clear)
function setupActions() {
  // Refresh button
  document.querySelectorAll('.refresh-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      refreshData();
      showToast('Data refreshed');
    });
  });

  // Export buttons
  document.getElementById('btn-export').addEventListener('click', () => {
    exportData();
  });

  // Import button
  document.getElementById('btn-import').addEventListener('click', () => {
    fileImportInput.click();
  });

  fileImportInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importPayload = JSON.parse(event.target.result);
        restoreImportData(importPayload);
      } catch (err) {
        showToast('Invalid JSON file format!', true);
      }
    };
    reader.readAsText(file);
    fileImportInput.value = ''; // clear input
  });

  // Clear all button
  document.getElementById('btn-clear-all').addEventListener('click', () => {
    confirmClearAll();
  });

  // Add entry button
  document.getElementById('btn-add-entry').addEventListener('click', () => {
    openEditModal('', '', null);
  });

  // Search input listeners
  searchInput.addEventListener('input', () => {
    renderTable();
  });

  chkCaseSensitive.addEventListener('change', () => {
    renderTable();
  });

  chkShowFavorites.addEventListener('change', () => {
    renderTable();
  });

  // IndexedDB selectors
  idbDbSelect.addEventListener('change', (e) => {
    state.selectedDb = e.target.value;
    populateObjectStoreSelector();
    renderTable();
  });

  idbStoreSelect.addEventListener('change', (e) => {
    state.selectedStore = e.target.value;
    renderTable();
  });

  document.getElementById('btn-delete-idb').addEventListener('click', () => {
    if (!state.selectedDb) return;
    
    itemPendingDelete = { type: 'indexeddb_db', dbName: state.selectedDb };
    deleteConfirmText.textContent = `Are you sure you want to delete the IndexedDB database "${state.selectedDb}"? All local tables inside will be lost.`;
    modalDeleteConfirm.classList.remove('hidden');
  });

  // Snapshots capture trigger
  document.getElementById('btn-take-snapshot').addEventListener('click', () => {
    takeStorageSnapshot();
  });

  document.getElementById('btn-compare-now').addEventListener('click', () => {
    compareSnapshots();
  });

  // Backups clear trigger
  document.getElementById('btn-clear-backups').addEventListener('click', () => {
    state.backups = [];
    chrome.storage.local.set({ backups: [] }, () => {
      renderBackupsView();
      showToast('Backup history cleared');
    });
  });

  // Inline configuration page submit
  document.getElementById('dash-settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newConfig = {
      theme: document.getElementById('dash-theme').value,
      autoRefresh: document.getElementById('dash-auto-refresh').value,
      exportFormat: document.getElementById('dash-export-format').value,
      maxSnapshots: state.settings.maxSnapshots // keep original
    };

    chrome.storage.sync.set(newConfig, () => {
      state.settings = newConfig;
      applyTheme(newConfig.theme);
      startLiveRefresh();
      showToast('Settings saved successfully!');
    });
  });
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Ctrl + F -> focus search box
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      if (state.activeView === 'local' || state.activeView === 'session' || state.activeView === 'cookies' || state.activeView === 'indexeddb') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    }

    // Escape -> close active modals
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

// Modal handling
function setupModals() {
  // Close triggers
  document.getElementById('btn-close-edit-modal').addEventListener('click', () => {
    modalEditEntry.classList.add('hidden');
  });
  document.getElementById('btn-cancel-edit').addEventListener('click', () => {
    modalEditEntry.classList.add('hidden');
  });

  document.getElementById('btn-close-viewer-modal').addEventListener('click', () => {
    modalValueViewer.classList.add('hidden');
  });

  document.getElementById('btn-close-delete-modal').addEventListener('click', () => {
    modalDeleteConfirm.classList.add('hidden');
  });
  document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    modalDeleteConfirm.classList.add('hidden');
  });

  // Delete Action confirmation
  document.getElementById('btn-confirm-delete').addEventListener('click', () => {
    executePendingDelete();
  });

  // Add/Edit Save action
  document.getElementById('btn-save-entry').addEventListener('click', () => {
    saveEditEntry();
  });

  // Viewer utilities
  document.getElementById('btn-viewer-copy').addEventListener('click', () => {
    copyToClipboard(viewerRawText.value);
    showToast('Value copied to clipboard');
  });
}

function closeAllModals() {
  modalEditEntry.classList.add('hidden');
  modalValueViewer.classList.add('hidden');
  modalDeleteConfirm.classList.add('hidden');
}

// CRUD: Add and Edit Storage Entry
function openEditModal(key, value, rawItem) {
  const view = state.activeView;
  
  if (view === 'indexeddb') {
    showToast('Editing IndexedDB data directly is not supported in this version.', true);
    return;
  }

  modalEditEntry.classList.remove('hidden');
  cookieSpecificFields.classList.add('hidden');
  
  if (key) {
    modalEditTitle.textContent = `Edit Storage Item (${key})`;
    editKeyInput.value = key;
    editKeyInput.disabled = true;
    editValueInput.value = value;
  } else {
    modalEditTitle.textContent = 'Add New Storage Item';
    editKeyInput.value = '';
    editKeyInput.disabled = false;
    editValueInput.value = '';
  }

  if (view === 'cookies') {
    cookieSpecificFields.classList.remove('hidden');
    
    if (rawItem) {
      cookiePath.value = rawItem.path || '/';
      cookieDomain.value = rawItem.domain || '';
      cookieSecure.checked = rawItem.secure || false;
      cookieHttponly.checked = rawItem.httpOnly || false;
      cookieSamesite.value = rawItem.sameSite || 'lax';
      
      if (rawItem.expirationDate) {
        const date = new Date(rawItem.expirationDate * 1000);
        // format date to ISO local format for date input
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - timezoneOffset)).toISOString().slice(0, 16);
        cookieExpiry.value = localISOTime;
      } else {
        cookieExpiry.value = '';
      }
    } else {
      cookiePath.value = '/';
      cookieDomain.value = state.activeHost;
      cookieSecure.checked = false;
      cookieHttponly.checked = false;
      cookieSamesite.value = 'lax';
      cookieExpiry.value = '';
    }
  }
}

function saveEditEntry() {
  const view = state.activeView;
  const key = editKeyInput.value.trim();
  const value = editValueInput.value;

  if (!key) {
    showToast('Key name cannot be empty', true);
    return;
  }

  if (view === 'local' || view === 'session') {
    chrome.tabs.sendMessage(state.activeTab.id, {
      action: 'SET_STORAGE_ITEM',
      type: view === 'local' ? 'localStorage' : 'sessionStorage',
      key: key,
      value: value
    }, (res) => {
      if (res && res.success) {
        modalEditEntry.classList.add('hidden');
        showToast('Value saved successfully');
        refreshData();
      } else {
        showToast('Failed to save data', true);
      }
    });
  } else if (view === 'cookies') {
    const expiryVal = cookieExpiry.value;
    let expirationDate = undefined;
    if (expiryVal) {
      expirationDate = new Date(expiryVal).getTime() / 1000;
    }

    chrome.runtime.sendMessage({
      type: 'SET_COOKIE',
      url: state.activeUrl,
      name: key,
      value: value,
      domain: cookieDomain.value.trim() || undefined,
      path: cookiePath.value.trim() || undefined,
      secure: cookieSecure.checked,
      httpOnly: cookieHttponly.checked,
      sameSite: cookieSamesite.value,
      expirationDate: expirationDate
    }, (res) => {
      if (res && res.success) {
        modalEditEntry.classList.add('hidden');
        showToast('Cookie saved successfully');
        refreshData();
      } else {
        showToast('Error: ' + (res.error || 'Could not set cookie'), true);
      }
    });
  }
}

// CRUD: Deletion management
function confirmDelete(key, type) {
  itemPendingDelete = { key, type };
  
  if (type === 'indexeddb') {
    itemPendingDelete.dbName = state.selectedDb;
    itemPendingDelete.storeName = state.selectedStore;
    deleteConfirmText.textContent = `Are you sure you want to delete item "${key}" from object store "${state.selectedStore}"?`;
  } else {
    deleteConfirmText.textContent = `Are you sure you want to delete the item "${key}"?`;
  }
  
  modalDeleteConfirm.classList.remove('hidden');
}

function executePendingDelete() {
  if (!itemPendingDelete) return;

  const { key, type, dbName, storeName } = itemPendingDelete;

  if (type === 'local' || type === 'session') {
    chrome.tabs.sendMessage(state.activeTab.id, {
      action: 'DELETE_STORAGE_ITEM',
      type: type === 'local' ? 'localStorage' : 'sessionStorage',
      key: key
    }, (res) => {
      if (res && res.success) {
        showToast('Item deleted');
        refreshData();
      }
    });
  } else if (type === 'cookies') {
    chrome.runtime.sendMessage({
      type: 'DELETE_COOKIE',
      url: state.activeUrl,
      name: key
    }, (res) => {
      if (res && res.success) {
        showToast('Cookie removed');
        refreshData();
      }
    });
  } else if (type === 'indexeddb') {
    chrome.tabs.sendMessage(state.activeTab.id, {
      action: 'DELETE_INDEXEDDB_ITEM',
      dbName,
      storeName,
      key
    }, (res) => {
      if (res && res.success) {
        showToast('IndexedDB item deleted');
        refreshData();
      }
    });
  } else if (type === 'indexeddb_db') {
    chrome.tabs.sendMessage(state.activeTab.id, {
      action: 'DELETE_INDEXEDDB_DATABASE',
      dbName
    }, (res) => {
      if (res && res.success) {
        showToast(`Database "${dbName}" deleted`);
        state.selectedDb = null;
        state.selectedStore = null;
        refreshData();
      }
    });
  }

  modalDeleteConfirm.classList.add('hidden');
  itemPendingDelete = null;
}

// CRUD: Clear All
function confirmClearAll() {
  const type = state.activeView;
  let confirmMsg = '';

  if (type === 'local') confirmMsg = 'Clear entire Local Storage?';
  else if (type === 'session') confirmMsg = 'Clear entire Session Storage?';
  else if (type === 'cookies') confirmMsg = 'Remove all cookies on this site domain?';
  else if (type === 'indexeddb') {
    if (!state.selectedStore) return;
    confirmMsg = `Clear all records in object store "${state.selectedStore}"?`;
  } else return;

  itemPendingDelete = { type: 'clear_all', target: type };
  deleteConfirmText.textContent = confirmMsg + ' This is a destructive operation.';
  modalDeleteConfirm.classList.remove('hidden');
}

function executeClearAll() {
  const target = itemPendingDelete.target;

  if (target === 'local' || target === 'session') {
    chrome.tabs.sendMessage(state.activeTab.id, {
      action: 'CLEAR_STORAGE',
      type: target === 'local' ? 'localStorage' : 'sessionStorage'
    }, (res) => {
      if (res && res.success) {
        showToast(`${target === 'local' ? 'LocalStorage' : 'SessionStorage'} cleared`);
        refreshData();
      }
    });
  } else if (target === 'cookies') {
    // Delete each cookie sequentially
    let errors = 0;
    const promises = state.cookies.map(c => {
      return new Promise(resolve => {
        chrome.runtime.sendMessage({
          type: 'DELETE_COOKIE',
          url: state.activeUrl,
          name: c.name
        }, (res) => {
          if (!res || !res.success) errors++;
          resolve();
        });
      });
    });

    Promise.all(promises).then(() => {
      showToast(errors > 0 ? `Cleared cookies with ${errors} failures` : 'All cookies deleted');
      refreshData();
    });
  } else if (target === 'indexeddb') {
    chrome.tabs.sendMessage(state.activeTab.id, {
      action: 'CLEAR_INDEXEDDB_STORE',
      dbName: state.selectedDb,
      storeName: state.selectedStore
    }, (res) => {
      if (res && res.success) {
        showToast(`Object store "${state.selectedStore}" cleared`);
        refreshData();
      }
    });
  }
}

// Modify executePendingDelete to direct to executeClearAll if appropriate
const originalExecute = executePendingDelete;
executePendingDelete = function() {
  if (itemPendingDelete && itemPendingDelete.type === 'clear_all') {
    executeClearAll();
    modalDeleteConfirm.classList.add('hidden');
    itemPendingDelete = null;
  } else {
    originalExecute();
  }
};

// IndexedDB Helper mappings
function populateIndexedDBSelector() {
  idbDbSelect.innerHTML = '';
  
  if (state.indexedDB.length === 0) {
    idbDbSelect.innerHTML = '<option value="">No databases</option>';
    idbStoreSelect.innerHTML = '<option value="">No stores</option>';
    return;
  }

  state.indexedDB.forEach(db => {
    const opt = document.createElement('option');
    opt.value = db.name;
    opt.textContent = `${db.name} (v${db.version})`;
    idbDbSelect.appendChild(opt);
  });

  if (!state.selectedDb || !state.indexedDB.some(d => d.name === state.selectedDb)) {
    state.selectedDb = state.indexedDB[0].name;
  }
  idbDbSelect.value = state.selectedDb;

  populateObjectStoreSelector();
}

function populateObjectStoreSelector() {
  idbStoreSelect.innerHTML = '';
  
  const currentDb = state.indexedDB.find(db => db.name === state.selectedDb);
  if (!currentDb || !currentDb.stores || currentDb.stores.length === 0) {
    idbStoreSelect.innerHTML = '<option value="">No object stores</option>';
    state.selectedStore = null;
    return;
  }

  currentDb.stores.forEach(store => {
    const opt = document.createElement('option');
    opt.value = store.name;
    opt.textContent = `${store.name} (${store.items.length} items)`;
    idbStoreSelect.appendChild(opt);
  });

  if (!state.selectedStore || !currentDb.stores.some(s => s.name === state.selectedStore)) {
    state.selectedStore = currentDb.stores[0].name;
  }
  idbStoreSelect.value = state.selectedStore;
}

function getSelectedIndexedDBItems() {
  const currentDb = state.indexedDB.find(db => db.name === state.selectedDb);
  if (!currentDb) return [];
  const currentStore = currentDb.stores.find(s => s.name === state.selectedStore);
  return currentStore ? currentStore.items : [];
}

// Fullscreen JSON/Value Inspector
function openFullscreenViewer(key, val) {
  modalValueViewer.classList.remove('hidden');
  viewerRawText.value = val;
  jsonTreeContainer.innerHTML = '';

  // Try to parse as JSON
  try {
    const obj = JSON.parse(val);
    jsonTreeContainer.appendChild(renderJsonNode(obj, 'Root Object'));
  } catch (e) {
    // If not JSON, show a fallback message
    jsonTreeContainer.innerHTML = `<span class="json-val-string">"Not a valid JSON object. Inspect raw text on the left."</span>`;
  }
}

// JSON Visual Tree Builder
function renderJsonNode(val, keyName = null) {
  const node = document.createElement('div');
  node.className = 'json-node';

  const header = document.createElement('div');
  header.className = 'json-node-header';

  if (keyName !== null) {
    const keySpan = document.createElement('span');
    keySpan.className = 'json-key';
    keySpan.textContent = `"${keyName}": `;
    header.appendChild(keySpan);
  }

  if (val === null) {
    const valSpan = document.createElement('span');
    valSpan.className = 'json-val-null';
    valSpan.textContent = 'null';
    header.appendChild(valSpan);
    node.appendChild(header);
  } else if (typeof val === 'object') {
    const isArray = Array.isArray(val);
    const bracketOpen = isArray ? '[' : '{';
    const bracketClose = isArray ? ']' : '}';
    const size = isArray ? val.length : Object.keys(val).length;
    
    const bracketSpan = document.createElement('span');
    bracketSpan.className = 'json-bracket';
    bracketSpan.textContent = `${bracketOpen} // ${size} items`;
    header.appendChild(bracketSpan);

    const toggle = document.createElement('span');
    toggle.className = 'json-node-toggle';
    node.appendChild(toggle);
    node.appendChild(header);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'json-node-content';
    
    if (isArray) {
      val.forEach((item, idx) => {
        contentDiv.appendChild(renderJsonNode(item, idx));
      });
    } else {
      Object.keys(val).forEach(k => {
        contentDiv.appendChild(renderJsonNode(val[k], k));
      });
    }

    const footer = document.createElement('div');
    footer.className = 'json-footer';
    footer.textContent = bracketClose;
    contentDiv.appendChild(footer);
    node.appendChild(contentDiv);

    toggle.addEventListener('click', () => {
      node.classList.toggle('collapsed');
    });
  } else {
    // Primitives
    const valSpan = document.createElement('span');
    if (typeof val === 'string') {
      valSpan.className = 'json-val-string';
      valSpan.textContent = `"${val}"`;
    } else if (typeof val === 'number') {
      valSpan.className = 'json-val-number';
      valSpan.textContent = val;
    } else if (typeof val === 'boolean') {
      valSpan.className = 'json-val-boolean';
      valSpan.textContent = val;
    }
    header.appendChild(valSpan);
    node.appendChild(header);
  }

  return node;
}

// Tree view expand/collapse actions
document.getElementById('btn-expand-all').addEventListener('click', () => {
  document.querySelectorAll('.json-node').forEach(node => {
    node.classList.remove('collapsed');
  });
});

document.getElementById('btn-collapse-all').addEventListener('click', () => {
  document.querySelectorAll('.json-node').forEach(node => {
    // Don't collapse root
    if (node !== jsonTreeContainer.firstChild) {
      node.classList.add('collapsed');
    }
  });
});

// Snapshots Management Engine
function takeStorageSnapshot() {
  const snapshot = {
    id: 'snap_' + Date.now(),
    timestamp: new Date().toLocaleString(),
    title: state.activeTab.title || 'Storage Snapshot',
    host: state.activeHost,
    localStorage: JSON.parse(JSON.stringify(state.localStorage)),
    sessionStorage: JSON.parse(JSON.stringify(state.sessionStorage)),
    cookies: JSON.parse(JSON.stringify(state.cookies))
  };

  state.snapshots.unshift(snapshot);
  
  // Truncate to maxsnapshots limit
  const limit = state.settings.maxSnapshots || 10;
  if (state.snapshots.length > limit) {
    state.snapshots = state.snapshots.slice(0, limit);
  }

  chrome.storage.local.set({ snapshots: state.snapshots }, () => {
    renderSnapshotsView();
    showToast('Storage snapshot captured!');
  });
}

function renderSnapshotsView() {
  const listContainer = document.getElementById('snapshot-list-container');
  const baseSelect = document.getElementById('compare-base-select');
  const targetSelect = document.getElementById('compare-target-select');

  listContainer.innerHTML = '';
  baseSelect.innerHTML = '<option value="">Select Base</option>';
  targetSelect.innerHTML = '<option value="">Select Target</option>';

  const hostSnapshots = state.snapshots.filter(s => s.host === state.activeHost);

  if (hostSnapshots.length === 0) {
    listContainer.innerHTML = `<div class="empty-state">No snapshots captured for ${state.activeHost} yet.</div>`;
    return;
  }

  hostSnapshots.forEach(snap => {
    // Calculate sizing stats
    const localItems = snap.localStorage ? snap.localStorage.length : 0;
    const sessionItems = snap.sessionStorage ? snap.sessionStorage.length : 0;
    const cookieItems = snap.cookies ? snap.cookies.length : 0;

    const div = document.createElement('div');
    div.className = 'snapshot-item';
    div.innerHTML = `
      <div class="time">${snap.timestamp}</div>
      <div class="title" title="${snap.title}">${snap.title}</div>
      <div class="size-info">Local: ${localItems} | Session: ${sessionItems} | Cookies: ${cookieItems}</div>
      <div style="text-align: right; margin-top: 8px;">
        <button class="btn btn-danger btn-xs delete-snap-btn" data-id="${snap.id}">Delete</button>
      </div>
    `;

    div.querySelector('.delete-snap-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSnapshot(snap.id);
    });

    listContainer.appendChild(div);

    // populate comparison selectors
    const opt1 = document.createElement('option');
    opt1.value = snap.id;
    opt1.textContent = snap.timestamp;
    baseSelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = snap.id;
    opt2.textContent = snap.timestamp;
    targetSelect.appendChild(opt2);
  });
}

function deleteSnapshot(id) {
  state.snapshots = state.snapshots.filter(s => s.id !== id);
  chrome.storage.local.set({ snapshots: state.snapshots }, () => {
    renderSnapshotsView();
    showToast('Snapshot deleted');
  });
}

function compareSnapshots() {
  const baseId = document.getElementById('compare-base-select').value;
  const targetId = document.getElementById('compare-target-select').value;
  const resultsContainer = document.getElementById('comparison-results-container');

  if (!baseId || !targetId) {
    showToast('Please select two snapshots to compare', true);
    return;
  }

  const base = state.snapshots.find(s => s.id === baseId);
  const target = state.snapshots.find(s => s.id === targetId);

  if (!base || !target) {
    showToast('Could not load snapshots', true);
    return;
  }

  resultsContainer.innerHTML = '';
  
  // Combine storage objects
  const diffs = {
    added: [],
    deleted: [],
    modified: []
  };

  // Helper map builders
  const baseMap = new Map();
  const targetMap = new Map();

  // We compare LocalStorage as a representative sample (or combine all types)
  const baseItems = [...(base.localStorage || []), ...(base.sessionStorage || []), ...(base.cookies || [])];
  const targetItems = [...(target.localStorage || []), ...(target.sessionStorage || []), ...(target.cookies || [])];

  baseItems.forEach(item => baseMap.set(item.key || item.name, item.value));
  targetItems.forEach(item => targetMap.set(item.key || item.name, item.value));

  // Find added and modified
  targetMap.forEach((val, key) => {
    if (!baseMap.has(key)) {
      diffs.added.push({ key, val });
    } else if (baseMap.get(key) !== val) {
      diffs.modified.push({ key, oldVal: baseMap.get(key), newVal: val });
    }
  });

  // Find deleted
  baseMap.forEach((val, key) => {
    if (!targetMap.has(key)) {
      diffs.deleted.push({ key, val });
    }
  });

  if (diffs.added.length === 0 && diffs.deleted.length === 0 && diffs.modified.length === 0) {
    resultsContainer.innerHTML = `<div class="empty-state">No changes found between these snapshots.</div>`;
    return;
  }

  // Display Diffs
  diffs.added.forEach(item => {
    resultsContainer.innerHTML += `
      <div class="comp-diff-row added">
        <span class="comp-diff-key">[+] ${item.key}</span>
        <span>Added: "${item.val}"</span>
      </div>
    `;
  });

  diffs.modified.forEach(item => {
    resultsContainer.innerHTML += `
      <div class="comp-diff-row modified">
        <span class="comp-diff-key">[*] ${item.key}</span>
        <span>Modified: "${item.oldVal}" &rarr; "${item.newVal}"</span>
      </div>
    `;
  });

  diffs.deleted.forEach(item => {
    resultsContainer.innerHTML += `
      <div class="comp-diff-row deleted">
        <span class="comp-diff-key">[-] ${item.key}</span>
        <span>Deleted: "${item.val}"</span>
      </div>
    `;
  });
}

// Backup history view builder
function renderBackupsView() {
  const body = document.getElementById('backups-table-body');
  body.innerHTML = '';

  const siteBackups = state.backups.filter(b => b.host === state.activeHost);

  if (siteBackups.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="empty-state" style="text-align: center;">No backups found for this domain.</td></tr>`;
    return;
  }

  siteBackups.forEach((b, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${b.timestamp}</td>
      <td>${b.host}</td>
      <td>${b.count} items</td>
      <td><span class="fav-item-type">${b.type}</span></td>
      <td>
        <button class="btn btn-secondary btn-xs restore-backup-btn" data-idx="${index}">Restore</button>
      </td>
    `;
    
    tr.querySelector('.restore-backup-btn').addEventListener('click', () => {
      restoreImportData(b.payload);
    });

    body.appendChild(tr);
  });
}

// Export / Import restoration functions
function exportData() {
  const view = state.activeView;
  let dataToExport = null;
  let filename = `${state.activeHost}_${view}_storage`;

  if (view === 'local') dataToExport = state.localStorage;
  else if (view === 'session') dataToExport = state.sessionStorage;
  else if (view === 'cookies') dataToExport = state.cookies;
  else {
    showToast('Export only available on active storage tables', true);
    return;
  }

  const format = state.settings.exportFormat || 'json';

  if (format === 'json') {
    // Generate pretty JSON
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `${filename}.json`);
  } else {
    // Generate CSV
    let csv = '';
    if (view === 'cookies') {
      csv = 'Name,Value,Domain,Path,Secure,HttpOnly\n';
      dataToExport.forEach(c => {
        csv += `"${escapeCsv(c.name)}","${escapeCsv(c.value)}","${escapeCsv(c.domain)}","${escapeCsv(c.path)}",${c.secure},${c.httpOnly}\n`;
      });
    } else {
      csv = 'Key,Value,Approx Size(Bytes)\n';
      dataToExport.forEach(i => {
        csv += `"${escapeCsv(i.key)}","${escapeCsv(i.value)}",${i.size}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    triggerDownload(blob, `${filename}.csv`);
  }

  // Save to backup history log
  saveBackupLog(view, dataToExport);
}

function escapeCsv(str) {
  if (!str) return '';
  return str.replace(/"/g, '""');
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Successfully exported file: ${filename}`);
}

function saveBackupLog(type, payload) {
  const log = {
    timestamp: new Date().toLocaleString(),
    host: state.activeHost,
    count: payload.length,
    type: type,
    payload: payload
  };

  state.backups.unshift(log);
  
  // Limiting backup logs to 20
  if (state.backups.length > 20) state.backups.pop();

  chrome.storage.local.set({ backups: state.backups }, () => {
    renderBackupsView();
  });
}

function restoreImportData(importPayload) {
  const view = state.activeView;

  if (!Array.isArray(importPayload)) {
    showToast('Import error: JSON must be an array of storage objects!', true);
    return;
  }

  let count = 0;
  
  if (view === 'local' || view === 'session') {
    const promises = importPayload.map(item => {
      if (!item.key) return Promise.resolve();
      count++;
      return new Promise(resolve => {
        chrome.tabs.sendMessage(state.activeTab.id, {
          action: 'SET_STORAGE_ITEM',
          type: view === 'local' ? 'localStorage' : 'sessionStorage',
          key: item.key,
          value: item.value || ''
        }, resolve);
      });
    });

    Promise.all(promises).then(() => {
      showToast(`Restored ${count} keys to ${view === 'local' ? 'LocalStorage' : 'SessionStorage'}`);
      refreshData();
    });
  } else if (view === 'cookies') {
    const promises = importPayload.map(item => {
      const name = item.name || item.key;
      if (!name) return Promise.resolve();
      count++;
      return new Promise(resolve => {
        chrome.runtime.sendMessage({
          type: 'SET_COOKIE',
          url: state.activeUrl,
          name: name,
          value: item.value || '',
          domain: item.domain || state.activeHost,
          path: item.path || '/',
          secure: item.secure || false,
          httpOnly: item.httpOnly || false,
          sameSite: item.sameSite || 'lax',
          expirationDate: item.expirationDate
        }, resolve);
      });
    });

    Promise.all(promises).then(() => {
      showToast(`Restored ${count} cookies to active domain`);
      refreshData();
    });
  } else {
    showToast('Please go to Local/Session Storage or Cookies tab to import data', true);
  }
}

// Clipboard copying utility
function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

// Toast manager
function showToast(message, isError = false) {
  toastEl.textContent = message;
  toastEl.style.backgroundColor = isError ? 'var(--danger-color)' : 'var(--toast-bg)';
  toastEl.classList.add('show');
  
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2500);
}
