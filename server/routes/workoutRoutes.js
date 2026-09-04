import express from 'express';
import { logWorkout, syncOfflineWorkouts, getWorkouts, getWorkoutById } from '../controllers/workoutController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getWorkouts)
  .post(protect, logWorkout);

router.post('/sync-offline', protect, syncOfflineWorkouts);
router.get('/:id', protect, getWorkoutById);

export default router;
