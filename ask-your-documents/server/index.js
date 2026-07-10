require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parseDocument } = require('./utils/parser');
const { chunkText } = require('./utils/chunker');
const { retrieveChunks } = require('./services/retrieval');
const { generateAnswer } = require('./services/ollama');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Set up Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (ext === 'pdf' || ext === 'txt' || ext === 'md' || ext === 'json') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, MD, and JSON files are allowed.'));
    }
  }
});

// In-memory database
let documents = [];
let chunks = [];

// Helper to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// GET /api/documents
app.get('/api/documents', (req, res) => {
  try {
    const docsSummary = documents.map(d => ({
      id: d.id,
      name: d.name,
      size: formatBytes(d.size),
      status: d.status,
      error: d.error || null
    }));
    res.json(docsSummary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/documents/upload
app.post('/api/documents/upload', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }

  const results = [];
  
  for (const file of req.files) {
    const docId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
    
    try {
      const parsedText = await parseDocument(file.buffer, file.originalname);
      
      // Save doc
      const newDoc = {
        id: docId,
        name: file.originalname,
        size: file.size,
        text: parsedText,
        status: 'ready'
      };
      documents.push(newDoc);

      // Create chunks
      const docChunks = chunkText(parsedText).map(text => ({
        docId,
        docName: file.originalname,
        text
      }));
      chunks.push(...docChunks);

      results.push({
        id: docId,
        name: file.originalname,
        status: 'ready'
      });
    } catch (error) {
      // Log parsing error but save record as status: error
      const failedDoc = {
        id: docId,
        name: file.originalname,
        size: file.size,
        text: '',
        status: 'error',
        error: error.message
      };
      documents.push(failedDoc);
      
      results.push({
        id: docId,
        name: file.originalname,
        status: 'error',
        error: error.message
      });
    }
  }

  res.json({
    message: 'Upload completed',
    files: results
  });
});

// DELETE /api/documents/:id
app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const docIndex = documents.findIndex(d => d.id === id);
  
  if (docIndex === -1) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  // Remove chunks associated with this doc
  chunks = chunks.filter(c => c.docId !== id);
  // Remove document
  documents.splice(docIndex, 1);

  res.json({ message: 'Document deleted successfully.' });
});

// POST /api/documents/clear
app.post('/api/documents/clear', (req, res) => {
  documents = [];
  chunks = [];
  res.json({ message: 'All documents cleared.' });
});

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  if (documents.filter(d => d.status === 'ready').length === 0) {
    return res.status(400).json({ error: 'Please upload at least one valid document before asking questions.' });
  }

  try {
    // Retrieve top 3 chunks
    const relevantChunks = retrieveChunks(message, chunks, 3);
    
    // Call Ollama
    const answer = await generateAnswer(message, relevantChunks);
    
    // Extract unique source document names
    const sources = [...new Set(relevantChunks.map(c => c.docName))];
    const excerpts = relevantChunks.map(c => ({
      docName: c.docName,
      text: c.text,
      score: c.score
    }));

    res.json({
      answer,
      sources,
      excerpts
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the 10MB limit.' });
    }
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`DocuMind backend running on port ${PORT}`);
});
