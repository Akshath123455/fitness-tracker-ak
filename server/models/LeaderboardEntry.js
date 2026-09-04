import mongoose from 'mongoose';

const leaderboardEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    cohortKey: { type: String, required: true }, // e.g. "male_18-30_80-90kg"
    demographics: {
      ageBand: { type: String, required: true }, // "teen", "18-30", "31-45", "46-60", "60+"
      sex: { type: String, required: true },
      weightClassKg: { type: String, required: true }, // "70-80kg"
      experienceLevel: { type: String, required: true },
    },
    strengthScore: { type: Number, required: true },
    wilksScore: { type: Number, default: 0 },
    dotsScore: { type: Number, default: 0 },
    liftMaxesKg: {
      squat: { type: Number, default: 0 },
      bench_press: { type: Number, default: 0 },
      deadlift: { type: Number, default: 0 },
      overhead_press: { type: Number, default: 0 },
    },
    streakDays: { type: Number, default: 0 },
    isOptedIn: { type: Boolean, default: true },
    isAnonymized: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

leaderboardEntrySchema.index({ cohortKey: 1, strengthScore: -1 });

export default mongoose.model('LeaderboardEntry', leaderboardEntrySchema);
