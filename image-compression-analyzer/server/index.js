import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import compressRouter from './routes/compress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure directories exist
const uploadDir = path.join(__dirname, 'uploads');
const compressedDir = path.join(__dirname, 'compressed');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(compressedDir)) {
  fs.mkdirSync(compressedDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Serve static directories
app.use('/uploads', express.static(uploadDir));
app.use('/compressed', express.static(compressedDir));

// API Routes
app.use('/compress', compressRouter);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
