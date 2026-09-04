import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { seedDatabase } from './seed.js';
import Exercise from './models/Exercise.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import strengthRoutes from './routes/strengthRoutes.js';
import programRoutes from './routes/programRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import aiCoachRoutes from './routes/aiCoachRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';

dotenv.config();

const app = express();

// Connect DB
await connectDB();

// Auto-seed if exercises are empty
const count = await Exercise.countDocuments();
if (count === 0) {
  console.log('[Server] Database is empty. Triggering initial automatic seed...');
  await seedDatabase();
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ApexPulse AI Server', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/strength', strengthRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/coach', aiCoachRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/exercises', exerciseRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[ApexPulse Server] Running on http://localhost:${PORT}`);
  });
}

export default app;
