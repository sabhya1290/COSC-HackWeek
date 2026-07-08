import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Palette, Copy, Check, Users, LogOut, Menu, X, 
  HelpCircle, Info, Home, PenTool, Layout, FileText, Download, Trash2, Plus
} from 'lucide-react';

import Toolbar from './components/Toolbar';
import Whiteboard from './components/Whiteboard';
import UsersPanel from './components/UsersPanel';
import Toast from './components/Toast';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export default function App() {
  // Navigation Routing States
  const [currentPage, setCurrentPage] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // App Connection & Room States
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [self, setSelf] = useState(null);
  
  // Form states at top level
  const [localName, setLocalName] = useState('');
  const [localRoomCode, setLocalRoomCode] = useState('');
  
  // Real-time collaborative workspace states
  const [users, setUsers] = useState([]);
  const [strokes, setStrokes] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isUsersPanelOpen, setIsUsersPanelOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Drawing Tools state
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#1e293b'); // Navy-slate default color
  const [size, setSize] = useState(5);

  // Connect to Socket server when room parameters are entered
  useEffect(() => {
    if (!roomId || !username || !roomJoined) return;

    const newSocket = io(SERVER_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-room', { roomId, username });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      addToast('Disconnected from server', 'danger');
    });

    // Handle joining events
    newSocket.on('room-joined', ({ roomId, self, users, strokes }) => {
      setSelf(self);
      setUsers(users);
      setRoomJoined(true);
      addToast(`Joined room: ${roomId}`, 'success');

      // Check if we should load local state if server has no strokes
      if (strokes.length === 0) {
        const saved = localStorage.getItem(`syncsketch_board_${roomId}`);
        if (saved) {
          try {
            const loadedStrokes = JSON.parse(saved);
            if (loadedStrokes && loadedStrokes.length > 0) {
              setStrokes(loadedStrokes);
              // Emit them to server so other users also see it
              loadedStrokes.forEach(s => {
                newSocket.emit('drawing-start', { roomId, stroke: s });
              });
              addToast('Restored saved board from local storage', 'success');
              return;
            }
          } catch (e) {
            console.error('Failed to restore local board', e);
          }
        }
      }
      setStrokes(strokes);
    });

    newSocket.on('user-joined', ({ user, users }) => {
      setUsers(users);
      addToast(`${user.username} joined the workspace`, 'info');
    });

    newSocket.on('user-left', ({ userId, username, users }) => {
      setUsers(users);
      addToast(`${username} left the workspace`, 'info');
    });

    // Handle drawing states
    newSocket.on('user-drawing-status', ({ userId, isDrawing, users }) => {
      setUsers(users);
    });

    newSocket.on('drawing-start', ({ stroke }) => {
      setStrokes((prev) => [...prev, stroke]);
    });

    newSocket.on('drawing', ({ strokeId, point }) => {
      setStrokes((prev) =>
        prev.map((s) => {
          if (s.id === strokeId) {
            return {
              ...s,
              points: [...s.points, point]
            };
          }
          return s;
        })
      );
    });

    newSocket.on('drawing-end', ({ strokeId }) => {
      // Draw end handler
    });

    // Request current canvas state from this socket helper
    newSocket.on('request-canvas-state', ({ requesterId }) => {
      setStrokes((currentStrokes) => {
        newSocket.emit('canvas-state', { requesterId, strokes: currentStrokes });
        return currentStrokes;
      });
    });

    newSocket.on('canvas-state', ({ strokes }) => {
      if (strokes) {
        setStrokes(strokes);
      }
    });

    // Clear and Undo
    newSocket.on('clear-canvas', () => {
      setStrokes([]);
      addToast('Whiteboard was cleared by room coordinator', 'info');
    });

    newSocket.on('undo-stroke', ({ strokeId, strokes }) => {
      setStrokes(strokes);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, username, roomJoined]);

  // Toast Helpers
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to generate distinct 6-character room codes
  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Home actions
  const handleCreateRoom = (e, customUsername) => {
    e.preventDefault();
    if (!customUsername.trim()) return;
    const newRoomCode = generateRoomId();
    setUsername(customUsername.trim());
    setRoomId(newRoomCode);
    setRoomJoined(true);
    setCurrentPage('whiteboard');
  };

  const handleJoinRoom = (e, customUsername, customRoomId) => {
    e.preventDefault();
    if (!customUsername.trim() || !customRoomId.trim()) return;
    setUsername(customUsername.trim());
    setRoomId(customRoomId.trim().toUpperCase());
    setRoomJoined(true);
    setCurrentPage('whiteboard');
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      addToast('Room link copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { roomId });
      socket.disconnect();
    }
    // Reset client state
    setRoomJoined(false);
    setRoomId('');
    setUsername('');
    setSelf(null);
    setUsers([]);
    setStrokes([]);
    setCurrentPage('home'); // Auto-redirect to home landing page
  };

  const handleNewBoard = () => {
    const confirmed = window.confirm('Are you sure you want to leave and create a new board? Your current session will be saved locally.');
    if (confirmed) {
      // Save current room strokes list before leaving
      if (roomId && strokes.length > 0) {
        localStorage.setItem(`syncsketch_board_${roomId}`, JSON.stringify(strokes));
      }
      handleLeaveRoom();
      setCurrentPage('home');
      addToast('Left room. Ready for a new board.', 'info');
    }
  };

  const handleUndo = () => {
    if (socket && roomId) {
      socket.emit('undo-stroke', { roomId });
    }
  };

  const handleClear = () => {
    const confirmed = window.confirm('Are you sure you want to clear the whiteboard? This will erase drawings for everyone in the room.');
    if (confirmed && socket && roomId) {
      socket.emit('clear-canvas', { roomId });
      addToast('Wiping whiteboard canvas...', 'info');
    }
  };

  const handleSaveLocally = () => {
    if (!roomId) return;
    localStorage.setItem(`syncsketch_board_${roomId}`, JSON.stringify(strokes));
    addToast('Board progress saved to local storage!', 'success');
  };

  // PNG Canvas download using canvas.toBlob() with a popup window new-tab fallback
  const handleDownload = () => {
    const canvas = document.querySelector('.whiteboard-canvas');
    if (!canvas) return;

    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Blob generation failed');
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `syncsketch-board-${roomId}.png`;
        link.href = url;
        
        // Append, trigger, and discard
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);

        addToast('Canvas downloaded successfully!', 'success');
      }, 'image/png');
    } catch (err) {
      console.warn('Direct blob download failed, falling back to new tab popup', err);
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(`
            <html>
              <head><title>SyncSketch Board Export</title></head>
              <body style="margin:0;display:flex;justify-content:center;align-items:center;background:#0f172a;">
                <img src="${dataUrl}" style="max-width:100%;max-height:100%;box-shadow:0 10px 25px rgba(0,0,0,0.5);border-radius:8px;" />
              </body>
            </html>
          `);
          addToast('Direct download blocked. Opened image in a new tab.', 'info');
        } else {
          addToast('Download failed. Please allow popups.', 'danger');
        }
      } catch (fallbackErr) {
        addToast('Error exporting whiteboard canvas.', 'danger');
      }
    }
  };

  // Check URL search parameters to pre-fill room code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const upperCode = roomParam.toUpperCase();
      setRoomId(upperCode);
      setLocalRoomCode(upperCode);
    }
  }, []);

  const hasMyStrokes = self && strokes.some((s) => s.userId === self.id);
  const activeDrawers = users.filter((u) => u.isDrawing && u.id !== self?.id);

  // Custom Local views
  const renderHome = () => {
    return (
      <div className="nav-page-content animate-fade">
        <div className="home-hero">
          <div className="home-logo-badge">
            <Palette size={56} strokeWidth={2.5} />
          </div>
          <h2>SyncSketch</h2>
          <p>Draw together, think together. A premium real-time collaborative sketchpad built for teams and visual brainstorming.</p>
        </div>

        <div className="home-dashboard">
          {/* Create Room Form */}
          <div className="home-card">
            <h3>Create a New Room</h3>
            <form onSubmit={(e) => handleCreateRoom(e, localName)} className="modal-actions" style={{ gap: '16px' }}>
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  className="input-field"
                  required
                  maxLength={15}
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="primary-btn" disabled={!localName.trim()} style={{ width: '100%' }}>
                <Plus size={20} />
                Create New Board
              </button>
            </form>
          </div>

          {/* Join Room Form */}
          <div className="home-card">
            <h3>Join an Existing Room</h3>
            <form onSubmit={(e) => handleJoinRoom(e, localName, localRoomCode)} className="modal-actions" style={{ gap: '16px' }}>
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  className="input-field"
                  required
                  maxLength={15}
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <label>Room Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit room code"
                  value={localRoomCode}
                  onChange={(e) => setLocalRoomCode(e.target.value)}
                  className="input-field"
                  required
                  autoComplete="off"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
              </div>
              <button type="submit" className="primary-btn" disabled={!localName.trim() || !localRoomCode.trim()} style={{ width: '100%' }}>
                <Users size={20} />
                Join Room
              </button>
            </form>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon-wrapper"><PenTool size={22} /></div>
            <h4>Responsive Canvas</h4>
            <p>High-resolution 1600x900 canvas resizing automatically without pixelating or erasing sketches.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon-wrapper"><Users size={22} /></div>
            <h4>Real-time Co-sketching</h4>
            <p>Draw simultaneously with teammates. See cursor indicators and live drawing statuses immediately.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon-wrapper"><Layout size={22} /></div>
            <h4>Premium Toolset</h4>
            <p>Toggle between pencils, erasers, and responsive text inputs. Adjust brush size and color tones.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderHelp = () => {
    return (
      <div className="nav-page-content animate-fade">
        <div className="home-hero" style={{ marginBottom: '32px' }}>
          <h2>Help Center & Guides</h2>
          <p>Get familiar with SyncSketch toolbelt functions, shortcuts, and collaboration mechanics.</p>
        </div>

        <div className="doc-section">
          <div className="doc-card">
            <h3>Workspace Controls</h3>
            <div className="help-grid">
              <div className="help-tool-item">
                <div className="help-tool-icon"><PenTool size={18} /></div>
                <div className="help-tool-details">
                  <h4>Pencil & Eraser</h4>
                  <p>Use the Pencil to draw clean vector paths. Swap to the Eraser to rub out coordinates on the board.</p>
                </div>
              </div>
              <div className="help-tool-item">
                <div className="help-tool-icon"><Palette size={18} /></div>
                <div className="help-tool-details">
                  <h4>Styling Palette</h4>
                  <p>Choose custom hex colors using the integrated color picker, and adapt stroke widths via the slider.</p>
                </div>
              </div>
              <div className="help-tool-item">
                <div className="help-tool-icon"><FileText size={18} /></div>
                <div className="help-tool-details">
                  <h4>Text Tool</h4>
                  <p>Select the text tool, tap anywhere on the canvas, input your description, and watch it render live on the board.</p>
                </div>
              </div>
              <div className="help-tool-item">
                <div className="help-tool-icon"><Download size={18} /></div>
                <div className="help-tool-details">
                  <h4>Download & Clear</h4>
                  <p>Export your board as a high-res PNG. Wipe the room's canvas for all users using the delete tool.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="doc-card">
            <h3>Real-time Collaboration</h3>
            <p>Each whiteboard has a unique room code. Share the code or direct room link with your collaborators to draw simultaneously. Any new user joining late will automatically receive the room's current state from active members, keeping drawings synchronized.</p>
          </div>

          {roomJoined && (
            <button className="primary-btn" onClick={() => setCurrentPage('whiteboard')} style={{ alignSelf: 'center' }}>
              Back to Whiteboard
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAbout = () => {
    return (
      <div className="nav-page-content animate-fade">
        <div className="home-hero" style={{ marginBottom: '32px' }}>
          <h2>About SyncSketch</h2>
          <p>SyncSketch is a web-based, zero-install collaborative whiteboard designed for agile planning, mockups, and quick diagrams.</p>
        </div>

        <div className="doc-section">
          <div className="doc-card">
            <h3>Our Mission</h3>
            <p>SyncSketch was created to make online visual communication as responsive and seamless as writing on a physical glass board. We leverage high-speed WebSocket connections to ensure that stroke latency is virtually non-existent, even across complex networks.</p>
          </div>

          <div className="doc-card">
            <h3>Technical Blueprint</h3>
            <p>The system is built on top of a highly responsive, event-driven architecture:</p>
            <div className="about-tech-stack">
              <span className="tech-badge">React (Vite)</span>
              <span className="tech-badge">Node.js</span>
              <span className="tech-badge">Express.js</span>
              <span className="tech-badge">Socket.IO</span>
              <span className="tech-badge">HTML5 Canvas API</span>
              <span className="tech-badge">CSS Variables</span>
            </div>
          </div>

          {roomJoined && (
            <button className="primary-btn" onClick={() => setCurrentPage('whiteboard')} style={{ alignSelf: 'center' }}>
              Back to Whiteboard
            </button>
          )}
        </div>
      </div>
    );
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="page-wrapper">
      {/* Top Header & Navbar Navigation */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">
            <Palette size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1>SyncSketch</h1>
            <span>Draw together, think together.</span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="nav-menu">
            <button 
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => handleNavClick('home')}
            >
              Home
            </button>
            {roomJoined && (
              <button 
                className={`nav-link ${currentPage === 'whiteboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('whiteboard')}
              >
                Whiteboard
              </button>
            )}
            <button 
              className={`nav-link ${currentPage === 'help' ? 'active' : ''}`}
              onClick={() => handleNavClick('help')}
            >
              Help
            </button>
            <button 
              className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
              onClick={() => handleNavClick('about')}
            >
              About
            </button>
          </nav>
        </div>

        {/* Room & Live details on whiteboard page */}
        {roomJoined && currentPage === 'whiteboard' && (
          <div className="header-center">
            <div className="room-badge">
              <span>Room:</span>
              <span className="code">{roomId}</span>
              <button className="copy-btn" onClick={handleCopyLink} title="Copy Share Link">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            <div className="connection-status">
              <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
              <span>{isConnected ? 'Live' : 'Offline'}</span>
              <span className="participant-count">({users.length})</span>
            </div>
          </div>
        )}

        {/* Right action tools */}
        <div className="header-right">
          {roomJoined && currentPage === 'whiteboard' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="leave-btn" 
                onClick={handleSaveLocally}
                style={{ borderColor: 'rgba(59,130,246,0.3)', color: 'var(--primary-blue)' }}
                title="Save Board Locally"
              >
                Save Local
              </button>
              <button className="leave-btn" onClick={handleNewBoard}>
                New Board
              </button>
            </div>
          )}
          {roomJoined && (
            <button 
              className="leave-btn" 
              onClick={handleLeaveRoom}
              style={{ backgroundColor: '#fef2f2', color: '#ef4444', borderColor: '#fee2e2' }}
            >
              <LogOut size={16} />
              Leave Room
            </button>
          )}
        </div>

        {/* Mobile Hamburger toggle */}
        <button className="hamburger-toggle" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile nav dropdown */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-dropdown animate-fade">
          <button 
            className={`mobile-nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            <Home size={18} style={{ marginRight: '10px' }} />
            Home
          </button>
          {roomJoined && (
            <button 
              className={`mobile-nav-link ${currentPage === 'whiteboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('whiteboard')}
            >
              <PenTool size={18} style={{ marginRight: '10px' }} />
              Whiteboard
            </button>
          )}
          <button 
            className={`mobile-nav-link ${currentPage === 'help' ? 'active' : ''}`}
            onClick={() => handleNavClick('help')}
          >
            <HelpCircle size={18} style={{ marginRight: '10px' }} />
            Help
          </button>
          <button 
            className={`mobile-nav-link ${currentPage === 'about' ? 'active' : ''}`}
            onClick={() => handleNavClick('about')}
          >
            <Info size={18} style={{ marginRight: '10px' }} />
            About
          </button>
          {roomJoined && currentPage === 'whiteboard' && (
            <div style={{ display: 'flex', gap: '8px', padding: '10px 14px' }}>
              <button 
                onClick={() => { handleSaveLocally(); setIsMobileMenuOpen(false); }}
                className="leave-btn"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Save
              </button>
              <button 
                onClick={() => { handleNewBoard(); setIsMobileMenuOpen(false); }}
                className="leave-btn"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                New Board
              </button>
            </div>
          )}
          {roomJoined && (
            <button 
              className="mobile-nav-link"
              onClick={() => { handleLeaveRoom(); setIsMobileMenuOpen(false); }}
              style={{ color: '#ef4444' }}
            >
              <LogOut size={18} style={{ marginRight: '10px' }} />
              Leave Room
            </button>
          )}
        </div>
      )}

      {/* Main Page Content Body router */}
      {currentPage === 'home' && renderHome()}
      {currentPage === 'help' && renderHelp()}
      {currentPage === 'about' && renderAbout()}

      {/* Whiteboard Layout Grid View */}
      {currentPage === 'whiteboard' && roomJoined && (
        <div className="app-container animate-fade">
          <Toolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            size={size}
            setSize={setSize}
            onUndo={handleUndo}
            onClear={handleClear}
            onDownload={handleDownload}
            canUndo={!!hasMyStrokes}
          />

          <Whiteboard
            socket={socket}
            roomId={roomId}
            tool={tool}
            color={color}
            size={size}
            strokes={strokes}
            setStrokes={setStrokes}
            self={self}
          />

          {/* Floating Drawing indicator */}
          {activeDrawers.length > 0 && (
            <div className="live-status-bar">
              <div className="pulse-dot" />
              <span>
                {activeDrawers.length === 1
                  ? `${activeDrawers[0].username} is drawing...`
                  : `${activeDrawers.length} collaborators drawing...`}
              </span>
            </div>
          )}

          {/* Collaborators side panel */}
          <button
            className="mobile-users-toggle"
            onClick={() => setIsUsersPanelOpen(!isUsersPanelOpen)}
          >
            <Users size={20} />
          </button>

          <UsersPanel
            users={users}
            self={self}
            isOpen={isUsersPanelOpen}
          />
        </div>
      )}

      {/* Toast popup notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </div>
  );
}
