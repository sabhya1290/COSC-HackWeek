const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const OLLAMA_API_URL = 'http://localhost:11434/api/chat';

// Middleware
app.use(cors());
app.use(express.json());

// Chat POST endpoint
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message && (!history || history.length === 0)) {
    return res.status(400).json({ error: 'Message or history is required.' });
  }

  // Format messages list for Ollama
  // Combines previous conversation history with the new user message
  const messages = [...(history || [])];
  if (message) {
    messages.push({ role: 'user', content: message });
  }

  try {
    // Send request to locally running Ollama
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: messages,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.message && data.message.content) {
      return res.json({
        message: data.message.content,
        role: 'assistant',
        model: OLLAMA_MODEL
      });
    } else {
      throw new Error('Invalid response structure received from Ollama.');
    }
  } catch (error) {
    console.error('Error talking to Ollama:', error.message);
    
    // Provide user-friendly troubleshooting suggestions
    let friendlyMessage = 'An unexpected error occurred while communicating with the AI model.';
    
    if (error.message.includes('fetch failed') || error.code === 'ECONNREFUSED') {
      friendlyMessage = 'Unable to connect to Ollama. Please make sure Ollama is running locally on your machine (run "ollama serve" or open the Ollama app).';
    } else if (error.message.includes('404')) {
      friendlyMessage = `The model "${OLLAMA_MODEL}" could not be found. Please pull it first by running "ollama pull ${OLLAMA_MODEL}" in your terminal.`;
    } else {
      friendlyMessage = `Error: ${error.message}`;
    }

    return res.status(503).json({ error: friendlyMessage });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: OLLAMA_MODEL });
});

app.listen(PORT, () => {
  console.log(`OllamaChat backend server is running on port ${PORT}`);
  console.log(`Configured Ollama Model: ${OLLAMA_MODEL}`);
});
