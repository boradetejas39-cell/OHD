const EmployeeResponse = require('../models/EmployeeResponse');
const Question = require('../models/Question');
const Company = require('../models/Company');
const connectDB = require('../config/database');

async function submitResponse(req, res) {
  try {
    await connectDB();

    const { companyId, employeeEmail, employeeName, answers, service } = req.body;

    if (!companyId || !answers) {
      return res.status(400).json({ error: 'Company ID and answers are required' });
    }

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Verify all 70 questions are answered
    if (!Array.isArray(answers) || answers.length !== 70) {
      return res.status(400).json({ error: 'All 70 questions must be answered' });
    }

    // Verify all questions exist and validate ratings
    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });

    if (questions.length !== 70) {
      return res.status(400).json({ error: 'Invalid question IDs provided' });
    }

    // Validate ratings
    const validRatings = ['A', 'B', 'C', 'D', 'E'];
    for (const answer of answers) {
      if (!validRatings.includes(answer.rating)) {
        return res.status(400).json({ error: `Invalid rating: ${answer.rating}. Must be A, B, C, D, or E` });
      }
    }

    // Check if employee already submitted response
    const existingResponse = await EmployeeResponse.findOne({ companyId, employeeEmail });
    if (existingResponse) {
      return res.status(400).json({ error: 'Response already submitted for this employee' });
    }

    const response = await EmployeeResponse.create({
      companyId,
      service,
      employeeEmail: employeeEmail ? employeeEmail.trim().toLowerCase() : undefined,
      employeeName,
      answers,
      submittedAt: new Date(),
    });

    return res.status(201).json({ response });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Response already submitted for this employee' });
    }
    return res.status(500).json({ error: error.message || 'Failed to submit response' });
  }
}

async function getCompanyResponses(req, res) {
  try {
    await connectDB();

    const responses = await EmployeeResponse.find({ companyId: req.params.companyId })
      .populate('companyId', 'name')
      .sort({ submittedAt: -1 });

    return res.json({ responses });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch responses' });
  }
}

module.exports = {
  submitResponse,
  getCompanyResponses
};

