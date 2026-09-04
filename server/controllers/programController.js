import Program from '../models/Program.js';
import TrainingProfile from '../models/TrainingProfile.js';
import Exercise from '../models/Exercise.js';
import { generatePeriodizedProgram } from '../services/periodizationEngine.js';
import { findSmartSubstitutes } from '../services/exerciseSubstitutionEngine.js';
import { analyzePerformanceAndRecommendAdjustments, applyAdaptationToProgram } from '../services/progressiveOverloadEngine.js';

// @desc    Get current active workout program
// @route   GET /api/programs/active
export const getActiveProgram = async (req, res, next) => {
  try {
    let program = await Program.findOne({ userId: req.user._id, isActive: true });

    if (!program) {
      const profile = await TrainingProfile.findOne({ userId: req.user._id });
      if (profile) {
        const generated = await generatePeriodizedProgram(profile);
        program = await Program.create({ ...generated, userId: req.user._id });
      }
    }

    if (!program) {
      return res.status(404).json({ error: 'No active program. Please complete profile intake.' });
    }

    // Get current week and today's workout
    const currentWeek = program.weeks.find((w) => w.weekNumber === program.currentWeekNumber) || program.weeks[0];
    const currentDay = currentWeek?.days.find((d) => d.dayNumber === program.currentDayNumber) || currentWeek?.days[0];

    // Fetch AI performance adaptations
    const adaptations = await analyzePerformanceAndRecommendAdjustments(req.user._id);

    res.json({
      program,
      currentWeek,
      currentDay,
      adaptations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate program with new options or periodization
// @route   POST /api/programs/regenerate
export const regenerateProgram = async (req, res, next) => {
  try {
    const profile = await TrainingProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    if (req.body.periodizationPreference) {
      profile.schedule.periodizationPreference = req.body.periodizationPreference;
      await profile.save();
    }

    // Deactivate existing programs
    await Program.updateMany({ userId: req.user._id }, { isActive: false });

    const newProgramData = await generatePeriodizedProgram(profile);
    const newProgram = await Program.create({
      ...newProgramData,
      userId: req.user._id,
    });

    res.status(201).json({
      program: newProgram,
      message: 'New periodized program successfully generated and activated!',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Swap exercise in active program
// @route   POST /api/programs/swap-exercise
export const swapProgramExercise = async (req, res, next) => {
  try {
    const { oldExerciseId, newExerciseId } = req.body;
    const program = await Program.findOne({ userId: req.user._id, isActive: true });
    if (!program) return res.status(404).json({ error: 'Active program not found' });

    const newExDoc = await Exercise.findById(newExerciseId);
    if (!newExDoc) return res.status(404).json({ error: 'Replacement exercise not found' });

    let replacedCount = 0;
    for (const week of program.weeks) {
      for (const day of week.days) {
        for (const ex of day.exercises) {
          if (ex.exerciseId.toString() === oldExerciseId.toString()) {
            ex.exerciseId = newExDoc._id;
            ex.exerciseName = newExDoc.name;
            ex.slug = newExDoc.slug;
            ex.movementPattern = newExDoc.movementPattern;
            ex.tier = newExDoc.tier;
            ex.notes = `Substituted for ${newExDoc.name}`;
            replacedCount++;
          }
        }
      }
    }

    program.adaptationHistory.push({
      triggerType: 'coach_swap',
      message: `Substituted exercise with ${newExDoc.name}.`,
      date: new Date(),
    });

    await program.save();
    res.json({ program, message: `Successfully substituted ${replacedCount} exercise instances.` });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply adaptation payload
// @route   POST /api/programs/adapt
export const applyAdaptation = async (req, res, next) => {
  try {
    const result = await applyAdaptationToProgram(req.user._id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
