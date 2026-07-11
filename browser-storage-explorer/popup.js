// popup.js - Extension popup controller

document.addEventListener('DOMContentLoaded', () => {
  const siteUrlEl = document.getElementById('site-url');
  const localCountEl = document.getElementById('local-count');
  const localSizeEl = document.getElementById('local-size');
  const sessionCountEl = document.getElementById('session-count');
  const sessionSizeEl = document.getElementById('session-size');
  const cookiesCountEl = document.getElementById('cookies-count');
  const cookiesDomainEl = document.getElementById('cookies-domain');
  
  const optionsBtn = document.getElementById('options-btn');
  const openDashboardBtn = document.getElementById('open-dashboard-btn');

  // Load Settings Theme
  chrome.storage.sync.get({ theme: 'dark' }, (settings) => {
    applyTheme(settings.theme);
  });

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
    }
  }

  // Open settings
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Open dashboard in new tab with the active tab ID passed as query param
  openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.create({ url: chrome.runtime.getURL(`dashboard.html?tabId=${tabs[0].id}`) });
      } else {
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
      }
    });
  });

  // Query active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      siteUrlEl.textContent = 'No active tab found';
      return;
    }

    const activeTab = tabs[0];
    const url = activeTab.url;

    // Check if the URL is inspectable (not chrome://, about://, etc.)
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://') || url.startsWith('about:')) {
      siteUrlEl.textContent = 'Cannot inspect system pages';
      disableInspectUI();
      return;
    }

    try {
      const parsedUrl = new URL(url);
      siteUrlEl.textContent = parsedUrl.hostname;
      cookiesDomainEl.textContent = parsedUrl.hostname;

      // 1. Get cookies count
      chrome.cookies.getAll({ domain: parsedUrl.hostname }, (cookies) => {
        const count = cookies ? cookies.length : 0;
        cookiesCountEl.textContent = count;
      });

      // 2. Fetch Storage statistics from Content Script
      // Inject content script first to ensure it is running
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content-script.js']
      }, () => {
        if (chrome.runtime.lastError) {
          // If we fail to inject, might be permission issue or page load issue
          console.warn("Could not inject content script:", chrome.runtime.lastError.message);
          siteUrlEl.textContent = "Injection blocked by policy";
          disableInspectUI();
          return;
        }

        // Script is loaded, query storage data
        chrome.tabs.sendMessage(activeTab.id, { action: 'GET_STORAGE_DATA' }, (response) => {
          if (chrome.runtime.lastError || !response || !response.success) {
            console.error("Failed to fetch storage data:", chrome.runtime.lastError);
            return;
          }

          const localItems = response.localStorage || [];
          const sessionItems = response.sessionStorage || [];

          // Calculate counts
          localCountEl.textContent = localItems.length;
          sessionCountEl.textContent = sessionItems.length;

          // Calculate approximate sizes
          const localSizeKB = localItems.reduce((acc, item) => acc + (item.size || 0), 0) / 1024;
          const sessionSizeKB = sessionItems.reduce((acc, item) => acc + (item.size || 0), 0) / 1024;

          localSizeEl.textContent = localSizeKB.toFixed(2) + ' KB';
          sessionSizeEl.textContent = sessionSizeKB.toFixed(2) + ' KB';
        });
      });

    } catch (e) {
      siteUrlEl.textContent = 'Invalid website URL';
      disableInspectUI();
    }
  });

  function disableInspectUI() {
    localCountEl.textContent = 'N/A';
    localSizeEl.textContent = '-';
    sessionCountEl.textContent = 'N/A';
    sessionSizeEl.textContent = '-';
    cookiesCountEl.textContent = 'N/A';
  }

  // Click on cards to open dashboard in specific tabs if implemented later
  document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    });
  });
});
