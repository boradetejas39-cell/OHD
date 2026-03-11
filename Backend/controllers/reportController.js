const connectDB = require('../config/database');
const { calculateOverallStats, calculateSectionStats } = require('../utils/calculations');
const Section = require('../models/Section');

async function getCompanyReport(req, res) {
  try {
    await connectDB();

    const overallStats = await calculateOverallStats(req.params.companyId);
    const sections = await Section.find().sort({ order: 1 });
    const sectionStats = [];

    for (const section of sections) {
      const stats = await calculateSectionStats(section._id.toString(), req.params.companyId);
      sectionStats.push(stats);
    }

    return res.json({
      companyId: req.params.companyId,
      overallStats,
      sectionStats,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to generate company report' });
  }
}

async function getSectionReport(req, res) {
  try {
    await connectDB();

    const { companyId } = req.query;

    const sectionStats = await calculateSectionStats(req.params.sectionId, companyId || undefined);

    return res.json({
      sectionStats,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to generate section report' });
  }
}

async function getOverallReport(req, res) {
  try {
    await connectDB();

    const { companyId } = req.query;

    const overallStats = await calculateOverallStats(companyId || undefined);
    const sections = await Section.find().sort({ order: 1 });
    const sectionStats = [];

    for (const section of sections) {
      const stats = await calculateSectionStats(section._id.toString(), companyId || undefined);
      sectionStats.push(stats);
    }

    return res.json({
      overallStats,
      sectionStats,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to generate overall report' });
  }
}

module.exports = {
  getCompanyReport,
  getSectionReport,
  getOverallReport
};

