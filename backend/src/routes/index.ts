import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './users.routes';
import resumeRoutes from './resumes.routes';
import jobRoutes from './jobs.routes';
import applicationRoutes from './applications.routes';
import notificationRoutes from './notifications.routes';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/resumes', resumeRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/notifications', notificationRoutes);

export default router;
