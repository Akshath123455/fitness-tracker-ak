import WorkoutLog from '../models/WorkoutLog.js';
import TrainingProfile from '../models/TrainingProfile.js';
import User from '../models/User.js';
import { calculate1RM, evaluateTrainingProfileMetrics } from '../services/strengthBenchmarkEngine.js';

// @desc    Log a completed workout session
// @route   POST /api/workouts
export const logWorkout = async (req, res, next) => {
  try {
    const {
      programId,
      workoutName,
      weekNumber,
      dayNumber,
      durationSeconds,
      overallRpe,
      fatigueRating,
      exercises,
      notes,
      clientSyncId,
    } = req.body;

    // Check idempotency if clientSyncId provided
    if (clientSyncId) {
      const existing = await WorkoutLog.findOne({ clientSyncId, userId: req.user._id });
      if (existing) {
        return res.json({ workout: existing, message: 'Already logged (synced from offline queue)' });
      }
    }

    const profile = await TrainingProfile.findOne({ userId: req.user._id });
    const user = await User.findById(req.user._id);

    let totalVolumeKg = 0;
    let totalReps = 0;
    let totalSetsCompleted = 0;
    const prsAchieved = [];

    // Process exercises and calculate e1RM per set
    const processedExercises = (exercises || []).map((ex) => {
      const processedSets = (ex.sets || []).map((s) => {
        const e1rm = calculate1RM(s.weightKg, s.reps, 'hybrid');
        if (s.completed && !s.isWarmup) {
          totalVolumeKg += (s.weightKg || 0) * (s.reps || 0);
          totalReps += s.reps || 0;
          totalSetsCompleted += 1;
        }
        return {
          ...s,
          estimated1RM: e1rm,
        };
      });

      // Check for personal record against profile baseline
      const maxSetE1RM = Math.max(...processedSets.map((s) => s.estimated1RM || 0));
      const exSlug = ex.slug || ex.exerciseName.toLowerCase().replace(/\s+/g, '_');

      if (profile && profile.liftBaselines && profile.liftBaselines[exSlug]) {
        const current1RM = profile.liftBaselines[exSlug].oneRepMax || 0;
        if (maxSetE1RM > current1RM && current1RM > 0) {
          const prText = `New 1RM Record on ${ex.exerciseName}: ${maxSetE1RM.toFixed(1)}kg (+${(maxSetE1RM - current1RM).toFixed(1)}kg)`;
          prsAchieved.push(prText);
          profile.liftBaselines[exSlug].oneRepMax = maxSetE1RM;
          profile.liftBaselines[exSlug].lastUpdated = new Date();
        }
      }

      return {
        ...ex,
        sets: processedSets,
        personalRecordsAchieved: prsAchieved,
      };
    });

    const workout = await WorkoutLog.create({
      userId: req.user._id,
      programId: programId || null,
      clientSyncId,
      workoutName: workoutName || 'Custom Training Session',
      weekNumber: weekNumber || 1,
      dayNumber: dayNumber || 1,
      date: new Date(),
      durationSeconds: durationSeconds || 3600,
      overallRpe: overallRpe || 8,
      fatigueRating: fatigueRating || 5,
      status: 'completed',
      exercises: processedExercises,
      metrics: {
        totalVolumeKg: Math.round(totalVolumeKg),
        totalReps,
        totalSetsCompleted,
        avgIntensityRpe: overallRpe || 8,
        newPRCount: prsAchieved.length,
      },
      notes: notes || '',
    });

    // Update streak
    const now = new Date();
    let currentStreak = user.streak?.current || 0;
    const lastActive = user.streak?.lastActiveDate ? new Date(user.streak.lastActiveDate) : null;

    if (!lastActive) {
      currentStreak = 1;
    } else {
      const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 3600);
      if (diffHours >= 20 && diffHours <= 48) {
        currentStreak += 1;
      } else if (diffHours > 48) {
        currentStreak = 1;
      }
    }

    user.streak = {
      current: currentStreak,
      longest: Math.max(currentStreak, user.streak?.longest || 0),
      lastActiveDate: now,
    };

    // Check for badge unlocks
    const unlockedBadges = [];
    const hasBadge = (id) => user.badges.some((b) => b.badgeId === id);

    if (currentStreak >= 7 && !hasBadge('streak_7')) {
      user.badges.push({ badgeId: 'streak_7', title: '7-Day Streak', description: 'One full week of consistency', icon: 'zap' });
      unlockedBadges.push('7-Day Consistency Streak');
    }
    if (currentStreak >= 14 && !hasBadge('streak_14')) {
      user.badges.push({ badgeId: 'streak_14', title: '14-Day Streak', description: 'Two full weeks unbroken', icon: 'zap' });
      unlockedBadges.push('14-Day Consistency Streak');
    }
    if (prsAchieved.length > 0 && !hasBadge('first_pr')) {
      user.badges.push({ badgeId: 'first_pr', title: 'PR Shatterer', description: 'Achieved a new personal best', icon: 'trophy' });
      unlockedBadges.push('PR Shatterer');
    }

    await user.save();

    // If baseline updated, re-evaluate profile score
    if (profile && prsAchieved.length > 0) {
      const evaluated = evaluateTrainingProfileMetrics(profile);
      profile.compositeMetrics.strengthScore = evaluated.strengthScore;
      profile.compositeMetrics.dotsScore = evaluated.dotsScore;
      profile.compositeMetrics.cohortPercentiles = evaluated.percentiles;
      await profile.save();
    }

    res.status(201).json({
      workout,
      prsAchieved,
      unlockedBadges,
      streak: user.streak,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Batch sync offline queued workouts
// @route   POST /api/workouts/sync-offline
export const syncOfflineWorkouts = async (req, res, next) => {
  try {
    const { queue } = req.body;
    if (!Array.isArray(queue) || queue.length === 0) {
      return res.json({ syncedCount: 0, message: 'Queue is empty' });
    }

    let syncedCount = 0;
    for (const item of queue) {
      const existing = await WorkoutLog.findOne({ clientSyncId: item.clientSyncId, userId: req.user._id });
      if (!existing) {
        await WorkoutLog.create({
          ...item,
          userId: req.user._id,
          status: 'completed',
        });
        syncedCount++;
      }
    }

    res.json({ syncedCount, message: `Successfully synchronized ${syncedCount} workouts from offline cache.` });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent workout logs with volume & stats
// @route   GET /api/workouts
export const getWorkouts = async (req, res, next) => {
  try {
    const logs = await WorkoutLog.find({ userId: req.user._id, status: 'completed' })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    // Aggregate weekly volume
    const totalVolume = logs.reduce((acc, l) => acc + (l.metrics?.totalVolumeKg || 0), 0);
    const totalSets = logs.reduce((acc, l) => acc + (l.metrics?.totalSetsCompleted || 0), 0);

    res.json({
      logs,
      summary: {
        totalLoggedWorkouts: logs.length,
        totalVolumeKg: totalVolume,
        totalSets,
        avgDurationMin: logs.length > 0 ? Math.round(logs.reduce((a, l) => a + l.durationSeconds, 0) / logs.length / 60) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed single workout
// @route   GET /api/workouts/:id
export const getWorkoutById = async (req, res, next) => {
  try {
    const log = await WorkoutLog.findOne({ _id: req.params.id, userId: req.user._id });
    if (!log) return res.status(404).json({ error: 'Workout log not found' });
    res.json(log);
  } catch (error) {
    next(error);
  }
};
