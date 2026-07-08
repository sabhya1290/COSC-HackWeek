import React from 'react';
import { Pencil, Eraser, Type, Undo2, Trash2, Download } from 'lucide-react';

export default function Toolbar({
  tool,
  setTool,
  color,
  setColor,
  size,
  setSize,
  onUndo,
  onClear,
  onDownload,
  canUndo
}) {
  return (
    <aside 
      className="app-toolbar"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Drawing tools group */}
      <div className="tool-group">
        <span className="tool-label">Tools</span>
        
        <button
          className={`tool-btn ${tool === 'pencil' ? 'active' : ''}`}
          onClick={() => setTool('pencil')}
          title="Pencil Tool"
        >
          <Pencil size={20} />
        </button>

        <button
          className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => setTool('eraser')}
          title="Eraser Tool"
        >
          <Eraser size={20} />
        </button>

        <button
          className={`tool-btn ${tool === 'text' ? 'active' : ''}`}
          onClick={() => setTool('text')}
          title="Text Tool"
        >
          <Type size={20} />
        </button>
      </div>

      {/* Brush color and stroke thickness controls */}
      <div className="tool-group">
        <span className="tool-label">Style</span>
        
        <div className="color-input-wrapper" title="Select Color">
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              if (tool === 'eraser') {
                setTool('pencil'); // Switch back to pencil if they choose color while erasing
              }
            }}
            className="color-picker"
          />
        </div>

        <div className="stroke-slider-container">
          <input
            type="range"
            min="2"
            max="40"
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
            title="Stroke Size"
          />
          <span className="stroke-size-preview">{size}px</span>
        </div>
      </div>

      {/* Editing options group */}
      <div className="tool-group" style={{ marginTop: 'auto' }}>
        <span className="tool-label">Actions</span>

        <button
          className="action-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo Stroke"
        >
          <Undo2 size={20} />
        </button>

        <button
          className="action-btn danger"
          onClick={onClear}
          title="Clear Board"
        >
          <Trash2 size={20} />
        </button>

        <button
          className="action-btn"
          onClick={onDownload}
          title="Download PNG"
        >
          <Download size={20} />
        </button>
      </div>
    </aside>
  );
}
