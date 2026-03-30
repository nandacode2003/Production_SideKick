const mongoose = require('mongoose');

// ─── MATCH ───────────────────────────────────────────────
const MatchSchema = new mongoose.Schema({
  // New format (requester/receiver)
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Legacy format (users array)
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending' },
  compatibilityScore: Number,
  matchedInterests: [String],
  matchScore: Number,
  interestScore: Number,
  distanceScore: Number,
  availabilityScore: Number,
  safetyScore: Number,
  chatRoomId: String,
  requesterRating: { type: Number, min: 1, max: 5 },
  receiverRating: { type: Number, min: 1, max: 5 },
}, { timestamps: true });

MatchSchema.index({ users: 1, status: 1 });
MatchSchema.index({ requester: 1, receiver: 1, status: 1 });

// ─── EVENT ───────────────────────────────────────────────
const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 500 },
  category: { type: String, enum: ['movie', 'sports', 'food', 'music', 'hangout', 'study', 'travel', 'gaming', 'coffee', 'adventure', 'rideshare', 'drive'], required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  city: { type: String },
  location: {
    city: String,
    venue: String,
    lat: Number,
    lng: Number,
  },
  date: { type: Date, required: true },
  time: { type: String },
  timeSlot: String,
  maxParticipants: { type: Number, default: 5, min: 2, max: 20 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
  isOpen: { type: Boolean, default: true },
  tags: [String],
  rideShareDetails: {
    pickupPoint: String,
    dropPoint: String,
    seatsAvailable: Number,
  },
}, { timestamps: true });

EventSchema.index({ 'location.city': 1, category: 1, date: 1 });

// ─── CHAT (legacy embedded) ───────────────────────────────
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

// ─── CHAT MESSAGE (new flat model) ────────────────────────
const ChatMessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'system'], default: 'text' },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// ─── REPORT ───────────────────────────────────────────────
const ReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: {
    type: String,
    enum: ['harassment', 'fake-profile', 'fake_profile', 'inappropriate', 'inappropriate_behavior', 'spam', 'safety-concern', 'no_show', 'other'],
    required: true,
  },
  description: { type: String, maxlength: 500 },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  adminNote: String,
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
  ChatMessage: mongoose.model('ChatMessage', ChatMessageSchema),
  Report: mongoose.model('Report', ReportSchema),
  CheckIn: mongoose.model('CheckIn', CheckInSchema),
  Rating: mongoose.model('Rating', RatingSchema),
};
