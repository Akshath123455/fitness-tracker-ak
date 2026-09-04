import express from 'express';
import Exercise from '../models/Exercise.js';

const router = express.Router();

// @desc    Get all exercises with optional category/movementPattern query
// @route   GET /api/exercises
router.get('/', async (req, res, next) => {
  try {
    const { category, movementPattern, equipment } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (movementPattern) filter.movementPattern = movementPattern;
    if (equipment) filter.equipmentRequired = equipment;

    const exercises = await Exercise.find(filter).sort({ tier: 1, name: 1 });
    res.json(exercises);
  } catch (error) {
    next(error);
  }
});

// @desc    Get single exercise by ID or slug
// @route   GET /api/exercises/:identifier
router.get('/:identifier', async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let exercise = await Exercise.findOne({ slug: identifier });
    if (!exercise && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      exercise = await Exercise.findById(identifier);
    }

    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
    res.json(exercise);
  } catch (error) {
    next(error);
  }
});

export default router;
