import strengthStandardsData from '../data/strengthStandardsData.json' with { type: 'json' };

/**
 * 1RM Estimation Formulas
 */
export const calculate1RM = (weight, reps, formula = 'epley') => {
  if (!weight || weight <= 0) return 0;
  if (!reps || reps <= 1) return Math.round(weight * 10) / 10;

  let e1rm = 0;
  switch (formula.toLowerCase()) {
    case 'brzycki':
      // Brzycki: W * (36 / (37 - R)) - caps at 36 reps
      e1rm = reps < 37 ? weight * (36 / (37 - reps)) : weight * 2.5;
      break;
    case 'lombardi':
      // Lombardi: W * R^0.10
      e1rm = weight * Math.pow(reps, 0.1);
      break;
    case 'hybrid':
      // Blended Epley + Brzycki for balanced accuracy
      const epleyVal = weight * (1 + reps / 30);
      const brzyckiVal = reps < 37 ? weight * (36 / (37 - reps)) : epleyVal;
      e1rm = reps <= 5 ? epleyVal : (epleyVal + brzyckiVal) / 2;
      break;
    case 'epley':
    default:
      // Epley: W * (1 + R / 30)
      e1rm = weight * (1 + reps / 30);
      break;
  }

  return Math.round(e1rm * 10) / 10;
};

/**
 * Age Factor (IPF/Masters normative regression curve)
 * Gives fair age-adjusted strength potential
 */
export const getAgeCoefficient = (age) => {
  if (!age || age < 13) return 0.8;
  if (age >= 13 && age <= 23) {
    // Junior growth curve
    return 0.85 + (age - 13) * 0.015;
  }
  if (age > 23 && age <= 35) {
    // Peak physiological band
    return 1.0;
  }
  // Masters decline curve: ~0.75% per year past 35
  const decline = (age - 35) * 0.0075;
  return Math.max(0.45, 1.0 - decline);
};

/**
 * Get Demographic Cohort Key
 */
export const getCohortKey = (sex, age, bodyWeightKg) => {
  let ageBand = '18-30';
  if (age < 18) ageBand = 'teen';
  else if (age <= 30) ageBand = '18-30';
  else if (age <= 45) ageBand = '31-45';
  else if (age <= 60) ageBand = '46-60';
  else ageBand = '60+';

  let weightBand = '70-80kg';
  if (bodyWeightKg < 60) weightBand = '<60kg';
  else if (bodyWeightKg < 70) weightBand = '60-70kg';
  else if (bodyWeightKg < 80) weightBand = '70-80kg';
  else if (bodyWeightKg < 90) weightBand = '80-90kg';
  else if (bodyWeightKg < 105) weightBand = '90-105kg';
  else weightBand = '105kg+';

  const normalizedSex = sex === 'female' ? 'female' : 'male';
  return {
    cohortKey: `${normalizedSex}_${ageBand}_${weightBand}`,
    ageBand,
    weightBand,
    sex: normalizedSex,
  };
};

/**
 * Interpolate strength tier thresholds for a given bodyweight
 */
const interpolateStandardsForWeight = (weightBrackets, bodyWeightKg) => {
  if (!weightBrackets || weightBrackets.length === 0) return null;

  // Sort ascending
  const sorted = [...weightBrackets].sort((a, b) => a.bodyWeightKg - b.bodyWeightKg);

  if (bodyWeightKg <= sorted[0].bodyWeightKg) {
    const scale = Math.max(0.6, bodyWeightKg / sorted[0].bodyWeightKg);
    return scaleStandards(sorted[0], scale);
  }

  if (bodyWeightKg >= sorted[sorted.length - 1].bodyWeightKg) {
    const scale = Math.min(1.4, bodyWeightKg / sorted[sorted.length - 1].bodyWeightKg);
    return scaleStandards(sorted[sorted.length - 1], scale);
  }

  // Find bounding brackets
  for (let i = 0; i < sorted.length - 1; i++) {
    const lower = sorted[i];
    const upper = sorted[i + 1];
    if (bodyWeightKg >= lower.bodyWeightKg && bodyWeightKg <= upper.bodyWeightKg) {
      const t = (bodyWeightKg - lower.bodyWeightKg) / (upper.bodyWeightKg - lower.bodyWeightKg);
      return {
        untrained: lower.untrained + t * (upper.untrained - lower.untrained),
        novice: lower.novice + t * (upper.novice - lower.novice),
        intermediate: lower.intermediate + t * (upper.intermediate - lower.intermediate),
        proficient: lower.proficient + t * (upper.proficient - lower.proficient),
        advanced: lower.advanced + t * (upper.advanced - lower.advanced),
        elite: lower.elite + t * (upper.elite - lower.elite),
      };
    }
  }

  return sorted[0];
};

const scaleStandards = (standard, factor) => ({
  untrained: standard.untrained * factor,
  novice: standard.novice * factor,
  intermediate: standard.intermediate * factor,
  proficient: standard.proficient * factor,
  advanced: standard.advanced * factor,
  elite: standard.elite * factor,
});

/**
 * Calculate lift percentile given user's 1RM, sex, age, and bodyweight
 */
