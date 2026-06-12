const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middleware/authMiddleware');

// All application routes are guarded behind token verification
router.use(authMiddleware);

router.post('/', applicationController.createApplication);
router.get('/', applicationController.getApplications);
router.put('/:id', applicationController.updateApplicationStatus);
router.delete('/:id', applicationController.deleteApplication);

module.exports = router;
