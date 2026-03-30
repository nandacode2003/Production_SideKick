const axios = require('axios');
const User = require('../models/User');
const { Match, Chat } = require('../models/index');
const { sendMatchNotificationEmail, sendMatchAcceptedEmail } = require('../utils/emailService');

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// ── LOCAL FALLBACK MATCHING ───────────────────────────────
function localMatch(user, candidates) {
  return candidates.map(c => {
    const userInts = new Set(user.interests || []);
    const candInts = new Set(c.interests || []);
    const intersection = [...userInts].filter(x => candInts.has(x)).length;
    const union = new Set([...userInts, ...candInts]).size;
    const interestScore = union > 0 ? Math.round((intersection / union) * 100) : 0;
    const safetyScore = Math.min(Math.max(c.safetyScore || 100, 0), 100);
    const totalScore = Math.round(0.6 * interestScore + 0.4 * safetyScore);
    return {
      candidateId: c._id.toString(),
      totalScore,
      interestScore,
      availabilityScore: 50,
      distanceScore: 50,
      safetyScore,
    };
  });
}

// ── GET MATCH SUGGESTIONS ─────────────────────────────────
exports.getSuggestions = async (req, res, next) => {
  try {
    const me = req.user;

    const existingMatches = await Match.find({
      $or: [
        { users: me._id },
        { requester: me._id },
        { receiver: me._id },
      ],
    });
    const excludeIds = existingMatches.flatMap(m => {
      const ids = [];
      if (m.users?.length) ids.push(...m.users.map(u => u.toString()));
      if (m.requester) ids.push(m.requester.toString());
      if (m.receiver) ids.push(m.receiver.toString());
      return ids;
    });

    const cityFilter = me.location?.city
      ? { 'location.city': me.location.city }
      : me.city ? { city: me.city } : {};

    const candidates = await User.find({
      _id: { $ne: me._id, $nin: [...(me.blockedUsers || []), ...excludeIds] },
      ...cityFilter,
      $or: [{ isEmailVerified: true }, { isPhoneVerified: true }],
    }).select('name age gender interests vibeTag vibe city location bio availability safetyScore isIdVerified isFaceVerified isOnline lastActive profilePhoto');

    if (!candidates.length) return res.json({ matches: [], source: 'no_candidates' });

    const payload = {
      user: {
        id: me._id,
        interests: me.interests,
        availability: me.availability,
        lat: me.location?.lat,
        lng: me.location?.lng,
        safetyScore: me.safetyScore,
      },
      candidates: candidates.map(c => ({
        id: c._id,
        interests: c.interests,
        availability: c.availability,
        lat: c.location?.lat,
        lng: c.location?.lng,
        safetyScore: c.safetyScore,
      })),
    };

    let scoredResults;
    let source = 'python';
    try {
      const { data } = await axios.post(`${PYTHON_URL}/match`, payload, { timeout: 5000 });
      scoredResults = data.results;
    } catch (pyErr) {
      console.warn('⚠️ Python service unavailable, using local fallback:', pyErr.message);
      scoredResults = localMatch(me, candidates);
      source = 'local_fallback';
    }

    const scored = scoredResults
      .filter(r => r.totalScore >= 10)
      .map(r => {
        const user = candidates.find(c => c._id.toString() === r.candidateId);
        return { user, ...r };
      })
      .filter(r => r.user);

    res.json({ matches: scored, source });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

// ── SEND MATCH REQUEST ────────────────────────────────────
exports.sendRequest = async (req, res, next) => {
  try {
    const { targetUserId, receiverId, eventId } = req.body;
    const toId = receiverId || targetUserId;
    if (!toId) return res.status(400).json({ message: 'receiverId is required' });
    if (toId === req.user._id.toString()) return res.status(400).json({ message: 'Cannot match with yourself' });

    const target = await User.findById(toId);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if ((target.blockedUsers || []).map(id => id.toString()).includes(req.user._id.toString()))
      return res.status(400).json({ message: 'Cannot send request to this user' });

    const existing = await Match.findOne({
      $or: [
        { users: { $all: [req.user._id, toId] } },
        { requester: req.user._id, receiver: toId },
        { requester: toId, receiver: req.user._id },
      ],
    });
    if (existing) return res.status(400).json({ message: 'Match request already exists' });

    const chatRoomId = `room_${req.user._id}_${toId}_${Date.now()}`;
    const match = await Match.create({
      requester: req.user._id,
      receiver: toId,
      users: [req.user._id, toId],
      initiator: req.user._id,
      event: eventId || null,
      chatRoomId,
    });

    const me = await User.findById(req.user._id);
    sendMatchNotificationEmail(target.email, me.name, []).catch(() => {});
    res.status(201).json({ message: 'Match request sent', match });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

// ── RESPOND TO REQUEST ────────────────────────────────────
exports.respondRequest = async (req, res, next) => {
  try {
    const { matchId, action } = req.body;
    if (!matchId || !['accept', 'reject'].includes(action))
      return res.status(400).json({ message: 'matchId and action (accept|reject) required' });

    const match = await Match.findOne({
      _id: matchId,
      $or: [{ receiver: req.user._id }, { users: req.user._id, initiator: { $ne: req.user._id } }],
      status: 'pending',
    });
    if (!match) return res.status(404).json({ message: 'Match request not found' });

    match.status = action === 'accept' ? 'accepted' : 'rejected';
    await match.save();

    if (action === 'accept') {
      // Auto-create chat room if using legacy Chat model
      const existingChat = await Chat.findOne({ match: match._id });
      if (!existingChat) {
        await Chat.create({ match: match._id, participants: match.users?.length ? match.users : [match.requester, match.receiver], messages: [] });
      }
      const initiatorId = match.initiator || match.requester;
      const initiator = await User.findById(initiatorId);
      const me = await User.findById(req.user._id);
      if (initiator) sendMatchAcceptedEmail(initiator.email, me.name).catch(() => {});
    }

    res.json({ message: `Match ${action}ed`, match });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

// ── GET PENDING REQUESTS ──────────────────────────────────
exports.getPending = async (req, res, next) => {
  try {
    const pending = await Match.find({
      $or: [
        { receiver: req.user._id, status: 'pending' },
        { users: req.user._id, initiator: { $ne: req.user._id }, status: 'pending' },
      ],
    }).populate('requester initiator users', 'name vibeTag vibe interests city location bio isIdVerified isFaceVerified profilePhoto age');
    res.json({ pending });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

// ── GET ACTIVE MATCHES ────────────────────────────────────
exports.getActive = async (req, res, next) => {
  try {
    const matches = await Match.find({
      $or: [
        { users: req.user._id, status: 'accepted' },
        { requester: req.user._id, status: 'accepted' },
        { receiver: req.user._id, status: 'accepted' },
      ],
    }).populate('requester receiver users', 'name vibeTag vibe interests city location bio isIdVerified isFaceVerified isOnline lastActive profilePhoto');
    res.json({ matches });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

// ── CANCEL REQUEST ────────────────────────────────────────
exports.cancelRequest = async (req, res, next) => {
  try {
    const { matchId } = req.body;
    const match = await Match.findOne({
      _id: matchId,
      $or: [{ requester: req.user._id }, { initiator: req.user._id }],
      status: 'pending',
    });
    if (!match) return res.status(404).json({ message: 'Pending request not found' });
    match.status = 'cancelled';
    await match.save();
    res.json({ message: 'Match request cancelled' });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};
