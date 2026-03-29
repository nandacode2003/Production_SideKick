const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Rating, Event } = require('../models/index');
const User = require('../models/User');

router.post('/', protect, async (req, res, next) => {
  try {
    const { ratedUserId, eventId, score, feedback } = req.body;
    if (!ratedUserId || !eventId || !score) return res.status(400).json({ message: 'ratedUserId, eventId, score are required' });
    if (score < 1 || score > 5) return res.status(400).json({ message: 'Score must be 1-5' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'completed') return res.status(400).json({ message: 'Can only rate after event is completed' });

    const bothJoined = event.participants.includes(req.user._id) && event.participants.includes(ratedUserId);
    if (!bothJoined) return res.status(400).json({ message: 'Both users must have participated in the event' });

    const alreadyRated = await Rating.findOne({ rater: req.user._id, rated: ratedUserId, event: eventId });
    if (alreadyRated) return res.status(400).json({ message: 'Already rated this user for this event' });

    await Rating.create({ rater: req.user._id, rated: ratedUserId, event: eventId, score, feedback });

    // Recalculate safety score from all ratings
    const allRatings = await Rating.find({ rated: ratedUserId });
    const avg = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
    await User.findByIdAndUpdate(ratedUserId, { safetyScore: Math.round(avg * 20) });

    res.status(201).json({ message: 'Rating submitted' });
  } catch (err) { next(err); }
});

module.exports = router;
