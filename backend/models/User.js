const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String },        // before-version field (hashed via pre-save)
  passwordHash: { type: String },    // after-version field

  // Verification
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isIdVerified: { type: Boolean, default: false },
  isFaceVerified: { type: Boolean, default: false },
  otp: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    windowStart: Date,
  },
  otpCode: String,
  otpExpiry: Date,

  // Profile
  age: Number,
  gender: { type: String, enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'] },
  vibe: { type: String, enum: ['Adventurer', 'Foodie', 'Planner', 'Socialite', 'Chill One', 'Go-Getter'] },
  vibeTag: String,
  interests: [{ type: String }],
  bio: { type: String, maxlength: 200 },
  profilePhoto: String,
  faceDescriptor: String,
  availability: { type: mongoose.Schema.Types.Mixed }, // supports both object and array formats
  location: {
    city: String,
    lat: Number,
    lng: Number,
  },
  city: { type: String }, // legacy field

  // Safety
  safetyScore: { type: Number, default: 100, min: 0, max: 100 },
  reportCount: { type: Number, default: 0 },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  safetyCircle: [{ name: String, email: String, phone: String }],
  safetyContacts: [{ name: String, phone: String }],

  // Meta
  isOnline: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastActive: { type: Date, default: Date.now },
  refreshToken: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

UserSchema.index({ email: 1 });
UserSchema.index({ 'location.city': 1 });
UserSchema.index({ interests: 1 });

UserSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

UserSchema.methods.matchPassword = async function (password) {
  if (this.passwordHash) return bcrypt.compare(password, this.passwordHash);
  if (this.password) return bcrypt.compare(password, this.password);
  return false;
};

module.exports = mongoose.model('User', UserSchema);
