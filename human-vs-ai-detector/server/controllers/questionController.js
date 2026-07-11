const fs = require('fs');
const path = require('path');

const questionsFilePath = path.join(__dirname, '../data/questions.json');
const statsFilePath = path.join(__dirname, '../data/stats.json');

// Helper to read questions
const readQuestions = () => {
  try {
    const data = fs.readFileSync(questionsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading questions:', err);
    return [];
  }
};

// Helper to write questions
const writeQuestions = (questions) => {
  try {
    fs.writeFileSync(questionsFilePath, JSON.stringify(questions, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing questions:', err);
    return false;
  }
};

// Helper to update stats
const updateStats = (isCorrect, category) => {
  try {
    if (!fs.existsSync(statsFilePath)) return;
    const data = fs.readFileSync(statsFilePath, 'utf8');
    const stats = JSON.parse(data);

    stats.totalAnswers = (stats.totalAnswers || 0) + 1;
    if (isCorrect) {
      stats.correctAnswers = (stats.correctAnswers || 0) + 1;
    }

    if (category) {
      if (!stats.categoryCounts) stats.categoryCounts = {};
      stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;

      // Recalculate favorite category
      let fav = 'Mixed';
      let maxCount = 0;
      for (const cat in stats.categoryCounts) {
        if (stats.categoryCounts[cat] > maxCount) {
          maxCount = stats.categoryCounts[cat];
          fav = cat;
        }
      }
      stats.favoriteCategory = fav.charAt(0).toUpperCase() + fav.slice(1);
    }

    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2), 'utf8');
  } catch (err) {
    console.error('Error updating stats:', err);
  }
};

// GET /api/question
exports.getQuestion = (req, res) => {
  console.log('getQuestion received query:', req.query);
  const questions = readQuestions();
  if (questions.length === 0) {
    return res.status(404).json({ error: 'No questions available' });
  }

  const { type, difficulty, exclude } = req.query;
  let filtered = [...questions];

  // Filter by category/type if specified and not 'mixed'
  if (type && type !== 'mixed') {
    filtered = filtered.filter(q => q.type.toLowerCase() === type.toLowerCase());
  }

  // Filter by difficulty if specified
  if (difficulty && difficulty !== 'any') {
    filtered = filtered.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
  }

  // Filter out already answered questions in current session
  if (exclude) {
    const excludeIds = exclude.split(',').map(Number);
    filtered = filtered.filter(q => !excludeIds.includes(q.id));
  }

  // If no questions match after filters, fallback to just category filter (ignoring difficulty)
  if (filtered.length === 0 && type && type !== 'mixed') {
    filtered = questions.filter(q => q.type.toLowerCase() === type.toLowerCase());
    if (exclude) {
      const excludeIds = exclude.split(',').map(Number);
      const afterExclude = filtered.filter(q => !excludeIds.includes(q.id));
      if (afterExclude.length > 0) {
        filtered = afterExclude;
      }
      // If afterExclude is empty, we do NOT apply the exclude filter,
      // allowing the category questions to repeat instead of mixing.
    }
  }

  // Final fallback to all questions (if mixed mode or if no questions in category)
  if (filtered.length === 0) {
    filtered = [...questions];
  }

  // Select a random question
  const randomIndex = Math.floor(Math.random() * filtered.length);
  const question = filtered[randomIndex];

  res.json({
    id: question.id,
    type: question.type,
    title: question.title,
    content: question.content,
    difficulty: question.difficulty,
    answer: question.answer, // Returned to match requested spec (though client will hide it until submission)
    explanation: question.explanation,
    clues: question.clues,
    confidence: question.confidence,
    hint: question.hint
  });
};

// POST /api/answer
exports.submitAnswer = (req, res) => {
  const { questionId, guess } = req.body;
  
  if (!questionId || !guess) {
    return res.status(400).json({ error: 'Missing questionId or guess' });
  }

  const questions = readQuestions();
  const question = questions.find(q => q.id === Number(questionId));

  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const correct = question.answer.toLowerCase() === guess.toLowerCase();
  
  // Update analytics stats
  updateStats(correct, question.type);

  res.json({
    correct,
    answer: question.answer,
    explanation: question.explanation,
    clues: question.clues,
    confidence: question.confidence
  });
};

// POST /api/question/admin (Admin Panel endpoint to add questions)
exports.addQuestion = (req, res) => {
  const { type, difficulty, title, content, answer, explanation, clues, confidence, hint } = req.body;

  if (!type || !difficulty || !title || !content || !answer || !explanation) {
    return res.status(400).json({ error: 'Missing required question fields' });
  }

  const questions = readQuestions();
  const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;

  const newQuestion = {
    id: nextId,
    type,
    difficulty,
    title,
    content,
    answer,
    explanation,
    clues: Array.isArray(clues) ? clues : (clues ? clues.split(',').map(c => c.trim()) : []),
    confidence: Number(confidence) || 50,
    hint: hint || ''
  };

  questions.push(newQuestion);
  if (writeQuestions(questions)) {
    res.status(201).json({ message: 'Question added successfully', question: newQuestion });
  } else {
    res.status(500).json({ error: 'Failed to write question to file' });
  }
};
