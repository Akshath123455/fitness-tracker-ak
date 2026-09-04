import mongoose from 'mongoose';

const prescribedSetSchema = new mongoose.Schema(
  {
    setNumber: { type: Number, required: true },
    targetReps: { type: Number, required: true },
    targetRpe: { type: Number, default: 8 },
    targetPercent1RM: { type: Number, default: 75 },
    prescribedWeightKg: { type: Number, default: 0 },
    restSeconds: { type: Number, default: 90 },
    isWarmup: { type: Boolean, default: false },
  },
  { _id: false }
);

const programExerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
    exerciseName: { type: String, required: true },
    slug: { type: String },
    movementPattern: { type: String },
    tier: { type: Number, default: 2 },
    orderIndex: { type: Number, required: true },
    targetSets: { type: Number, required: true, default: 3 },
    sets: [prescribedSetSchema],
    progressionRule: { type: String, default: 'double_progression' },
    notes: { type: String, default: '' },
    substituteOptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
  },
  { _id: false }
);

const programDaySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true }, // 1 to 7
    dayName: { type: String, required: true }, // e.g., "Day 1: Upper Strength"
    focusCategory: { type: String, default: 'Upper Body' },
    isRestDay: { type: Boolean, default: false },
    estimatedDurationMin: { type: Number, default: 60 },
    exercises: [programExerciseSchema],
  },
  { _id: false }
);

const programWeekSchema = new mongoose.Schema(
  {
    weekNumber: { type: Number, required: true },
    theme: { type: String, default: 'Accumulation' }, // Accumulation, Intensity, Deload, Peak
    intensityMultiplier: { type: Number, default: 1.0 },
    isDeloadWeek: { type: Boolean, default: false },
    days: [programDaySchema],
  },
  { _id: false }
);

const programSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    periodizationType: {
      type: String,
      enum: ['linear', 'undulating', 'block'],
      required: true,
    },
    goal: { type: String, required: true },
    durationWeeks: { type: Number, required: true, default: 4 },
    currentWeekNumber: { type: Number, default: 1 },
    currentDayNumber: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    weeks: [programWeekSchema],
    adaptationHistory: [
      {
        date: { type: Date, default: Date.now },
        triggerType: { type: String, enum: ['auto_overload', 'deload_trigger', 'plateau_tweak', 'user_custom', 'coach_swap'] },
        message: { type: String, required: true },
        modifications: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Program', programSchema);
