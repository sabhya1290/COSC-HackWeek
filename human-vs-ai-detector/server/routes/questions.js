const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

router.get('/question', questionController.getQuestion);
router.post('/answer', questionController.submitAnswer);
router.post('/question/admin', questionController.addQuestion);

module.exports = router;
