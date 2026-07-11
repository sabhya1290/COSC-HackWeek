import React, { useState, useRef, useEffect } from 'react';

export default function ComparisonSlider({ originalUrl, compressedUrl }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging]);

  return (
    <div className="flex flex-col items-center w-full">
      <div
        ref={containerRef}
        className="relative w-full aspect-video md:aspect-[16/10] max-h-[600px] overflow-hidden rounded-xl border border-cyan-500/20 select-none cursor-ew-resize glass-panel"
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        {/* Original Image */}
        <div className="absolute inset-0 w-full h-full bg-slate-900">
          <img
            src={originalUrl}
            alt="Original"
            className="w-full h-full object-contain pointer-events-none no-select"
          />
          <div className="absolute bottom-4 left-4 px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-300 bg-slate-950/80 border border-slate-800 rounded">
            ORIGINAL
          </div>
        </div>

        {/* Compressed Image (Clipped) */}
        <div
          className="absolute inset-y-0 right-0 h-full overflow-hidden bg-slate-950"
          style={{ left: `${sliderPosition}%` }}
        >
          <img
            src={compressedUrl}
            alt="Compressed"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none no-select"
            style={{
              width: containerRef.current ? containerRef.current.offsetWidth : '100%',
              maxWidth: 'none',
              transform: `translateX(-${sliderPosition}%)`
            }}
          />
          <div className="absolute bottom-4 right-4 px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-cyan-400 bg-slate-950/80 border border-cyan-500/30 rounded">
            COMPRESSED
          </div>
        </div>

        {/* Slider Handle Line */}
        <div
          className="absolute inset-y-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(102,252,241,0.8)] cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Handle Knob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900 text-cyan-400 border border-cyan-400 rounded flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-transform duration-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
            </svg>
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">
        ◄ DRAG CENTER HANDLE TO SWIPE SYSTEM COMPARISON ►
      </p>
    </div>
  );
}
