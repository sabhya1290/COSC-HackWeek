import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Trash2, Eye, ShieldAlert, CheckCircle2, Sliders, Info, 
  Download, FileText, Image as ImageIcon, Sparkles, Search, RefreshCw,
  Sun, Moon, Layers, Grid, BarChart3, HelpCircle, Minimize2, ZoomIn
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/images';

export default function App() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [threshold, setThreshold] = useState(85);
  const [hashType, setHashType] = useState('pHash'); // aHash, dHash, pHash
  const [filterType, setFilterType] = useState('all'); // all, duplicates, similar, unique
  const [sortField, setSortField] = useState('highestSimilarity'); // highestSimilarity, lowestSimilarity, name, size
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, groups, stats
  
  // Modal state
  const [selectedPair, setSelectedPair] = useState(null); // { imgA, imgB, similarity, distance }
  const [selectedImage, setSelectedImage] = useState(null); // single image for info

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize Dark Mode
  useEffect(() => {
    const isDark = localStorage.getItem('theme') !== 'light';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Fetch images on mount
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (Array.isArray(data)) {
        setImages(data);
      }
    } catch (err) {
      console.error('Failed to fetch images:', err);
    } finally {
      setLoading(false);
    }
  };

  // Upload handler
  const handleFiles = async (files) => {
    if (!files.length) return;
    
    // Validate sizes and types
    const validFiles = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 10MB limit.`);
        continue;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        alert(`File ${file.name} has unsupported format. Use JPG, PNG, WEBP.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    validFiles.forEach((file) => formData.append('images', file));

    try {
      setUploadProgress(40);
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);
      const data = await res.json();
      if (res.ok) {
        setImages(prev => [...prev, ...data.images]);
        setUploadProgress(100);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during upload');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  // Drag and drop events
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Delete image handler
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setImages(prev => prev.filter(img => img.id !== id));
        if (selectedImage && selectedImage.id === id) setSelectedImage(null);
        if (selectedPair && (selectedPair.imgA.id === id || selectedPair.imgB.id === id)) setSelectedPair(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Clear database
  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL images? This action is permanent.')) return;
    try {
      const res = await fetch(`${API_BASE}/clear`, { method: 'POST' });
      if (res.ok) {
        setImages([]);
        setSelectedImage(null);
        setSelectedPair(null);
      }
    } catch (err) {
      console.error('Clear failed:', err);
    }
  };

  // Helper: Hamming Distance
  const hammingDistance = (h1, h2) => {
    if (!h1 || !h2 || h1.length !== h2.length) return 64;
    let dist = 0;
    for (let i = 0; i < h1.length; i++) {
      const val = parseInt(h1[i], 16) ^ parseInt(h2[i], 16);
      let temp = val;
      while (temp > 0) {
        if (temp & 1) dist++;
        temp >>= 1;
      }
    }
    return dist;
  };

  // Compute similarities for all images
  const computeMatches = () => {
    const results = [];
    
    for (let i = 0; i < images.length; i++) {
      const imgA = images[i];
      let bestMatch = null;
      let highestSim = 0;
      const allMatches = [];

      for (let j = 0; j < images.length; j++) {
        if (i === j) continue;
        const imgB = images[j];
        
        const h1 = imgA.hashes[hashType];
        const h2 = imgB.hashes[hashType];
        const dist = hammingDistance(h1, h2);
        const sim = Math.round(((64 - dist) / 64) * 100);

        if (sim >= threshold) {
          allMatches.push({ img: imgB, similarity: sim, distance: dist });
        }

        if (sim > highestSim) {
          highestSim = sim;
          bestMatch = { img: imgB, similarity: sim, distance: dist };
        }
      }

      results.push({
        image: imgA,
        bestMatch,
        matches: allMatches,
        highestSimilarity: highestSim
      });
    }

    return results;
  };

  const matchesInfo = computeMatches();

  // Filters & Sorting Processing
  const processedCards = matchesInfo.filter(({ image, highestSimilarity }) => {
    // Search filter
    if (searchQuery && !image.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (filterType === 'duplicates') {
      return highestSimilarity === 100;
    } else if (filterType === 'similar') {
      return highestSimilarity >= threshold && highestSimilarity < 100;
    } else if (filterType === 'unique') {
      return highestSimilarity < threshold;
    }
    return true;
  }).sort((a, b) => {
    if (sortField === 'highestSimilarity') {
      return b.highestSimilarity - a.highestSimilarity;
    } else if (sortField === 'lowestSimilarity') {
      return a.highestSimilarity - b.highestSimilarity;
    } else if (sortField === 'name') {
      return a.image.filename.localeCompare(b.image.filename);
    } else if (sortField === 'size') {
      return b.image.size - a.image.size;
    }
    return 0;
  });

  // Groups generation logic (connected components)
  const generateDuplicateGroups = () => {
    const visited = new Set();
    const groups = [];

    images.forEach(img => {
      if (visited.has(img.id)) return;

      const group = [img];
      visited.add(img.id);

      // Simple BFS/DFS to find all connected matching images
      const queue = [img];
      while (queue.length > 0) {
        const current = queue.shift();
        
        images.forEach(other => {
          if (visited.has(other.id)) return;

          const h1 = current.hashes[hashType];
          const h2 = other.hashes[hashType];
          const dist = hammingDistance(h1, h2);
          const sim = Math.round(((64 - dist) / 64) * 100);

          if (sim >= threshold) {
            group.push(other);
            visited.add(other.id);
            queue.push(other);
          }
        });
      }

      if (group.length > 1) {
        // Find average similarity inside the group
        let totalSim = 0;
        let pairs = 0;
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const h1 = group[i].hashes[hashType];
            const h2 = group[j].hashes[hashType];
            const dist = hammingDistance(h1, h2);
            totalSim += Math.round(((64 - dist) / 64) * 100);
            pairs++;
          }
        }
        groups.push({
          images: group,
          avgSimilarity: pairs > 0 ? Math.round(totalSim / pairs) : 100
        });
      }
    });

    return groups;
  };

  const duplicateGroups = generateDuplicateGroups();

  // Statistics calculation
  const totalImages = images.length;
  const duplicateImagesCount = matchesInfo.filter(m => m.highestSimilarity === 100).length;
  const similarImagesCount = matchesInfo.filter(m => m.highestSimilarity >= threshold && m.highestSimilarity < 100).length;
  const uniqueImagesCount = matchesInfo.filter(m => m.highestSimilarity < threshold).length;
  const avgSimilarityVal = matchesInfo.length > 0 
    ? Math.round(matchesInfo.reduce((acc, curr) => acc + curr.highestSimilarity, 0) / matchesInfo.length) 
    : 0;

  // Storage saved (sum of file size of duplicate images)
  const storageSaved = (() => {
    let saved = 0;
    const handled = new Set();
    
    // For each group, we keep the largest image (or first one) and save the rest
    duplicateGroups.forEach(group => {
      const sortedByDescSize = [...group.images].sort((a, b) => b.size - a.size);
      sortedByDescSize.slice(1).forEach(img => {
        if (!handled.has(img.id)) {
          saved += img.size;
          handled.add(img.id);
        }
      });
    });
    return saved;
  })();

  // Format File Size
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Generate difference heatmap between selected comparison pair
  useEffect(() => {
    if (!selectedPair) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img1 = new Image();
    const img2 = new Image();

    let loadedCount = 0;
    const onLoad = () => {
      loadedCount++;
      if (loadedCount === 2) {
        // Draw both onto a temp workspace to compare
        const size = 150;
        canvas.width = size;
        canvas.height = size;

        // Draw Image A
        ctx.drawImage(img1, 0, 0, size, size);
        const dataA = ctx.getImageData(0, 0, size, size).data;

        // Draw Image B
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img2, 0, 0, size, size);
        const dataB = ctx.getImageData(0, 0, size, size).data;

        // Create heatmap image data
        const heatmap = ctx.createImageData(size, size);
        for (let i = 0; i < dataA.length; i += 4) {
          const rDiff = Math.abs(dataA[i] - dataB[i]);
          const gDiff = Math.abs(dataA[i+1] - dataB[i+1]);
          const bDiff = Math.abs(dataA[i+2] - dataB[i+2]);
          const totalDiff = (rDiff + gDiff + bDiff) / 3;

          // Red highlights for differences, dark blue/gray for matches
          heatmap.data[i] = Math.min(255, totalDiff * 3);
          heatmap.data[i+1] = Math.max(0, 40 - totalDiff);
          heatmap.data[i+2] = Math.max(0, 100 - totalDiff);
          heatmap.data[i+3] = 255;
        }

        ctx.putImageData(heatmap, 0, 0);
      }
    };

    img1.crossOrigin = "anonymous";
    img2.crossOrigin = "anonymous";
    img1.src = `http://localhost:5000${selectedPair.imgA.filepath}`;
    img2.src = `http://localhost:5000${selectedPair.imgB.filepath}`;
    
    img1.onload = onLoad;
    img2.onload = onLoad;
  }, [selectedPair]);

  // Exports
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(matchesInfo, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `image-similarity-report.json`);
    dlAnchorElem.click();
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Image ID,Filename,Width,Height,Size (Bytes),aHash,dHash,pHash,Highest Similarity,Best Match Filename\n";
    
    matchesInfo.forEach(({ image, bestMatch, highestSimilarity }) => {
      const bestMatchName = bestMatch ? bestMatch.img.filename : 'None';
      csvContent += `${image.id},"${image.filename}",${image.width},${image.height},${image.size},${image.hashes.aHash},${image.hashes.dHash},${image.hashes.pHash},${highestSimilarity}%,"${bestMatchName}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", encodedUri);
    dlAnchorElem.setAttribute("download", "image-similarity-report.csv");
    dlAnchorElem.click();
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header Banner */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
                Duplicate Image Finder
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI Perceptual Image Similarity Dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
            </button>
            
            <button
              onClick={handleClearAll}
              disabled={images.length === 0}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/20 disabled:opacity-40 rounded-xl transition-all duration-150"
            >
              Clear DB
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Drag & Drop Upload Zone */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 group
            ${dragActive 
              ? 'border-violet-500 bg-violet-500/10 scale-[0.99] shadow-inner' 
              : 'border-slate-200 dark:border-slate-800 hover:border-violet-500/60 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
            }`}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            multiple 
            accept="image/jpeg,image/png,image/jpg,image/webp" 
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden" 
          />
          <div className="max-w-md mx-auto space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300 group-hover:text-violet-500 group-hover:bg-violet-500/10">
              <Upload className="h-8 w-8" />
            </div>
            <div>
              <p className="font-semibold text-base">Drag & Drop images here, or <span className="text-violet-500 group-hover:underline">browse</span></p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supports JPG, PNG, WEBP up to 10MB per file</p>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="absolute inset-0 bg-white/90 dark:bg-slate-950/90 rounded-3xl flex flex-col items-center justify-center p-6 space-y-3 z-10">
              <RefreshCw className="h-8 w-8 text-violet-500 animate-spin" />
              <p className="font-medium text-sm">Processing & Hashing Images...</p>
              <div className="w-64 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-violet-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Widgets */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Uploads</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-bold">{totalImages}</span>
              <span className="text-xs text-slate-400">files</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Duplicates
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">{duplicateImagesCount}</span>
              <span className="text-xs text-slate-400">exact</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-xs text-amber-500 dark:text-amber-400 font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Similar Images
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{similarImagesCount}</span>
              <span className="text-xs text-slate-400">similar</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-xs text-green-500 dark:text-green-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Unique Images
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{uniqueImagesCount}</span>
              <span className="text-xs text-slate-400">clean</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-xs text-violet-500 dark:text-violet-400 font-medium">Potential Savings</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">{formatBytes(storageSaved)}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">Avg Similarity</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{avgSimilarityVal}%</span>
            </div>
          </div>
        </section>

        {/* Dashboard Tabs & Control Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            
            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all duration-150
                  ${activeTab === 'dashboard' 
                    ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                <Grid className="h-4 w-4" />
                <span>All Cards</span>
              </button>
              <button 
                onClick={() => setActiveTab('groups')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all duration-150
                  ${activeTab === 'groups' 
                    ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                <Layers className="h-4 w-4" />
                <span>Duplicate Groups</span>
              </button>
            </div>

            {/* Export Toolbar */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={exportCSV} 
                disabled={images.length === 0}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl flex items-center space-x-1.5 transition duration-150"
              >
                <Download className="h-3.5 w-3.5" />
                <span>CSV</span>
              </button>
              <button 
                onClick={exportJSON}
                disabled={images.length === 0}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl flex items-center space-x-1.5 transition duration-150"
              >
                <Download className="h-3.5 w-3.5" />
                <span>JSON</span>
              </button>
              <button 
                onClick={triggerPrint}
                disabled={images.length === 0}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl flex items-center space-x-1.5 transition duration-150"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>

          {/* Filters, Slider, Hashing Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            
            {/* Search Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Search by Name</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. screenshot.png"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Hashing Algorithm Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Hashing Method</label>
              <select 
                value={hashType} 
                onChange={(e) => setHashType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="pHash">Perceptual Hash (pHash) - Recommended</option>
                <option value="aHash">Average Hash (aHash)</option>
                <option value="dHash">Difference Hash (dHash)</option>
              </select>
            </div>

            {/* Threshold Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Similarity Threshold</label>
                <span className="text-xs font-bold text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded">{threshold}%</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400">50%</span>
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  value={threshold} 
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
                <span className="text-xs text-slate-400">100%</span>
              </div>
            </div>

            {/* Card Categories */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Duplicate Badge Filter</label>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl text-center text-xs font-semibold">
                <button 
                  onClick={() => setFilterType('all')} 
                  className={`py-1.5 rounded-xl transition duration-150 ${filterType === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-500 dark:text-white' : 'text-slate-500'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterType('duplicates')} 
                  className={`py-1.5 rounded-xl transition duration-150 ${filterType === 'duplicates' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-500 dark:text-white' : 'text-slate-500'}`}
                >
                  Dupes
                </button>
                <button 
                  onClick={() => setFilterType('similar')} 
                  className={`py-1.5 rounded-xl transition duration-150 ${filterType === 'similar' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-500 dark:text-white' : 'text-slate-500'}`}
                >
                  Sim
                </button>
                <button 
                  onClick={() => setFilterType('unique')} 
                  className={`py-1.5 rounded-xl transition duration-150 ${filterType === 'unique' ? 'bg-white dark:bg-slate-700 shadow-sm text-green-500 dark:text-white' : 'text-slate-500'}`}
                >
                  Uniq
                </button>
              </div>
            </div>

          </div>

          {/* Sorter bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Sort by:</span>
              {['highestSimilarity', 'lowestSimilarity', 'name', 'size'].map(field => (
                <button
                  key={field}
                  onClick={() => setSortField(field)}
                  className={`px-3 py-1.5 rounded-xl font-semibold border transition duration-150
                    ${sortField === field 
                      ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-white' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  {field === 'highestSimilarity' && 'Highest Similarity'}
                  {field === 'lowestSimilarity' && 'Lowest Similarity'}
                  {field === 'name' && 'Filename'}
                  {field === 'size' && 'File Size'}
                </button>
              ))}
            </div>

            <div className="text-slate-400 font-medium">
              Showing <span className="text-slate-800 dark:text-white font-bold">{processedCards.length}</span> of {images.length} images
            </div>
          </div>

        </div>

        {/* Tab content rendering */}
        {loading ? (
          <div className="text-center py-20">
            <RefreshCw className="h-10 w-10 text-violet-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Loading catalog...</p>
          </div>
        ) : activeTab === 'dashboard' ? (
          processedCards.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
              <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No images match your filters.</p>
              <p className="text-xs text-slate-400 mt-1">Upload images or adjust the similarity slider.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedCards.map(({ image, bestMatch, matches, highestSimilarity }) => {
                const isExact = highestSimilarity === 100;
                const isSimilar = highestSimilarity >= threshold && highestSimilarity < 100;
                
                // Badge config
                let badgeColor = 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
                let badgeText = 'Unique';
                if (isExact) {
                  badgeColor = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 animate-pulse';
                  badgeText = 'Duplicate';
                } else if (isSimilar) {
                  badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                  badgeText = `Similar (${highestSimilarity}%)`;
                }

                // Compression suggestions (Bonus)
                const isLarge = image.size > 2 * 1024 * 1024;
                const canCompress = image.mime.includes('png') || isLarge;

                return (
                  <div 
                    key={image.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col"
                  >
                    {/* Image Preview Container */}
                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
                      <img 
                        src={`http://localhost:5000${image.filepath}`} 
                        alt={image.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      
                      {/* Duplicate Badge */}
                      <span className={`absolute top-4 left-4 border text-xs font-semibold px-2.5 py-1 rounded-xl backdrop-blur-md ${badgeColor}`}>
                        {badgeText}
                      </span>

                      {/* Info overlay */}
                      <div className="absolute top-4 right-4 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button 
                          onClick={() => setSelectedImage(image)}
                          className="p-2 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md shadow"
                          title="View Details"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(image.id)}
                          className="p-2 bg-red-500/90 text-white rounded-xl hover:bg-red-600 backdrop-blur-md shadow"
                          title="Delete File"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Meta information */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-semibold text-sm truncate" title={image.filename}>
                          {image.filename}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>{image.width} × {image.height} px</span>
                          <span>{formatBytes(image.size)}</span>
                        </div>
                      </div>

                      {/* Display Selected Hash Value */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          <span>{hashType} Value</span>
                          <span className="font-mono text-[9px] lowercase bg-slate-200 dark:bg-slate-800 text-slate-500 px-1 rounded">hex</span>
                        </div>
                        <code className="text-xs font-mono text-violet-500 truncate block">
                          {image.hashes[hashType]}
                        </code>
                      </div>

                      {/* Match Analysis Details */}
                      {bestMatch ? (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Best match:</span>
                            <span className={`font-bold ${highestSimilarity >= threshold ? 'text-violet-500' : 'text-slate-400'}`}>
                              {highestSimilarity}% Match
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-400 truncate max-w-[150px]">
                              {bestMatch.img.filename}
                            </span>
                            <button
                              onClick={() => setSelectedPair({
                                imgA: image,
                                imgB: bestMatch.img,
                                similarity: highestSimilarity,
                                distance: bestMatch.distance
                              })}
                              className="text-xs text-violet-500 hover:text-violet-600 font-semibold flex items-center space-x-0.5"
                            >
                              <Eye className="h-3.5 w-3.5 mr-0.5" />
                              <span>Compare side-by-side</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2 text-xs text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800/60">
                          No other images in library
                        </div>
                      )}

                      {/* Compression Suggester */}
                      {canCompress && (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5 flex items-start space-x-2">
                          <Sparkles className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 leading-normal">
                            Suggested: Compress as WEBP to save up to 60% size.
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Groups tab content */
          duplicateGroups.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
              <Layers className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No duplicate clusters found.</p>
              <p className="text-xs text-slate-400 mt-1">Upload matching/similar images or adjust the threshold.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {duplicateGroups.map((group, gIdx) => (
                <div 
                  key={gIdx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-4">
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-600 dark:text-white flex items-center justify-center font-bold text-sm">
                        {gIdx + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-base">Duplicate Set</h3>
                        <p className="text-xs text-slate-400">{group.images.length} items connected</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Avg Set Similarity:</span>
                      <span className="text-sm font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-xl">
                        {group.avgSimilarity}%
                      </span>
                    </div>
                  </div>

                  {/* List of files in the set */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {group.images.map(img => (
                      <div 
                        key={img.id}
                        className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-3 flex items-center space-x-3 relative group"
                      >
                        <img 
                          src={`http://localhost:5000${img.filepath}`} 
                          alt={img.filename} 
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold truncate" title={img.filename}>
                            {img.filename}
                          </h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {formatBytes(img.size)}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDelete(img.id)}
                          className="absolute right-2 top-2 p-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition duration-150"
                          title="Delete File"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Side-by-Side Comparison Modal (Bonus: with heatmap) */}
      {selectedPair && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setSelectedPair(null)}
              className="absolute right-6 top-6 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <Minimize2 className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold">Side-by-Side Analysis</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Detailed perceptual comparison metric report</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              
              {/* Left Image */}
              <div className="space-y-3">
                <div className="aspect-video bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <img 
                    src={`http://localhost:5000${selectedPair.imgA.filepath}`} 
                    alt={selectedPair.imgA.filename} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold truncate">{selectedPair.imgA.filename}</h4>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>{selectedPair.imgA.width}x{selectedPair.imgA.height}</span>
                    <span>{formatBytes(selectedPair.imgA.size)}</span>
                  </div>
                  <code className="text-[10px] font-mono text-violet-500 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 px-2 py-1 rounded mt-2 block truncate">
                    pHash: {selectedPair.imgA.hashes.pHash}
                  </code>
                </div>
              </div>

              {/* Heatmap & Middle Stats */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-4">
                
                <div className="space-y-1">
                  <span className="text-2xl font-black text-violet-500">{selectedPair.similarity}%</span>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Similarity Score</p>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>

                <div className="space-y-1">
                  <span className="text-base font-bold text-slate-700 dark:text-slate-300">{selectedPair.distance}</span>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Hamming Distance</p>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>

                {/* Canvas Difference Heatmap */}
                <div className="space-y-2">
                  <canvas ref={canvasRef} className="w-[120px] h-[120px] rounded-xl border border-slate-200 dark:border-slate-800 shadow bg-slate-950"></canvas>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Difference Heatmap</p>
                </div>
              </div>

              {/* Right Image */}
              <div className="space-y-3">
                <div className="aspect-video bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <img 
                    src={`http://localhost:5000${selectedPair.imgB.filepath}`} 
                    alt={selectedPair.imgB.filename} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold truncate">{selectedPair.imgB.filename}</h4>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>{selectedPair.imgB.width}x{selectedPair.imgB.height}</span>
                    <span>{formatBytes(selectedPair.imgB.size)}</span>
                  </div>
                  <code className="text-[10px] font-mono text-violet-500 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 px-2 py-1 rounded mt-2 block truncate">
                    pHash: {selectedPair.imgB.hashes.pHash}
                  </code>
                </div>
              </div>

            </div>

            <div className="bg-violet-500/5 border border-violet-500/10 rounded-2xl p-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <strong>Heatmap Legend:</strong> Red highlights represent spatial divergence in local pixels between the left and right resized frames. Dark areas represent uniform/identical content layout patterns.
            </div>
          </div>
        </div>
      )}

      {/* Single Image Details Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute right-6 top-6 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <Minimize2 className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold">Image Inspector</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Detailed structural hashes and metadata</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-square flex items-center justify-center">
                <img 
                  src={`http://localhost:5000${selectedImage.filepath}`} 
                  alt={selectedImage.filename} 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Filename</label>
                  <span className="text-sm font-semibold break-all">{selectedImage.filename}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Dimensions</label>
                    <span className="text-sm font-semibold">{selectedImage.width} × {selectedImage.height} px</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">File Size</label>
                    <span className="text-sm font-semibold">{formatBytes(selectedImage.size)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Calculated Hashes</span>
                  
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Average Hash (aHash)</span>
                    <code className="text-xs font-mono text-violet-500 break-all">{selectedImage.hashes.aHash}</code>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Difference Hash (dHash)</span>
                    <code className="text-xs font-mono text-violet-500 break-all">{selectedImage.hashes.dHash}</code>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Perceptual Hash (pHash)</span>
                    <code className="text-xs font-mono text-violet-500 break-all">{selectedImage.hashes.pHash}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
