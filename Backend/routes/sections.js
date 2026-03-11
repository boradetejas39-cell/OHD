const express = require('express');
const router = express.Router();
const { getSections, createSection } = require('../controllers/sectionController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, getSections);
router.post('/', requireAdmin, createSection);

module.exports = router;

