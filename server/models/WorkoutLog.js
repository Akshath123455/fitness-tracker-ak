import mongoose from 'mongoose';

const loggedSetSchema = new mongoose.Schema(
  {
    setNumber: { type: Number, required: true },
    weightKg: { type: Number, required: true, default: 0 },
    reps: { type: Number, required: true, default: 0 },
    rpe: { type: Number, min: 1, max: 10, default: 8 },
    isWarmup: { type: Boolean, default: false },
    completed: { type: Boolean, default: true },
    estimated1RM: { type: Number, default: 0 },
    restTakenSeconds: { type: Number, default: 90 },
  },
  { _id: false }
);

const loggedExerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
    exerciseName: { type: String, required: true },
    movementPattern: { type: String },
    sets: [loggedSetSchema],
    personalRecordsAchieved: [{ type: String }], // e.g. "Max 1RM: 120kg", "Max Reps: 12"
    substitutedFromId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', default: null },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const workoutLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      default: null,
    },
    clientSyncId: {
      type: String,
      unique: true,
      sparse: true,
    },
    workoutName: { type: String, required: true },
    weekNumber: { type: Number, default: 1 },
    dayNumber: { type: Number, default: 1 },
    date: { type: Date, default: Date.now },
    durationSeconds: { type: Number, default: 3600 },
    overallRpe: { type: Number, min: 1, max: 10, default: 8 },
    fatigueRating: { type: Number, min: 1, max: 10, default: 5 },
    energyRating: { type: Number, min: 1, max: 10, default: 7 },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'discarded'],
      default: 'completed',
    },
    exercises: [loggedExerciseSchema],
    metrics: {
      totalVolumeKg: { type: Number, default: 0 },
      totalReps: { type: Number, default: 0 },
      totalSetsCompleted: { type: Number, default: 0 },
      avgIntensityRpe: { type: Number, default: 8 },
      newPRCount: { type: Number, default: 0 },
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

workoutLogSchema.index({ userId: 1, date: -1 });

export default mongoose.model('WorkoutLog', workoutLogSchema);
