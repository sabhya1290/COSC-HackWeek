const fs = require('fs');
const path = require('path');

const leaderboardFilePath = path.join(__dirname, '../data/leaderboard.json');
const statsFilePath = path.join(__dirname, '../data/stats.json');

// Helper to read leaderboard
const readLeaderboard = () => {
  try {
    if (!fs.existsSync(leaderboardFilePath)) return [];
    const data = fs.readFileSync(leaderboardFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading leaderboard:', err);
    return [];
  }
};

// Helper to write leaderboard
const writeLeaderboard = (leaderboard) => {
  try {
    fs.writeFileSync(leaderboardFilePath, JSON.stringify(leaderboard, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing leaderboard:', err);
    return false;
  }
};

// GET /api/leaderboard
exports.getLeaderboard = (req, res) => {
  const leaderboard = readLeaderboard();
  
  // Sort by score descending, then accuracy descending, then date descending
  const sorted = leaderboard.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return new Date(b.date) - new Date(a.date);
  });

  // Limit to top 50 entries
  res.json(sorted.slice(0, 50));
};

// POST /api/leaderboard
exports.addLeaderboardEntry = (req, res) => {
  const { name, score, accuracy, difficulty, bestStreak } = req.body;

  if (!name || score === undefined || accuracy === undefined) {
    return res.status(400).json({ error: 'Missing name, score, or accuracy' });
  }

  const leaderboard = readLeaderboard();
  
  const newEntry = {
    id: Date.now(),
    name: name.trim().substring(0, 20),
    score: Number(score),
    accuracy: Number(accuracy),
    difficulty: difficulty || 'Medium',
    bestStreak: Number(bestStreak) || 0,
    date: new Date().toISOString()
  };

  leaderboard.push(newEntry);
  
  if (writeLeaderboard(leaderboard)) {
    res.status(201).json({ message: 'Leaderboard entry added successfully', entry: newEntry });
  } else {
    res.status(500).json({ error: 'Failed to write leaderboard entry' });
  }
};

// GET /api/stats
exports.getStats = (req, res) => {
  try {
    if (!fs.existsSync(statsFilePath)) {
      return res.status(404).json({ error: 'Stats file not found' });
    }
    const data = fs.readFileSync(statsFilePath, 'utf8');
    const stats = JSON.parse(data);

    // Calculate average accuracy
    const avgAccuracy = stats.totalAnswers > 0 
      ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100) 
      : 0;

    res.json({
      gamesPlayed: stats.gamesPlayed || 0,
      totalAnswers: stats.totalAnswers || 0,
      correctAnswers: stats.correctAnswers || 0,
      averageAccuracy: avgAccuracy,
      favoriteCategory: stats.favoriteCategory || 'Mixed'
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/stats/gameover (Triggered when game finishes, increments gamesPlayed)
exports.incrementGamesPlayed = (req, res) => {
  try {
    if (!fs.existsSync(statsFilePath)) {
      return res.status(404).json({ error: 'Stats file not found' });
    }
    const data = fs.readFileSync(statsFilePath, 'utf8');
    const stats = JSON.parse(data);

    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;

    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2), 'utf8');
    res.json({ success: true, gamesPlayed: stats.gamesPlayed });
  } catch (err) {
    console.error('Error incrementing games played:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
