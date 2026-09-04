import express from 'express';
import { chatWithCoach, getExerciseSubstitutes, getExerciseFormCues } from '../controllers/aiCoachController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/chat', protect, chatWithCoach);
router.get('/substitutes/:exerciseId', protect, getExerciseSubstitutes);
router.get('/form-cues/:slug', protect, getExerciseFormCues);

export default router;
