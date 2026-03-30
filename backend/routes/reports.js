const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Report } = require('../models/index');
const User = require('../models/User');

router.post('/', protect, async (req, res, next) => {
  try {
    const { reportedId, reason, description } = req.body;
    if (!reportedId || !reason)
      return res.status(400).json({ message: 'reportedId and reason are required' });

    await Report.create({ reporter: req.user._id, reported: reportedId, reason, description: description || '' });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: reportedId } });
    await User.findByIdAndUpdate(reportedId, { $inc: { safetyScore: -10 } });
    res.status(201).json({ message: 'Report submitted. User has been blocked.' });
  } catch (err) { next(err); }
});

router.get('/', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admins only' });
    const reports = await Report.find()
      .populate('reporter', 'name email')
      .populate('reported', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ reports });
  } catch (err) { next(err); }
});

module.exports = router;
