import TrainingProfile from '../models/TrainingProfile.js';
import LeaderboardEntry from '../models/LeaderboardEntry.js';
import { evaluateTrainingProfileMetrics, getCohortKey } from '../services/strengthBenchmarkEngine.js';
import { generatePeriodizedProgram } from '../services/periodizationEngine.js';
import Program from '../models/Program.js';

// @desc    Get user's training profile
// @route   GET /api/profile
export const getProfile = async (req, res, next) => {
  try {
    const profile = await TrainingProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ error: 'Training profile not found. Complete onboarding first.' });
    }
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update full training profile (Onboarding intake)
// @route   POST /api/profile
export const saveProfile = async (req, res, next) => {
  try {
    const { demographics, goals, schedule, equipment, healthFlags, liftBaselines } = req.body;

    if (!demographics || !goals || !schedule || !equipment) {
      return res.status(400).json({ error: 'Incomplete intake profile data provided' });
    }

    // Evaluate strength metrics & percentiles server-side
    const evaluated = evaluateTrainingProfileMetrics({ demographics, liftBaselines: liftBaselines || {} });

    let profile = await TrainingProfile.findOne({ userId: req.user._id });

    const profileData = {
      userId: req.user._id,
      demographics,
      goals,
      schedule,
      equipment,
      healthFlags: {
        ...healthFlags,
        medicalDisclaimerAccepted: true,
        disclaimerAcceptedAt: new Date(),
      },
      liftBaselines: liftBaselines || {},
      compositeMetrics: {
        strengthScore: evaluated.strengthScore,
        wilksScore: evaluated.dotsScore,
        dotsScore: evaluated.dotsScore,
        cohortPercentiles: evaluated.percentiles,
        demographicCohortKey: evaluated.cohortInfo.cohortKey,
        lastAssessmentDate: new Date(),
        nextAssessmentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    };

    if (profile) {
      profile.set(profileData);
      await profile.save();
    } else {
      profile = await TrainingProfile.create(profileData);
    }

    // Synchronize Leaderboard Entry
    await LeaderboardEntry.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        displayName: req.user.name,
        avatarUrl: req.user.avatarUrl,
        cohortKey: evaluated.cohortInfo.cohortKey,
        demographics: {
          ageBand: evaluated.cohortInfo.ageBand,
          sex: evaluated.cohortInfo.sex,
          weightClassKg: evaluated.cohortInfo.weightBand,
          experienceLevel: demographics.experienceLevel,
        },
        strengthScore: evaluated.strengthScore,
        dotsScore: evaluated.dotsScore,
        liftMaxesKg: {
          squat: liftBaselines?.squat?.oneRepMax || 0,
          bench_press: liftBaselines?.bench_press?.oneRepMax || 0,
          deadlift: liftBaselines?.deadlift?.oneRepMax || 0,
          overhead_press: liftBaselines?.overhead_press?.oneRepMax || 0,
        },
        isOptedIn: req.user.privacy?.shareCohortLeaderboard ?? true,
        isAnonymized: req.user.privacy?.anonymizeLeaderboardName ?? false,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    // Auto-generate Periodized Program if none exists or newly onboarding
    let activeProgram = await Program.findOne({ userId: req.user._id, isActive: true });
    if (!activeProgram) {
      const generated = await generatePeriodizedProgram(profile);
      activeProgram = await Program.create({
        ...generated,
        userId: req.user._id,
      });
    }

    res.status(201).json({
      profile,
      activeProgram,
      metrics: evaluated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Re-assessment endpoint (Triggered every 4-6 weeks)
// @route   POST /api/profile/reassess
export const submitReassessment = async (req, res, next) => {
  try {
    const { bodyWeightKg, liftBaselines } = req.body;
    const profile = await TrainingProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    if (bodyWeightKg) {
      profile.demographics.bodyWeightKg = bodyWeightKg;
    }

    if (liftBaselines) {
      profile.liftBaselines = { ...profile.liftBaselines, ...liftBaselines };
    }

    const evaluated = evaluateTrainingProfileMetrics({
      demographics: profile.demographics,
      liftBaselines: profile.liftBaselines,
    });

    profile.compositeMetrics = {
      ...profile.compositeMetrics,
      strengthScore: evaluated.strengthScore,
      dotsScore: evaluated.dotsScore,
      cohortPercentiles: evaluated.percentiles,
      lastAssessmentDate: new Date(),
      nextAssessmentDueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    };

    await profile.save();

    // Update Leaderboard
    await LeaderboardEntry.findOneAndUpdate(
      { userId: req.user._id },
      {
        strengthScore: evaluated.strengthScore,
        dotsScore: evaluated.dotsScore,
        liftMaxesKg: {
          squat: profile.liftBaselines?.squat?.oneRepMax || 0,
          bench_press: profile.liftBaselines?.bench_press?.oneRepMax || 0,
          deadlift: profile.liftBaselines?.deadlift?.oneRepMax || 0,
          overhead_press: profile.liftBaselines?.overhead_press?.oneRepMax || 0,
        },
        lastUpdated: new Date(),
      }
    );

    res.json({
      profile,
      metrics: evaluated,
      message: 'Re-assessment complete! Your strength score and percentile rankings have updated.',
    });
  } catch (error) {
    next(error);
  }
};
