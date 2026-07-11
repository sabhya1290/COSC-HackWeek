import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getQuestion = async (type = 'mixed', difficulty = 'any', exclude = []) => {
  const response = await api.get('/question', {
    params: {
      type,
      difficulty,
      exclude: exclude.join(','),
    },
  });
  return response.data;
};

export const submitAnswer = async (questionId, guess) => {
  const response = await api.post('/answer', {
    questionId,
    guess,
  });
  return response.data;
};

export const getLeaderboard = async () => {
  const response = await api.get('/leaderboard');
  return response.data;
};

export const addLeaderboardEntry = async (entryData) => {
  const response = await api.post('/leaderboard', entryData);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const incrementGamesPlayed = async () => {
  const response = await api.post('/stats/gameover');
  return response.data;
};

// Admin panel helper
export const adminAddQuestion = async (questionData) => {
  const response = await api.post('/question/admin', questionData);
  return response.data;
};
