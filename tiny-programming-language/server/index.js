const express = require('express');
const cors = require('cors');
const { runTinyLang } = require('./interpreter');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main run endpoint
app.post('/api/run', (req, res) => {
  const { code } = req.body;
  if (typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'Source code is required' });
  }

  const result = runTinyLang(code);
  res.json(result);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', language: 'TinyLang' });
});

app.listen(PORT, () => {
  console.log(`TinyLang backend server running on port ${PORT}`);
});
