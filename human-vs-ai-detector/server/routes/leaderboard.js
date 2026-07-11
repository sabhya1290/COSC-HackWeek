const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

router.get('/leaderboard', leaderboardController.getLeaderboard);
router.post('/leaderboard', leaderboardController.addLeaderboardEntry);
router.get('/stats', leaderboardController.getStats);
router.post('/stats/gameover', leaderboardController.incrementGamesPlayed);

module.exports = router;
