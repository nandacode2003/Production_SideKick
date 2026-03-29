const User = require('../models/User');
const { Match, Chat } = require('../models/index');
const { sendMatchNotificationEmail, sendMatchAcceptedEmail } = require('../utils/emailService');

function calcScore(me, candidate) {
  const myInts = new Set(me.interests || []);
  const cInts = new Set(candidate.interests || []);
  const common = [...myInts].filter(x => cInts.has(x));
  const union = new Set([...myInts, ...cInts]).size;
  const interestScore = union > 0 ? (common.length / union) * 50 : 0;

  const vibeScore = me.vibe && me.vibe === candidate.vibe ? 15 : 0;

  const myAvail = me.availability || {};
  const cAvail = candidate.availability || {};
  const availScore = ['weekdays', 'weekends', 'evenings'].reduce((acc, slot) => {
    return acc + (myAvail[slot] && cAvail[slot] ? 10 : 0);
  }, 0);

  const safetyFactor = ((candidate.safetyScore || 100) / 100) * 10;
  const verifiedBonus = (candidate.isIdVerified ? 5 : 0) + (candidate.isFaceVerified ? 5 : 0);

  return {
    score: Math.round(interestScore + vibeScore + availScore + safetyFactor + verifiedBonus),
    matchedInterests: common,
  };
}

exports.getSuggestions = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id);

    const existingMatches = await Match.find({ users: me._id });
    const excludeIds = existingMatches.flatMap(m => m.users.map(u => u.toString()));

    const filter = {
      _id: { $ne: me._id, $nin: [...(me.blockedUsers || []), ...excludeIds] },
      isEmailVerified: true,
    };
    if (me.city) filter.city = me.city;

    const candidates = await User.find(filter)
      .select('name vibe interests city bio availability safetyScore isIdVerified isFaceVerified isOnline lastActive');

    const scored = candidates
      .map(c => {
        const { score, matchedInterests } = calcScore(me, c);
        return { user: c, compatibilityScore: score, matchedInterests };
      })
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 10);

    res.json(scored);
  } catch (err) { next(err); }
};

exports.sendRequest = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: 'targetUserId is required' });
    if (targetUserId === req.user._id.toString()) return res.status(400).json({ message: 'Cannot match with yourself' });

    const target = await User.findById(targetUserId);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if ((target.blockedUsers || []).includes(req.user._id))
      return res.status(400).json({ message: 'Cannot send request to this user' });

    const existing = await Match.findOne({ users: { $all: [req.user._id, targetUserId] } });
    if (existing) return res.status(400).json({ message: 'Match already exists' });

    const me = await User.findById(req.user._id);
    const { score, matchedInterests } = calcScore(me, target);

    const match = await Match.create({
      users: [req.user._id, targetUserId],
      initiator: req.user._id,
      compatibilityScore: score,
      matchedInterests,
    });

    sendMatchNotificationEmail(target.email, me.name, matchedInterests).catch(() => {});
    res.status(201).json({ message: 'Match request sent', match });
  } catch (err) { next(err); }
};

exports.getPending = async (req, res, next) => {
  try {
    const pending = await Match.find({
      users: req.user._id,
      initiator: { $ne: req.user._id },
      status: 'pending',
    }).populate('users', 'name vibe interests city bio isIdVerified isFaceVerified');
    res.json(pending);
  } catch (err) { next(err); }
};

exports.getActive = async (req, res, next) => {
  try {
    const matches = await Match.find({ users: req.user._id, status: 'accepted' })
      .populate('users', 'name vibe interests city bio isIdVerified isFaceVerified isOnline lastActive');
    res.json(matches);
  } catch (err) { next(err); }
};

exports.acceptMatch = async (req, res, next) => {
  try {
    const match = await Match.findOne({
      _id: req.params.matchId,
      users: req.user._id,
      initiator: { $ne: req.user._id },
      status: 'pending',
    });
    if (!match) return res.status(404).json({ message: 'Match request not found' });

    match.status = 'accepted';
    await match.save();

    // Auto-create chat room
    await Chat.create({ match: match._id, participants: match.users, messages: [] });

    // Notify initiator
    const initiator = await User.findById(match.initiator);
    const me = await User.findById(req.user._id);
    if (initiator) sendMatchAcceptedEmail(initiator.email, me.name).catch(() => {});

    res.json({ message: 'Match accepted', match });
  } catch (err) { next(err); }
};

exports.rejectMatch = async (req, res, next) => {
  try {
    const match = await Match.findOneAndUpdate(
      { _id: req.params.matchId, users: req.user._id, status: 'pending' },
      { status: 'rejected' },
      { new: true }
    );
    if (!match) return res.status(404).json({ message: 'Match not found' });
    res.json({ message: 'Match rejected' });
  } catch (err) { next(err); }
};
