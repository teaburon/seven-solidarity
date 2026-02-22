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
  zipcode: { type: String },
  city: { type: String },
  state: { type: String },
  locationUpdatedAt: { type: Date },
  locationLabel: { type: String },
  bio: { type: String, maxlength: 500 },
  contactMethods: [{
    label: { type: String, maxlength: 50 },
    value: { type: String, maxlength: 100 }
  }],
  allowDiscordContact: { type: Boolean, default: false },
  skills: [{ type: String }],
  offers: [{ type: String }],
  openToHelp: { type: Boolean, default: true },
  
  // For future gamification features
  points: { type: Number, default: 0 },
  helpedCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', UserSchema);
