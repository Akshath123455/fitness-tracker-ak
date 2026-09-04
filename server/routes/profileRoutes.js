import express from 'express';
import { getProfile, saveProfile, submitReassessment } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getProfile)
  .post(protect, saveProfile);

router.post('/reassess', protect, submitReassessment);

export default router;
