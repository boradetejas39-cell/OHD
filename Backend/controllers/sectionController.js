const Section = require('../models/Section');
const connectDB = require('../config/database');

async function getSections(req, res) {
  try {
    await connectDB();
    const sections = await Section.find().sort({ order: 1 });
    return res.json({ sections });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch sections' });
  }
}

async function createSection(req, res) {
  try {
    await connectDB();

    const { name, description, order } = req.body;

    if (!name || order === undefined) {
      return res.status(400).json({ error: 'Name and order are required' });
    }

    const section = await Section.create({
      name,
      description,
      order,
    });

    return res.status(201).json({ section });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create section' });
  }
}

module.exports = {
  getSections,
  createSection
};

