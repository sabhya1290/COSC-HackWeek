/**
 * VisionShift - Color Blindness Simulator
 * Interactive accessible web application for simulating color vision deficiencies.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const headerUploadBtn = document.getElementById('header-upload-btn');
  const uploadSection = document.getElementById('upload-section');
  const simulatorWorkspace = document.getElementById('simulator-workspace');
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  
  const resetBtn = document.getElementById('reset-btn');
  const downloadBtn = document.getElementById('download-btn');
  
  const modeButtons = document.querySelectorAll('.mode-btn');
  const toggleSideBySide = document.getElementById('toggle-side-by-side');
  const toggleSlider = document.getElementById('toggle-slider');
  
  const previewSide = document.getElementById('preview-container-side');
  const previewSlider = document.getElementById('preview-container-slider');
  
  const originalPreviewSide = document.getElementById('original-preview-side');
  const originalPreviewSlider = document.getElementById('original-preview-slider');
  
  const simulatedCanvasSide = document.getElementById('simulated-canvas-side');
  const simulatedCanvasSlider = document.getElementById('simulated-canvas-slider');
  
  const simulatedBadgeSide = document.getElementById('simulated-badge-side');
  const simulatedBadgeSlider = document.getElementById('simulated-badge-slider');
  
  const sliderWrapper = document.getElementById('slider-wrapper');
  const sliderOriginalContainer = document.getElementById('slider-original-container');
  const sliderHandle = document.getElementById('slider-handle');
  
  const loadingOverlay = document.getElementById('loading-overlay');

  // Application State
  let uploadedImage = null; // Image object
  let currentMode = 'normal';
  let comparisonMode = 'side'; // 'side' or 'slider'
  let isDraggingSlider = false;
  let sliderPosition = 50; // percentage (0 - 100)

  // Color Transformation Matrices
  const matrices = {
    protanopia: [
      [0.567, 0.433, 0.000],
      [0.558, 0.442, 0.000],
      [0.000, 0.242, 0.758]
    ],
    deuteranopia: [
      [0.625, 0.375, 0.000],
      [0.700, 0.300, 0.000],
      [0.000, 0.300, 0.700]
    ],
    tritanopia: [
      [0.950, 0.050, 0.000],
      [0.000, 0.433, 0.567],
      [0.000, 0.475, 0.525]
    ]
  };

  // --- Image Upload Handlers ---

  // Trigger file browser when header upload button is clicked
  headerUploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  // Browse button trigger
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  // Drag and drop event listeners
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
      handleFile(files[0]);
    }
  });

  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, or WEBP).');
      return;
    }

    showLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        uploadedImage = img;
        
        // Update original previews
        originalPreviewSide.src = e.target.result;
        originalPreviewSlider.src = e.target.result;
        
        // Reset state
        currentMode = 'normal';
        updateActiveModeButton();
        
        // Show workspace and hide upload section
        uploadSection.classList.add('d-none');
        simulatorWorkspace.classList.remove('d-none');
        
        // Process Simulation
        runSimulation();
        
        // Scroll to workspace
        simulatorWorkspace.scrollIntoView({ behavior: 'smooth' });
        showLoading(false);
      };
      img.onerror = () => {
        showLoading(false);
        alert('Failed to load the image. Please try another file.');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // --- Simulation Logic ---

  function runSimulation() {
    if (!uploadedImage) return;
    showLoading(true);

    // Give UI thread a tiny break to show loading overlay
    setTimeout(() => {
      processCanvas(simulatedCanvasSide);
      processCanvas(simulatedCanvasSlider);
      
      // Update badges
      const modeLabels = {
        normal: 'Normal Vision',
        protanopia: 'Protanopia (Red-Blind)',
        deuteranopia: 'Deuteranopia (Green-Blind)',
        tritanopia: 'Tritanopia (Blue-Blind)',
        achromatopsia: 'Achromatopsia (Monochromacy)'
      };
      const labelText = `Simulated (${modeLabels[currentMode]})`;
      simulatedBadgeSide.textContent = labelText;
      simulatedBadgeSlider.textContent = labelText;

      // Update slider image sizing
      updateSliderWidths();
      showLoading(false);
    }, 50);
  }

  function processCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Scale canvas to match image aspect ratio but limit max size for performance
    const maxDimension = 1200;
    let width = uploadedImage.width;
    let height = uploadedImage.height;
    
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(uploadedImage, 0, 0, width, height);
    
    if (currentMode === 'normal') {
      return; // Normal vision is just the original image
    }
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    if (currentMode === 'achromatopsia') {
      // Grayscale conversion: gray = 0.299 * red + 0.587 * green + 0.114 * blue
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i]     = gray; // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
      }
    } else {
      // Matrix transformations
      const matrix = matrices[currentMode];
      const m00 = matrix[0][0], m01 = matrix[0][1], m02 = matrix[0][2];
      const m10 = matrix[1][0], m11 = matrix[1][1], m12 = matrix[1][2];
      const m20 = matrix[2][0], m21 = matrix[2][1], m22 = matrix[2][2];
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const nr = r * m00 + g * m01 + b * m02;
        const ng = r * m10 + g * m11 + b * m12;
        const nb = r * m20 + g * m21 + b * m22;
        
        data[i]     = nr < 0 ? 0 : (nr > 255 ? 255 : nr);
        data[i + 1] = ng < 0 ? 0 : (ng > 255 ? 255 : ng);
        data[i + 2] = nb < 0 ? 0 : (nb > 255 ? 255 : nb);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  function showLoading(show) {
    if (show) {
      loadingOverlay.classList.remove('d-none');
    } else {
      loadingOverlay.classList.add('d-none');
    }
  }

  // --- Navigation & Mode Controls ---

  // Handle Mode Selection
  modeButtons.forEach(button => {
    button.addEventListener('click', () => {
      currentMode = button.getAttribute('data-mode');
      updateActiveModeButton();
      runSimulation();
    });
  });

  function updateActiveModeButton() {
    modeButtons.forEach(btn => {
      const mode = btn.getAttribute('data-mode');
      if (mode === currentMode) {
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
      }
    });
  }

  // Compare Mode Toggle (Side-by-side vs Slider)
  toggleSideBySide.addEventListener('click', () => {
    comparisonMode = 'side';
    toggleSideBySide.classList.add('active');
    toggleSideBySide.setAttribute('aria-selected', 'true');
    toggleSlider.classList.remove('active');
    toggleSlider.setAttribute('aria-selected', 'false');
    
    previewSide.classList.remove('d-none');
    previewSlider.classList.add('d-none');
  });

  toggleSlider.addEventListener('click', () => {
    comparisonMode = 'slider';
    toggleSlider.classList.add('active');
    toggleSlider.setAttribute('aria-selected', 'true');
    toggleSideBySide.classList.remove('active');
    toggleSideBySide.setAttribute('aria-selected', 'false');
    
    previewSlider.classList.remove('d-none');
    previewSide.classList.add('d-none');
    
    // Recalculate dimensions on next frame to ensure rendering is complete
    requestAnimationFrame(() => {
      updateSliderWidths();
      setSliderPosition(sliderPosition);
    });
  });

  // --- Compare Slider Logic ---

  function updateSliderWidths() {
    if (!uploadedImage || comparisonMode !== 'slider') return;
    const width = sliderWrapper.offsetWidth;
    originalPreviewSlider.style.width = width + 'px';
  }

  window.addEventListener('resize', () => {
    updateSliderWidths();
    if (comparisonMode === 'slider') {
      setSliderPosition(sliderPosition);
    }
  });

  function setSliderPosition(pct) {
    pct = Math.max(0, Math.min(100, pct));
    sliderPosition = pct;
    
    // Update container widths and handle positions
    sliderOriginalContainer.style.width = pct + '%';
    sliderHandle.style.left = pct + '%';
    sliderHandle.setAttribute('aria-valuenow', Math.round(pct));
  }

  // Slider Mouse/Touch Events
  function handleSliderMove(clientX) {
    const rect = sliderWrapper.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setSliderPosition(pct);
  }

  // Mouse drag events
  sliderHandle.addEventListener('mousedown', (e) => {
    isDraggingSlider = true;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingSlider) return;
    handleSliderMove(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDraggingSlider = false;
  });

  // Touch drag events
  sliderHandle.addEventListener('touchstart', (e) => {
    isDraggingSlider = true;
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDraggingSlider) return;
    if (e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  });

  window.addEventListener('touchend', () => {
    isDraggingSlider = false;
  });

  // Keyboard accessibility for Slider
  sliderHandle.addEventListener('keydown', (e) => {
    let step = 5; // move by 5%
    if (e.shiftKey) step = 1; // finer tuning
    
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPosition(sliderPosition - step);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPosition(sliderPosition + step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSliderPosition(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSliderPosition(100);
    }
  });

  // --- Reset & Download Actions ---

  // Reset application to default state
  resetBtn.addEventListener('click', () => {
    uploadedImage = null;
    fileInput.value = '';
    
    // Reset preview elements
    originalPreviewSide.src = '';
    originalPreviewSlider.src = '';
    
    const sideCtx = simulatedCanvasSide.getContext('2d');
    const sliderCtx = simulatedCanvasSlider.getContext('2d');
    sideCtx.clearRect(0, 0, simulatedCanvasSide.width, simulatedCanvasSide.height);
    sliderCtx.clearRect(0, 0, simulatedCanvasSlider.width, simulatedCanvasSlider.height);
    
    // Toggle view visibility
    simulatorWorkspace.classList.add('d-none');
    uploadSection.classList.remove('d-none');
    
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Download simulation image
  downloadBtn.addEventListener('click', () => {
    if (!uploadedImage) return;
    
    // Download currently selected canvas
    const activeCanvas = comparisonMode === 'side' ? simulatedCanvasSide : simulatedCanvasSlider;
    
    const link = document.createElement('a');
    link.download = `visionshift-${currentMode}-${Date.now()}.png`;
    link.href = activeCanvas.toDataURL('image/png');
    link.click();
  });
});
