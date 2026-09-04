import User from '../models/User.js';
import TrainingProfile from '../models/TrainingProfile.js';
import { generateToken } from '../middleware/auth.js';

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: user.preferences,
      token: generateToken(user._id),
      hasCompletedOnboarding: false,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const profile = await TrainingProfile.findOne({ userId: user._id });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
        streak: user.streak,
        badges: user.badges,
        token: generateToken(user._id),
        hasCompletedOnboarding: !!profile,
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Instant Demo User login / switch
// @route   POST /api/auth/demo
export const demoLogin = async (req, res, next) => {
  try {
    let demoUser = await User.findOne({ email: 'alex.fitness@apexpulse.ai' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Alex Vance',
        email: 'alex.fitness@apexpulse.ai',
        password: 'Password123!',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        streak: { current: 14, longest: 28, lastActiveDate: new Date() },
        badges: [
          { badgeId: 'streak_14', title: 'Fortnight Warrior', description: '14-day unbroken consistency', icon: 'zap' },
          { badgeId: 'bench_bodyweight', title: '1x BW Bench', description: 'Pressed your exact body weight', icon: 'shield' },
          { badgeId: 'centurion', title: 'Centurion Volume', description: 'Logged over 100 working sets', icon: 'award' },
        ],
      });
    }

    const profile = await TrainingProfile.findOne({ userId: demoUser._id });

    res.json({
      _id: demoUser._id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      preferences: demoUser.preferences,
      streak: demoUser.streak,
      badges: demoUser.badges,
      token: generateToken(demoUser._id),
      hasCompletedOnboarding: !!profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile & preferences
// @route   GET /api/auth/me
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const profile = await TrainingProfile.findOne({ userId: user._id });

    res.json({
      ...user.toObject(),
      hasCompletedOnboarding: !!profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update preferences / privacy
// @route   PUT /api/auth/preferences
export const updatePreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.body.preferences) user.preferences = { ...user.preferences, ...req.body.preferences };
    if (req.body.privacy) user.privacy = { ...user.privacy, ...req.body.privacy };

    await user.save();
    res.json({ preferences: user.preferences, privacy: user.privacy });
  } catch (error) {
    next(error);
  }
};
