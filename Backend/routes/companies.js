const express = require('express');
const router = express.Router();
const {
  getCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  deleteCompany
} = require('../controllers/companyController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, getCompanies);
router.post('/', requireAdmin, createCompany);
router.get('/:id', requireAdmin, getCompanyById);
router.put('/:id', requireAdmin, updateCompany);
router.delete('/:id', requireAdmin, deleteCompany);

module.exports = router;

