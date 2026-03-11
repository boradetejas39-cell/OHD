const express = require('express');
const router = express.Router();
const { getQuestions, createQuestion } = require('../controllers/questionController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, getQuestions);
router.post('/', requireAdmin, createQuestion);

module.exports = router;

