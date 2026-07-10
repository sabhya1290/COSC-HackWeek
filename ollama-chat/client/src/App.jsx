import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Composer from './components/Composer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  // Application State
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('ollama_chats');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeChatId, setActiveChatId] = useState(() => {
    return localStorage.getItem('ollama_active_chat') || null;
  });

  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelName, setModelName] = useState('llama3.2');
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('ollama_theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  // UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmClearChat, setConfirmClearChat] = useState(false);

  // Sync conversations to localStorage
  useEffect(() => {
    localStorage.setItem('ollama_chats', JSON.stringify(conversations));
  }, [conversations]);

  // Sync activeChatId to localStorage
  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem('ollama_active_chat', activeChatId);
    } else {
      localStorage.removeItem('ollama_active_chat');
    }
  }, [activeChatId]);

  // Sync theme class to body
  useEffect(() => {
    localStorage.setItem('ollama_theme', theme);
    const bodyClass = document.body.classList;
    if (theme === 'light') {
      bodyClass.add('light-theme');
    } else {
      bodyClass.remove('light-theme');
    }
  }, [theme]);

  // Fetch model name on startup
  useEffect(() => {
    async function checkBackendHealth() {
      try {
        const res = await fetch(`${API_URL}/api/health`);
        if (res.ok) {
          const data = await res.json();
          if (data.model) {
            setModelName(data.model);
          }
        }
      } catch (err) {
        console.warn('Backend server is not reachable yet, using fallback model name.');
      }
    }
    checkBackendHealth();
  }, []);

  // Theme Toggler
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Create a new Chat session
  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      messages: []
    };
    setConversations(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setError(null);
  };

  // Get active conversation messages
  const activeChat = conversations.find(c => c.id === activeChatId);
  const messages = activeChat ? activeChat.messages : [];

  // Handle Sending a Message
  const handleSendMessage = async (textToSend = null) => {
    const rawMessage = textToSend || messageInput;
    if (!rawMessage.trim()) return;

    setError(null);
    setIsLoading(true);

    let currentChatId = activeChatId;
    let updatedConversations = [...conversations];

    // If there is no active chat session, create one automatically
    if (!currentChatId) {
      const newChat = {
        id: Date.now().toString(),
        title: rawMessage.substring(0, 30) + (rawMessage.length > 30 ? '...' : ''),
        messages: []
      };
      updatedConversations = [newChat, ...updatedConversations];
      currentChatId = newChat.id;
      setActiveChatId(newChat.id);
    }

    // Find the targeted conversation
    const targetChatIndex = updatedConversations.findIndex(c => c.id === currentChatId);
    if (targetChatIndex === -1) {
      setIsLoading(false);
      return;
    }

    const targetChat = updatedConversations[targetChatIndex];

    // Append the User Message
    const userMessage = {
      role: 'user',
      content: rawMessage,
      timestamp: new Date().toISOString()
    };

    // Update conversation title if this is the first message
    const isFirstMessage = targetChat.messages.length === 0;
    if (isFirstMessage) {
      targetChat.title = rawMessage.substring(0, 30) + (rawMessage.length > 30 ? '...' : '');
    }

    targetChat.messages = [...targetChat.messages, userMessage];
    setConversations(updatedConversations);
    if (!textToSend) {
      setMessageInput('');
    }

    try {
      // API call to our local backend
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: rawMessage,
          history: targetChat.messages.slice(0, -1).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server returned an error');
      }

      const responseData = await response.json();

      // Append Ollama Assistant response
      const assistantMessage = {
        role: 'assistant',
        content: responseData.message,
        timestamp: new Date().toISOString()
      };

      // Reload list state to append the assistant bubble
      setConversations(prev => {
        return prev.map(chat => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: [...chat.messages, assistantMessage]
            };
          }
          return chat;
        });
      });

    } catch (err) {
      setError(err.message || 'Unable to communicate with the chat backend.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicking on suggestion cards
  const handleSuggestionClick = (promptText) => {
    handleSendMessage(promptText);
  };

  // Individual chat deletion handlers
  const requestDeleteChat = (id) => {
    setConfirmDeleteId(id);
  };

  const confirmDeleteChat = () => {
    setConversations(prev => prev.filter(c => c.id !== confirmDeleteId));
    if (activeChatId === confirmDeleteId) {
      setActiveChatId(null);
    }
    setConfirmDeleteId(null);
  };

  // Current chat conversation deletion
  const requestClearCurrentChat = () => {
    if (activeChatId) {
      setConfirmClearChat(true);
    }
  };

  const confirmClearCurrentChat = () => {
    setConversations(prev => {
      return prev.map(chat => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: [] };
        }
        return chat;
      });
    });
    setError(null);
    setConfirmClearChat(false);
  };

  // Clear all conversations handlers
  const requestClearAll = () => {
    setConfirmClearAll(true);
  };

  const confirmClearAllChats = () => {
    setConversations([]);
    setActiveChatId(null);
    setError(null);
    setConfirmClearAll(false);
  };

  return (
    <div className="app-container">
      <Sidebar
        conversations={conversations}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={createNewChat}
        onDeleteChat={requestDeleteChat}
        onClearAll={requestClearAll}
        isOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      <main className="main-chat">
        <Header
          modelName={modelName}
          onToggleTheme={toggleTheme}
          theme={theme}
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        />

        <ChatArea
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSuggestionClick={handleSuggestionClick}
          onClearCurrentChat={requestClearCurrentChat}
        />

        <Composer
          value={messageInput}
          onChange={setMessageInput}
          onSend={() => handleSendMessage()}
          isLoading={isLoading}
        />
      </main>

      {/* CONFIRM DELETE INDIVIDUAL CHAT MODAL */}
      {confirmDeleteId && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2 className="modal-title">Delete Conversation?</h2>
            <p className="modal-desc">
              This action cannot be undone. The selected conversation will be permanently deleted.
            </p>
            <div className="modal-actions">
              <button className="btn-modal cancel" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button className="btn-modal confirm" onClick={confirmDeleteChat}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR ACTIVE CONVERSATION MODAL */}
      {confirmClearChat && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2 className="modal-title">Clear Current Conversation?</h2>
            <p className="modal-desc">
              This action will delete all messages in this conversation. The chat history title will be preserved.
            </p>
            <div className="modal-actions">
              <button className="btn-modal cancel" onClick={() => setConfirmClearChat(false)}>
                Cancel
              </button>
              <button className="btn-modal confirm" onClick={confirmClearCurrentChat}>
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR ALL MODAL */}
      {confirmClearAll && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2 className="modal-title">Clear All Conversations?</h2>
            <p className="modal-desc">
              This action cannot be undone. All saved chat conversations in localStorage will be permanently erased.
            </p>
            <div className="modal-actions">
              <button className="btn-modal cancel" onClick={() => setConfirmClearAll(false)}>
                Cancel
              </button>
              <button className="btn-modal confirm" onClick={confirmClearAllChats}>
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
