import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validate, registerSchema, loginSchema, refreshTokenSchema } from '../validation/schemas';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', authenticateToken, logout);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', authenticateToken, resendVerification);

export default router;
