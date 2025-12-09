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

// Add favorite
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { date, solarDate, lunarDate, note } = req.body;

    const favorite = new Favorite({
      userId: req.userId,
      date: new Date(date),
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