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

// Additional indexes for query optimization
favoriteSchema.index({ userId: 1, createdAt: -1 }); // For sorted queries
favoriteSchema.index({ userId: 1, date: 1 }, { unique: true }); // Prevent duplicate favorites

module.exports = mongoose.model('Favorite', favoriteSchema);
