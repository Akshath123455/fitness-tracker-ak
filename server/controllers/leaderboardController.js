import LeaderboardEntry from '../models/LeaderboardEntry.js';
import TrainingProfile from '../models/TrainingProfile.js';
import User from '../models/User.js';

// @desc    Get demographic cohort leaderboard
// @route   GET /api/leaderboard/cohort
export const getCohortLeaderboard = async (req, res, next) => {
  try {
    const profile = await TrainingProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const cohortKey = profile.compositeMetrics?.demographicCohortKey || 'all';

    // Fetch cohort entries opted in
    const entries = await LeaderboardEntry.find({
      cohortKey,
      isOptedIn: true,
    })
      .sort({ strengthScore: -1 })
      .limit(50)
      .lean();

    // Map names according to privacy
    const sanitized = entries.map((entry, idx) => {
      const isCurrentUser = entry.userId.toString() === req.user._id.toString();
      let displayName = entry.displayName;
      if (entry.isAnonymized && !isCurrentUser) {
        displayName = `Lifter #${entry._id.toString().slice(-4).toUpperCase()}`;
      }

      return {
        rank: idx + 1,
        isCurrentUser,
        displayName,
        avatarUrl: entry.avatarUrl,
        strengthScore: entry.strengthScore,
        dotsScore: entry.dotsScore,
        liftMaxesKg: entry.liftMaxesKg,
        experienceLevel: entry.demographics?.experienceLevel,
      };
    });

    res.json({
      cohortKey,
      demographics: {
        age: profile.demographics.age,
        sex: profile.demographics.sex,
        bodyWeightKg: profile.demographics.bodyWeightKg,
      },
      userScore: profile.compositeMetrics?.strengthScore,
      userRank: sanitized.find((s) => s.isCurrentUser)?.rank || 1,
      totalLiftersInCohort: sanitized.length,
      rankings: sanitized,
      privacyNotice: 'Leaderboards are strictly scoped to your age band, biological sex, and bodyweight class for fair, meaningful peer comparison.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user badges and milestone achievements
// @route   GET /api/leaderboard/badges
export const getUserBadges = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('badges streak');
    const profile = await TrainingProfile.findOne({ userId: req.user._id });

    const allBadgesCatalog = [
      { id: 'first_pr', title: 'PR Shatterer', description: 'Break a personal record on any compound lift', icon: 'trophy', category: 'Strength' },
      { id: 'streak_7', title: '7-Day Consistency', description: 'Log training consistently for 7 days', icon: 'zap', category: 'Habit' },
      { id: 'streak_14', title: 'Fortnight Warrior', description: 'Maintain training momentum for 14 days', icon: 'flame', category: 'Habit' },
      { id: 'centurion', title: 'Centurion Volume', description: 'Log over 100 working sets in the platform', icon: 'shield', category: 'Volume' },
      { id: 'bench_bodyweight', title: '1x Bodyweight Bench', description: 'Achieve a 1.0x bodyweight bench press', icon: 'award', category: 'Milestone' },
      { id: 'squat_15bw', title: '1.5x Bodyweight Squat', description: 'Squat 1.5 times your body weight', icon: 'award', category: 'Milestone' },
      { id: 'deadlift_2bw', title: 'Double Bodyweight Deadlift', description: 'Pull 2.0 times your body weight from floor', icon: 'crown', category: 'Milestone' },
      { id: 'plateau_buster', title: 'Plateau Buster', description: 'Successfully overcome a 3-week lift plateau with AI adaptation', icon: 'target', category: 'Mastery' },
    ];

    const unlockedMap = new Set((user.badges || []).map((b) => b.badgeId));

    const enrichedBadges = allBadgesCatalog.map((b) => ({
      ...b,
      isUnlocked: unlockedMap.has(b.id),
      unlockedAt: user.badges?.find((ub) => ub.badgeId === b.id)?.unlockedAt || null,
    }));

    res.json({
      badges: enrichedBadges,
      streak: user.streak,
    });
  } catch (error) {
    next(error);
  }
};
