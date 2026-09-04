import express from 'express';
import { registerUser, loginUser, demoLogin, getCurrentUser, updatePreferences } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/demo', demoLogin);
router.get('/me', protect, getCurrentUser);
router.put('/preferences', protect, updatePreferences);

export default router;
