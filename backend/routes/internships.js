const express = require('express');
const router = express.Router();
const internshipController = require('../controllers/internshipController');
const authMiddleware = require('../middleware/authMiddleware');

// Public endpoints
router.get('/', internshipController.getAllInternships);
router.get('/:id', internshipController.getInternshipById);

// Guarded endpoints
router.post('/', authMiddleware, internshipController.createInternship);
router.put('/:id', authMiddleware, internshipController.updateInternship);
router.delete('/:id', authMiddleware, internshipController.deleteInternship);

module.exports = router;
