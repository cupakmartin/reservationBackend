import { Router } from 'express';
import { register, login, refresh, getMe } from './auth.controller';
import { validate } from '../../../middleware/validation';
import { authenticate } from '../../../middleware/auth';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['client', 'worker', 'admin']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const refreshSchema = z.object({
  refreshToken: z.string()
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.get('/me', authenticate, getMe);

export default router;
