import express from 'express';
import { getActiveProgram, regenerateProgram, swapProgramExercise, applyAdaptation } from '../controllers/programController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/active', protect, getActiveProgram);
router.post('/regenerate', protect, regenerateProgram);
router.post('/swap-exercise', protect, swapProgramExercise);
router.post('/adapt', protect, applyAdaptation);

export default router;
