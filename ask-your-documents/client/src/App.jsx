import React, { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  // Application state
  const [documents, setDocuments] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // UI states
  const [expandedSources, setExpandedSources] = useState({});
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Load documents and chat history on mount
  useEffect(() => {
    fetchDocuments();
    const storedChat = localStorage.getItem('documind_chat_history');
    if (storedChat) {
      try {
        setChatHistory(JSON.parse(storedChat));
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isSending]);

  // Persist chat history to localStorage
  const saveChatHistory = (history) => {
    setChatHistory(history);
    localStorage.setItem('documind_chat_history', JSON.stringify(history));
  };

  // Fetch documents from server
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents list.');
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Handle file uploads
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    // Check extension
    const validFiles = Array.from(files).filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return ext === 'pdf' || ext === 'txt' || ext === 'md' || ext === 'json';
    });

    if (validFiles.length === 0) {
      setErrorMessage('Please select only PDF, TXT, MD, or JSON files.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    validFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${API_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload files.');
      }

      // Check if there are any parsing errors
      const failedUploads = data.files.filter(f => f.status === 'error');
      if (failedUploads.length > 0) {
        const errorList = failedUploads.map(f => `${f.name}: ${f.error}`).join(', ');
        setErrorMessage(`Some files failed parsing: ${errorList}`);
      }

      await fetchDocuments();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
  };

  // Drag & drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Delete document
  const handleDeleteDocument = async (id, name) => {
    setErrorMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/documents/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete document.');
      }
      await fetchDocuments();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Clear all documents
  const handleClearAllDocuments = async () => {
    setErrorMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/documents/clear`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to clear documents.');
      setDocuments([]);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend) => {
    const msgText = textToSend || currentMessage;
    if (!msgText.trim() || isSending) return;

    // Check if at least one document is ready
    const hasReadyDoc = documents.some(d => d.status === 'ready');
    if (!hasReadyDoc) {
      setErrorMessage('Please upload a valid document first.');
      return;
    }

    const newUserMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatHistory, newUserMessage];
    saveChatHistory(updatedHistory);
    setCurrentMessage('');
    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: msgText })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get a response from Ollama.');
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        excerpts: data.excerpts || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      saveChatHistory([...updatedHistory, assistantMessage]);
    } catch (err) {
      setErrorMessage(err.message);
      // Remove sending state or add error placeholder
    } finally {
      setIsSending(false);
      // Focus input again
      setTimeout(() => chatInputRef.current?.focus(), 50);
    }
  };

  // Textarea Enter handler
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle sources drawer
  const toggleSourceExcerpts = (msgId) => {
    setExpandedSources(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  // Clear chat history
  const handleClearChat = () => {
    saveChatHistory([]);
    setShowClearChatConfirm(false);
  };

  // Sample suggestions helper
  const suggestions = [
    "Summarize the main points of this document.",
    "What are the key conclusions or takeaways?",
    "Can you find any dates or project timelines mentioned?",
    "Who are the key people or stakeholders involved?"
  ];

  const hasDocuments = documents.some(d => d.status === 'ready');

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">D</div>
          <div className="header-title-group">
            <h1>DocuMind</h1>
            <p>Ask questions from your documents</p>
          </div>
        </div>
        
        <div className="badge">
          <span className="badge-pulse"></span>
          Local AI Active
        </div>
      </header>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="alert-banner" role="alert">
          <span><strong>Error:</strong> {errorMessage}</span>
          <button className="alert-close" onClick={() => setErrorMessage(null)} aria-label="Dismiss error">
            &times;
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <main className="main-layout">
        {/* Left Sidebar */}
        <aside className="sidebar">
          {/* Upload Area */}
          <div className="sidebar-section">
            <span className="section-title">Upload Documents</span>
            <div 
              className={`upload-zone ${isDragging ? 'dragging' : ''}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              aria-label="Upload files by dragging and dropping here, or click to browse"
            >
              <div className="upload-icon">📤</div>
              <p>{isUploading ? 'Uploading...' : 'Drag & Drop documents here'}</p>
              <span>Supports PDF, TXT, MD, JSON (Max 10MB)</span>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="file-input" 
                multiple
                accept=".pdf,.txt,.md,.json"
              />
            </div>
            
            <button 
              className="btn btn-primary"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? 'Uploading...' : 'Choose Files'}
            </button>
          </div>

          {/* Document List */}
          <div className="sidebar-section">
            <span className="section-title">Documents ({documents.length})</span>
            
            {documents.length === 0 ? (
              <div className="empty-sidebar-state">
                No documents uploaded yet. Upload a TXT, PDF, MD, or JSON file to start.
              </div>
            ) : (
              <div className="doc-list">
                {documents.map(doc => (
                  <div key={doc.id} className="doc-item">
                    <div className="doc-info">
                      <span className="doc-name" title={doc.name}>{doc.name}</span>
                      <div className="doc-meta">
                        <span>{doc.size}</span>
                        <span className={`doc-status-badge ${doc.status}`}>
                          {doc.status}
                        </span>
                      </div>
                      {doc.error && (
                        <span className="doc-meta" style={{ color: 'var(--accent-error)', fontSize: '0.65rem' }}>
                          {doc.error}
                        </span>
                      )}
                    </div>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleDeleteDocument(doc.id, doc.name)}
                      aria-label={`Delete ${doc.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            {documents.length > 0 && (
              <button 
                className="btn btn-danger" 
                style={{ marginTop: '0.5rem' }} 
                onClick={handleClearAllDocuments}
              >
                Clear All Documents
              </button>
            )}
          </div>
        </aside>

        {/* Right Chat Area */}
        <section className="chat-container">
          {/* Suggestions header if documents are present */}
          {hasDocuments && chatHistory.length === 0 && (
            <div className="suggestions-container">
              <span className="section-title" style={{ width: '100%', marginBottom: '0.25rem' }}>
                Try asking:
              </span>
              {suggestions.map((suggestion, idx) => (
                <button 
                  key={idx} 
                  className="suggestion-chip"
                  onClick={() => handleSendMessage(suggestion)}
                  disabled={isSending}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Messages Viewport */}
          <div className="messages-viewport">
            {chatHistory.length === 0 ? (
              <div className="welcome-overlay">
                <div className="welcome-logo">DocuMind</div>
                <h2>Ask questions from your documents</h2>
                <p>
                  DocuMind uses your local computer to analyze, search, and answer questions about your files. 
                  All processing stays private on your local machine.
                </p>
                <div className="welcome-steps">
                  <div className="welcome-step">
                    <span className="step-num">1</span>
                    <span className="step-desc">Upload documents in PDF, TXT, MD, or JSON format using the sidebar.</span>
                  </div>
                  <div className="welcome-step">
                    <span className="step-num">2</span>
                    <span className="step-desc">Wait for status to show "ready" for successfully parsed files.</span>
                  </div>
                  <div className="welcome-step">
                    <span className="step-num">3</span>
                    <span className="step-desc">Type your question below and hit send. DocuMind will read sources and reply.</span>
                  </div>
                </div>
              </div>
            ) : (
              chatHistory.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.role}`}>
                  <div className="message-bubble">
                    <div className="message-meta">
                      <span>{msg.role === 'user' ? 'You' : 'DocuMind'}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                    {/* Sources section for Assistant messages */}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="sources-section">
                        <div className="sources-header">
                          <span>Sources:</span>
                          <div className="source-chips">
                            {msg.sources.map((src, sIdx) => (
                              <span key={sIdx} className="source-chip">{src}</span>
                            ))}
                          </div>
                        </div>

                        {msg.excerpts && msg.excerpts.length > 0 && (
                          <>
                            <button 
                              className="sources-toggle" 
                              onClick={() => toggleSourceExcerpts(msg.id)}
                            >
                              {expandedSources[msg.id] ? '▼ Hide source details' : '▶ View source details'}
                            </button>
                            
                            {expandedSources[msg.id] && (
                              <div className="sources-drawer">
                                {msg.excerpts.map((exc, eIdx) => (
                                  <div key={eIdx} className="source-excerpt">
                                    <div className="excerpt-meta">
                                      {exc.docName} (Similarity: {(exc.score * 100).toFixed(1)}%)
                                    </div>
                                    <div>"{exc.text}"</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isSending && (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <span>Searching your documents & generating response...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Panel */}
          <div className="chat-input-panel">
            <div className={`chat-input-wrapper ${!hasDocuments ? 'disabled' : ''}`}>
              <textarea
                ref={chatInputRef}
                className="chat-input"
                placeholder={hasDocuments ? "Ask a question about your documents..." : "Upload documents to enable chat..."}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!hasDocuments || isSending}
                rows={1}
                aria-label="Chat input"
              />
              <div className="chat-actions">
                {chatHistory.length > 0 && (
                  <button 
                    className="btn-icon" 
                    title="Clear chat history"
                    onClick={() => setShowClearChatConfirm(true)}
                    aria-label="Clear chat"
                  >
                    🧹
                  </button>
                )}
                <button
                  className="btn-send"
                  onClick={() => handleSendMessage()}
                  disabled={!hasDocuments || isSending || !currentMessage.trim()}
                  aria-label="Send message"
                >
                  ➔
                </button>
              </div>
            </div>
            <div className="chat-input-note">
              Enter to send, Shift + Enter for new line. Powered by local Ollama.
            </div>
          </div>
        </section>
      </main>

      {/* Confirmation Modal */}
      {showClearChatConfirm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 className="modal-title">Clear Chat History?</h3>
            <p className="modal-body">
              Are you sure you want to clear your current conversation history? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowClearChatConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleClearChat}>
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
