const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/safetyController');
const { protect } = require('../middleware/auth');

router.post('/checkin', protect, ctrl.createCheckIn);
router.post('/confirm/:token', ctrl.confirmSafe);

module.exports = router;
