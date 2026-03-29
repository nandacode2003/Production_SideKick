const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/verify-otp', ctrl.verifyOtp);
router.post('/resend-otp', ctrl.resendOtp);
router.post('/login', ctrl.login);
router.post('/refresh-token', ctrl.refreshToken);
router.post('/logout', protect, ctrl.logout);
router.get('/me', protect, ctrl.getMe);
router.post('/verify-id', protect, ctrl.verifyGovId);
router.post('/verify-face', protect, ctrl.verifyFace);

module.exports = router;
