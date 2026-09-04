import express from 'express';
import { getCohortLeaderboard, getUserBadges } from '../controllers/leaderboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/cohort', protect, getCohortLeaderboard);
router.get('/badges', protect, getUserBadges);

export default router;
