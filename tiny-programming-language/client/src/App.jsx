import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EXAMPLES = {
  hello: `# Hello World Example\nPRINT "Hello World"`,
  variables: `# Variables and Arithmetic\nLET a = 15\nLET b = 10\nLET total = (a + b) * 2 / 5\nPRINT "Variables total:"\nPRINT total`,
  ifelse: `# IF/ELSE Conditional\nLET age = 20\nIF age >= 18 THEN\n  PRINT "Access Granted: Adult"\nELSE\n  PRINT "Access Denied: Minor"\nEND`,
  loop: `# FOR Loop Example\nFOR i = 1 TO 5\n  PRINT i\nEND`,
  fizzbuzz: `# FizzBuzz Implementation\nFOR i = 1 TO 20\n  IF i % 15 == 0 THEN\n    PRINT "FizzBuzz"\n  ELSE\n    IF i % 3 == 0 THEN\n      PRINT "Fizz"\n    ELSE\n      IF i % 5 == 0 THEN\n        PRINT "Buzz"\n      ELSE\n        PRINT i\n      END\n    END\n  END\nEND`
};

function App() {
  const [code, setCode] = useState(EXAMPLES.hello);
  const [output, setOutput] = useState([]);
  const [error, setError] = useState(null);
  const [errorLine, setErrorLine] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);

  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Sync scroll of line numbers and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Generate line numbers array
  const lines = code.split('\n');
  const lineNumbers = Array.from({ length: Math.max(lines.length, 1) }, (_, i) => i + 1);

  const loadExample = (key) => {
    setCode(EXAMPLES[key]);
    setError(null);
    setErrorLine(null);
    setOutput([]);
  };

  const handleRun = async () => {
    setIsLoading(true);
    setError(null);
    setErrorLine(null);
    setOutput([]);
    const startTime = performance.now();

    try {
      const response = await fetch(`${API_URL}/api/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      setExecutionTime(((performance.now() - startTime)).toFixed(1));

      if (data.success) {
        setOutput(data.output);
      } else {
        setError(data.error);
        if (data.line !== undefined) {
          setErrorLine(data.line);
        }
      }
    } catch (err) {
      setError('Failed to connect to TinyLang backend server. Please make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setOutput([]);
    setError(null);
    setErrorLine(null);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-section">
          <span className="logo-icon">⚡</span>
          <div>
            <h1>TinyLang Studio</h1>
            <p className="subtitle">Write, run, and learn a tiny programming language.</p>
          </div>
        </div>
        <div className="header-actions">
          <button id="btn-load-hello" className="btn btn-secondary" onClick={() => loadExample('hello')}>Hello World</button>
          <button id="btn-load-variables" className="btn btn-secondary" onClick={() => loadExample('variables')}>Variables</button>
          <button id="btn-load-ifelse" className="btn btn-secondary" onClick={() => loadExample('ifelse')}>IF/ELSE</button>
          <button id="btn-load-loops" className="btn btn-secondary" onClick={() => loadExample('loop')}>Loops</button>
          <button id="btn-load-fizzbuzz" className="btn btn-primary" onClick={() => loadExample('fizzbuzz')}>FizzBuzz</button>
        </div>
      </header>

      <main className="main-content">
        <div className="editor-panel">
          <div className="panel-header">
            <h3>Editor</h3>
            <div className="editor-controls">
              <button id="btn-editor-clear" className="btn btn-clear" onClick={handleClear}>Clear</button>
              <button 
                id="btn-editor-run"
                className={`btn btn-run ${isLoading ? 'loading' : ''}`} 
                onClick={handleRun} 
                disabled={isLoading}
              >
                {isLoading ? 'Running...' : 'Run Code 🚀'}
              </button>
            </div>
          </div>
          
          <div className="editor-wrapper">
            <div className="line-numbers" ref={lineNumbersRef}>
              {lineNumbers.map((num) => (
                <div 
                  key={num} 
                  className={`line-number ${errorLine === num ? 'line-error-marker' : ''}`}
                >
                  {num}
                </div>
              ))}
            </div>
            <textarea
              id="code-editor"
              ref={textareaRef}
              className="code-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              placeholder="# Write your TinyLang code here..."
              spellCheck="false"
            />
          </div>
        </div>

        <div className="console-panel">
          <div className="panel-header">
            <h3>Console Output</h3>
            {executionTime && !error && (
              <span className="execution-time">{executionTime}ms</span>
            )}
          </div>
          
          <div className="console-body">
            {isLoading && (
              <div className="console-loader">
                <div className="spinner"></div>
                <p>Executing program on backend interpreter...</p>
              </div>
            )}
            
            {!isLoading && error && (
              <div className="console-error-box">
                <div className="error-title">⚠️ Execution Error</div>
                <div className="error-message">
                  {errorLine ? `Line ${errorLine}: ` : ''}{error}
                </div>
              </div>
            )}

            {!isLoading && !error && output.length === 0 && (
              <div className="console-empty">
                Console is empty. Click "Run Code" to see the output.
              </div>
            )}

            {!isLoading && !error && output.length > 0 && (
              <div className="console-output-lines">
                {output.map((line, idx) => (
                  <div key={idx} className="console-line">
                    <span className="console-prompt">&gt;</span> {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <section className="syntax-guide">
        <h2>📚 TinyLang Syntax Reference</h2>
        <div className="guide-grid">
          <div className="guide-card">
            <h4>Variables</h4>
            <pre>
{`LET name = "Sabhya"
LET age = 20
LET total = 10 + 5`}
            </pre>
          </div>
          <div className="guide-card">
            <h4>Print Statement</h4>
            <pre>
{`PRINT "Hello World"
PRINT name
PRINT total`}
            </pre>
          </div>
          <div className="guide-card">
            <h4>Conditionals</h4>
            <pre>
{`IF age >= 18 THEN
  PRINT "Adult"
ELSE
  PRINT "Minor"
END`}
            </pre>
          </div>
          <div className="guide-card">
            <h4>Loops</h4>
            <pre>
{`FOR i = 1 TO 5
  PRINT i
END`}
            </pre>
          </div>
          <div className="guide-card">
            <h4>Comments</h4>
            <pre>
{`# This is a comment`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
