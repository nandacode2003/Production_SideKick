const User = require('../models/User');

const sanitize = (user) => {
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.password; delete u.otp; delete u.refreshToken;
  return u;
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp -refreshToken');
    res.json({ user });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, city, availability } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio;
    if (city) updates.city = city;
    if (availability) updates.availability = availability;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .select('-password -otp -refreshToken');
    res.json({ user });
  } catch (err) { next(err); }
};

exports.updateVibe = async (req, res, next) => {
  try {
    const { vibe } = req.body;
    const valid = ['Adventurer', 'Foodie', 'Planner', 'Socialite', 'Chill One', 'Go-Getter'];
    if (!valid.includes(vibe)) return res.status(400).json({ message: 'Invalid vibe' });
    const user = await User.findByIdAndUpdate(req.user._id, { vibe }, { new: true }).select('-password -otp -refreshToken');
    res.json({ user });
  } catch (err) { next(err); }
};

exports.updateInterests = async (req, res, next) => {
  try {
    const { interests } = req.body;
    if (!Array.isArray(interests) || interests.length < 3)
      return res.status(400).json({ message: 'Minimum 3 interests required' });
    const user = await User.findByIdAndUpdate(req.user._id, { interests }, { new: true }).select('-password -otp -refreshToken');
    res.json({ user });
  } catch (err) { next(err); }
};

exports.verifyId = async (req, res, next) => {
  try {
    await new Promise(r => setTimeout(r, 2000));
    await User.findByIdAndUpdate(req.user._id, { isIdVerified: true });
    res.json({ message: 'ID Verified', isIdVerified: true });
  } catch (err) { next(err); }
};

exports.verifyFace = async (req, res, next) => {
  try {
    await new Promise(r => setTimeout(r, 1000));
    await User.findByIdAndUpdate(req.user._id, { isFaceVerified: true });
    res.json({ message: 'Face Verified', isFaceVerified: true });
  } catch (err) { next(err); }
};

exports.updateSafetyCircle = async (req, res, next) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts) || contacts.length > 2)
      return res.status(400).json({ message: 'Maximum 2 safety contacts allowed' });
    const user = await User.findByIdAndUpdate(req.user._id, { safetyCircle: contacts }, { new: true }).select('-password -otp -refreshToken');
    res.json({ safetyCircle: user.safetyCircle });
  } catch (err) { next(err); }
};
