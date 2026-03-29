const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

const genOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sanitize = (user) => {
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.password; delete u.otp; delete u.refreshToken;
  return u;
};

// ── REGISTER ─────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password)
      return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Invalid email format' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const otp = genOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const now = new Date();

    const user = await User.create({
      name, email, phone, password,
      otp: { code: hashedOtp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0, sentCount: 1, windowStart: now },
    });

    await sendOTPEmail(email, otp);
    res.status(201).json({ message: 'OTP sent to email', userId: user._id });
  } catch (err) { next(err); }
};

// ── VERIFY OTP ────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ message: 'userId and otp are required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ message: 'Already verified' });

    if (!user.otp?.code) return res.status(400).json({ message: 'No OTP found. Request a new one.' });
    if (user.otp.attempts >= 5) return res.status(400).json({ message: 'Too many attempts. Request a new OTP.' });
    if (new Date() > user.otp.expiresAt) return res.status(400).json({ message: 'OTP expired' });

    const match = await bcrypt.compare(otp, user.otp.code);
    if (!match) {
      await User.findByIdAndUpdate(userId, { $inc: { 'otp.attempts': 1 } });
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const { token, refreshToken } = generateTokens(user._id);
    const updated = await User.findByIdAndUpdate(userId, {
      isEmailVerified: true,
      refreshToken,
      $unset: { otp: '' },
    }, { new: true });

    await sendWelcomeEmail(user.email, user.name);
    res.json({ message: 'Email verified', token, refreshToken, user: sanitize(updated) });
  } catch (err) { next(err); }
};

// ── RESEND OTP ────────────────────────────────────────────
exports.resendOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ message: 'Already verified' });

    // Rate limit: max 3 per 15 min window
    const windowStart = user.otp?.windowStart;
    const withinWindow = windowStart && (Date.now() - new Date(windowStart).getTime()) < 15 * 60 * 1000;
    if (withinWindow && (user.otp?.sentCount || 0) >= 3) {
      return res.status(429).json({ message: 'Too many OTP requests. Try again in 15 minutes.' });
    }

    const otp = genOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const now = new Date();

    await User.findByIdAndUpdate(userId, {
      otp: {
        code: hashedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        sentCount: withinWindow ? (user.otp.sentCount || 0) + 1 : 1,
        windowStart: withinWindow ? windowStart : now,
      },
    });

    await sendOTPEmail(user.email, otp);
    res.json({ message: 'OTP resent to email' });
  } catch (err) { next(err); }
};

// ── LOGIN ─────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.isEmailVerified)
      return res.status(403).json({ message: 'Email not verified', userId: user._id });

    const { token, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken, isOnline: true, lastActive: new Date() });

    res.json({
      token, refreshToken,
      user: { id: user._id, name: user.name, email: user.email, vibe: user.vibe, interests: user.interests, city: user.city, isIdVerified: user.isIdVerified, isFaceVerified: user.isFaceVerified },
    });
  } catch (err) { next(err); }
};

// ── REFRESH TOKEN ─────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({ _id: decoded.id, refreshToken });
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });

    const { token } = generateTokens(user._id);
    res.json({ token });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// ── LOGOUT ────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null, isOnline: false });
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
};

// ── GET ME ────────────────────────────────────────────────
exports.getMe = (req, res) => res.json({ user: sanitize(req.user) });

// ── VERIFY GOV ID (mock) ──────────────────────────────────
exports.verifyGovId = async (req, res, next) => {
  try {
    await new Promise(r => setTimeout(r, 2000));
    await User.findByIdAndUpdate(req.user._id, { isIdVerified: true });
    res.json({ message: 'ID Verified', isIdVerified: true });
  } catch (err) { next(err); }
};

// ── VERIFY FACE (mock) ────────────────────────────────────
exports.verifyFace = async (req, res, next) => {
  try {
    await new Promise(r => setTimeout(r, 1000));
    await User.findByIdAndUpdate(req.user._id, { isFaceVerified: true });
    res.json({ message: 'Face Verified', isFaceVerified: true });
  } catch (err) { next(err); }
};
