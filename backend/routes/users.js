const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { updateProfile, getProfile, blockUser, reportUser, rateUser } = require('../controllers/userController');

router.put('/profile', protect, updateProfile);
router.post('/block',  protect, blockUser);
router.post('/report', protect, reportUser);
router.post('/rate',   protect, rateUser);
router.get('/:id',     protect, getProfile);

module.exports = router;
