const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password -passwordHash -otp -otpCode -refreshToken');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.status(401).json({ message: msg });
  }
};

const generateTokens = (userId) => ({
  token: jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' }),
  accessToken: jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' }),
  refreshToken: process.env.JWT_REFRESH_SECRET
    ? jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' })
    : null,
});

module.exports = { protect, generateTokens };
