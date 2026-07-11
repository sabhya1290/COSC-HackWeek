import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, FileImage, Layers, Trash2, 
  HelpCircle, Download, AlertCircle, ArrowLeft, Loader2 
} from 'lucide-react';

import DropzoneArea from './components/DropzoneArea';
import ComparisonSlider from './components/ComparisonSlider';
import ZoomableComparison from './components/ZoomableComparison';
import MetricsPanel from './components/MetricsPanel';
import HistoryPanel from './components/HistoryPanel';
import BatchCompressor from './components/BatchCompressor';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { downloadFile } from './utils/download.js';

const SERVER_URL = 'http://localhost:5000';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [mode, setMode] = useState('single');
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Single image mode states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [quality, setQuality] = useState(80);
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState(null);
  const [compareMode, setCompareMode] = useState('slider');
  const [error, setError] = useState(null);

  // Batch mode files queue state
  const [batchFiles, setBatchFiles] = useState([]);

  // Compression History State
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('compression_history')) || [];
    } catch {
      return [];
    }
  });

  const compressTimeoutRef = useRef(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('compression_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setTheme(t => t === 'dark' ? 'light' : 'dark');
      }
      if (e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setMode(m => m === 'single' ? 'batch' : 'single');
      }
      if (e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setQuality(80);
        setCompareMode('slider');
      }
      if (e.key === 'Escape') {
        resetSingleView();
      }
      if (e.key === '?') {
        setShowShortcuts(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addHistory = (item) => {
    setHistory(prev => [
      { id: Date.now(), timestamp: new Date().toISOString(), ...item },
      ...prev
    ]);
  };

  const handleSingleFileDrop = (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      
      triggerCompression(file, quality);
    }
  };

  const handleBatchFilesDrop = (acceptedFiles) => {
    const newQueueItems = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'idle',
      progress: 0,
      result: null
    }));
    setBatchFiles(prev => [...prev, ...newQueueItems]);
  };

  useEffect(() => {
    if (selectedFile) {
      if (compressTimeoutRef.current) {
        clearTimeout(compressTimeoutRef.current);
      }
      compressTimeoutRef.current = setTimeout(() => {
        triggerCompression(selectedFile, quality);
      }, 400);
    }
    return () => {
      if (compressTimeoutRef.current) clearTimeout(compressTimeoutRef.current);
    };
  }, [quality]);

  const triggerCompression = async (file, currentQuality) => {
    setIsCompressing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('quality', currentQuality);

      const response = await axios.post(`${SERVER_URL}/compress`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(response.data);

      if (response.data.savedPercentage > 50) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#66fcf1', '#39ff14', '#00ffcc']
        });
      }

      addHistory({
        filename: file.name,
        quality: currentQuality,
        originalSize: response.data.originalSize,
        compressedSize: response.data.compressedSize,
        savedPercentage: response.data.savedPercentage,
        compressedImageURL: response.data.compressedImageURL
      });

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'SYSTEM_FAILURE: COMPRESSION FAILED');
    } finally {
      setIsCompressing(false);
    }
  };

  const resetSingleView = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const loadHistoryItem = (item) => {
    setSelectedFile({ name: item.filename, size: item.originalSize });
    setPreviewUrl(`${SERVER_URL}${item.compressedImageURL}`);
    setResult({
      originalSize: item.originalSize,
      compressedSize: item.compressedSize,
      savedPercentage: item.savedPercentage,
      ratio: (item.originalSize / item.compressedSize).toFixed(1) + ':1',
      dimensions: { original: 'N/A', compressed: 'N/A' },
      format: item.filename.split('.').pop().toUpperCase(),
      compressedImageURL: item.compressedImageURL,
      timeTaken: 'N/A',
      estimatedQualityLoss: `${100 - item.quality}%`
    });
    setQuality(item.quality);
  };

  const handleDownload = () => {
    if (!result) return;
    const fileUrl = `${SERVER_URL}${result.compressedImageURL}`;
    const ext = selectedFile.name.split('.').pop();
    const name = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.'));
    const downloadName = `${name}_compressed_${quality}.${ext}`;
    downloadFile(fileUrl, downloadName);
  };

  return (
    <div className="min-h-screen flex flex-col font-mono selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-300">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-cyan-500/10 dark:border-slate-800/30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-cyan-955/40 border border-cyan-500/30 dark:border-slate-800/40 text-cyan-550 dark:text-cyan-400 rounded shadow-md shadow-cyan-500/5">
              <FileImage size={18} />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-widest text-cyan-550 dark:text-cyan-400 uppercase animate-cyber-pulse">
                CYBER_COMPRESS.exe
              </span>
              <span className="hidden sm:inline-block ml-2 text-[8px] uppercase font-bold border border-cyan-500/30 dark:border-slate-800/35 text-cyan-550 dark:text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/20">
                SYS_v1.2
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex p-0.5 bg-slate-200 dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded">
              <button
                onClick={() => setMode('single')}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all duration-200
                  ${mode === 'single'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
              >
                SINGLE_IMG
              </button>
              <button
                onClick={() => setMode('batch')}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all duration-200
                  ${mode === 'batch'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
              >
                BATCH_LOAD
              </button>
            </div>

            {/* Help / Shortcuts Button */}
            <button
              onClick={() => setShowShortcuts(true)}
              className="p-1.5 border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:border-cyan-500 text-slate-500 hover:text-cyan-550 rounded transition"
              title="Keyboard Shortcuts"
            >
              <HelpCircle size={15} />
            </button>

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:border-cyan-500 text-slate-500 hover:text-cyan-550 rounded transition"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {mode === 'single' ? (
            <motion.div
              key="single-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Editor & Comparison Viewport */}
              <div className="lg:col-span-8 space-y-6">
                {!selectedFile ? (
                  <div className="space-y-4">
                    <div className="text-center max-w-lg mx-auto py-6">
                      <h2 className="text-xl font-bold tracking-widest text-cyan-600 dark:text-cyan-400 uppercase">IMAGE_PIXEL_QUANTIZATION</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-405 mt-2 font-bold uppercase tracking-wide">
                        Deploy raw visual data matrices, evaluate loss metrics, and compile optimized files.
                      </p>
                    </div>
                    <DropzoneArea onFilesDropped={handleSingleFileDrop} multiple={false} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Active Viewer Header */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={resetSingleView}
                        className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-350 uppercase"
                      >
                        <ArrowLeft size={12} />
                        <span>RESET_RAW_INPUT</span>
                      </button>

                      {/* Display Switcher */}
                      <div className="flex p-0.5 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded">
                        <button
                          onClick={() => setCompareMode('slider')}
                          className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase transition
                            ${compareMode === 'slider'
                              ? 'bg-cyan-500 text-slate-950 shadow'
                              : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                          SPLIT_SLIDE
                        </button>
                        <button
                          onClick={() => setCompareMode('side-by-side')}
                          className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase transition
                            ${compareMode === 'side-by-side'
                              ? 'bg-cyan-500 text-slate-950 shadow'
                              : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                          SIDE_SIDE
                        </button>
                      </div>
                    </div>

                    {/* Image comparison viewport */}
                    {isCompressing && !result ? (
                      <div className="w-full aspect-video flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/60">
                        <Loader2 size={32} className="animate-spin text-cyan-550 dark:text-cyan-400" />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-wider">Quantizing source pixel values...</p>
                      </div>
                    ) : error ? (
                      <div className="w-full aspect-video flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 p-4">
                        <AlertCircle size={32} className="mb-2" />
                        <p className="text-xs font-bold uppercase">SYSTEM_ERROR: OPTIMIZE_FAIL</p>
                        <p className="text-[10px] mt-1 text-center max-w-md uppercase font-medium">{error}</p>
                        <button
                          onClick={() => triggerCompression(selectedFile, quality)}
                          className="mt-4 px-4 py-1.5 bg-red-900/40 border border-red-500/40 text-red-400 hover:bg-red-900/60 rounded text-[10px] font-bold uppercase transition"
                        >
                          RETRY_JOB
                        </button>
                      </div>
                    ) : result ? (
                      <div>
                        {compareMode === 'slider' ? (
                          <ComparisonSlider
                            originalUrl={previewUrl}
                            compressedUrl={`${SERVER_URL}${result.compressedImageURL}`}
                          />
                        ) : (
                          <ZoomableComparison
                            originalUrl={previewUrl}
                            compressedUrl={`${SERVER_URL}${result.compressedImageURL}`}
                          />
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Right Column: Compression parameters & metrics */}
              <div className="lg:col-span-4 space-y-6">
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-5 rounded-xl glass-card border border-cyan-500/20 dark:border-slate-800/30 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">QUANTIZATION_LEVEL</h3>
                      <span className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400">{quality}%</span>
                    </div>

                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-205 dark:bg-slate-905 rounded appearance-none cursor-pointer accent-cyan-500"
                    />

                    <div className="flex justify-between text-[8px] text-slate-500 dark:text-slate-400 font-bold uppercase px-1">
                      <span>MAX_COMP (10%)</span>
                      <span>BALANCED</span>
                      <span>LOSSLESS (100%)</span>
                    </div>

                    {isCompressing && (
                      <div className="flex items-center space-x-2 text-[8px] text-cyan-600 dark:text-cyan-400 font-bold animate-pulse uppercase">
                        <Loader2 size={10} className="animate-spin" />
                        <span>recpiling system data...</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Metrics Details */}
                {result && !isCompressing && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <MetricsPanel
                      metrics={result}
                      filename={selectedFile.name}
                      originalUrl={previewUrl}
                    />

                    <button
                      onClick={handleDownload}
                      className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-slate-950 rounded text-xs font-bold tracking-widest uppercase shadow shadow-cyan-500/10 flex items-center justify-center space-x-2 transition active:scale-[0.98]"
                    >
                      <Download size={14} />
                      <span>COMPILE_DOWNLOAD</span>
                    </button>
                  </motion.div>
                )}

                {/* History Panel */}
                <HistoryPanel
                  history={history}
                  onClear={() => setHistory([])}
                  onSelect={loadHistoryItem}
                  serverUrl={SERVER_URL}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="batch-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-6 max-w-4xl mx-auto"
            >
              <div className="text-center max-w-lg mx-auto pb-4">
                <h2 className="text-xl font-bold tracking-widest text-cyan-600 dark:text-cyan-400 uppercase">BATCH_COMP_CONSOLE</h2>
                <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wide">
                  Load multiple matrices, drag-reorder queue sequences, apply preset algorithms, and compile batch drives.
                </p>
              </div>

              <DropzoneArea onFilesDropped={handleBatchFilesDrop} multiple={true} />

              {batchFiles.length > 0 && (
                <BatchCompressor
                  files={batchFiles}
                  setFiles={setBatchFiles}
                  serverUrl={SERVER_URL}
                  addHistory={addHistory}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Keyboard Shortcuts overlay panel */}
      <KeyboardShortcutsHelp
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
