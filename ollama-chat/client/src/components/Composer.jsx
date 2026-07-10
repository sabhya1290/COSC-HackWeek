import React, { useRef, useEffect } from 'react';

function Composer({ value, onChange, onSend, isLoading }) {
  const textareaRef = useRef(null);

  // Auto-resize textarea heights based on input size
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSend();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSend();
      }
    }
  };

  return (
    <div className="composer-container">
      <form onSubmit={handleSubmit} className="composer-form">
        <textarea
          ref={textareaRef}
          className="composer-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message to Ollama..."
          rows={1}
          disabled={isLoading}
          aria-label="Write a message to Ollama"
        />
        <button
          type="submit"
          className="btn-send"
          disabled={!value.trim() || isLoading}
          aria-label="Send message"
          title="Send message"
        >
          ➔
        </button>
      </form>
    </div>
  );
}

export default Composer;
