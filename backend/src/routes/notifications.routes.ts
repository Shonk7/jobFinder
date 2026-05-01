import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { AuthenticationError } from '../errors/customErrors';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const page = parseInt((req.query['page'] as string) || '1', 10);
    const limit = Math.min(
      parseInt((req.query['limit'] as string) || '20', 10),
      100
    );
    const skip = (page - 1) * limit;

    const unseenMatches = await prisma.jobMatch.findMany({
      where: {
        userId: req.user.id,
        isViewed: false,
        matchScore: { gte: 0.6 },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            jobType: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
          },
        },
      },
      orderBy: { matchScore: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.jobMatch.count({
      where: {
        userId: req.user.id,
        isViewed: false,
        matchScore: { gte: 0.6 },
      },
    });

    const notifications = unseenMatches.map((match) => ({
      id: match.id,
      type: 'job_match',
      title: `New job match: ${match.job.title} at ${match.job.company}`,
      body: `Match score: ${Math.round(match.matchScore * 100)}%`,
      data: { jobId: match.jobId, matchScore: match.matchScore },
      isRead: match.isViewed,
      createdAt: match.createdAt,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/:id/read',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      const { id } = req.params;

      await prisma.jobMatch.updateMany({
        where: {
          id,
          userId: req.user.id,
        },
        data: { isViewed: true },
      });

      res.status(200).json({
        status: 'success',
        message: 'Notification marked as read',
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/read-all',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      await prisma.jobMatch.updateMany({
        where: { userId: req.user.id, isViewed: false },
        data: { isViewed: true },
      });

      res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
