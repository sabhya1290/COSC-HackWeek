/**
 * MetaLens - File Metadata Inspector
 * Client-side file metadata viewer and manager.
 */

// Configure PDF.js Worker
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
}

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const browseBtn = document.getElementById('browse-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const emptyState = document.getElementById('empty-state');
  const controlsSection = document.getElementById('controls-section');
  const cardsGrid = document.getElementById('cards-grid');
  const searchInput = document.getElementById('search-input');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const toastContainer = document.getElementById('toast-container');
  
  // Dialog Elements
  const clearDialog = document.getElementById('clear-dialog');
  const confirmClearBtn = document.getElementById('confirm-clear-btn');
  const cancelClearBtn = document.getElementById('cancel-clear-btn');

  // Application State
  let filesList = []; // Holds file metadata objects
  let activeFilter = 'all';
  let searchQuery = '';

  // Load initial history from LocalStorage
  loadHistory();

  // --- File Selection Event Handlers ---

  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  });

  // Drag and drop setup
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      processFiles(files);
    }
  });

  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  // --- Core File Processing Logic ---

  async function processFiles(files) {
    let newFilesCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
      
      // Determine file category
      let category = 'other';
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        category = 'image';
      } else if (ext === 'pdf') {
        category = 'pdf';
      } else {
        showToast(`Unsupported format: .${ext.toUpperCase()}`, 'danger');
        continue;
      }

      const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Read basic details
      const meta = {
        id: fileId,
        name: file.name,
        sizeBytes: file.size,
        sizeFormatted: formatBytes(file.size),
        type: file.type || 'Unknown MIME type',
        lastModified: new Date(file.lastModified).toLocaleString(),
        extension: ext.toUpperCase(),
        category: category,
        previewUrl: null, // Temp in-memory URL for current session only
        pdfPages: null,
        dimensions: null,
        aspectRatio: null,
        exif: null
      };

      // 1. Process Images
      if (category === 'image') {
        // Dimensions
        const dims = await getImageDimensions(file);
        if (dims) {
          meta.dimensions = `${dims.width} x ${dims.height} px`;
          meta.aspectRatio = calculateAspectRatio(dims.width, dims.height);
        }

        // Preview URL (current session only)
        meta.previewUrl = URL.createObjectURL(file);

        // EXIF metadata
        if (window.EXIF) {
          const exifData = await getExifData(file);
          if (exifData && Object.keys(exifData).length > 0) {
            meta.exif = {
              make: exifData.Make || 'N/A',
              model: exifData.Model || 'N/A',
              dateTaken: exifData.DateTimeOriginal || 'N/A',
              orientation: formatOrientation(exifData.Orientation),
              gps: formatGPS(exifData.GPSLatitude, exifData.GPSLatitudeRef, exifData.GPSLongitude, exifData.GPSLongitudeRef)
            };
          }
        }
      }

      // 2. Process PDFs
      if (category === 'pdf') {
        const pages = await getPdfPageCount(file);
        if (pages !== null) {
          meta.pdfPages = pages;
        }
      }

      filesList.unshift(meta);
      newFilesCount++;
    }

    if (newFilesCount > 0) {
      showToast(`Successfully added ${newFilesCount} file(s)`, 'success');
      saveHistoryToLocalStorage();
      renderWorkspace();
    }
  }

  // --- Helper Methods for Sizing and Formatting ---

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function calculateAspectRatio(width, height) {
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const r = gcd(width, height);
    return `${width / r}:${height / r}`;
  }

  function formatOrientation(orientation) {
    if (!orientation) return 'N/A';
    const orientations = {
      1: 'Normal (Horizontal)',
      3: 'Rotated 180°',
      6: 'Rotated 90° CW',
      8: 'Rotated 90° CCW',
      9: 'Unknown'
    };
    return orientations[orientation] || `Code ${orientation}`;
  }

  function formatGPS(lat, latRef, lon, lonRef) {
    if (!lat || !lon) return 'N/A';
    
    const convertDMSToDD = (dms, ref) => {
      if (!dms || dms.length < 3) return 0;
      let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
      if (ref === 'S' || ref === 'W') {
        dd = dd * -1;
      }
      return dd.toFixed(5);
    };

    const latitude = convertDMSToDD(lat, latRef);
    const longitude = convertDMSToDD(lon, lonRef);
    return `${latitude}, ${longitude}`;
  }

  // --- File Reading Promisified Utilities ---

  function getImageDimensions(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  }

  function getExifData(file) {
    return new Promise((resolve) => {
      EXIF.getData(file, function() {
        const allTags = EXIF.getAllTags(this);
        resolve(allTags);
      });
    });
  }

  function getPdfPageCount(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        pdfjsLib.getDocument(typedarray).promise.then(pdf => {
          resolve(pdf.numPages);
        }).catch(err => {
          console.error('PDF.js loading error:', err);
          resolve(null);
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(file);
    });
  }

  // --- Rendering UI Logic ---

  function renderWorkspace() {
    // Show/hide controls, empty states, and reset elements
    if (filesList.length === 0) {
      emptyState.classList.remove('d-none');
      controlsSection.classList.add('d-none');
      clearAllBtn.classList.add('d-none');
      cardsGrid.innerHTML = '';
      return;
    }

    emptyState.classList.add('d-none');
    controlsSection.classList.remove('d-none');
    clearAllBtn.classList.remove('d-none');

    // Filter and Search the data
    const filteredFiles = filesList.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || file.category === activeFilter;
      return matchesSearch && matchesFilter;
    });

    cardsGrid.innerHTML = '';
    
    if (filteredFiles.length === 0) {
      cardsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>No matching files found</h3>
          <p>Try modifying your search or changing the filter.</p>
        </div>
      `;
      return;
    }

    filteredFiles.forEach(file => {
      const card = createCardElement(file);
      cardsGrid.appendChild(card);
    });
  }

  function createCardElement(file) {
    const card = document.createElement('article');
    card.className = 'metadata-card';
    card.setAttribute('data-id', file.id);

    // 1. Header Section
    const fileIcon = file.category === 'image' 
      ? `<svg class="file-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
      : `<svg class="file-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;

    // 2. Preview Section
    let previewHTML = '';
    if (file.category === 'image') {
      if (file.previewUrl) {
        previewHTML = `<img src="${file.previewUrl}" alt="Preview of ${file.name}" class="card-preview-img">`;
      } else {
        // Placeholder for reloaded sessions where URL object is revoked
        previewHTML = `
          <div class="pdf-preview-placeholder">
            <svg class="pdf-preview-icon" style="color: var(--color-primary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span style="font-size: 0.85rem; font-weight: 500;">Preview unavailable (from history)</span>
          </div>
        `;
      }
    } else {
      previewHTML = `
        <div class="pdf-preview-placeholder">
          <svg class="pdf-preview-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          <span style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">PDF Document</span>
          ${file.pdfPages ? `<span style="font-size: 0.8rem; color: var(--text-secondary);">${file.pdfPages} page(s)</span>` : ''}
        </div>
      `;
    }

    // 3. EXIF Section for Image
    let specialSectionHTML = '';
    if (file.category === 'image' && file.dimensions) {
      specialSectionHTML = `
        <div class="special-meta-section">
          <div class="special-meta-title">Resolution & Frame</div>
          <table class="metadata-table">
            <tr>
              <th>Dimensions</th>
              <td>${file.dimensions}</td>
            </tr>
            <tr>
              <th>Aspect Ratio</th>
              <td>${file.aspectRatio}</td>
            </tr>
          </table>
        </div>
      `;
    }

    let exifSectionHTML = '';
    if (file.category === 'image' && file.exif) {
      exifSectionHTML = `
        <div class="special-meta-section mt-3">
          <div class="special-meta-title">EXIF Data</div>
          <table class="metadata-table">
            <tr>
              <th>Camera Make</th>
              <td>${file.exif.make}</td>
            </tr>
            <tr>
              <th>Model</th>
              <td>${file.exif.model}</td>
            </tr>
            <tr>
              <th>Date Taken</th>
              <td>${file.exif.dateTaken}</td>
            </tr>
            <tr>
              <th>GPS Info</th>
              <td>${file.exif.gps}</td>
            </tr>
            <tr>
              <th>Orientation</th>
              <td>${file.exif.orientation}</td>
            </tr>
          </table>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-header">
        ${fileIcon}
        <div class="file-title-wrapper">
          <h4 class="file-name" title="${file.name}">${file.name}</h4>
        </div>
        <button class="card-remove-btn" aria-label="Remove ${file.name}">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="card-preview-container">
        ${previewHTML}
      </div>
      <div class="card-body">
        <table class="metadata-table">
          <tr>
            <th>Format</th>
            <td>${file.extension}</td>
          </tr>
          <tr>
            <th>MIME Type</th>
            <td>${file.type}</td>
          </tr>
          <tr>
            <th>Size</th>
            <td>${file.sizeFormatted}</td>
          </tr>
          <tr>
            <th>Modified</th>
            <td>${file.lastModified}</td>
          </tr>
          ${file.pdfPages ? `<tr><th>Page Count</th><td>${file.pdfPages}</td></tr>` : ''}
        </table>
        
        ${specialSectionHTML}
        ${exifSectionHTML}
      </div>
      <div class="card-actions">
        <button class="card-action-btn copy-btn" aria-label="Copy metadata for ${file.name}">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy Info
        </button>
        <button class="card-action-btn download-btn" aria-label="Download JSON metadata for ${file.name}">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          JSON
        </button>
      </div>
    `;

    // Hook card action events
    card.querySelector('.card-remove-btn').addEventListener('click', () => {
      removeFile(file.id);
    });

    card.querySelector('.copy-btn').addEventListener('click', () => {
      copyMetadata(file);
    });

    card.querySelector('.download-btn').addEventListener('click', () => {
      downloadMetadataJSON(file);
    });

    return card;
  }

  // --- Card Actions Logic ---

  function removeFile(fileId) {
    const file = filesList.find(f => f.id === fileId);
    const fileName = file ? file.name : 'File';
    
    // Revoke object URL to free memory if available
    if (file && file.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }

    filesList = filesList.filter(f => f.id !== fileId);
    showToast(`Removed: ${fileName}`, 'info');
    saveHistoryToLocalStorage();
    renderWorkspace();
  }

  function copyMetadata(file) {
    let text = `FILE METADATA: ${file.name}\n`;
    text += `===================================\n`;
    text += `Format: ${file.extension}\n`;
    text += `MIME Type: ${file.type}\n`;
    text += `Size: ${file.sizeFormatted}\n`;
    text += `Last Modified: ${file.lastModified}\n`;
    
    if (file.pdfPages) {
      text += `Page Count: ${file.pdfPages}\n`;
    }
    if (file.dimensions) {
      text += `Dimensions: ${file.dimensions}\n`;
      text += `Aspect Ratio: ${file.aspectRatio}\n`;
    }
    if (file.exif) {
      text += `Camera Make: ${file.exif.make}\n`;
      text += `Model: ${file.exif.model}\n`;
      text += `Date Taken: ${file.exif.dateTaken}\n`;
      text += `GPS Coordinates: ${file.exif.gps}\n`;
      text += `Orientation: ${file.exif.orientation}\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      showToast('Metadata copied to clipboard', 'success');
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
      showToast('Failed to copy metadata', 'danger');
    });
  }

  function downloadMetadataJSON(file) {
    // Clone metadata object but exclude temporary blob URLs to prevent clutter
    const cleanMeta = { ...file };
    delete cleanMeta.previewUrl;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanMeta, null, 2));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `${file.name}-metadata.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Downloaded metadata as JSON', 'success');
  }

  // --- Filtering and Searching Events ---

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderWorkspace();
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeFilter = btn.getAttribute('data-filter');
      renderWorkspace();
    });
  });

  // --- Clear All Dialog Logic ---

  clearAllBtn.addEventListener('click', () => {
    clearDialog.showModal();
  });

  cancelClearBtn.addEventListener('click', () => {
    clearDialog.close();
  });

  confirmClearBtn.addEventListener('click', () => {
    // Revoke any active blob preview URLs
    filesList.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });

    filesList = [];
    saveHistoryToLocalStorage();
    renderWorkspace();
    clearDialog.close();
    showToast('All files cleared from workspace', 'info');
  });

  // Close dialog on clicking backdrop
  clearDialog.addEventListener('click', (e) => {
    const dialogDimensions = clearDialog.getBoundingClientRect();
    if (
      e.clientX < dialogDimensions.left ||
      e.clientX > dialogDimensions.right ||
      e.clientY < dialogDimensions.top ||
      e.clientY > dialogDimensions.bottom
    ) {
      clearDialog.close();
    }
  });

  // --- Toast Manager ---

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' 
      ? '<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      : type === 'danger'
      ? '<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
      : '<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="12" x2="12" y2="16"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

    toast.innerHTML = `${icon}<span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // --- LocalStorage History Sync ---

  function saveHistoryToLocalStorage() {
    // Strip temporary previewUrls to avoid storing massive strings or invalid blobs
    const historyList = filesList.map(file => {
      const copy = { ...file };
      delete copy.previewUrl;
      return copy;
    });

    try {
      localStorage.setItem('metalens_history', JSON.stringify(historyList));
    } catch (e) {
      console.error('LocalStorage history save failed:', e);
    }
  }

  function loadHistory() {
    const data = localStorage.getItem('metalens_history');
    if (data) {
      try {
        filesList = JSON.parse(data);
        renderWorkspace();
      } catch (e) {
        console.error('LocalStorage history load failed:', e);
      }
    }
  }
});
