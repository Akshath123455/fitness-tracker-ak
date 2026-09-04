import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, closeDB } from './config/db.js';
import User from './models/User.js';
import TrainingProfile from './models/TrainingProfile.js';
import Exercise from './models/Exercise.js';
import StrengthStandard from './models/StrengthStandard.js';
import Program from './models/Program.js';
import WorkoutLog from './models/WorkoutLog.js';
import LeaderboardEntry from './models/LeaderboardEntry.js';
import exerciseSeedData from './data/exerciseSeedData.json' with { type: 'json' };
import strengthStandardsData from './data/strengthStandardsData.json' with { type: 'json' };
import { evaluateTrainingProfileMetrics, getCohortKey } from './services/strengthBenchmarkEngine.js';
import { generatePeriodizedProgram } from './services/periodizationEngine.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Starting database seeding...');

    // 1. Seed Exercises
    await Exercise.deleteMany({});
    const insertedExercises = await Exercise.insertMany(exerciseSeedData);
    console.log(`[Seed] Seeded ${insertedExercises.length} exercises.`);

    // 2. Seed Strength Standards
    await StrengthStandard.deleteMany({});
    const insertedStandards = await StrengthStandard.insertMany(strengthStandardsData);
    console.log(`[Seed] Seeded ${insertedStandards.length} strength standards tables.`);

    // 3. Create Demo User
    await User.deleteMany({ email: 'alex.fitness@apexpulse.ai' });
    const demoUser = await User.create({
      name: 'Alex Vance',
      email: 'alex.fitness@apexpulse.ai',
      password: 'Password123!',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      role: 'user',
      preferences: {
        unitSystem: 'kg',
        soundAlerts: true,
        restTimerAutoStart: true,
        theme: 'dark',
      },
      privacy: {
        shareCohortLeaderboard: true,
        anonymizeLeaderboardName: false,
        shareProgressStats: true,
      },
      streak: {
        current: 14,
        longest: 28,
        lastActiveDate: new Date(),
      },
      badges: [
        { badgeId: 'first_pr', title: 'PR Shatterer', description: 'Break a personal record', icon: 'trophy' },
        { badgeId: 'streak_7', title: '7-Day Consistency', description: 'One full week unbroken', icon: 'zap' },
        { badgeId: 'streak_14', title: 'Fortnight Warrior', description: 'Two full weeks unbroken', icon: 'flame' },
        { badgeId: 'bench_bodyweight', title: '1x Bodyweight Bench', description: 'Pressed your exact body weight', icon: 'award' },
      ],
    });

    // 4. Create Demo Training Profile
    await TrainingProfile.deleteMany({ userId: demoUser._id });
    const profileDemographics = {
      age: 28,
      sex: 'male',
      bodyWeightKg: 82.5,
      heightCm: 180,
      experienceLevel: 'intermediate',
    };

    const liftBaselines = {
      squat: { oneRepMax: 140, testedReps: 3, testedWeight: 130, formulaUsed: 'epley', confidencePct: 95, lastUpdated: new Date() },
      bench_press: { oneRepMax: 105, testedReps: 5, testedWeight: 92.5, formulaUsed: 'epley', confidencePct: 95, lastUpdated: new Date() },
      deadlift: { oneRepMax: 175, testedReps: 2, testedWeight: 167.5, formulaUsed: 'epley', confidencePct: 95, lastUpdated: new Date() },
      overhead_press: { oneRepMax: 65, testedReps: 5, testedWeight: 57.5, formulaUsed: 'epley', confidencePct: 95, lastUpdated: new Date() },
      pull_up: { oneRepMax: 102.5, testedReps: 8, testedWeight: 82.5, formulaUsed: 'bodyweight_calc', confidencePct: 90, lastUpdated: new Date() },
      barbell_row: { oneRepMax: 90, testedReps: 6, testedWeight: 77.5, formulaUsed: 'epley', confidencePct: 90, lastUpdated: new Date() },
    };

    const evaluated = evaluateTrainingProfileMetrics({
      demographics: profileDemographics,
      liftBaselines,
    });

    const demoProfile = await TrainingProfile.create({
      userId: demoUser._id,
      demographics: profileDemographics,
      goals: {
        primary: 'strength',
        secondary: ['hypertrophy', 'athletic_power'],
        targetNotes: 'Looking to break 180kg deadlift and hit 110kg bench press.',
      },
      schedule: {
        daysPerWeek: 4,
        sessionDurationMin: 60,
        preferredSplit: 'upper_lower',
        periodizationPreference: 'undulating',
      },
      equipment: {
        access: 'full_gym',
        availableList: ['barbell', 'dumbbell', 'cable', 'machine', 'squat_rack'],
      },
      healthFlags: {
        injuries: ['shoulder'],
        specialPopulation: 'general',
        medicalDisclaimerAccepted: true,
        disclaimerAcceptedAt: new Date(),
        notes: 'Mild right shoulder impingement on wide grip benches.',
      },
      liftBaselines,
      compositeMetrics: {
        strengthScore: evaluated.strengthScore,
        wilksScore: evaluated.dotsScore,
        dotsScore: evaluated.dotsScore,
        cohortPercentiles: evaluated.percentiles,
        demographicCohortKey: evaluated.cohortInfo.cohortKey,
        lastAssessmentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        nextAssessmentDueDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
      },
    });

    // 5. Generate Active Program for Demo User
    await Program.deleteMany({ userId: demoUser._id });
    const programData = await generatePeriodizedProgram(demoProfile);
    const demoProgram = await Program.create({
      ...programData,
      userId: demoUser._id,
      currentWeekNumber: 2,
      currentDayNumber: 1,
    });

    // 6. Seed Sample Workout Logs
    await WorkoutLog.deleteMany({ userId: demoUser._id });
    const sampleDates = [
      new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    ];

    const squatEx = insertedExercises.find((e) => e.slug === 'barbell_back_squat');
    const benchEx = insertedExercises.find((e) => e.slug === 'barbell_bench_press');
    const dlEx = insertedExercises.find((e) => e.slug === 'conventional_deadlift');
    const ohpEx = insertedExercises.find((e) => e.slug === 'overhead_press');

    await WorkoutLog.create([
      {
        userId: demoUser._id,
        programId: demoProgram._id,
        workoutName: 'Day 1: Upper Power & Strength',
        weekNumber: 1,
        dayNumber: 1,
        date: sampleDates[0],
        durationSeconds: 3420,
        overallRpe: 8.5,
        fatigueRating: 6,
        status: 'completed',
        exercises: [
          {
            exerciseId: benchEx._id,
            exerciseName: benchEx.name,
            sets: [
              { setNumber: 1, weightKg: 85, reps: 5, rpe: 8, completed: true, estimated1RM: 99 },
              { setNumber: 2, weightKg: 85, reps: 5, rpe: 8, completed: true, estimated1RM: 99 },
              { setNumber: 3, weightKg: 87.5, reps: 5, rpe: 8.5, completed: true, estimated1RM: 102 },
            ],
          },
        ],
        metrics: { totalVolumeKg: 1285, totalReps: 15, totalSetsCompleted: 3, avgIntensityRpe: 8.2, newPRCount: 0 },
      },
      {
        userId: demoUser._id,
        programId: demoProgram._id,
        workoutName: 'Day 2: Lower Quad & Hinge Focus',
        weekNumber: 1,
        dayNumber: 2,
        date: sampleDates[1],
        durationSeconds: 3800,
        overallRpe: 8.0,
        fatigueRating: 5,
        status: 'completed',
        exercises: [
          {
            exerciseId: squatEx._id,
            exerciseName: squatEx.name,
            sets: [
              { setNumber: 1, weightKg: 115, reps: 5, rpe: 7.5, completed: true, estimated1RM: 134 },
              { setNumber: 2, weightKg: 120, reps: 5, rpe: 8.0, completed: true, estimated1RM: 140 },
              { setNumber: 3, weightKg: 122.5, reps: 4, rpe: 8.5, completed: true, estimated1RM: 139 },
            ],
          },
        ],
        metrics: { totalVolumeKg: 1665, totalReps: 14, totalSetsCompleted: 3, avgIntensityRpe: 8.0, newPRCount: 0 },
      },
      {
        userId: demoUser._id,
        programId: demoProgram._id,
        workoutName: 'Day 3: Upper Hypertrophy & Density',
        weekNumber: 1,
        dayNumber: 3,
        date: sampleDates[2],
        durationSeconds: 3600,
        overallRpe: 8.0,
        fatigueRating: 4,
        status: 'completed',
        exercises: [
          {
            exerciseId: ohpEx._id,
            exerciseName: ohpEx.name,
            sets: [
              { setNumber: 1, weightKg: 52.5, reps: 6, rpe: 8, completed: true, estimated1RM: 63 },
              { setNumber: 2, weightKg: 52.5, reps: 6, rpe: 8, completed: true, estimated1RM: 63 },
              { setNumber: 3, weightKg: 55, reps: 5, rpe: 8.5, completed: true, estimated1RM: 64 },
            ],
          },
        ],
        metrics: { totalVolumeKg: 905, totalReps: 17, totalSetsCompleted: 3, avgIntensityRpe: 8.2, newPRCount: 0 },
      },
    ]);

    // 7. Seed Cohort Peer Leaderboard Entries
    await LeaderboardEntry.deleteMany({});
    const cohortKey = evaluated.cohortInfo.cohortKey;

    const peerCohortEntries = [
      {
        userId: demoUser._id,
        displayName: 'Alex Vance (You)',
        avatarUrl: demoUser.avatarUrl,
        cohortKey,
        demographics: { ageBand: '18-30', sex: 'male', weightClassKg: '80-90kg', experienceLevel: 'intermediate' },
        strengthScore: evaluated.strengthScore,
        dotsScore: evaluated.dotsScore,
        liftMaxesKg: { squat: 140, bench_press: 105, deadlift: 175, overhead_press: 65 },
        streakDays: 14,
        isOptedIn: true,
        isAnonymized: false,
      },
      {
        userId: new mongoose.Types.ObjectId(),
        displayName: 'Marcus Sterling',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        cohortKey,
        demographics: { ageBand: '18-30', sex: 'male', weightClassKg: '80-90kg', experienceLevel: 'advanced' },
        strengthScore: 785,
        dotsScore: 348,
        liftMaxesKg: { squat: 165, bench_press: 125, deadlift: 210, overhead_press: 77.5 },
        streakDays: 24,
        isOptedIn: true,
        isAnonymized: false,
      },
      {
        userId: new mongoose.Types.ObjectId(),
        displayName: 'David K.',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
        cohortKey,
        demographics: { ageBand: '18-30', sex: 'male', weightClassKg: '80-90kg', experienceLevel: 'intermediate' },
        strengthScore: 692,
        dotsScore: 312,
        liftMaxesKg: { squat: 145, bench_press: 110, deadlift: 185, overhead_press: 67.5 },
        streakDays: 8,
        isOptedIn: true,
        isAnonymized: false,
      },
      {
        userId: new mongoose.Types.ObjectId(),
        displayName: 'Liam O’Connor',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
        cohortKey,
        demographics: { ageBand: '18-30', sex: 'male', weightClassKg: '80-90kg', experienceLevel: 'intermediate' },
        strengthScore: 615,
        dotsScore: 280,
        liftMaxesKg: { squat: 130, bench_press: 95, deadlift: 160, overhead_press: 60 },
        streakDays: 5,
        isOptedIn: true,
        isAnonymized: false,
      },
      {
        userId: new mongoose.Types.ObjectId(),
        displayName: 'Sam Thorne',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        cohortKey,
        demographics: { ageBand: '18-30', sex: 'male', weightClassKg: '80-90kg', experienceLevel: 'novice' },
        strengthScore: 540,
        dotsScore: 245,
        liftMaxesKg: { squat: 110, bench_press: 85, deadlift: 140, overhead_press: 50 },
        streakDays: 11,
        isOptedIn: true,
        isAnonymized: false,
      },
    ];

    await LeaderboardEntry.insertMany(peerCohortEntries);
    console.log(`[Seed] Seeded ${peerCohortEntries.length} peer leaderboard cohort entries.`);

    console.log('[Seed] Database successfully populated!');
  } catch (error) {
    console.error('[Seed] Error during database seeding:', error);
  }
};

if (process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    await closeDB();
    process.exit(0);
  })();
}
