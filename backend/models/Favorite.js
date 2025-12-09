const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: Date,
  solarDate: String,
  lunarDate: String,
  note: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

favoriteSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
