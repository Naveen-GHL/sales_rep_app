import { Router } from 'express';
import { login, refreshToken, logout, forgotPassword, resetPassword, me } from './authController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, me);

export default router;
