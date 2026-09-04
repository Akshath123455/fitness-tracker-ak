import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['chest', 'back', 'quads', 'hamstrings', 'glutes', 'shoulders', 'arms', 'core', 'calves', 'full_body'],
      required: true,
    },
    movementPattern: {
      type: String,
      enum: ['squat', 'hinge', 'horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull', 'lunge', 'isolation', 'carry'],
      required: true,
    },
    primaryMuscles: [{ type: String }],
    secondaryMuscles: [{ type: String }],
    equipmentRequired: {
      type: String,
      enum: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'band'],
      required: true,
    },
    tier: {
      type: Number,
      enum: [1, 2, 3], // 1 = Main Compound, 2 = Secondary, 3 = Accessory/Isolation
      default: 2,
    },
    injuryRiskAreas: [
      {
        type: String,
        enum: ['lower_back', 'shoulder', 'knee', 'wrist', 'hip', 'neck', 'elbow', 'ankle'],
      },
    ],
    cues: [{ type: String }],
    commonMistakes: [{ type: String }],
    videoUrl: { type: String, default: '' },
    isCustom: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Exercise', exerciseSchema);
