import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Link2, Link2Off } from 'lucide-react';

export default function ZoomableComparison({ originalUrl, compressedUrl }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [sync, setSync] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const [compressedPan, setCompressedPan] = useState({ x: 0, y: 0 });
  const [compressedZoom, setCompressedZoom] = useState(1);

  const resetViews = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCompressedZoom(1);
    setCompressedPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e, side) => {
    e.preventDefault();
    setIsDragging(side);
    const currentPan = (sync || side === 'original') ? pan : compressedPan;
    dragStart.current = { x: e.clientX - currentPan.x, y: e.clientY - currentPan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;

    if (sync || isDragging === 'original') {
      setPan({ x: newX, y: newY });
      if (sync) setCompressedPan({ x: newX, y: newY });
    } else {
      setCompressedPan({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e, side) => {
    e.preventDefault();
    const zoomFactor = 0.15;
    const direction = e.deltaY < 0 ? 1 : -1;

    if (sync || side === 'original') {
      const nextZoom = Math.max(1, Math.min(6, zoom + direction * zoomFactor));
      setZoom(nextZoom);
      if (sync) setCompressedZoom(nextZoom);
    } else {
      const nextZoom = Math.max(1, Math.min(6, compressedZoom + direction * zoomFactor));
      setCompressedZoom(nextZoom);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, pan, compressedPan, sync]);

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Zoom and Sync Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-xl border border-cyan-500/20">
        <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400">
          <span className="px-2.5 py-1 bg-slate-900 rounded border border-slate-800">
            ZOOM_LVL: {zoom.toFixed(1)}x
          </span>
          {!sync && (
            <span className="px-2.5 py-1 bg-slate-900 rounded border border-slate-800">
              C_ZOOM: {compressedZoom.toFixed(1)}x
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Sync Button */}
          <button
            onClick={() => {
              setSync(!sync);
              if (!sync) {
                setCompressedZoom(zoom);
                setCompressedPan(pan);
              }
            }}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-[10px] font-bold border uppercase transition-all duration-200
              ${sync 
                ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 neon-glow-cyan' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
          >
            {sync ? <Link2 size={12} /> : <Link2Off size={12} />}
            <span>{sync ? 'SYNC_LOCKED' : 'SYNC_OFF'}</span>
          </button>

          {/* Zoom controls */}
          <button
            onClick={() => {
              const nz = Math.max(1, zoom - 0.5);
              setZoom(nz);
              if (sync) setCompressedZoom(nz);
            }}
            className="p-1 bg-slate-900 border border-slate-850 hover:border-cyan-500 hover:text-cyan-400 rounded text-slate-400 transition"
          >
            <ZoomOut size={12} />
          </button>
          <button
            onClick={() => {
              const nz = Math.min(6, zoom + 0.5);
              setZoom(nz);
              if (sync) setCompressedZoom(nz);
            }}
            className="p-1 bg-slate-900 border border-slate-850 hover:border-cyan-500 hover:text-cyan-400 rounded text-slate-400 transition"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={resetViews}
            className="p-1 bg-slate-900 border border-slate-850 hover:border-cyan-500 hover:text-cyan-400 rounded text-slate-400 transition"
            title="Reset Zoom/Position"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Side-by-side Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original Viewport */}
        <div className="flex flex-col space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">DRIVE_SOURCE_RAW</span>
          <div
            className="relative w-full aspect-video md:aspect-[4/3] overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => handleMouseDown(e, 'original')}
            onWheel={(e) => handleWheel(e, 'original')}
          >
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
              }}
            >
              <img
                src={originalUrl}
                alt="Original"
                className="max-w-full max-h-full object-contain pointer-events-none no-select"
              />
            </div>
          </div>
        </div>

        {/* Compressed Viewport */}
        <div className="flex flex-col space-y-1">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider ml-1">SYSTEM_OUT_OPTIMIZED</span>
          <div
            className="relative w-full aspect-video md:aspect-[4/3] overflow-hidden rounded-xl border border-cyan-500/25 bg-slate-950/90 cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => handleMouseDown(e, 'compressed')}
            onWheel={(e) => handleWheel(e, 'compressed')}
          >
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
              style={{
                transform: `scale(${sync ? zoom : compressedZoom}) translate(${(sync ? pan.x : compressedPan.x) / (sync ? zoom : compressedZoom)}px, ${(sync ? pan.y : compressedPan.y) / (sync ? zoom : compressedZoom)}px)`
              }}
            >
              <img
                src={compressedUrl}
                alt="Compressed"
                className="max-w-full max-h-full object-contain pointer-events-none no-select"
              />
            </div>
          </div>
        </div>
      </div>
      <p className="text-[9px] text-slate-500 text-center font-bold uppercase">
        ◄ WHEEL MOUSE TO ZOOM IN/OUT // DRAG INSIDE WINDOW TO PAN ►
      </p>
    </div>
  );
}
