import React, { useRef, useEffect, useState } from 'react';

export default function Whiteboard({
  socket,
  roomId,
  tool,
  color,
  size,
  strokes,
  setStrokes,
  self
}) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeIdRef = useRef(null);
  const prevPointRef = useRef(null);

  // Set up canvas properties and context
  useEffect(() => {
    const canvas = canvasRef.current;
    
    // Fixed internal resolution to maintain scale and aspect ratio across different screen sizes
    canvas.width = 1600;
    canvas.height = 900;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    // Redraw all strokes on canvas setup
    redrawCanvas();
  }, []);

  // Watch for strokes list changes (e.g. initial loads, undo, other users drawing) and redraw
  useEffect(() => {
    redrawCanvas();
  }, [strokes]);

  // Redraws the entire canvas using the list of stroke history
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    const ctx = contextRef.current;
    // Clear canvas completely
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw each stroke
    strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;

      if (stroke.tool === 'text') {
        ctx.fillStyle = stroke.color;
        // Font size scales with slider
        const fontSize = Math.max(16, stroke.size * 1.5 + 10);
        ctx.font = `600 ${fontSize}px Outfit, Inter, sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(stroke.text || '', stroke.points[0].x, stroke.points[0].y);
        return;
      }

      ctx.beginPath();
      ctx.lineWidth = stroke.size;
      // Eraser draws white lines to erase
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;

      const firstPoint = stroke.points[0];
      ctx.moveTo(firstPoint.x, firstPoint.y);

      // If it's just a single click/tap point, draw a dot
      if (stroke.points.length === 1) {
        ctx.lineTo(firstPoint.x, firstPoint.y);
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
      }

      ctx.stroke();
    });
  };

  // Convert client coordinate into the canvas's internal 1600x900 space
  const getCanvasCoordinates = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Drawing event handlers
  const startDrawing = (clientX, clientY) => {
    if (!socket || !roomId || !self) return;

    const { x, y } = getCanvasCoordinates(clientX, clientY);

    if (tool === 'text') {
      const text = window.prompt("Enter text to add to canvas:");
      if (!text || !text.trim()) return;

      const strokeId = `stroke-${socket.id}-${Date.now()}`;
      const newStroke = {
        id: strokeId,
        userId: socket.id,
        username: self.username,
        tool: 'text',
        text: text.trim(),
        color,
        size,
        points: [{ x, y }]
      };

      // Add to local strokes
      setStrokes((prev) => [...prev, newStroke]);

      // Emit to server
      socket.emit('drawing-start', { roomId, stroke: newStroke });
      socket.emit('drawing-end', { roomId, strokeId });
      return;
    }

    setIsDrawing(true);

    const strokeId = `stroke-${socket.id}-${Date.now()}`;
    currentStrokeIdRef.current = strokeId;
    prevPointRef.current = { x, y };

    const newStroke = {
      id: strokeId,
      userId: socket.id,
      username: self.username,
      tool,
      color,
      size,
      points: [{ x, y }]
    };

    // Update local strokes
    setStrokes((prev) => [...prev, newStroke]);

    // Send drawing starting event to backend
    socket.emit('drawing-start', { roomId, stroke: newStroke });
  };

  const draw = (clientX, clientY) => {
    if (!isDrawing || !socket || !roomId || tool === 'text') return;

    const { x, y } = getCanvasCoordinates(clientX, clientY);
    const strokeId = currentStrokeIdRef.current;
    const newPoint = { x, y };

    // Update local state by appending new point to the active stroke
    setStrokes((prev) =>
      prev.map((s) => {
        if (s.id === strokeId) {
          return {
            ...s,
            points: [...s.points, newPoint]
          };
        }
        return s;
      })
    );

    // Draw the segment locally immediately for zero-latency feedback
    const ctx = contextRef.current;
    if (ctx && prevPointRef.current) {
      ctx.beginPath();
      ctx.lineWidth = size;
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.moveTo(prevPointRef.current.x, prevPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    prevPointRef.current = newPoint;

    // Emit point to other clients
    socket.emit('drawing', { roomId, strokeId, point: newPoint });
  };

  const stopDrawing = () => {
    if (!isDrawing || !socket || !roomId || tool === 'text') return;

    setIsDrawing(false);
    const strokeId = currentStrokeIdRef.current;

    // Emit end drawing
    socket.emit('drawing-end', { roomId, strokeId });

    currentStrokeIdRef.current = null;
    prevPointRef.current = null;
  };

  // Mouse event wrappers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only draw with left click
    startDrawing(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    draw(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  // Touch event wrappers (for mobile support)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      startDrawing(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      draw(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    stopDrawing();
  };

  return (
    <div className="app-whiteboard-wrapper">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="whiteboard-canvas"
      />
    </div>
  );
}
