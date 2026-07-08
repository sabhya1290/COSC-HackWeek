import React from 'react';
import { Users, PenTool } from 'lucide-react';

export default function UsersPanel({ users, self, isOpen }) {
  return (
    <aside className={`app-users-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <Users size={20} className="text-secondary" />
        <span>Collaborators ({users.length})</span>
      </div>

      <div className="users-list">
        {users.map((u) => {
          const isSelf = u.id === self?.id;
          return (
            <div key={u.id} className="user-item">
              <div className="user-info">
                {/* Colored border status indicator */}
                <div
                  className="avatar"
                  style={{
                    backgroundColor: u.color,
                    boxShadow: `0 0 0 2px ${u.color}33`
                  }}
                >
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <span className={`user-name ${isSelf ? 'self' : ''}`}>
                  {u.username}
                </span>
              </div>

              {/* Real-time drawing feedback badge */}
              {u.isDrawing && !isSelf && (
                <div className="drawing-indicator" title={`${u.username} is drawing`}>
                  <PenTool size={12} />
                  <span>drawing</span>
                  <div className="drawing-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
