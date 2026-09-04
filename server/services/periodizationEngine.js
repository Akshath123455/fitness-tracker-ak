import Exercise from '../models/Exercise.js';
import { sanitizeWorkoutDay } from './exerciseSubstitutionEngine.js';

/**
 * Periodized Program Generation Engine
 */
export const generatePeriodizedProgram = async (profile) => {
  const { demographics, goals, schedule, equipment, liftBaselines } = profile;
  const daysPerWeek = schedule?.daysPerWeek || 4;
  const experience = demographics?.experienceLevel || 'intermediate';
  const goal = goals?.primary || 'strength';

  // Determine periodization model if set to 'auto'
  let periodizationType = schedule?.periodizationPreference || 'auto';
  if (periodizationType === 'auto') {
    if (experience === 'beginner') {
      periodizationType = 'linear';
    } else if (experience === 'intermediate' || goal === 'hypertrophy') {
      periodizationType = 'undulating';
    } else {
      periodizationType = 'block';
    }
  }

  const durationWeeks = periodizationType === 'block' ? 6 : 4;
  const programTitle = getProgramTitle(goal, periodizationType, daysPerWeek);

  // Fetch all exercises from DB
  const allExercises = await Exercise.find().lean();
  const exerciseMap = new Map(allExercises.map((e) => [e.slug, e]));

  // Generate Week 1 baseline template based on split
  const baseDays = buildSplitTemplate(daysPerWeek, exerciseMap, liftBaselines, equipment.access);

  // Expand across weeks with periodization load curve
  const weeks = [];
  for (let w = 1; w <= durationWeeks; w++) {
    const isDeload = w === durationWeeks;
    let weekTheme = 'Accumulation';
    let intensityMultiplier = 1.0;
    let volumeSetMultiplier = 1.0;

    if (periodizationType === 'linear') {
      if (isDeload) {
        weekTheme = 'Deload & Recovery';
        intensityMultiplier = 0.85;
        volumeSetMultiplier = 0.6;
      } else {
        weekTheme = `Linear Progression +${(w - 1) * 2.5}%`;
        intensityMultiplier = 1.0 + (w - 1) * 0.025; // 2.5% progression per week
      }
    } else if (periodizationType === 'undulating') {
      if (isDeload) {
        weekTheme = 'Active Recovery Deload';
        intensityMultiplier = 0.80;
        volumeSetMultiplier = 0.6;
      } else {
        const waves = ['Hypertrophy Focus', 'Power & Velocity', 'Strength Intensity', 'Overload Wave'];
        weekTheme = waves[(w - 1) % waves.length];
        intensityMultiplier = 1.0 + (w - 1) * 0.02;
      }
    } else if (periodizationType === 'block') {
      if (w <= 2) {
        weekTheme = 'Accumulation Block (High Volume)';
        intensityMultiplier = 0.95;
      } else if (w <= 4) {
        weekTheme = 'Transmutation Block (Strength)';
        intensityMultiplier = 1.05;
      } else if (w === 5) {
        weekTheme = 'Realization Block (Peaking)';
        intensityMultiplier = 1.10;
      } else {
        weekTheme = 'Deload & Test Week';
        intensityMultiplier = 0.85;
        volumeSetMultiplier = 0.5;
      }
    }

    // Clone base days and adjust sets/reps/weights for the week
    const weekDays = [];
    for (const day of baseDays) {
      const adjustedExercises = day.exercises.map((ex) => {
        const adjustedSets = ex.sets.map((s) => {
          let calcWeight = Math.round((s.prescribedWeightKg * intensityMultiplier) / 2.5) * 2.5;
          let targetReps = s.targetReps;
          let targetRpe = s.targetRpe;

          if (isDeload) {
            targetRpe = Math.max(6, targetRpe - 2);
          }

          return {
            setNumber: s.setNumber,
            targetReps,
            targetRpe,
            targetPercent1RM: Math.round(s.targetPercent1RM * intensityMultiplier),
            prescribedWeightKg: calcWeight,
            restSeconds: s.restSeconds,
            isWarmup: s.isWarmup,
          };
        });

        // If deload, reduce total sets
        const numSetsToKeep = isDeload ? Math.max(2, Math.round(ex.targetSets * volumeSetMultiplier)) : ex.targetSets;

        return {
          ...ex,
          targetSets: numSetsToKeep,
          sets: adjustedSets.slice(0, numSetsToKeep),
        };
      });

      // Sanitize with injury filter
      const safeExercises = await sanitizeWorkoutDay(adjustedExercises, profile);

      weekDays.push({
        dayNumber: day.dayNumber,
        dayName: day.dayName,
        focusCategory: day.focusCategory,
        isRestDay: day.isRestDay,
        estimatedDurationMin: day.estimatedDurationMin,
        exercises: safeExercises,
      });
    }

    weeks.push({
      weekNumber: w,
      theme: weekTheme,
      intensityMultiplier,
      isDeloadWeek: isDeload,
      days: weekDays,
    });
  }

  return {
    title: programTitle,
    description: `A ${durationWeeks}-week ${periodizationType.toUpperCase()} periodized program optimized for ${goal.replace('_', ' ')} and ${daysPerWeek} training days per week.`,
    periodizationType,
    goal,
    durationWeeks,
    currentWeekNumber: 1,
    currentDayNumber: 1,
    isActive: true,
    weeks,
    adaptationHistory: [
      {
        triggerType: 'auto_overload',
        message: `Program calibrated from onboarding biometrics and initial strength baselines.`,
        date: new Date(),
      },
    ],
  };
};

