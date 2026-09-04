import WorkoutLog from '../models/WorkoutLog.js';
import Program from '../models/Program.js';

/**
 * Evaluates performance history and returns adaptation suggestions
 */
export const analyzePerformanceAndRecommendAdjustments = async (userId) => {
  // Fetch active program
  const program = await Program.findOne({ userId, isActive: true });
  if (!program) return { status: 'no_active_program', recommendations: [] };

  // Fetch last 10 workout logs
  const logs = await WorkoutLog.find({ userId, status: 'completed' })
    .sort({ date: -1 })
    .limit(10)
    .lean();

  if (logs.length === 0) {
    return { status: 'insufficient_data', message: 'Complete your first workout to enable adaptive engine adjustments.' };
  }

  const recommendations = [];
  const exerciseHistoryMap = new Map();

  // Aggregate logs per exercise
  for (const log of logs) {
    for (const ex of log.exercises || []) {
      const idStr = ex.exerciseId.toString();
      if (!exerciseHistoryMap.has(idStr)) {
        exerciseHistoryMap.set(idStr, []);
      }
      exerciseHistoryMap.get(idStr).push({
        workoutDate: log.date,
        exerciseName: ex.exerciseName,
        sets: ex.sets || [],
        overallRpe: log.overallRpe,
        fatigueRating: log.fatigueRating,
      });
    }
  }

  // 1. Check Systemic Fatigue / High Recovery Debt
  const recentFatigueLogs = logs.slice(0, 3);
  const avgFatigue = recentFatigueLogs.reduce((acc, l) => acc + (l.fatigueRating || 5), 0) / recentFatigueLogs.length;
  const avgOverallRPE = recentFatigueLogs.reduce((acc, l) => acc + (l.overallRpe || 8), 0) / recentFatigueLogs.length;

  if (avgFatigue >= 8 || avgOverallRPE >= 9.3) {
    recommendations.push({
      type: 'DELOAD_RECOMMENDED',
      urgency: 'high',
      title: 'Neuromuscular Recovery Debt Detected',
      reason: `Your last ${recentFatigueLogs.length} sessions logged an average exertion RPE of ${avgOverallRPE.toFixed(1)} and fatigue index of ${avgFatigue.toFixed(1)}/10. High systemic fatigue dampens supercompensation.`,
      suggestedAction: 'Activate 1-Week Active Recovery Deload (-40% volume, -10% load)',
      applyPayload: { action: 'TRIGGER_DELOAD', durationWeeks: 1 },
    });
  }

  // 2. Evaluate Individual Exercises
  for (const [exerciseId, sessions] of exerciseHistoryMap.entries()) {
    if (sessions.length < 2) continue;

    const latest = sessions[0];
    const previous = sessions[1];
    const exerciseName = latest.exerciseName;

    const workingSetsLatest = latest.sets.filter((s) => !s.isWarmup && s.completed);
    if (workingSetsLatest.length === 0) continue;

    const avgWeightLatest = workingSetsLatest.reduce((acc, s) => acc + s.weightKg, 0) / workingSetsLatest.length;
    const avgRepsLatest = workingSetsLatest.reduce((acc, s) => acc + s.reps, 0) / workingSetsLatest.length;
    const avgRpeLatest = workingSetsLatest.reduce((acc, s) => acc + (s.rpe || 8), 0) / workingSetsLatest.length;

    const maxE1RMLatest = Math.max(...workingSetsLatest.map((s) => s.estimated1RM || 0));

    // Plateau Detection (3+ sessions with zero 1RM progress or repeated failed reps)
    if (sessions.length >= 3) {
      const e1rms = sessions.slice(0, 3).map((s) => Math.max(...s.sets.map((x) => x.estimated1RM || 0)));
      const isStagnant = e1rms.every((v) => Math.abs(v - e1rms[0]) < 1.0);

      if (isStagnant && e1rms[0] > 0) {
        recommendations.push({
          type: 'PLATEAU_DETECTED',
          exerciseId,
          exerciseName,
          urgency: 'medium',
          title: `Stall Detected on ${exerciseName}`,
          reason: `Estimated 1RM has held flat at ~${e1rms[0].toFixed(1)}kg across the last 3 logged sessions. The stimulus has reached adaptive equilibrium.`,
          suggestedAction: 'Swap to a close biomechanical variation or switch rep tempo (3-sec eccentric).',
          applyPayload: { action: 'OFFER_SUBSTITUTION', exerciseId },
        });
        continue;
      }
    }

    // Progressive Overload Progression Check
    if (avgRpeLatest <= 8.0 && avgRepsLatest >= 5) {
      const isLower = exerciseName.toLowerCase().includes('squat') || exerciseName.toLowerCase().includes('deadlift');
      const increment = isLower ? 2.5 : 1.25; // kg
      const nextWeight = Math.round((avgWeightLatest + increment) / 1.25) * 1.25;

      recommendations.push({
        type: 'PROGRESSIVE_OVERLOAD',
        exerciseId,
        exerciseName,
        urgency: 'low',
        title: `Ready for Overload: +${increment}kg on ${exerciseName}`,
        reason: `Completed working sets at average RPE ${avgRpeLatest.toFixed(1)} (well within capacity).`,
        suggestedAction: `Increase next working set from ${avgWeightLatest.toFixed(1)}kg to ${nextWeight.toFixed(1)}kg.`,
        applyPayload: { action: 'UPDATE_EXERCISE_WEIGHT', exerciseId, nextWeight },
      });
    }
  }

  return {
    status: 'analyzed',
    activeProgramId: program._id,
    recommendations,
  };
};

