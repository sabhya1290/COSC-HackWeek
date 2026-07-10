import React, { useEffect, useRef } from 'react';

function ChatArea({ 
  messages, 
  isLoading, 
  error, 
  onSuggestionClick, 
  onClearCurrentChat 
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const suggestions = [
    { title: 'Explain Recursion', desc: 'Break down programming recursion simply.', text: 'Can you explain the programming concept of recursion using a simple analogy?' },
    { title: 'Write a Python Script', desc: 'Create a file scanner utility.', text: 'Write a simple Python script that lists all files in a directory recursively.' },
    { title: 'Code Refactoring', desc: 'Clean up nested conditional checks.', text: 'How can I refactor a function with many nested if-else statements to be cleaner?' },
    { title: 'Design a CSS Layout', desc: 'Create a flexible grid system.', text: 'What is the best way to design a responsive 3-column dashboard layout in plain CSS?' }
  ];

  return (
    <div className="messages-container">
      {messages.length === 0 ? (
        <div className="welcome-screen">
          <div className="welcome-logo">🦙</div>
          <h1>Welcome to OllamaChat</h1>
          <p>
            Start a local chat session. Choose a prompt suggestion below or type your own message to begin.
          </p>
          <div className="prompt-suggestions">
            {suggestions.map((sug, idx) => (
              <div 
                key={idx} 
                className="suggestion-card"
                onClick={() => onSuggestionClick(sug.text)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSuggestionClick(sug.text);
                  }
                }}
              >
                <div className="suggestion-title">{sug.title}</div>
                <div className="suggestion-desc">{sug.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '800px', margin: '0 auto', flex: 1 }}>
          {/* Active Chat Control Header */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <button 
              className="btn-sidebar-action btn-danger"
              style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={onClearCurrentChat}
              aria-label="Clear active conversation"
            >
              🗑️ Clear Chat
            </button>
          </div>

          {messages.map((msg, index) => (
            <div key={index} className={`message-row ${msg.role}`}>
              <div className="message-bubble">
                <span className="message-sender">
                  {msg.role === 'user' ? 'You' : 'Ollama'}
                </span>
                <div className="message-content">
                  {msg.content}
                </div>
                <span className="message-time">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Thinking Loader */}
      {isLoading && (
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div className="thinking-container">
            <span className="thinking-text">Ollama is thinking</span>
            <div className="thinking-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Card */}
      {error && (
        <div className="error-card" role="alert">
          <div className="error-title">
            <span>⚠️</span> Connection Error
          </div>
          <div className="error-msg">{error}</div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatArea;
