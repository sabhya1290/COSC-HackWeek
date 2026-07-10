import React from 'react';

function Header({ modelName, onToggleTheme, theme, onToggleMobileMenu }) {
  return (
    <header className="chat-header">
      <div className="header-left">
        <button 
          className="mobile-menu-btn" 
          onClick={onToggleMobileMenu}
          aria-label="Toggle sidebar menu"
        >
          ☰
        </button>
        <div className="model-info">
          <span className="model-label">Model:</span>
          <span className="model-name">{modelName}</span>
        </div>
      </div>
      <div className="header-right">
        <div className="status-badge" role="status">
          <span className="status-dot"></span>
          <span>Local Ollama</span>
        </div>
        <button 
          className="theme-toggle-btn" 
          onClick={onToggleTheme} 
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}

export default Header;
