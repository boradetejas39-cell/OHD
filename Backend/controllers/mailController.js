const connectDB = require('../config/database');
const { sendBulkEmails, generateSurveyEmail } = require('../services/mailService');
const MailLog = require('../models/MailLog');
const XLSX = require('xlsx');

async function sendBulkMail(req, res) {
  try {
    await connectDB();

    const file = req.file;
    const { subject, companyId, surveyLink, companyName, service } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    if (!subject || !surveyLink) {
      return res.status(400).json({ error: 'Subject and survey link are required' });
    }

    // Extract emails from file
    const emails = [];
    const fileName = file.originalname.toLowerCase();

    if (fileName.endsWith('.csv')) {
      const text = file.buffer.toString('utf-8');
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.trim()) {
          const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
          for (const col of columns) {
            if (col.includes('@') && col.includes('.')) {
              emails.push(col.toLowerCase());
              break;
            }
          }
        }
      }
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      let emailColumnIndex = -1;
      if (data.length > 0) {
        const headerRow = data[0];
        emailColumnIndex = headerRow.findIndex(cell =>
          cell && (cell.toString().toLowerCase().includes('email') || cell.toString().toLowerCase().includes('mail'))
        );
      }

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (emailColumnIndex >= 0 && row[emailColumnIndex]) {
          const email = row[emailColumnIndex].toString().trim().toLowerCase();
          if (email.includes('@') && email.includes('.')) {
            emails.push(email);
          }
        } else {
          for (const cell of row) {
            if (cell && cell.toString().includes('@') && cell.toString().includes('.')) {
              emails.push(cell.toString().trim().toLowerCase());
              break;
            }
          }
        }
      }
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload CSV or Excel file.' });
    }

    if (emails.length === 0) {
      return res.status(400).json({ error: 'No valid emails found in the file' });
    }

    const uniqueEmails = [...new Set(emails)];
    const html = generateSurveyEmail(companyName || 'Your Organization', surveyLink, service);

    const result = await sendBulkEmails(uniqueEmails, subject, html, companyId || undefined, service);

    return res.json({
      message: 'Bulk email sending completed',
      total: uniqueEmails.length,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to send bulk emails' });
  }
}

async function getMailLogs(req, res) {
  try {
    await connectDB();

    const { companyId, status, page = 1, limit = 50 } = req.query;

    const query = {};
    if (companyId) query.companyId = companyId;
    if (status) query.status = status;

    const logs = await MailLog.find(query)
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await MailLog.countDocuments(query);

    return res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch mail logs' });
  }
}

module.exports = {
  sendBulkMail,
  getMailLogs
};

