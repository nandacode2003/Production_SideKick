const crypto = require('crypto');
const { CheckIn, Event } = require('../models/index');
const User = require('../models/User');
const { sendSafetyCircleEmail, sendSafetyAlertEmail } = require('../utils/emailService');

exports.createCheckIn = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const user = await User.findById(req.user._id);
    if (!user.safetyCircle?.length) return res.status(400).json({ message: 'No safety circle contacts set up' });

    const checkInToken = crypto.randomUUID();
    const expiresAt = new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000);

    const checkIn = await CheckIn.create({
      user: req.user._id,
      event: eventId,
      safetyContacts: user.safetyCircle.map(c => ({ name: c.name, email: c.email })),
      checkInToken,
      expiresAt,
    });

    const checkInLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/safe/${checkInToken}`;
    user.safetyCircle.forEach(contact => {
      if (contact.email) {
        sendSafetyCircleEmail(contact.email, user.name, event.title, event.location, checkInLink).catch(() => {});
      }
    });

    res.status(201).json({ message: 'Safety circle notified', checkInId: checkIn._id });
  } catch (err) { next(err); }
};

exports.confirmSafe = async (req, res, next) => {
  try {
    const checkIn = await CheckIn.findOne({ checkInToken: req.params.token });
    if (!checkIn) return res.status(404).json({ message: 'Check-in not found' });
    checkIn.status = 'safe';
    await checkIn.save();
    res.json({ message: "Glad you're safe! 🎉" });
  } catch (err) { next(err); }
};

// Background job — run every 15 minutes
const runAlertJob = async () => {
  try {
    const expired = await CheckIn.find({ status: 'active', expiresAt: { $lt: new Date() } })
      .populate('user', 'name');
    for (const checkIn of expired) {
      checkIn.status = 'alert';
      await checkIn.save();
      checkIn.safetyContacts.forEach(contact => {
        if (contact.email) {
          sendSafetyAlertEmail(contact.email, checkIn.user?.name || 'Your contact').catch(() => {});
        }
      });
    }
  } catch (err) {
    console.error('Safety alert job error:', err.message);
  }
};

setInterval(runAlertJob, 15 * 60 * 1000);
