const { Report, Match } = require('../models/index');
const User = require('../models/User');

exports.submitReport = async (req, res, next) => {
  try {
    const { reportedUserId, reason, description } = req.body;
    if (!reportedUserId || !reason) return res.status(400).json({ message: 'reportedUserId and reason are required' });

    await Report.create({ reporter: req.user._id, reported: reportedUserId, reason, description });

    const reported = await User.findByIdAndUpdate(
      reportedUserId,
      { $inc: { reportCount: 1 } },
      { new: true }
    );

    // Adjust safety score based on report count
    let safetyUpdate = {};
    if (reported.reportCount >= 5) safetyUpdate.safetyScore = 0;
    else if (reported.reportCount >= 3) safetyUpdate.safetyScore = Math.max(0, (reported.safetyScore || 100) - 20);

    if (Object.keys(safetyUpdate).length) {
      await User.findByIdAndUpdate(reportedUserId, safetyUpdate);
    }

    res.status(201).json({ message: 'Report submitted' });
  } catch (err) { next(err); }
};

exports.blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: userId } });
    // Remove active matches
    await Match.deleteMany({ users: { $all: [req.user._id, userId] } });
    res.json({ message: 'User blocked' });
  } catch (err) { next(err); }
};

exports.unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: userId } });
    res.json({ message: 'User unblocked' });
  } catch (err) { next(err); }
};
