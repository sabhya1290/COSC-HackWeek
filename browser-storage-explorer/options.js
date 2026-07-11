// options.js - Configuration settings handling for Browser Storage Explorer

const form = document.getElementById('settings-form');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const toast = document.getElementById('toast');

const defaults = {
  theme: 'dark',
  autoRefresh: '1',
  exportFormat: 'json',
  maxSnapshots: 10
};

// Apply UI Theme
function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  } else if (theme === 'dark') {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  } else {
    // System preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-theme', prefersDark);
    document.body.classList.toggle('light-theme', !prefersDark);
  }
}

// Load configurations
function loadSettings() {
  chrome.storage.sync.get(defaults, (settings) => {
    document.getElementById('default-theme').value = settings.theme;
    document.getElementById('auto-refresh').value = settings.autoRefresh;
    document.getElementById('export-format').value = settings.exportFormat;
    document.getElementById('max-snapshots').value = settings.maxSnapshots;
    
    applyTheme(settings.theme);
  });
}

// Save configurations
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const settings = {
    theme: document.getElementById('default-theme').value,
    autoRefresh: document.getElementById('auto-refresh').value,
    exportFormat: document.getElementById('export-format').value,
    maxSnapshots: parseInt(document.getElementById('max-snapshots').value) || 10
  };

  chrome.storage.sync.set(settings, () => {
    applyTheme(settings.theme);
    showToast('Settings saved successfully!');
  });
});

// Reset configurations
resetBtn.addEventListener('click', () => {
  chrome.storage.sync.set(defaults, () => {
    loadSettings();
    showToast('Settings reset to defaults');
  });
});

// Show notification toast
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);

// Listen to theme selector live change
document.getElementById('default-theme').addEventListener('change', (e) => {
  applyTheme(e.target.value);
});
