import React from 'react';
import { Copy, FileText, Check, Database, Activity } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function MetricsPanel({ metrics, filename, originalUrl }) {
  const [copied, setCopied] = React.useState(false);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const copyStats = () => {
    const text = `
SYS_IMAGE_OPTIMIZATION_REPORT: ${filename}
---------------------------------------------
ORIGINAL_SIZE: ${formatBytes(metrics.originalSize)}
OPTIMIZED_SIZE: ${formatBytes(metrics.compressedSize)}
SAVINGS_RATIO: -${metrics.savedPercentage}%
COMPRESSION_RATIO: ${metrics.ratio}
DIMENSIONS: ${metrics.dimensions.original} -> ${metrics.dimensions.compressed}
SYS_FORMAT: ${metrics.format}
TIME_ELAPSED: ${metrics.timeTaken} ms
ESTIMATED_QUALITY_LOSS: ${metrics.estimatedQualityLoss}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportPDF = () => {
    const element = document.getElementById('pdf-report-content');
    if (!element) return;
    
    // Create print-friendly clone
    const clone = element.cloneNode(true);
    clone.classList.add('pdf-print-wrapper');
    
    // Recursively clean theme/color classes to prevent oklch tailwind v4 color space parsing crash in html2canvas
    const cleanStyles = (el) => {
      const classesToRemove = [];
      el.classList.forEach(cls => {
        if (
          cls.startsWith('text-') || 
          cls.startsWith('bg-') || 
          cls.startsWith('border-') || 
          cls.startsWith('shadow-') || 
          cls.startsWith('neon-') ||
          cls.includes('glass-')
        ) {
          classesToRemove.push(cls);
        }
      });
      classesToRemove.forEach(cls => el.classList.remove(cls));
      
      // Inline clean styling variables
      if (el.tagName === 'H3' || el.tagName === 'H4') {
        el.style.color = '#0f172a';
        el.style.fontWeight = 'bold';
      } else if (el.tagName === 'P' || el.tagName === 'SPAN') {
        el.style.color = '#334155';
      }
      el.style.textShadow = 'none';
      el.style.boxShadow = 'none';
      el.style.borderColor = '#e2e8f0';

      Array.from(el.children).forEach(child => cleanStyles(child));
    };

    cleanStyles(clone);

    // Style the badge manually on the print template
    const formatBadge = clone.querySelector('.format-badge-target');
    if (formatBadge) {
      formatBadge.style.backgroundColor = '#f1f5f9';
      formatBadge.style.color = '#0f172a';
      formatBadge.style.padding = '4px 8px';
      formatBadge.style.borderRadius = '4px';
      formatBadge.style.border = '1px solid #cbd5e1';
      formatBadge.style.fontWeight = 'bold';
      formatBadge.style.fontSize = '10px';
    }

    const opt = {
      margin: 15,
      filename: `${filename.split('.')[0]}_compression_report.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    const h2p = html2pdf.default || html2pdf;
    h2p().from(clone).set(opt).save();
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Primary Dashboard Cards */}
      <div id="pdf-report-content" className="p-6 rounded-xl glass-card border border-cyan-500/20 dark:border-slate-800/30 space-y-6">
        <div className="flex items-center justify-between border-b border-cyan-500/10 dark:border-slate-800/30 pb-4">
          <div>
            <h3 className="text-md font-bold tracking-wide text-cyan-400 dark:text-cyan-400 uppercase">SYS_OPTIMIZATION_METRICS</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-0.5">FILE: {filename}</p>
          </div>
          <span className="format-badge-target px-2.5 py-1 text-[10px] font-black text-slate-900 dark:text-slate-955 bg-cyan-400 rounded">
            {metrics.format}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950/60 dark:bg-slate-900/40 rounded border border-slate-900 dark:border-slate-800/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">RAW_FILE_SIZE</p>
            <p className="text-lg font-bold text-slate-355 dark:text-slate-200 mt-1">{formatBytes(metrics.originalSize)}</p>
          </div>

          <div className="p-4 bg-cyan-950/20 dark:bg-cyan-950/10 rounded border border-cyan-500/30 dark:border-cyan-500/20 neon-glow-cyan">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">SYS_COMPRESSED_SIZE</p>
            <p className="text-lg font-bold text-cyan-400 mt-1">{formatBytes(metrics.compressedSize)}</p>
          </div>

          <div className="p-4 bg-emerald-950/20 dark:bg-emerald-950/10 rounded border border-emerald-500/30 dark:border-emerald-500/20 neon-glow-green col-span-2 lg:col-span-1">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">RATIO_SAVED</p>
            <p className="text-lg font-bold text-emerald-400 mt-1">-{metrics.savedPercentage}%</p>
          </div>

          <div className="p-4 bg-slate-950/60 dark:bg-slate-900/40 rounded border border-slate-900 dark:border-slate-800/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">COMP_RATIO</p>
            <p className="text-lg font-bold text-slate-355 dark:text-slate-200 mt-1">{metrics.ratio}</p>
          </div>

          <div className="p-4 bg-slate-950/60 dark:bg-slate-900/40 rounded border border-slate-900 dark:border-slate-800/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">RESOLUTION</p>
            <p className="text-xs font-bold text-slate-355 dark:text-slate-200 mt-1.5">{metrics.dimensions.compressed}</p>
            <p className="text-[9px] text-slate-500 dark:text-slate-404 font-bold uppercase mt-0.5">WAS: {metrics.dimensions.original}</p>
          </div>

          <div className="p-4 bg-slate-950/60 dark:bg-slate-900/40 rounded border border-slate-900 dark:border-slate-800/50 col-span-2 lg:col-span-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TIME_ELAPSED</p>
            <p className="text-lg font-bold text-slate-355 dark:text-slate-200 mt-1">{metrics.timeTaken} ms</p>
          </div>
        </div>

        {/* Technical Metadata Inspector */}
        {metrics.metadata && (
          <div className="pt-4 border-t border-slate-900 dark:border-slate-800/50">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Database size={10} className="text-cyan-400" />
              SYSTEM_METADATA_METRIC
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-bold">
              <div className="flex justify-between p-2 bg-slate-950/40 dark:bg-slate-900/20 rounded border border-slate-900 dark:border-slate-800/30">
                <span className="text-slate-500 uppercase">COLOR_SPACE</span>
                <span className="text-slate-350 dark:text-slate-300">{metrics.metadata.space || 'sRGB'}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950/40 dark:bg-slate-900/20 rounded border border-slate-900 dark:border-slate-800/30">
                <span className="text-slate-500 uppercase">CHANNELS</span>
                <span className="text-slate-350 dark:text-slate-300">{metrics.metadata.channels}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950/40 dark:bg-slate-900/20 rounded border border-slate-900 dark:border-slate-800/30">
                <span className="text-slate-500 uppercase">ALPHA_CH</span>
                <span className="text-slate-350 dark:text-slate-300">{metrics.metadata.hasAlpha ? 'YES' : 'NO'}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950/40 dark:bg-slate-900/20 rounded border border-slate-900 dark:border-slate-800/30">
                <span className="text-slate-500 uppercase">DENSITY</span>
                <span className="text-slate-355 dark:text-slate-300">{metrics.metadata.density} DPI</span>
              </div>
            </div>
          </div>
        )}

        {/* Quality Loss Info */}
        <div className="flex items-center space-x-3 p-3 bg-cyan-950/20 dark:bg-cyan-950/5 border border-cyan-500/10 dark:border-cyan-500/5 rounded">
          <Activity className="text-cyan-400 shrink-0" size={16} />
          <div className="text-[10px] font-bold uppercase tracking-wide">
            <span className="text-slate-400 dark:text-slate-300">ESTIMATED_SYS_QUALITY_LOSS: </span>
            <span className="text-cyan-400">{metrics.estimatedQualityLoss}</span>
            <span className="text-slate-550 dark:text-slate-400 block text-[8px] mt-0.5 lowercase font-medium">Dynamic optimization algorithm executed. Pixel ratios aligned.</span>
          </div>
        </div>
      </div>

      {/* Button Controls */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={copyStats}
          className="flex items-center space-x-1.5 px-4 py-2 border border-slate-800 dark:border-slate-700 text-slate-400 dark:text-slate-300 bg-slate-950 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 rounded text-xs font-bold transition active:scale-[0.98]"
        >
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          <span>{copied ? 'SYS_COPIED' : 'COPY_METRICS'}</span>
        </button>

        <button
          onClick={exportPDF}
          className="flex items-center space-x-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 rounded text-xs font-bold transition active:scale-[0.98]"
        >
          <FileText size={12} />
          <span>EXPORT_PDF</span>
        </button>
      </div>
    </div>
  );
}
