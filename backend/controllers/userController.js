const axios = require('axios');
const User = require('../models/User');
const { Report, Match } = require('../models/index');

const NLP_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8002';

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'age', 'gender', 'bio', 'profilePhoto', 'interests', 'vibeTag', 'vibe', 'availability', 'location', 'city', 'safetyContacts', 'safetyCircle'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // Auto-generate vibe tag from interests if NLP service available
    if (updates.interests?.length > 0 && !updates.vibeTag && !updates.vibe) {
      try {
        const { data } = await axios.post(`${NLP_URL}/vibe-tag`, { interests: updates.interests }, { timeout: 3000 });
        updates.vibeTag = data.vibeTag;
      } catch (nlpErr) {
        console.warn('⚠️ Vibe tag service unavailable:', nlpErr.message);
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password -passwordHash -otp -otpCode');
    res.json({ user });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name age gender bio profilePhoto interests vibeTag vibe safetyScore isIdVerified isFaceVerified location city');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

exports.rateUser = async (req, res, next) => {
  try {
    const { userId, rating, matchId } = req.body;
    if (!userId || !rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'userId and rating (1-5) are required' });

    if (matchId) {
      const match = await Match.findOne({
        _id: matchId,
        $or: [{ requester: req.user._id }, { receiver: req.user._id }, { users: req.user._id }],
        status: 'accepted',
      });
      if (match) {
        const isRequester = match.requester?.toString() === req.user._id.toString();
        if (isRequester) match.requesterRating = rating;
        else match.receiverRating = rating;
        await match.save();
      }
    }

    const delta = rating >= 4 ? 2 : rating <= 2 ? -5 : 0;
    if (delta !== 0) await User.findByIdAndUpdate(userId, { $inc: { safetyScore: delta } });
    res.json({ message: 'Rating submitted' });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

exports.blockUser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: userId } });
    res.json({ message: 'User blocked' });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

exports.reportUser = async (req, res, next) => {
  try {
    const { reportedId, reason, description } = req.body;
    await Report.create({ reporter: req.user._id, reported: reportedId, reason, description });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: reportedId } });
    await User.findByIdAndUpdate(reportedId, { $inc: { safetyScore: -10 } });
    res.json({ message: 'Report submitted. User blocked.' });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};
