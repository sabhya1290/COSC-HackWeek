import React, { useState } from 'react';
import { Palette, Play, Plus } from 'lucide-react';

export default function RoomModal({ onJoin }) {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const generateRoomId = () => {
    // Generate a 6-digit alphanumeric uppercase code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    const newRoomId = generateRoomId();
    onJoin({ roomId: newRoomId, username: username.trim() });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!username.trim() || !roomId.trim()) return;
    onJoin({ roomId: roomId.trim().toUpperCase(), username: username.trim() });
  };

  return (
    <div className="modal-overlay animate-fade">
      <div className="modal-content animate-slide">
        <div className="modal-header">
          <div className="modal-logo">
            <Palette size={40} strokeWidth={2.5} />
          </div>
          <h2>SyncSketch</h2>
          <p>Draw together, think together.</p>
        </div>

        {!isJoining ? (
          // Create Room / Choose Join option Form
          <form onSubmit={handleCreateRoom} className="modal-actions">
            <div className="form-group">
              <label htmlFor="username-create">Display Name</label>
              <input
                id="username-create"
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                required
                maxLength={15}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={!username.trim()}
            >
              <Plus size={20} />
              Create New Board
            </button>

            <div className="action-divider">or</div>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => setIsJoining(true)}
            >
              Join Existing Room
            </button>
          </form>
        ) : (
          // Join Room Form
          <form onSubmit={handleJoinRoom} className="modal-actions">
            <div className="form-group">
              <label htmlFor="username-join">Display Name</label>
              <input
                id="username-join"
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                required
                maxLength={15}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="room-id">Room Code</label>
              <input
                id="room-id"
                type="text"
                placeholder="Enter 6-digit code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="input-field"
                required
                autoComplete="off"
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
              />
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={!username.trim() || !roomId.trim()}
            >
              <Play size={20} />
              Join Room
            </button>

            <div className="action-divider">or</div>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => setIsJoining(false)}
            >
              Go Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
