import React, { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SUGGESTED_TASKS = [
  {
    title: "1. Search Wikipedia (AI)",
    prompt: "Search Wikipedia for \"Artificial Intelligence\" and extract the first paragraph"
  },
  {
    title: "2. Search MDN (Fetch API)",
    prompt: "Search MDN for \"JavaScript fetch API\" and extract the page title"
  },
  {
    title: "3. Submit Contact Form",
    prompt: "Fill a local/demo contact form with sample name, email, and message"
  },
  {
    title: "4. Product Comparison",
    prompt: "Compare three sample products from a mock shopping page"
  },
  {
    title: "5. example.com Scrape",
    prompt: "Visit example.com and extract the heading and paragraph"
  },
  {
    title: "6. Book Appointment",
    prompt: "Book a dummy appointment on the local booking website for Jane Smith on 2026-10-15"
  }
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | planning | queued | running | completed | failed
  const [plan, setPlan] = useState([]);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState({});
  const [screenshots, setScreenshots] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [history, setHistory] = useState([]);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const logsContainerRef = useRef(null);
  const pollingRef = useRef(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('agentflow_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Scroll to bottom of logs when they update
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Set up polling when active
  useEffect(() => {
    if (taskId && (status === 'planning' || status === 'queued' || status === 'running')) {
      pollingRef.current = setInterval(() => {
        pollTaskStatus(taskId);
      }, 1000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [taskId, status]);

  const pollTaskStatus = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`);
      if (!res.ok) throw new Error('Task lookup failed.');
      
      const data = await res.json();
      
      setStatus(data.status);
      setPlan(data.plan || []);
      setLogs(data.logs || []);
      setResults(data.results || {});
      setScreenshots(data.screenshots || []);

      // If finished, save to history
      if (data.status === 'completed' || data.status === 'failed') {
        saveToHistory(data);
      }
    } catch (err) {
      console.error('Error polling task:', err);
    }
  };

  const saveToHistory = (taskData) => {
    setHistory((prevHistory) => {
      // Avoid duplicate history items
      const filtered = prevHistory.filter(item => item.id !== taskData.id);
      const updated = [
        {
          id: taskData.id,
          prompt: taskData.prompt,
          status: taskData.status,
          timestamp: new Date().toLocaleTimeString()
        },
        ...filtered
      ].slice(0, 15); // limit to 15 items

      localStorage.setItem('agentflow_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleGeneratePlan = async () => {
    if (!prompt.trim()) {
      setError('Please enter a task description.');
      return;
    }

    setLoading(true);
    setError(null);
    setPlan([]);
    setLogs([]);
    setResults({});
    setScreenshots([]);
    setConfirmed(false);
    setStatus('planning');

    try {
      const res = await fetch(`${API_BASE}/api/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) throw new Error('Failed to generate execution steps. Server may be down.');

      const data = await res.json();
      setTaskId(data.id);
      setPlan(data.plan);
      setStatus(data.status);
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAgent = async () => {
    if (!confirmed) {
      setError('You must confirm the safety warning before executing automation.');
      return;
    }

    if (!taskId) return;

    setError(null);
    setStatus('running');

    try {
      const res = await fetch(`${API_BASE}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, plan })
      });

      if (!res.ok) throw new Error('Failed to start Playwright runner.');
    } catch (err) {
      setError(err.message);
      setStatus('failed');
    }
  };

  const handleSelectSuggested = (selectedPrompt) => {
    setPrompt(selectedPrompt);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('agentflow_history');
    setHistory([]);
  };

  const handleLoadHistoryItem = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`);
      if (!res.ok) throw new Error('Could not load historical task.');
      
      const data = await res.json();
      setTaskId(data.id);
      setPrompt(data.prompt);
      setPlan(data.plan || []);
      setLogs(data.logs || []);
      setResults(data.results || {});
      setScreenshots(data.screenshots || []);
      setStatus(data.status);
      setConfirmed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!taskId) return;

    const reportContent = {
      taskId,
      prompt,
      status,
      plan,
      logs,
      results,
      screenshots: screenshots.map(src => `${API_BASE}${src}`)
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportContent, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `agent_report_${taskId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="glass-panel app-header">
        <div className="brand-section">
          <div className="logo-icon">A</div>
          <div>
            <h1 className="brand-title">AgentFlow</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Autonomous Browser Agent</p>
          </div>
        </div>
        <div>
          <span className="badge-demo">Demo Mode</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Control Panel */}
        <div className="sidebar-panel">
          {/* Prompt Entry Card */}
          <div className="glass-panel">
            <h3 className="section-title">New Task</h3>
            <textarea
              className="task-textarea"
              placeholder="e.g., Search Wikipedia for 'Artificial Intelligence' and extract the first paragraph..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={status === 'running' || status === 'planning'}
            />

            <h4 style={{ margin: '15px 0 5px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Suggested Tasks:</h4>
            <div className="suggested-tasks">
              {SUGGESTED_TASKS.map((t, idx) => (
                <div
                  key={idx}
                  className="task-card"
                  onClick={() => (status !== 'running' && status !== 'planning') && handleSelectSuggested(t.prompt)}
                >
                  <strong>{t.title}</strong>
                  <p style={{ fontSize: '11px', marginTop: '3px' }}>{t.prompt.substring(0, 50)}...</p>
                </div>
              ))}
            </div>

            <button
              className="btn-primary"
              onClick={handleGeneratePlan}
              disabled={loading || status === 'running' || status === 'planning' || !prompt.trim()}
            >
              {status === 'planning' ? 'Generating Plan...' : 'Generate Plan'}
            </button>
            {error && <p style={{ color: 'var(--error-color)', fontSize: '13px', marginTop: '10px' }}>⚠️ {error}</p>}
          </div>

          {/* History Log Card */}
          <div className="glass-panel history-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="section-title" style={{ margin: 0 }}>Task History</h3>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  style={{ background: 'none', border: 'none', color: 'var(--error-color)', fontSize: '12px', cursor: 'pointer' }}
                >
                  Clear History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>
                <span className="empty-icon">⏳</span>
                <p style={{ fontSize: '12px' }}>No previous execution logs.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="history-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => (status !== 'running' && status !== 'planning') && handleLoadHistoryItem(item.id)}
                  >
                    <div>
                      <p className="history-prompt" title={item.prompt}>{item.prompt}</p>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.timestamp}</span>
                    </div>
                    <span className={`history-status status-${item.status}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Main Panel */}
        <div className="main-content">
          {/* Status Indicator */}
          <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
            <div className="live-status-indicator">
              <span className={`status-dot ${status === 'running' || status === 'planning' ? 'active' : status}`} />
              <span>Agent Status: <strong style={{ textTransform: 'uppercase', color: 'var(--text-primary)' }}>{status}</strong></span>
            </div>
            {taskId && (status === 'completed' || status === 'failed') && (
              <button className="btn-secondary" style={{ width: 'auto', padding: '8px 16px' }} onClick={handleDownloadReport}>
                Download Report 📥
              </button>
            )}
          </div>

          {/* Plan Execution Panel */}
          <div className="glass-panel plan-section">
            <h3 className="section-title">Execution Steps</h3>
            {plan.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📝</span>
                <p>Enter a task prompt and generate a plan to view automation steps.</p>
              </div>
            ) : (
              <>
                <div className="steps-list">
                  {plan.map((step, idx) => (
                    <div key={idx} className={`step-item ${step.status}`}>
                      <div className="step-number">{idx + 1}</div>
                      <div className="step-description">
                        <p style={{ fontWeight: '500' }}>{step.description}</p>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {step.url && `URL: ${step.url}`}
                          {step.selector && `Selector: ${step.selector}`}
                          {step.value && ` | Value: ${step.value}`}
                        </span>
                      </div>
                      <span className="step-action-badge">{step.action}</span>
                    </div>
                  ))}
                </div>

                {status === 'queued' && (
                  <>
                    <div className="confirmation-box">
                      <input
                        type="checkbox"
                        id="safety-confirm"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                      />
                      <label htmlFor="safety-confirm">
                        <strong>Demo Mode Disclaimer:</strong> I understand this executes mock browser operations locally using Playwright and respects domain restrictions.
                      </label>
                    </div>

                    <button
                      className="btn-primary btn-success"
                      disabled={!confirmed}
                      onClick={handleRunAgent}
                    >
                      Run Playwright Agent
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Results Gallery and Logs */}
          {(status === 'running' || status === 'completed' || status === 'failed' || logs.length > 0) && (
            <div className="results-container">
              {/* Execution Logs */}
              <div className="glass-panel logs-panel">
                <h3 className="section-title">Execution Logs</h3>
                <div className="logs-stream" ref={logsContainerRef}>
                  {logs.map((log, idx) => (
                    <div key={idx} className={`log-entry ${log.type}`}>
                      <span className="log-time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className="log-msg">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scraped Results & Screen captures */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 className="section-title">Extracted Output</h3>
                
                {Object.keys(results).length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No data extracted yet.</p>
                ) : (
                  <div className="extracted-data-card">
                    {Object.entries(results).map(([key, val]) => (
                      <div key={key} className="extracted-data-item">
                        <div className="extracted-label">{key.replace(/_/g, ' ')}</div>
                        <div className="extracted-value">{val}</div>
                      </div>
                    ))}
                  </div>
                )}

                <h3 className="section-title" style={{ marginTop: '10px' }}>Screenshots</h3>
                {screenshots.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No screenshots captured yet.</p>
                ) : (
                  <div className="screenshot-gallery">
                    {screenshots.map((src, idx) => (
                      <div
                        key={idx}
                        className="screenshot-item"
                        onClick={() => setLightboxSrc(`${API_BASE}${src}`)}
                      >
                        <img src={`${API_BASE}${src}`} alt={`Step ${idx + 1}`} />
                        <div className="screenshot-label">Step {idx + 1}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxSrc && (
        <div className="lightbox" onClick={() => setLightboxSrc(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxSrc(null)}>×</button>
            <img src={lightboxSrc} alt="Preview Screenshot" />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
