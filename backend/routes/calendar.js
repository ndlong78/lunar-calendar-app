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

    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(date)) {
      return res.status(400).json({ message: 'Date must be in ISO format YYYY-MM-DD' });
    }

    const parsedDate = new Date(date);
    const [year, month, day] = date.split('-').map(Number);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() + 1 !== month ||
      parsedDate.getUTCDate() !== day
    ) {
      return res.status(400).json({ message: 'Invalid calendar date' });
    }

    const lunar = LunarCalendar.solarToLunar(day, month, year);
    const zodiacAnimal = LunarCalendar.getZodiacAnimal(lunar.year);
    const lunarMonthName = LunarCalendar.getLunarMonthName(lunar.month);
    const lunarDayName = LunarCalendar.getLunarDayName(lunar.day);
    const canChiYear = LunarCalendar.getHeavenlyStemBranch(lunar.year);

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
        leap: lunar.leap,
        formatted: lunar.formatted,
        dayName: lunarDayName,
        monthName: lunarMonthName,
        canChiYear
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

    const lunarYear = parseInt(year, 10);
    const lunarMonth = parseInt(month, 10);
    const lunarDay = parseInt(day, 10);

    if ([lunarYear, lunarMonth, lunarDay].some(value => Number.isNaN(value))) {
      return res.status(400).json({ message: 'Year, month and day must be numbers' });
    }

    const solar = LunarCalendar.lunarToSolar(lunarYear, lunarMonth, lunarDay);

    if (!solar) {
      return res.status(400).json({ message: 'Invalid lunar date or leap month mismatch' });
    }

    res.json({
      lunar: {
        year: lunarYear,
        month: lunarMonth,
        day: lunarDay,
        formatted: `${lunarDay}/${lunarMonth}/${lunarYear}`
      },
      solar: {
        year: solar.year,
        month: solar.month,
        day: solar.day,
        formatted: solar.formatted
      },
      zodiacAnimal: LunarCalendar.getZodiacAnimal(lunarYear)
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

const validateHolidayPayload = (payload, { partial = false } = {}) => {
  const errors = [];
  const { name_vi, name_en, solarDate, lunarDate, type } = payload;

  if (!partial || name_vi !== undefined) {
    if (!name_vi || typeof name_vi !== 'string' || !name_vi.trim()) {
      errors.push('name_vi is required and must be a non-empty string');
    }
  }

  if (!partial || name_en !== undefined) {
    if (!name_en || typeof name_en !== 'string' || !name_en.trim()) {
      errors.push('name_en is required and must be a non-empty string');
    }
  }

  if (!partial || type !== undefined) {
    if (!['solar', 'lunar'].includes(type)) {
      errors.push('type must be either "solar" or "lunar"');
    }
  }

  const datePattern = /^\d{2}-\d{2}$/;
  const isValidMonthDay = (value, maxDay = 31) => {
    if (!datePattern.test(value)) return false;
    const [mm, dd] = value.split('-').map(Number);
    return mm >= 1 && mm <= 12 && dd >= 1 && dd <= maxDay;
  };

  const effectiveType = type;

  if (!partial || solarDate !== undefined || lunarDate !== undefined) {
    if (partial && effectiveType === undefined && (solarDate !== undefined || lunarDate !== undefined)) {
      errors.push('type is required when updating solarDate or lunarDate');
    }

    if (effectiveType === 'solar') {
      if (!solarDate || !isValidMonthDay(solarDate, 31)) {
        errors.push('solarDate must be in MM-DD format with valid month/day');
      }
    }

    if (effectiveType === 'lunar') {
      if (!lunarDate || !isValidMonthDay(lunarDate, 30)) {
        errors.push('lunarDate must be in MM-DD format with valid lunar month/day');
      }
    }
  }

  return errors;
};

// Add holiday (admin only)
router.post('/holidays', verifyAdmin, async (req, res, next) => {
  try {
    const errors = validateHolidayPayload(req.body, { partial: false });
    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const { name_vi, name_en, solarDate, lunarDate, type } = req.body;

    const holiday = new Holiday({
      name_vi: name_vi.trim(),
      name_en: name_en.trim(),
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
    const errors = validateHolidayPayload(req.body, { partial: true });
    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

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