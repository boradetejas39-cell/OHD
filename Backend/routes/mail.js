const express = require('express');
const router = express.Router();
const multer = require('multer');
const { sendBulkMail, getMailLogs } = require('../controllers/mailController');
const { requireAdmin } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/bulk', requireAdmin, upload.single('file'), sendBulkMail);
router.get('/logs', requireAdmin, getMailLogs);

module.exports = router;

