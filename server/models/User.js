import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    avatarUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    },
    role: {
      type: String,
      enum: ['user', 'coach', 'admin'],
      default: 'user',
    },
    preferences: {
      unitSystem: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg',
      },
      soundAlerts: {
        type: Boolean,
        default: true,
      },
      restTimerAutoStart: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        enum: ['dark', 'emerald', 'cyber'],
        default: 'dark',
      },
    },
    privacy: {
      shareCohortLeaderboard: {
        type: Boolean,
        default: true,
      },
      anonymizeLeaderboardName: {
        type: Boolean,
        default: false,
      },
      shareProgressStats: {
        type: Boolean,
        default: true,
      },
    },
    streak: {
      current: {
        type: Number,
        default: 0,
      },
      longest: {
        type: Number,
        default: 0,
      },
      lastActiveDate: {
        type: Date,
        default: null,
      },
    },
    badges: [
      {
        badgeId: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String },
        category: { type: String },
        icon: { type: String, default: 'award' },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
