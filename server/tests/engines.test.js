import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  calculate1RM,
  getAgeCoefficient,
  calculateLiftPercentile,
  calculateDOTS,
  calculateCompositeStrengthScore,
  getCohortKey,
} from '../services/strengthBenchmarkEngine.js';

describe('Strength Benchmark Engine Formula Tests', () => {
  test('calculate1RM correctly estimates 1RM using Epley', () => {
    // 100kg for 10 reps -> 100 * (1 + 10/30) = 133.3kg
    const e1rm = calculate1RM(100, 10, 'epley');
    assert.strictEqual(e1rm, 133.3);
  });

  test('calculate1RM for 1 rep returns exact weight', () => {
    const e1rm = calculate1RM(150, 1);
    assert.strictEqual(e1rm, 150);
  });

  test('getAgeCoefficient reflects junior, peak, and masters bands', () => {
    const teenCoeff = getAgeCoefficient(16);
    const peakCoeff = getAgeCoefficient(28);
    const mastersCoeff = getAgeCoefficient(50);

    assert.ok(teenCoeff < 1.0, 'Teen age coefficient should be < 1.0');
    assert.strictEqual(peakCoeff, 1.0, 'Age 28 should have peak coefficient of 1.0');
    assert.ok(mastersCoeff < 1.0, 'Age 50 should have masters coefficient < 1.0');
  });

  test('calculateLiftPercentile returns calibrated percentiles within valid bounds', () => {
    // Male, 82.5kg, 28 years old, 140kg squat should be around intermediate/proficient (~55-75th percentile)
    const percentile = calculateLiftPercentile('squat', 140, 'male', 28, 82.5);
    assert.ok(percentile >= 50 && percentile <= 80, `Expected percentile between 50 and 80, got ${percentile}`);
  });

  test('calculateDOTS computes normalized powerlifting coefficient', () => {
    // 500kg total at 80kg body weight
    const dots = calculateDOTS(500, 80, 'male');
    assert.ok(dots > 300 && dots < 400, `Expected DOTS between 300 and 400, got ${dots}`);
  });

  test('calculateCompositeStrengthScore scales properly between 0 and 1000', () => {
    const score = calculateCompositeStrengthScore({
      squat: 70,
      bench_press: 65,
      deadlift: 75,
      overhead_press: 60,
      pull_up: 80,
      barbell_row: 65,
    });
    assert.ok(score >= 650 && score <= 750, `Expected score between 650 and 750, got ${score}`);
  });

  test('getCohortKey correctly segments demographics', () => {
    const cohort = getCohortKey('male', 28, 82.5);
    assert.strictEqual(cohort.cohortKey, 'male_18-30_80-90kg');
    assert.strictEqual(cohort.ageBand, '18-30');
    assert.strictEqual(cohort.weightBand, '80-90kg');
  });
});
