const mongoose = require('mongoose');

// ─── MATCH ───────────────────────────────────────────────
const MatchSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  compatibilityScore: Number,
  matchedInterests: [String],
}, { timestamps: true });

MatchSchema.index({ users: 1, status: 1 });

// ─── EVENT ───────────────────────────────────────────────
const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 500 },
  category: { type: String, enum: ['movie', 'sports', 'food', 'music', 'hangout', 'study', 'travel', 'gaming', 'coffee', 'adventure'], required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  city: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  maxParticipants: { type: Number, default: 5, min: 2, max: 20 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
}, { timestamps: true });

EventSchema.index({ city: 1, category: 1, date: 1, status: 1 });

// ─── CHAT ─────────────────────────────────────────────────
const ChatSchema = new mongoose.Schema({
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true, maxlength: 1000 },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  lastMessage: {
    text: String,
    sender: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
  },
}, { timestamps: true });

ChatSchema.index({ participants: 1 });
ChatSchema.index({ match: 1 });

// ─── REPORT ───────────────────────────────────────────────
const ReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, enum: ['harassment', 'fake-profile', 'inappropriate', 'spam', 'safety-concern', 'other'], required: true },
  description: { type: String, maxlength: 500 },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
}, { timestamps: true });

// ─── CHECK-IN ─────────────────────────────────────────────
const CheckInSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  safetyContacts: [{ name: String, email: String }],
  status: { type: String, enum: ['active', 'safe', 'alert'], default: 'active' },
  checkInToken: String,
  expiresAt: Date,
}, { timestamps: true });

// ─── RATING ───────────────────────────────────────────────
const RatingSchema = new mongoose.Schema({
  rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rated: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  score: { type: Number, min: 1, max: 5 },
  feedback: { type: String, maxlength: 200 },
}, { timestamps: true });

module.exports = {
  Match: mongoose.model('Match', MatchSchema),
  Event: mongoose.model('Event', EventSchema),
  Chat: mongoose.model('Chat', ChatSchema),
  Report: mongoose.model('Report', ReportSchema),
  CheckIn: mongoose.model('CheckIn', CheckInSchema),
  Rating: mongoose.model('Rating', RatingSchema),
};