function getProgramTitle(goal, periodizationType, days) {
  const goalNames = {
    strength: 'Apex Strength Protocol',
    hypertrophy: 'Hypertrophy Surge',
    fat_loss: 'Metabolic Density Plan',
    general_fitness: 'Total Body Kinetic',
    sport_specific: 'Athletic Power Cycle',
    rehab: 'Functional Foundation & Recovery',
  };

  return `${goalNames[goal] || 'Apex Custom Protocol'} (${days}D/${periodizationType.toUpperCase()})`;
}

/**
 * Split templates generator based on available days
 */
function buildSplitTemplate(daysPerWeek, exerciseMap, baselines, equipmentAccess) {
  const findEx = (slug) => {
    if (exerciseMap.has(slug)) return exerciseMap.get(slug);
    // fallback to first available
    return Array.from(exerciseMap.values())[0];
  };

  const getWeightForExercise = (slug, basePercent) => {
    let baseline1RM = 0;
    if (slug.includes('squat')) baseline1RM = baselines?.squat?.oneRepMax || 60;
    else if (slug.includes('bench')) baseline1RM = baselines?.bench_press?.oneRepMax || 50;
    else if (slug.includes('deadlift')) baseline1RM = baselines?.deadlift?.oneRepMax || 80;
    else if (slug.includes('press') || slug.includes('ohp')) baseline1RM = baselines?.overhead_press?.oneRepMax || 35;
    else if (slug.includes('row')) baseline1RM = baselines?.barbell_row?.oneRepMax || 45;
    else if (slug.includes('pull_up')) baseline1RM = baselines?.pull_up?.oneRepMax || 70;
    else baseline1RM = 30;

    return Math.round((baseline1RM * basePercent) / 2.5) * 2.5;
  };

  const createExerciseObj = (slug, setsCount, reps, rpe, pct1RM, restSec, order) => {
    const ex = findEx(slug);
    const weight = getWeightForExercise(slug, pct1RM / 100);

    const sets = [];
    for (let i = 1; i <= setsCount; i++) {
      sets.push({
        setNumber: i,
        targetReps: reps,
        targetRpe: rpe,
        targetPercent1RM: pct1RM,
        prescribedWeightKg: weight,
        restSeconds: restSec,
        isWarmup: false,
      });
    }

    return {
      exerciseId: ex._id,
      exerciseName: ex.name,
      slug: ex.slug,
      movementPattern: ex.movementPattern,
      tier: ex.tier,
      orderIndex: order,
      targetSets: setsCount,
      sets,
      progressionRule: 'linear_microload',
      notes: `${reps} reps @ RPE ${rpe}`,
    };
  };

  if (daysPerWeek === 3) {
    // 3-Day Full Body Split
    return [
      {
        dayNumber: 1,
        dayName: 'Day 1: Full Body Strength A',
        focusCategory: 'Full Body Compound',
        isRestDay: false,
        estimatedDurationMin: 60,
        exercises: [
          createExerciseObj('barbell_back_squat', 3, 5, 8, 75, 150, 1),
          createExerciseObj('barbell_bench_press', 3, 5, 8, 75, 120, 2),
          createExerciseObj('barbell_row', 3, 8, 7.5, 70, 90, 3),
          createExerciseObj('dumbbell_lateral_raise', 3, 12, 8, 60, 60, 4),
          createExerciseObj('plank', 3, 45, 8, 50, 60, 5),
        ],
      },
      {
        dayNumber: 2,
        dayName: 'Day 2: Full Body Hypertrophy B',
        focusCategory: 'Full Body Volume',
        isRestDay: false,
        estimatedDurationMin: 60,
        exercises: [
          createExerciseObj('conventional_deadlift', 3, 5, 8, 77.5, 180, 1),
          createExerciseObj('overhead_press', 3, 6, 8, 72.5, 120, 2),
          createExerciseObj('pull_up', 3, 8, 8, 70, 90, 3),
          createExerciseObj('bulgarian_split_squat', 3, 10, 8, 65, 90, 4),
          createExerciseObj('tricep_rope_pushdown', 3, 12, 8, 60, 60, 5),
        ],
      },
      {
        dayNumber: 3,
        dayName: 'Day 3: Full Body Anchor C',
        focusCategory: 'Full Body Power',
        isRestDay: false,
        estimatedDurationMin: 60,
        exercises: [
          createExerciseObj('romanian_deadlift', 3, 8, 7.5, 70, 120, 1),
          createExerciseObj('dumbbell_incline_press', 3, 8, 8, 70, 90, 2),
          createExerciseObj('seated_cable_row', 3, 10, 8, 65, 90, 3),
          createExerciseObj('incline_dumbbell_bicep_curl', 3, 12, 8, 60, 60, 4),
          createExerciseObj('hanging_leg_raise', 3, 12, 8, 50, 60, 5),
        ],
      },
    ];
  }

  // 4-Day Upper / Lower Split (Default standard)
  return [
    {
      dayNumber: 1,
      dayName: 'Day 1: Upper Power & Strength',
      focusCategory: 'Upper Body',
      isRestDay: false,
      estimatedDurationMin: 60,
      exercises: [
        createExerciseObj('barbell_bench_press', 4, 5, 8, 77.5, 150, 1),
        createExerciseObj('barbell_row', 4, 6, 8, 75, 120, 2),
        createExerciseObj('overhead_press', 3, 6, 8, 72.5, 90, 3),
        createExerciseObj('pull_up', 3, 8, 8, 70, 90, 4),
        createExerciseObj('tricep_rope_pushdown', 3, 12, 8.5, 60, 60, 5),
      ],
    },
    {
      dayNumber: 2,
      dayName: 'Day 2: Lower Quad & Hinge Focus',
      focusCategory: 'Lower Body',
      isRestDay: false,
      estimatedDurationMin: 60,
      exercises: [
        createExerciseObj('barbell_back_squat', 4, 5, 8, 77.5, 180, 1),
        createExerciseObj('romanian_deadlift', 3, 8, 7.5, 70, 120, 2),
        createExerciseObj('leg_press', 3, 10, 8, 70, 90, 3),
        createExerciseObj('lying_leg_curl', 3, 12, 8.5, 65, 60, 4),
        createExerciseObj('hanging_leg_raise', 3, 12, 8, 50, 60, 5),
      ],
    },
    {
      dayNumber: 3,
      dayName: 'Day 3: Upper Hypertrophy & Density',
      focusCategory: 'Upper Body',
      isRestDay: false,
      estimatedDurationMin: 60,
      exercises: [
        createExerciseObj('dumbbell_incline_press', 4, 8, 8, 72.5, 90, 1),
        createExerciseObj('lat_pulldown', 4, 10, 8, 70, 90, 2),
        createExerciseObj('dumbbell_lateral_raise', 4, 12, 8.5, 60, 60, 3),
        createExerciseObj('seated_cable_row', 3, 10, 8, 65, 60, 4),
        createExerciseObj('incline_dumbbell_bicep_curl', 3, 12, 8.5, 60, 60, 5),
      ],
    },
    {
      dayNumber: 4,
      dayName: 'Day 4: Lower Posterior Chain & Power',
      focusCategory: 'Lower Body',
      isRestDay: false,
      estimatedDurationMin: 60,
      exercises: [
        createExerciseObj('conventional_deadlift', 3, 5, 8.5, 80, 180, 1),
        createExerciseObj('bulgarian_split_squat', 3, 8, 8, 70, 90, 2),
        createExerciseObj('leg_extension', 3, 12, 8.5, 65, 60, 3),
        createExerciseObj('lying_leg_curl', 3, 10, 8, 65, 60, 4),
        createExerciseObj('plank', 3, 60, 8, 50, 60, 5),
      ],
    },
  ];
}
