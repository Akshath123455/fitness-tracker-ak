import Exercise from '../models/Exercise.js';

/**
 * Exercise Substitution & Contraindication Filtering Engine
 */
export const findSmartSubstitutes = async (exercise, profile) => {
  const { equipment, healthFlags } = profile;
  const userInjuries = healthFlags?.injuries || [];
  const specialPop = healthFlags?.specialPopulation || 'general';
  const equipmentAccess = equipment?.access || 'full_gym';

  // Find exercises with matching movement pattern
  const candidates = await Exercise.find({
    movementPattern: exercise.movementPattern,
    _id: { $ne: exercise._id },
  }).lean();

  // Filter candidates based on safety and equipment constraints
  const suitable = candidates.filter((candidate) => {
    // 1. Injury Filter: Candidate must not target injured areas
    if (userInjuries.length > 0) {
      const touchesInjury = candidate.injuryRiskAreas.some((risk) => userInjuries.includes(risk));
      if (touchesInjury) return false;
    }

    // 2. Special Population Guidelines
    if (specialPop === 'prenatal' || specialPop === 'postpartum') {
      // Avoid excessive intra-abdominal pressure exercises or supine heavy presses
      if (candidate.slug === 'barbell_back_squat' || candidate.slug === 'conventional_deadlift') {
        return false;
      }
    }

    if (specialPop === 'older_adult') {
      // Prioritize joint-friendly, machine or dumbbell movements
      if (candidate.tier === 1 && candidate.equipmentRequired === 'barbell') {
        // lower weight priority for heavy barbell compounds if novice
      }
    }

    // 3. Equipment Filter
    if (equipmentAccess === 'bodyweight_only') {
      return candidate.equipmentRequired === 'bodyweight';
    } else if (equipmentAccess === 'dumbbells_bands') {
      return ['dumbbell', 'band', 'bodyweight'].includes(candidate.equipmentRequired);
    } else if (equipmentAccess === 'home_gym') {
      return ['barbell', 'dumbbell', 'band', 'bodyweight'].includes(candidate.equipmentRequired);
    }

    // 'full_gym' allows everything
    return true;
  });

  return suitable;
};

/**
 * Checks whether an exercise is contraindicated for a user profile
 */
export const isExerciseContraindicated = (exercise, profile) => {
  const injuries = profile.healthFlags?.injuries || [];
  if (injuries.length === 0) return false;

  return exercise.injuryRiskAreas?.some((risk) => injuries.includes(risk)) || false;
};

/**
 * Replace all contraindicated exercises in a scheduled day with safe equivalents
 */
export const sanitizeWorkoutDay = async (exercisesList, profile) => {
  const sanitized = [];

  for (const item of exercisesList) {
    let exerciseDoc = await Exercise.findById(item.exerciseId).lean();
    if (!exerciseDoc) {
      sanitized.push(item);
      continue;
    }

    if (isExerciseContraindicated(exerciseDoc, profile)) {
      const substitutes = await findSmartSubstitutes(exerciseDoc, profile);
      if (substitutes.length > 0) {
        const replacement = substitutes[0];
        sanitized.push({
          ...item,
          exerciseId: replacement._id,
          exerciseName: replacement.name,
          slug: replacement.slug,
          movementPattern: replacement.movementPattern,
          tier: replacement.tier,
          notes: `Auto-substituted from ${exerciseDoc.name} due to injury safety flags (${profile.healthFlags?.injuries?.join(', ')})`,
        });
      } else {
        // If no safe substitute found, preserve but flag
        sanitized.push({
          ...item,
          notes: `Caution: Perform with light load or consult coach due to ${profile.healthFlags?.injuries?.join(', ')}`,
        });
      }
    } else {
      sanitized.push(item);
    }
  }

  return sanitized;
};
