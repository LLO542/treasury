import { Router } from 'express';
import {
  getCurrentUser,
  login,
  logout,
  register,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loginRateLimiter } from '../middleware/login-rate-limit.middleware.js';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', loginRateLimiter, login);
authRouter.post('/logout', authenticate, logout);
authRouter.get('/me', authenticate, getCurrentUser);

export { authRouter };
