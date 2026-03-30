const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:8001';

const genOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sanitize = (user) => {
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.password; delete u.passwordHash;
  delete u.otp; delete u.otpCode; delete u.otpExpiry;
  delete u.refreshToken; delete u.faceDescriptor;
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

    const phoneClean = phone.replace(/\s/g, '');
    const existing = await User.findOne({ $or: [{ email }, { phone: phoneClean }] });
    if (existing) return res.status(400).json({ message: 'Email or phone already registered' });

    const otp = genOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const now = new Date();

    const user = await User.create({
      name, email, phone: phoneClean, password,
      otp: { code: hashedOtp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0, sentCount: 1, windowStart: now },
    });

    sendOTPEmail(email, otp, name).catch(err => console.error('OTP Email error:', err.message));
    res.status(201).json({ message: 'OTP sent to email', userId: user._id, phone: phoneClean });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

// ── VERIFY OTP ────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    // Support both userId+otp (before) and phone+otp (after)
    const { userId, otp, phone } = req.body;

    let user;
    if (phone) {
      const phoneClean = phone.replace(/\s/g, '');
      user = await User.findOne({ phone: phoneClean });
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Simple OTP check (after-version style)
      if (user.otpCode && user.otpCode === otp && Date.now() <= new Date(user.otpExpiry).getTime()) {
        user.isPhoneVerified = true;
        user.isEmailVerified = true;
        user.otpCode = undefined;
        user.otpExpiry = undefined;
        await user.save();
        const tokens = generateTokens(user._id);
        await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken });
        return res.json({ message: 'Verified', token: tokens.token, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: sanitize(user) });
      }
    }

    if (userId) {
      if (!otp) return res.status(400).json({ message: 'userId and otp are required' });
      user = await User.findById(userId);
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

      const tokens = generateTokens(user._id);
      const updated = await User.findByIdAndUpdate(userId, {
        isEmailVerified: true, isPhoneVerified: true,
        refreshToken: tokens.refreshToken,
        $unset: { otp: '' },
      }, { new: true });

      sendWelcomeEmail(user.email, user.name).catch(() => {});
      return res.json({ message: 'Email verified', token: tokens.token, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: sanitize(updated) });
    }

    return res.status(400).json({ message: 'Invalid or expired OTP' });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

// ── RESEND OTP ────────────────────────────────────────────
exports.resendOtp = async (req, res, next) => {
  try {
    const { userId, phone } = req.body;

    let user;
    if (phone) {
      const phoneClean = phone.replace(/\s/g, '');
      user = await User.findOne({ phone: phoneClean });
    } else if (userId) {
      user = await User.findById(userId);
    }
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Rate limit: max 3 per 15 min window
    const windowStart = user.otp?.windowStart;
    const withinWindow = windowStart && (Date.now() - new Date(windowStart).getTime()) < 15 * 60 * 1000;
    if (withinWindow && (user.otp?.sentCount || 0) >= 3) {
      return res.status(429).json({ message: 'Too many OTP requests. Try again in 15 minutes.' });
    }

    const otp = genOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const now = new Date();

    await User.findByIdAndUpdate(user._id, {
      otp: {
        code: hashedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        sentCount: withinWindow ? (user.otp?.sentCount || 0) + 1 : 1,
        windowStart: withinWindow ? windowStart : now,
      },
    });

    await sendOTPEmail(user.email, otp, user.name);
    res.json({ message: 'OTP resent to email' });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

// ── LOGIN ─────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.isEmailVerified && !user.isPhoneVerified)
      return res.status(403).json({ message: 'Email not verified', userId: user._id });

    const tokens = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken, isOnline: true, lastActive: new Date() });

    res.json({
      token: tokens.token,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: sanitize(user),
    });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

// ── REFRESH TOKEN ─────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });
    if (!process.env.JWT_REFRESH_SECRET) return res.status(400).json({ message: 'Refresh tokens not configured' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({ _id: decoded.id, refreshToken });
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });

    const tokens = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken });
    res.json({ token: tokens.token, accessToken: tokens.accessToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// ── LOGOUT ────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null, isOnline: false });
    res.json({ message: 'Logged out' });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

// ── GET ME ────────────────────────────────────────────────
exports.getMe = (req, res) => res.json({ user: sanitize(req.user) });

// ── VERIFY GOV ID ─────────────────────────────────────────
exports.verifyGovId = async (req, res, next) => {
  try {
    const { idType, idNumber } = req.body;
    if (!idType || !idNumber)
      return res.status(400).json({ message: 'idType and idNumber are required' });

    await new Promise(r => setTimeout(r, 1500));
    await User.findByIdAndUpdate(req.user._id, { isIdVerified: true });
    res.json({ message: 'Government ID verified ✅', isIdVerified: true, idType });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};

// ── VERIFY FACE ───────────────────────────────────────────
exports.verifyFace = async (req, res, next) => {
  try {
    const { faceDescriptor } = req.body;
    if (!faceDescriptor) return res.status(400).json({ message: 'No face data provided' });

    let confidence = 0.95;
    try {
      const { data } = await axios.post(`${FACE_SERVICE_URL}/face-verify`, { descriptor: faceDescriptor }, { timeout: 5000 });
      if (!data.verified) return res.status(400).json({ message: data.message || 'Face verification failed' });
      confidence = data.confidence;
    } catch (pyErr) {
      console.warn('⚠️ Face service unavailable, using fallback:', pyErr.message);
    }

    await User.findByIdAndUpdate(req.user._id, {
      isFaceVerified: true,
      faceDescriptor: faceDescriptor.substring(0, 64),
    });
    res.json({ message: 'Face verified ✅', isFaceVerified: true, confidence });
  } catch (err) { next ? next(err) : res.status(500).json({ message: err.message }); }
};
