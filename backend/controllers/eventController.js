const { Event } = require('../models/index');
const User = require('../models/User');
const { sendEventJoinedEmail, sendSafetyCircleEmail } = require('../utils/emailService');

exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, category, city, location, date, time, maxParticipants } = req.body;
    if (!title || !category || !city || !location || !date || !time)
      return res.status(400).json({ message: 'title, category, city, location, date, time are required' });
    if (new Date(date) < new Date())
      return res.status(400).json({ message: 'Event date must be in the future' });

    const event = await Event.create({
      title, description, category, city, location, date, time,
      maxParticipants: maxParticipants || 5,
      creator: req.user._id,
      participants: [req.user._id],
    });
    res.status(201).json({ event });
  } catch (err) { next(err); }
};

exports.getEvents = async (req, res, next) => {
  try {
    const { city, category, status = 'upcoming', page = 1, limit = 10 } = req.query;
    const filter = { status, date: { $gte: new Date() } };
    if (city) filter.city = city;
    else if (req.user.city) filter.city = req.user.city;
    if (category) filter.category = category;

    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .populate('creator', 'name vibe')
      .populate('participants', 'name vibe')
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ events, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'name vibe isIdVerified isFaceVerified')
      .populate('participants', 'name vibe isIdVerified isFaceVerified');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ event });
  } catch (err) { next(err); }
};

exports.getMyCreated = async (req, res, next) => {
  try {
    const events = await Event.find({ creator: req.user._id }).sort({ date: -1 });
    res.json({ events });
  } catch (err) { next(err); }
};

exports.getMyJoined = async (req, res, next) => {
  try {
    const events = await Event.find({ participants: req.user._id }).sort({ date: -1 });
    res.json({ events });
  } catch (err) { next(err); }
};

exports.joinEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'upcoming') return res.status(400).json({ message: 'Event is not open for joining' });
    if (new Date(event.date) < new Date()) return res.status(400).json({ message: 'Event has already passed' });
    if (event.participants.includes(req.user._id)) return res.status(400).json({ message: 'Already joined' });
    if (event.participants.length >= event.maxParticipants) return res.status(400).json({ message: 'Event is full' });

    event.participants.push(req.user._id);
    await event.save();

    // Send confirmation email
    sendEventJoinedEmail(req.user.email, event.title, event.date, event.location).catch(() => {});

    // Notify safety circle
    const user = await User.findById(req.user._id);
    if (user.safetyCircle?.length) {
      const checkInLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/safe/preview`;
      user.safetyCircle.forEach(contact => {
        if (contact.email) {
          sendSafetyCircleEmail(contact.email, user.name, event.title, event.location, checkInLink).catch(() => {});
        }
      });
    }

    const populated = await event.populate('creator', 'name vibe');
    res.json({ event: populated });
  } catch (err) { next(err); }
};

exports.leaveEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.creator.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'Creator cannot leave. Delete the event instead.' });

    event.participants = event.participants.filter(p => p.toString() !== req.user._id.toString());
    await event.save();
    res.json({ message: 'Left event', event });
  } catch (err) { next(err); }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only creator can delete this event' });

    event.status = 'cancelled';
    await event.save();
    res.json({ message: 'Event cancelled' });
  } catch (err) { next(err); }
};
