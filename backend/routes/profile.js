const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.get('/me', protect, ctrl.getMe);
router.put('/update', protect, ctrl.updateProfile);
router.put('/vibe', protect, ctrl.updateVibe);
router.put('/interests', protect, ctrl.updateInterests);
router.post('/verify-id', protect, ctrl.verifyId);
router.post('/verify-face', protect, ctrl.verifyFace);
router.put('/safety-circle', protect, ctrl.updateSafetyCircle);

module.exports = router;
