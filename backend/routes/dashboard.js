const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Match, Event, Chat } = require('../models/index');

router.get('/stats', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [activeMatches, eventsJoined, pendingRequests, chats] = await Promise.all([
      Match.countDocuments({ users: userId, status: 'accepted' }),
      Event.countDocuments({ participants: userId }),
      Match.countDocuments({ users: userId, initiator: { $ne: userId }, status: 'pending' }),
      Chat.find({ participants: userId }),
    ]);

    const unreadMessages = chats.reduce((acc, chat) => {
      return acc + chat.messages.filter(m => !m.read && m.sender.toString() !== userId.toString()).length;
    }, 0);

    res.json({ activeMatches, eventsJoined, pendingRequests, unreadMessages });
  } catch (err) { next(err); }
});

module.exports = router;
