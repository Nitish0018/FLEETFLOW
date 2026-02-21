import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refresh, logout, updateProfile } from '../controllers/auth.controller';

const router = Router();

// Strict rate limit for auth routes (prevent brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: 'Too many auth attempts, please try again in 15 minutes.' },
});

import { authMiddleware } from '../middlewares/auth.middleware';

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.put('/profile', authMiddleware, updateProfile);

export default router;
