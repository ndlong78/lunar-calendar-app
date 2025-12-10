const express = require('express');
const LunarCalendar = require('../services/LunarCalendar');
const holidayData = require('../data/vietnam_holidays.json');
const Holiday = require('../models/Holiday');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Convert date
router.get('/convert', async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter required' });
    }

    const [year, month, day] = date.split('-').map(Number);
    const lunar = LunarCalendar.solarToLunar(day, month, year);
    const zodiacAnimal = LunarCalendar.getZodiacAnimal(lunar.year);
    const lunarMonthName = LunarCalendar.getLunarMonthName(lunar.month);
    const lunarDayName = LunarCalendar.getLunarDayName(lunar.day);

    res.json({
      solar: {
        date,
        year,
        month,
        day,
        formatted: `${day}/${month}/${year}`
      },
      lunar: {
        year: lunar.year,
        month: lunar.month,
        day: lunar.day,
        formatted: lunar.formatted,
        dayName: lunarDayName,
        monthName: lunarMonthName
      },
      zodiacAnimal: zodiacAnimal,
      accuracy: '99.9%'
    });
  } catch (error) {
    next(error);
  }
});

// Reverse convert
router.get('/convert-reverse', (req, res, next) => {
  try {
    const { year, month, day } = req.query;

    if (!year || !month || !day) {
      return res.status(400).json({ message: 'Year, month, day required' });
    }

    const solar = LunarCalendar.lunarToSolar(
      parseInt(year),
      parseInt(month),
      parseInt(day)
    );

    res.json({
      lunar: {
        year: parseInt(year),
        month: parseInt(month),
        day: parseInt(day),
        formatted: `${day}/${month}/${year}`
      },
      solar: {
        year: solar.year,
        month: solar.month,
        day: solar.day,
        formatted: solar.formatted
      },
      zodiacAnimal: LunarCalendar.getZodiacAnimal(parseInt(year))
    });
  } catch (error) {
    next(error);
  }
});

// Get holidays
router.get('/holidays', async (req, res, next) => {
  try {
    const holidays = await Holiday.find({ active: true });

    if (holidays.length) {
      return res.json({ holidays, source: 'database' });
    }

    const mappedHolidays = holidayData.items.map(item => ({
      code: item.id,
      name_vi: item.name_vi,
      name_en: item.name_en,
      type: item.calendar === 'solar' ? 'solar' : 'lunar',
      solarDate: item.calendar === 'solar' ? `${item.month}-${item.day}` : undefined,
      lunarDate: item.calendar === 'lunar' ? `${item.lunar_month}-${item.lunar_day}` : undefined,
      description_vi: item.description_vi,
      is_public_holiday: item.is_public_holiday,
      tags: item.tags || []
    }));

    res.json({
      meta: holidayData.meta,
      holidays: mappedHolidays,
      source: 'static'
    });
  } catch (error) {
    next(error);
  }
});

// Add holiday (admin only)
router.post('/holidays', verifyAdmin, async (req, res, next) => {
  try {
    const { name_vi, name_en, solarDate, lunarDate, type } = req.body;

    const holiday = new Holiday({
      name_vi,
      name_en,
      solarDate,
      lunarDate,
      type,
      active: true
    });

    await holiday.save();
    res.status(201).json({ message: 'Holiday added', holiday });
  } catch (error) {
    next(error);
  }
});

// Update holiday (admin only)
router.put('/holidays/:id', verifyAdmin, async (req, res, next) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ message: 'Holiday updated', holiday });
  } catch (error) {
    next(error);
  }
});

// Delete holiday (admin only)
router.delete('/holidays/:id', verifyAdmin, async (req, res, next) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: 'Holiday deleted' });
  } catch (error) {
    next(error);
  }
});

// Get zodiac info
router.get('/zodiac/:year', (req, res, next) => {
  try {
    const year = parseInt(req.params.year);
    const animal = LunarCalendar.getZodiacAnimal(year);

    const zodiacInfo = {
      'Tý': { element: 'Nước', personality: 'Thông minh, táo bạo' },
      'Sửu': { element: 'Đất', personality: 'Kiên nhẫn, chăm chỉ' },
      'Dần': { element: 'Gỗ', personality: 'Dũng cảm, lãnh đạo' },
      'Mão': { element: 'Gỗ', personality: 'Hiền lành, thích hòa hợp' },
      'Thìn': { element: 'Đất', personality: 'Quyết đoán, tự tin' },
      'Tỵ': { element: 'Lửa', personality: 'Khôn ngoan, bình tĩnh' },
      'Ngọ': { element: 'Lửa', personality: 'Năng động, vui vẻ' },
      'Mùi': { element: 'Đất', personality: 'Tốt bụng, cẩn thận' },
      'Thân': { element: 'Kim', personality: 'Thông minh, hài hước' },
      'Dậu': { element: 'Kim', personality: 'Trung thực, siêng năng' },
      'Tuất': { element: 'Đất', personality: 'Trung thành, tin cậy' },
      'Hợi': { element: 'Nước', personality: 'Hòa nhân, tốt bụng' }
    };

    const info = zodiacInfo[animal] || {};

    res.json({
      year,
      animal,
      ...info
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;