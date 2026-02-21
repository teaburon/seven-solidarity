const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  username: { type: String },
  displayName: { type: String },
  avatar: { type: String },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenUpdatedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Request' }],
  responses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Response' }],
  email: { type: String },
  zipcode: { type: String },
  city: { type: String },
  state: { type: String },
  locationLabel: { type: String },
  bio: { type: String, maxlength: 500 },
  contactMethods: {
    discord: { type: String },
    email: { type: String },
    phone: { type: String },
    signal: { type: String },
    telegram: { type: String },
    other: { type: String }
  },
  // Keep contact for backward compatibility during migration
  contact: { type: String, maxlength: 200 },
  offers: [{ type: String }],
  waysToHelp: [{ type: String }],
  skills: [{ type: String }],
  openToHelp: { type: Boolean, default: true },
  
  // For future gamification features
  points: { type: Number, default: 0 },
  helpedCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', UserSchema);
