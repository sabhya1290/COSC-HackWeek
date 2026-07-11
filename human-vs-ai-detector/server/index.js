const express = require('express');
const cors = require('cors');
const path = require('path');
const questionsRouter = require('./routes/questions');
const leaderboardRouter = require('./routes/leaderboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend connection
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// API Routes
app.use('/api', questionsRouter);
app.use('/api', leaderboardRouter);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', time: new Date() });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
