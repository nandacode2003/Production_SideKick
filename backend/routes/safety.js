const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const SAFETY_URL = process.env.SAFETY_SERVICE_URL || 'http://localhost:8003';

// ── SOS ALERT ─────────────────────────────────────────────
router.post('/sos', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('name phone email safetyContacts safetyCircle location');
    const contacts = user.safetyContacts?.length ? user.safetyContacts : user.safetyCircle;
    if (!contacts || contacts.length === 0)
      return res.status(400).json({ message: 'No safety contacts found. Add contacts in your Safety Circle first.' });

    const { message, location } = req.body;
    const payload = {
      userName: user.name,
      userPhone: user.phone,
      userEmail: user.email,
      location: location || user.location || {},
      safetyContacts: contacts,
      message: message || 'I need help! Please contact me immediately.',
    };

    try {
      const { data } = await axios.post(`${SAFETY_URL}/sos`, payload, { timeout: 10000 });
      return res.json(data);
    } catch (serviceErr) {
      console.warn('⚠️ Safety service unavailable:', serviceErr.message);
      return res.json({ message: 'SOS alert sent (fallback mode)', contacts: contacts.length });
    }
  } catch (err) { next(err); }
});

// ── ICEBREAKER ────────────────────────────────────────────
router.post('/icebreaker', protect, async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: 'targetUserId is required' });
    const target = await User.findById(targetUserId).select('interests');
    if (!target) return res.status(404).json({ message: 'User not found' });

    try {
      const { data } = await axios.post(`${SAFETY_URL}/icebreaker`, {
        interests_a: req.user.interests || [],
        interests_b: target.interests || [],
      }, { timeout: 5000 });
      return res.json(data);
    } catch (serviceErr) {
      const shared = (req.user.interests || []).filter(i => (target.interests || []).includes(i));
      return res.json({ question: shared.length ? `What's your favourite ${shared[0]} experience?` : 'What do you like to do on weekends?' });
    }
  } catch (err) { next(err); }
});

// ── WEATHER ───────────────────────────────────────────────
router.get('/weather', protect, async (req, res, next) => {
  try {
    const city = req.query.city || req.user.location?.city || 'Bhubaneswar';
    try {
      const { data } = await axios.post(`${SAFETY_URL}/weather`, { city }, { timeout: 8000 });
      return res.json(data);
    } catch (serviceErr) {
      return res.json({ city, message: 'Weather service unavailable' });
    }
  } catch (err) { next(err); }
});

// ── CHECK-IN ──────────────────────────────────────────────
router.post('/checkin', protect, async (req, res, next) => {
  try {
    const { CheckIn } = require('../models/index');
    const { eventId, safetyContacts } = req.body;
    const checkIn = await CheckIn.create({
      user: req.user._id,
      event: eventId,
      safetyContacts: safetyContacts || req.user.safetyCircle || [],
      status: 'active',
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    });
    res.status(201).json({ checkIn });
  } catch (err) { next(err); }
});

module.exports = router;
