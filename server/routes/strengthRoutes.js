import express from 'express';
import { estimate1RMAndPercentile, getStrengthBenchmarks, getStrengthHistory } from '../controllers/strengthController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/estimate', estimate1RMAndPercentile);
router.get('/benchmarks', protect, getStrengthBenchmarks);
router.get('/history', protect, getStrengthHistory);

export default router;
