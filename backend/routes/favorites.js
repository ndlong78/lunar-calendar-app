const express = require('express');
const Favorite = require('../models/Favorite');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get user favorites
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json({ favorites });
  } catch (error) {
    next(error);
  }
});

const isValidIsoDate = value => {
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRegex.test(value)) return false;
  const parsed = new Date(value);
  const [y, m, d] = value.split('-').map(Number);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getUTCFullYear() === y &&
    parsed.getUTCMonth() + 1 === m &&
    parsed.getUTCDate() === d
  );
};

// Add favorite
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { date, solarDate, lunarDate, note } = req.body;

    const errors = [];

    let parsedDate;
    if (date !== undefined) {
      if (typeof date !== 'string' || !isValidIsoDate(date)) {
        errors.push('date must be a valid ISO string (YYYY-MM-DD)');
      } else {
        parsedDate = new Date(date);
      }
    }

    if (solarDate !== undefined && (typeof solarDate !== 'string' || !isValidIsoDate(solarDate))) {
      errors.push('solarDate must be a valid ISO string (YYYY-MM-DD)');
    }

    if (lunarDate !== undefined && (typeof lunarDate !== 'string' || !lunarDate.trim())) {
      errors.push('lunarDate must be a non-empty string');
    }

    if (note !== undefined) {
      if (typeof note !== 'string') {
        errors.push('note must be a string');
      } else if (note.length > 255) {
        errors.push('note must not exceed 255 characters');
      }
    }

    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const favorite = new Favorite({
      userId: req.userId,
      date: parsedDate,
      solarDate,
      lunarDate,
      note
    });

    await favorite.save();
    res.status(201).json({ message: 'Favorite saved', favorite });
  } catch (error) {
    next(error);
  }
});

// Delete favorite
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const favorite = await Favorite.findById(req.params.id);

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    if (favorite.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Favorite.findByIdAndDelete(req.params.id);
    res.json({ message: 'Favorite deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;