import mongoose from 'mongoose';

const weightBracketSchema = new mongoose.Schema(
  {
    bodyWeightKg: { type: Number, required: true },
    untrained: { type: Number, required: true },
    novice: { type: Number, required: true },
    intermediate: { type: Number, required: true },
    proficient: { type: Number, required: true },
    advanced: { type: Number, required: true },
    elite: { type: Number, required: true },
  },
  { _id: false }
);

const strengthStandardSchema = new mongoose.Schema(
  {
    exerciseKey: {
      type: String,
      required: true,
      enum: ['squat', 'bench_press', 'deadlift', 'overhead_press', 'pull_up', 'barbell_row'],
    },
    exerciseName: { type: String, required: true },
    sex: {
      type: String,
      enum: ['male', 'female', 'unisex'],
      required: true,
    },
    weightBrackets: [weightBracketSchema],
    sourceCitation: {
      type: String,
      default: 'Published normative strength distributions (ExRx / Kilgore & Rippetoe empirical standards)',
    },
  },
  {
    timestamps: true,
  }
);

strengthStandardSchema.index({ exerciseKey: 1, sex: 1 }, { unique: true });

export default mongoose.model('StrengthStandard', strengthStandardSchema);
