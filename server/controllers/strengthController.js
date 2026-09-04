import StrengthStandard from '../models/StrengthStandard.js';
import TrainingProfile from '../models/TrainingProfile.js';
import WorkoutLog from '../models/WorkoutLog.js';
import { calculate1RM, calculateLiftPercentile, evaluateTrainingProfileMetrics } from '../services/strengthBenchmarkEngine.js';

// @desc    Calculate hypothetical 1RM and percentile for an arbitrary input
// @route   POST /api/strength/estimate
export const estimate1RMAndPercentile = async (req, res, next) => {
  try {
    const { exerciseKey, weightKg, reps, sex, age, bodyWeightKg } = req.body;

    const e1rm = calculate1RM(weightKg, reps, 'hybrid');
    const percentile = calculateLiftPercentile(exerciseKey, e1rm, sex, age, bodyWeightKg);

    res.json({
      exerciseKey,
      weightKg,
      reps,
      estimated1RM: e1rm,
      percentile,
      bodyWeightRatio: bodyWeightKg ? Math.round((e1rm / bodyWeightKg) * 100) / 100 : 0,
      disclaimer: 'Calculated using empirical normative models (Epley/Brzycki + IPF population distribution). Not a clinical diagnostic.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's radar chart & cohort benchmark breakdown
// @route   GET /api/strength/benchmarks
export const getStrengthBenchmarks = async (req, res, next) => {
  try {
    const profile = await TrainingProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const evaluated = evaluateTrainingProfileMetrics(profile);
    const standards = await StrengthStandard.find().lean();

    // Radar chart formatted points
    const radarData = [
      { subject: 'Squat', percentile: evaluated.percentiles.squat || 50, valueKg: profile.liftBaselines?.squat?.oneRepMax || 0, fullMark: 100 },
      { subject: 'Bench Press', percentile: evaluated.percentiles.bench_press || 50, valueKg: profile.liftBaselines?.bench_press?.oneRepMax || 0, fullMark: 100 },
      { subject: 'Deadlift', percentile: evaluated.percentiles.deadlift || 50, valueKg: profile.liftBaselines?.deadlift?.oneRepMax || 0, fullMark: 100 },
      { subject: 'Overhead Press', percentile: evaluated.percentiles.overhead_press || 50, valueKg: profile.liftBaselines?.overhead_press?.oneRepMax || 0, fullMark: 100 },
      { subject: 'Pull-Up', percentile: evaluated.percentiles.pull_up || 50, valueKg: profile.liftBaselines?.pull_up?.oneRepMax || 0, fullMark: 100 },
      { subject: 'Barbell Row', percentile: evaluated.percentiles.barbell_row || 50, valueKg: profile.liftBaselines?.barbell_row?.oneRepMax || 0, fullMark: 100 },
    ];

    res.json({
      strengthScore: evaluated.strengthScore,
      dotsScore: evaluated.dotsScore,
      percentiles: evaluated.percentiles,
      radarData,
      demographicCohort: evaluated.cohortInfo,
      standards,
      citationNotice: {
        source: 'ExRx / Dr. Lon Kilgore & Mark Rippetoe normative tables + IPF regression equations',
        limitations: 'Normative reference baselines reflect athletic distributions. Actual individual leverages, limb lengths, and injury histories modify individual trajectories.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get historical 1RM trendlines across logged workouts
// @route   GET /api/strength/history
export const getStrengthHistory = async (req, res, next) => {
  try {
    const logs = await WorkoutLog.find({ userId: req.user._id, status: 'completed' })
      .sort({ date: 1 })
      .lean();

    const historyByExercise = {
      squat: [],
      bench_press: [],
      deadlift: [],
      overhead_press: [],
    };

    for (const log of logs) {
      for (const ex of log.exercises || []) {
        const nameLow = ex.exerciseName.toLowerCase();
        let key = null;
        if (nameLow.includes('squat')) key = 'squat';
        else if (nameLow.includes('bench')) key = 'bench_press';
        else if (nameLow.includes('deadlift')) key = 'deadlift';
        else if (nameLow.includes('press') || nameLow.includes('ohp')) key = 'overhead_press';

        if (key && historyByExercise[key]) {
          const maxE1RM = Math.max(...(ex.sets || []).map((s) => s.estimated1RM || 0));
          if (maxE1RM > 0) {
            historyByExercise[key].push({
              date: log.date.toISOString().split('T')[0],
              estimated1RM: maxE1RM,
              workoutName: log.workoutName,
            });
          }
        }
      }
    }

    res.json({ historyByExercise });
  } catch (error) {
    next(error);
  }
};
