const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },

  // Verification
  isEmailVerified: { type: Boolean, default: false },
  isIdVerified: { type: Boolean, default: false },
  isFaceVerified: { type: Boolean, default: false },
  otp: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    windowStart: Date,
  },

  // Profile
  vibe: { type: String, enum: ['Adventurer', 'Foodie', 'Planner', 'Socialite', 'Chill One', 'Go-Getter'] },
  interests: [{ type: String }],
  city: { type: String },
  bio: { type: String, maxlength: 200 },
  availability: {
    weekdays: { type: Boolean, default: false },
    weekends: { type: Boolean, default: true },
    evenings: { type: Boolean, default: true },
  },

  // Safety
  safetyScore: { type: Number, default: 100, min: 0, max: 100 },
  reportCount: { type: Number, default: 0 },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  safetyCircle: [{ name: String, email: String, phone: String }],

  // Meta
  isOnline: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
  refreshToken: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

UserSchema.index({ email: 1 });
UserSchema.index({ city: 1 });
UserSchema.index({ interests: 1 });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
