import React from 'react';
import { Download, Trash2, ExternalLink, HardDrive } from 'lucide-react';
import { downloadFile } from '../utils/download.js';

export default function HistoryPanel({ history, onClear, onSelect, serverUrl }) {
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = (item) => {
    const fileUrl = `${serverUrl}${item.compressedImageURL}`;
    const ext = item.filename.split('.').pop();
    const name = item.filename.substring(0, item.filename.lastIndexOf('.'));
    const downloadName = `${name}_compressed_${item.quality}.${ext}`;
    downloadFile(fileUrl, downloadName);
  };

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-xl glass-card text-slate-500 border border-slate-900">
        <HardDrive size={24} className="mb-2 opacity-50 text-cyan-500" />
        <p className="text-xs font-bold uppercase">NO_HISTORY_LOGGED</p>
        <p className="text-[10px] text-slate-600 mt-1 uppercase">Successful compressions will record here.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">HISTORY_LOG</h3>
          <p className="text-[9px] text-slate-600 font-bold uppercase">LOCAL_CACHE_STORAGE</p>
        </div>
        <button
          onClick={onClear}
          className="flex items-center space-x-1 px-2.5 py-1.5 border border-red-950 text-red-400 hover:bg-red-950/20 rounded text-[10px] font-bold uppercase transition active:scale-[0.98]"
        >
          <Trash2 size={12} />
          <span>WIPE_LOG</span>
        </button>
      </div>

      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
        {history.map((item) => (
          <div
            key={item.id || item.timestamp}
            className="flex items-center justify-between p-3 bg-slate-950/40 rounded border border-slate-900 transition hover:border-cyan-500/20 group"
          >
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-[11px] font-bold text-slate-355 truncate" title={item.filename}>
                {item.filename}
              </span>
              <div className="flex gap-2 items-center text-[9px] text-slate-500 font-bold uppercase mt-1">
                <span>QUAL: {item.quality}%</span>
                <span>•</span>
                <span className="text-emerald-500">-{item.savedPercentage}%</span>
                <span>•</span>
                <span>{formatBytes(item.compressedSize)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 shrink-0">
              <button
                onClick={() => onSelect(item)}
                className="p-1 bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 text-slate-400 rounded transition"
                title="Load into Viewer"
              >
                <ExternalLink size={12} />
              </button>
              <button
                onClick={() => handleDownload(item)}
                className="p-1 bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 text-slate-400 rounded transition"
                title="Download file"
              >
                <Download size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
