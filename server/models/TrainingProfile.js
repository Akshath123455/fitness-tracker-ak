import mongoose from 'mongoose';

const liftBaselineSchema = new mongoose.Schema(
  {
    oneRepMax: { type: Number, default: 0 },
    testedReps: { type: Number, default: 1 },
    testedWeight: { type: Number, default: 0 },
    formulaUsed: { type: String, default: 'direct_1rm' },
    confidencePct: { type: Number, default: 95 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const trainingProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    demographics: {
      age: { type: Number, required: true, min: 13, max: 100 },
      sex: {
        type: String,
        enum: ['male', 'female', 'prefer_not_to_say'],
        required: true,
      },
      bodyWeightKg: { type: Number, required: true, min: 30, max: 300 },
      heightCm: { type: Number, required: true, min: 100, max: 250 },
      experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'elite'],
        required: true,
      },
    },
    goals: {
      primary: {
        type: String,
        enum: [
          'strength',
          'hypertrophy',
          'fat_loss',
          'general_fitness',
          'sport_specific',
          'rehab',
        ],
        required: true,
      },
      secondary: [{ type: String }],
      targetNotes: { type: String, default: '' },
    },
    schedule: {
      daysPerWeek: { type: Number, required: true, min: 2, max: 6, default: 4 },
      sessionDurationMin: { type: Number, required: true, default: 60 },
      preferredSplit: {
        type: String,
        enum: ['full_body', 'upper_lower', 'push_pull_legs', 'auto'],
        default: 'auto',
      },
      periodizationPreference: {
        type: String,
        enum: ['linear', 'undulating', 'block', 'auto'],
        default: 'auto',
      },
    },
    equipment: {
      access: {
        type: String,
        enum: ['full_gym', 'home_gym', 'dumbbells_bands', 'bodyweight_only'],
        required: true,
      },
      availableList: [{ type: String }],
    },
    healthFlags: {
      injuries: [
        {
          type: String,
          enum: ['lower_back', 'shoulder', 'knee', 'wrist', 'hip', 'neck', 'elbow', 'ankle'],
        },
      ],
      specialPopulation: {
        type: String,
        enum: ['general', 'prenatal', 'postpartum', 'older_adult', 'rehab'],
        default: 'general',
      },
      medicalDisclaimerAccepted: { type: Boolean, required: true, default: false },
      disclaimerAcceptedAt: { type: Date, default: null },
      notes: { type: String, default: '' },
    },
    liftBaselines: {
      squat: { type: liftBaselineSchema, default: () => ({}) },
      bench_press: { type: liftBaselineSchema, default: () => ({}) },
      deadlift: { type: liftBaselineSchema, default: () => ({}) },
      overhead_press: { type: liftBaselineSchema, default: () => ({}) },
      pull_up: { type: liftBaselineSchema, default: () => ({}) },
      barbell_row: { type: liftBaselineSchema, default: () => ({}) },
    },
    compositeMetrics: {
      strengthScore: { type: Number, default: 0 },
      wilksScore: { type: Number, default: 0 },
      dotsScore: { type: Number, default: 0 },
      cohortPercentiles: {
        squat: { type: Number, default: 50 },
        bench_press: { type: Number, default: 50 },
        deadlift: { type: Number, default: 50 },
        overhead_press: { type: Number, default: 50 },
        pull_up: { type: Number, default: 50 },
        barbell_row: { type: Number, default: 50 },
      },
      demographicCohortKey: { type: String, default: 'all' },
      lastAssessmentDate: { type: Date, default: Date.now },
      nextAssessmentDueDate: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('TrainingProfile', trainingProfileSchema);