export const calculateLiftPercentile = (exerciseKey, oneRepMaxKg, sex, age, bodyWeightKg) => {
  if (!oneRepMaxKg || oneRepMaxKg <= 0) return 5;

  const standardEntry = strengthStandardsData.find(
    (s) => s.exerciseKey === exerciseKey && (s.sex === (sex === 'female' ? 'female' : 'male') || s.sex === 'unisex')
  );

  if (!standardEntry) return 50;

  const ageCoeff = getAgeCoefficient(age);
  const normalized1RM = oneRepMaxKg / ageCoeff;

  const thresholds = interpolateStandardsForWeight(standardEntry.weightBrackets, bodyWeightKg);
  if (!thresholds) return 50;

  // Map tiers to percentile markers:
  // 0 -> 1%, Untrained -> 10%, Novice -> 25%, Intermediate -> 50%, Proficient -> 75%, Advanced -> 90%, Elite -> 99%
  const points = [
    { weight: 0, p: 1 },
    { weight: thresholds.untrained, p: 10 },
    { weight: thresholds.novice, p: 25 },
    { weight: thresholds.intermediate, p: 50 },
    { weight: thresholds.proficient, p: 75 },
    { weight: thresholds.advanced, p: 90 },
    { weight: thresholds.elite, p: 99 },
  ];

  if (normalized1RM <= points[0].weight) return 1;
  if (normalized1RM >= points[points.length - 1].weight) return 99.5;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (normalized1RM >= p1.weight && normalized1RM <= p2.weight) {
      const frac = (normalized1RM - p1.weight) / (p2.weight - p1.weight);
      const calculatedP = p1.p + frac * (p2.p - p1.p);
      return Math.round(Math.min(99.9, Math.max(1, calculatedP)) * 10) / 10;
    }
  }

  return 50;
};

/**
 * DOTS Coefficient Calculation (Pound-for-Pound normalization)
 */
export const calculateDOTS = (totalKg, bodyWeightKg, sex) => {
  if (!totalKg || !bodyWeightKg) return 0;
  const bw = bodyWeightKg;
  let a, b, c, d, e;

  if (sex === 'female') {
    a = -57.96288;
    b = 13.6175032;
    c = -0.1126655495;
    d = 0.0005158568;
    e = -0.0000010706;
  } else {
    a = -307.2723;
    b = 24.0900756;
    c = -0.1918759221;
    d = 0.0007391293;
    e = -0.000001093;
  }

  const denominator = a + b * bw + c * Math.pow(bw, 2) + d * Math.pow(bw, 3) + e * Math.pow(bw, 4);
  if (denominator <= 0) return 0;
  const dots = (500 / denominator) * totalKg;
  return Math.round(dots * 10) / 10;
};

/**
 * Composite Strength Score (0 to 1000 scale)
 */
export const calculateCompositeStrengthScore = (percentiles) => {
  const weights = {
    squat: 0.25,
    deadlift: 0.25,
    bench_press: 0.20,
    overhead_press: 0.15,
    pull_up: 0.10,
    barbell_row: 0.05,
  };

  let totalScore = 0;
  let totalWeight = 0;

  for (const [lift, weight] of Object.entries(weights)) {
    const p = percentiles[lift] || 30; // default baseline if unrecorded
    totalScore += p * 10 * weight;
    totalWeight += weight;
  }

  const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 350;
  return Math.min(1000, Math.max(50, finalScore));
};

/**
 * Full Profile Assessment Evaluator
 */
export const evaluateTrainingProfileMetrics = (profileData) => {
  const { demographics, liftBaselines } = profileData;
  const { sex, age, bodyWeightKg } = demographics;

  const percentiles = {
    squat: calculateLiftPercentile('squat', liftBaselines?.squat?.oneRepMax || 0, sex, age, bodyWeightKg),
    bench_press: calculateLiftPercentile('bench_press', liftBaselines?.bench_press?.oneRepMax || 0, sex, age, bodyWeightKg),
    deadlift: calculateLiftPercentile('deadlift', liftBaselines?.deadlift?.oneRepMax || 0, sex, age, bodyWeightKg),
    overhead_press: calculateLiftPercentile('overhead_press', liftBaselines?.overhead_press?.oneRepMax || 0, sex, age, bodyWeightKg),
    pull_up: calculateLiftPercentile('pull_up', liftBaselines?.pull_up?.oneRepMax || 0, sex, age, bodyWeightKg),
    barbell_row: calculateLiftPercentile('barbell_row', liftBaselines?.barbell_row?.oneRepMax || 0, sex, age, bodyWeightKg),
  };

  const strengthScore = calculateCompositeStrengthScore(percentiles);
  const bigThreeTotal =
    (liftBaselines?.squat?.oneRepMax || 0) +
    (liftBaselines?.bench_press?.oneRepMax || 0) +
    (liftBaselines?.deadlift?.oneRepMax || 0);

  const dotsScore = calculateDOTS(bigThreeTotal, bodyWeightKg, sex);
  const cohortInfo = getCohortKey(sex, age, bodyWeightKg);

  return {
    percentiles,
    strengthScore,
    dotsScore,
    bigThreeTotal,
    cohortInfo,
  };
};
