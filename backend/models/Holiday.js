const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  code: {
    type: String,
    index: true
  },
  name_vi: {
    type: String,
    required: true
  },
  name_en: {
    type: String,
    required: true
  },
  solarDate: String,
  lunarDate: String,
  type: {
    type: String,
    enum: ['solar', 'lunar'],
    required: true
  },
  is_public_holiday: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: []
  },
  description_vi: String,
  description_en: String,
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
// Compound indexes for efficient filtering
holidaySchema.index({ type: 1, active: 1 }); // For filtered queries
holidaySchema.index({ active: 1, createdAt: -1 }); // For admin dashboard
holidaySchema.index({ code: 1 }, { unique: true, sparse: true }); // Unique codes

module.exports = mongoose.model('Holiday', holidaySchema);
