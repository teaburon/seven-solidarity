const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  createdAt: { type: Date, default: Date.now },
  editedAt: { type: Date }
});

const RequestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  tags: [String],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  responses: [ResponseSchema],
  createdAt: { type: Date, default: Date.now },
  editedAt: { type: Date },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  solvedOutsidePlatform: { type: Boolean, default: false },
  requestLocation: {
    city: String,
    state: String
  }
});

module.exports = mongoose.model('Request', RequestSchema);
