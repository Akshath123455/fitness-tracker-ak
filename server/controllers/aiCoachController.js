import { queryAICoach } from '../services/aiCoachService.js';
import Exercise from '../models/Exercise.js';
import { findSmartSubstitutes } from '../services/exerciseSubstitutionEngine.js';
import TrainingProfile from '../models/TrainingProfile.js';

// @desc    Send message to AI Coach
// @route   POST /api/coach/chat
export const chatWithCoach = async (req, res, next) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await queryAICoach(req.user._id, message, conversationHistory || []);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Get instant exercise substitution recommendations
// @route   GET /api/coach/substitutes/:exerciseId
export const getExerciseSubstitutes = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.exerciseId);
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

    const profile = await TrainingProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const substitutes = await findSmartSubstitutes(exercise, profile);
    res.json({
      originalExercise: exercise,
      substitutes,
      userInjuries: profile.healthFlags?.injuries || [],
      equipmentAccess: profile.equipment.access,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get form cues and common mistakes for an exercise
// @route   GET /api/coach/form-cues/:slug
export const getExerciseFormCues = async (req, res, next) => {
  try {
    const exercise = await Exercise.findOne({ slug: req.params.slug });
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

    res.json({
      exerciseName: exercise.name,
      slug: exercise.slug,
      cues: exercise.cues,
      commonMistakes: exercise.commonMistakes,
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      videoUrl: exercise.videoUrl,
    });
  } catch (error) {
    next(error);
  }
};
