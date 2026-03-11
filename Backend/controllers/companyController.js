const Company = require('../models/Company');
const connectDB = require('../config/database');

async function getCompanies(req, res) {
  try {
    await connectDB();
    const companies = await Company.find().sort({ createdAt: -1 });
    return res.json({ companies });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch companies' });
  }
}

async function createCompany(req, res) {
  try {
    await connectDB();

    const { name, email, industry, employeeCount } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ error: 'Company with this email already exists' });
    }

    const company = await Company.create({
      name,
      email,
      industry,
      employeeCount: employeeCount || 0,
      status: 'active',
    });

    return res.status(201).json({ company });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create company' });
  }
}

async function getCompanyById(req, res) {
  try {
    await connectDB();

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    return res.json({ company });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch company' });
  }
}

async function updateCompany(req, res) {
  try {
    await connectDB();

    const { name, email, industry, employeeCount, status } = req.body;

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check email uniqueness if email is being updated
    if (email && email !== company.email) {
      const existingCompany = await Company.findOne({ email });
      if (existingCompany) {
        return res.status(400).json({ error: 'Company with this email already exists' });
      }
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      { name, email, industry, employeeCount, status },
      { new: true, runValidators: true }
    );

    return res.json({ company: updatedCompany });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to update company' });
  }
}

async function deleteCompany(req, res) {
  try {
    await connectDB();

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await Company.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to delete company' });
  }
}

module.exports = {
  getCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  deleteCompany
};