/**
 * Apply automated adjustment to active program
 */
export const applyAdaptationToProgram = async (userId, payload) => {
  const program = await Program.findOne({ userId, isActive: true });
  if (!program) throw new Error('No active program found');

  if (payload.action === 'TRIGGER_DELOAD') {
    // Modify current week to deload intensity
    const currentWeekIdx = (program.currentWeekNumber || 1) - 1;
    if (program.weeks[currentWeekIdx]) {
      program.weeks[currentWeekIdx].isDeloadWeek = true;
      program.weeks[currentWeekIdx].theme = 'AI-Triggered Recovery Deload';
      program.weeks[currentWeekIdx].intensityMultiplier = 0.85;

      for (const day of program.weeks[currentWeekIdx].days) {
        for (const ex of day.exercises) {
          ex.targetSets = Math.max(2, ex.targetSets - 1);
          ex.sets = ex.sets.slice(0, ex.targetSets).map((s) => ({
            ...s,
            prescribedWeightKg: Math.round((s.prescribedWeightKg * 0.85) / 2.5) * 2.5,
            targetRpe: Math.max(6, s.targetRpe - 2),
          }));
        }
      }
    }

    program.adaptationHistory.push({
      triggerType: 'deload_trigger',
      message: 'Fatigue-triggered active deload applied to current training week.',
      date: new Date(),
    });

    await program.save();
    return { success: true, message: 'Deload week activated successfully.' };
  }

  if (payload.action === 'UPDATE_EXERCISE_WEIGHT') {
    const { exerciseId, nextWeight } = payload;
    let updatedCount = 0;

    for (const week of program.weeks) {
      for (const day of week.days) {
        for (const ex of day.exercises) {
          if (ex.exerciseId.toString() === exerciseId.toString()) {
            for (const s of ex.sets) {
              s.prescribedWeightKg = nextWeight;
            }
            updatedCount++;
          }
        }
      }
    }

    program.adaptationHistory.push({
      triggerType: 'auto_overload',
      message: `Progressive overload applied: updated weight to ${nextWeight}kg.`,
      date: new Date(),
    });

    await program.save();
    return { success: true, message: `Updated ${updatedCount} sessions with new weight target ${nextWeight}kg.` };
  }

  return { success: false, message: 'Unknown action' };
};
