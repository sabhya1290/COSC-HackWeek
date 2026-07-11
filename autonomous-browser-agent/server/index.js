import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import taskRoutes from './routes/tasks.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
app.set('port', PORT);

// Configure CORS to allow frontend requests
app.use(cors());

// Body parser
app.use(express.json());

// Serve static assets (mock pages, screens)
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', taskRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'An internal server error occurred.' });
});

// Start the Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🤖 Autonomous Browser Agent Backend running`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`🔗 Mock Pages: http://localhost:${PORT}/demo/`);
  console.log(`==================================================`);
});
