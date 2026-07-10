import React from 'react';

function Sidebar({ 
  conversations, 
  activeChatId, 
  onSelectChat, 
  onNewChat, 
  onDeleteChat, 
  onClearAll, 
  isOpen, 
  onCloseMobileMenu 
}) {
  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} 
        onClick={onCloseMobileMenu}
      ></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon" aria-hidden="true">🦙</div>
            <h1 className="logo-text">OllamaChat</h1>
          </div>
          <button 
            className="btn-new-chat" 
            onClick={() => {
              onNewChat();
              onCloseMobileMenu();
            }}
            aria-label="Start a new chat session"
          >
            <span>+</span> New Chat
          </button>
        </div>

        <div className="chats-list-container">
          <div className="chat-history-title">Previous Chats</div>
          {conversations.length === 0 ? (
            <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No chats yet
            </div>
          ) : (
            conversations.map((chat) => (
              <div 
                key={chat.id} 
                className={`chat-history-item ${activeChatId === chat.id ? 'active' : ''}`}
                onClick={() => {
                  onSelectChat(chat.id);
                  onCloseMobileMenu();
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectChat(chat.id);
                    onCloseMobileMenu();
                  }
                }}
                aria-label={`Select chat: ${chat.title}`}
              >
                <span className="chat-item-text">{chat.title}</span>
                <button
                  className="chat-item-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  aria-label={`Delete chat: ${chat.title}`}
                  title="Delete chat"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <button 
            className="btn-sidebar-action btn-danger" 
            onClick={onClearAll}
            disabled={conversations.length === 0}
            aria-label="Delete all chat conversations"
          >
            🗑️ Clear all chats
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
