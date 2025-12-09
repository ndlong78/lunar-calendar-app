const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
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

module.exports = mongoose.model('Holiday', holidaySchema);
