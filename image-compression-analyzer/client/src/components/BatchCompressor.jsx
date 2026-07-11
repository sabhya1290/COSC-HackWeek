import React, { useState } from 'react';
import { Play, Download, Trash2, Sliders, Layers, RefreshCw, GripVertical } from 'lucide-react';
import axios from 'axios';
import { downloadFile } from '../utils/download.js';

export default function BatchCompressor({ files, setFiles, serverUrl, addHistory }) {
  const [preset, setPreset] = useState('balanced');
  const [quality, setQuality] = useState(60);
  const [isCompressing, setIsCompressing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const getQualityFromPreset = (p) => {
    if (p === 'high') return 85;
    if (p === 'balanced') return 60;
    if (p === 'max') return 25;
    return quality;
  };

  const handlePresetChange = (p) => {
    setPreset(p);
    setQuality(getQualityFromPreset(p));
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const reordered = [...files];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, draggedItem);
    
    setFiles(reordered);
    setDraggedIndex(null);
  };

  const handleRemove = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const compressBatch = async () => {
    setIsCompressing(true);
    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      const fileObj = updatedFiles[i];
      if (fileObj.status === 'success') continue;

      updatedFiles[i] = { ...fileObj, status: 'compressing', progress: 50 };
      setFiles([...updatedFiles]);

      try {
        const formData = new FormData();
        formData.append('image', fileObj.file);
        formData.append('quality', quality);

        const response = await axios.post(`${serverUrl}/compress`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        updatedFiles[i] = {
          ...fileObj,
          status: 'success',
          progress: 100,
          result: response.data
        };
        setFiles([...updatedFiles]);

        addHistory({
          filename: fileObj.file.name,
          quality: quality,
          originalSize: response.data.originalSize,
          compressedSize: response.data.compressedSize,
          savedPercentage: response.data.savedPercentage,
          compressedImageURL: response.data.compressedImageURL
        });

      } catch (err) {
        console.error(err);
        updatedFiles[i] = {
          ...fileObj,
          status: 'failed',
          error: err.response?.data?.error || 'Compression failed.'
        };
        setFiles([...updatedFiles]);
      }
    }
    setIsCompressing(false);
  };

  const downloadAll = () => {
    files.forEach((fileObj) => {
      if (fileObj.status === 'success' && fileObj.result) {
        const fileUrl = `${serverUrl}${fileObj.result.compressedImageURL}`;
        const name = fileObj.file.name;
        const ext = name.split('.').pop();
        const nameNoExt = name.substring(0, name.lastIndexOf('.'));
        const downloadName = `${nameNoExt}_compressed_${quality}.${ext}`;
        downloadFile(fileUrl, downloadName);
      }
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl glass-card border border-cyan-500/20">
        {/* Preset Selector */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-450 flex items-center gap-1.5 uppercase tracking-wider">
            <Layers size={14} className="text-cyan-400" /> SYSTEM_PRESETS
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'high', label: 'HIGH_QUAL', val: '85%' },
              { id: 'balanced', label: 'BALANCED', val: '60%' },
              { id: 'max', label: 'MAX_COMP', val: '25%' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handlePresetChange(item.id)}
                className={`flex flex-col items-center justify-center p-3 rounded border text-[10px] font-bold uppercase transition active:scale-[0.98]
                  ${preset === item.id 
                    ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 neon-glow-cyan' 
                    : 'bg-slate-950/60 border-slate-900 hover:border-slate-800 text-slate-500'
                  }`}
              >
                <span>{item.label}</span>
                <span className="text-[8px] text-slate-655 mt-0.5">{item.val}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quality Custom slider */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-450 flex items-center justify-between uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Sliders size={14} className="text-cyan-400" /> CUSTOM_RATIO</span>
            <span className="text-cyan-400 font-extrabold">{quality}%</span>
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={quality}
              onChange={(e) => {
                setQuality(parseInt(e.target.value));
                setPreset('custom');
              }}
              className="w-full h-2 bg-slate-900 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
          <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase px-1">
            <span>10% (MAX)</span>
            <span>BALANCED</span>
            <span>100% (MIN)</span>
          </div>
        </div>
      </div>

      {/* Batch Processing List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            BATCH_QUEUE ({files.length} ITEMS)
          </h3>
          <div className="flex gap-2">
            {files.some(f => f.status === 'success') && (
              <button
                onClick={downloadAll}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded text-[10px] font-bold uppercase transition active:scale-[0.98]"
              >
                <Download size={12} />
                <span>DOWNLOAD_ALL</span>
              </button>
            )}
            <button
              onClick={compressBatch}
              disabled={isCompressing || files.length === 0}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-900 disabled:border-slate-800 disabled:text-slate-600 text-slate-950 rounded text-[10px] font-bold uppercase transition active:scale-[0.98]"
            >
              {isCompressing ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              <span>RUN_BATCH</span>
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {files.map((fileObj, index) => (
            <div
              key={fileObj.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className="flex items-center justify-between p-3 bg-slate-950/40 rounded border border-slate-900 transition hover:border-cyan-550/20"
            >
              <div className="flex items-center space-x-3 min-w-0 pr-4">
                <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400">
                  <GripVertical size={14} />
                </div>
                {fileObj.previewUrl && (
                  <img
                    src={fileObj.previewUrl}
                    alt="Preview"
                    className="w-8 h-8 object-cover rounded border border-slate-800"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-350 truncate">{fileObj.file.name}</p>
                  <p className="text-[8px] text-slate-600 font-bold uppercase">{formatBytes(fileObj.file.size)}</p>
                </div>
              </div>

              {/* Status / Output Metrics */}
              <div className="flex items-center space-x-4 shrink-0">
                {fileObj.status === 'idle' && (
                  <span className="text-[8px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-500 rounded">
                    READY
                  </span>
                )}
                {fileObj.status === 'compressing' && (
                  <span className="text-[8px] font-bold px-2 py-0.5 bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 rounded flex items-center gap-1">
                    <RefreshCw size={8} className="animate-spin" /> RUNNING
                  </span>
                )}
                {fileObj.status === 'success' && fileObj.result && (
                  <div className="flex items-center space-x-2 text-[8px] font-bold">
                    <span className="text-slate-500">
                      {formatBytes(fileObj.result.compressedSize)}
                    </span>
                    <span className="text-emerald-500">
                      -{fileObj.result.savedPercentage}%
                    </span>
                  </div>
                )}
                {fileObj.status === 'failed' && (
                  <span className="text-[8px] font-bold px-2 py-0.5 bg-red-950/40 border border-red-500/20 text-red-400 rounded">
                    ERROR
                  </span>
                )}

                <button
                  onClick={() => handleRemove(index)}
                  disabled={isCompressing}
                  className="p-1 hover:text-red-500 text-slate-600 transition"
                  title="Remove from queue"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
