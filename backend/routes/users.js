const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');
const User = require('../models/User');

router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name vibe interests city bio safetyScore isIdVerified isFaceVerified isOnline lastActive');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
});

router.post('/:userId/block', protect, ctrl.blockUser);
router.post('/:userId/unblock', protect, ctrl.unblockUser);

module.exports = router;
