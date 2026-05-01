import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import {
  AuthenticationError,
  NotFoundError,
  AuthorizationError,
  AppError,
} from '../errors/customErrors';

const VALID_STATUSES = [
  'pending',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
  'accepted',
];

export const getApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    const status = req.query['status'] as string | undefined;

    const where: Prisma.ApplicationWhereInput = {
      userId: req.user.id,
    };

    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              jobType: true,
              industry: true,
              salaryMin: true,
              salaryMax: true,
              salaryCurrency: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    const statusCounts = await prisma.application.groupBy({
      by: ['status'],
      where: { userId: req.user.id },
      _count: { status: true },
    });

    res.status(200).json({
      status: 'success',
      data: {
        applications,
        statusSummary: statusCounts.reduce<Record<string, number>>(
          (acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
          },
          {}
        ),
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
};

export const getApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
      },
    });

    if (!application) {
      throw new NotFoundError('Application');
    }

    if (application.userId !== req.user.id) {
      throw new AuthorizationError('You do not have access to this application');
    }

    res.status(200).json({
      status: 'success',
      data: { application },
    });
  } catch (err) {
    next(err);
  }
};

export const updateApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const { id } = req.params;
    const { status, coverLetter } = req.body as {
      status?: string;
      coverLetter?: string;
    };

    const application = await prisma.application.findUnique({ where: { id } });

    if (!application) {
      throw new NotFoundError('Application');
    }

    if (application.userId !== req.user.id) {
      throw new AuthorizationError('You do not have access to this application');
    }

    if (status && !VALID_STATUSES.includes(status)) {
      throw new AppError(
        `Invalid status. Valid statuses are: ${VALID_STATUSES.join(', ')}`,
        400,
        'INVALID_STATUS'
      );
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(coverLetter !== undefined && { coverLetter }),
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
    });

    if (status === 'applied' || status === 'pending') {
      await prisma.jobMatch.updateMany({
        where: { userId: req.user.id, jobId: application.jobId },
        data: { isApplied: true },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Application updated successfully',
      data: { application: updatedApplication },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const { id } = req.params;

    const application = await prisma.application.findUnique({ where: { id } });

    if (!application) {
      throw new NotFoundError('Application');
    }

    if (application.userId !== req.user.id) {
      throw new AuthorizationError(
        'You do not have access to this application'
      );
    }

    if (!['pending', 'withdrawn'].includes(application.status)) {
      throw new AppError(
        'Only pending or withdrawn applications can be deleted',
        400,
        'INVALID_OPERATION'
      );
    }

    await prisma.application.delete({ where: { id } });

    await prisma.jobMatch.updateMany({
      where: { userId: req.user.id, jobId: application.jobId },
      data: { isApplied: false },
    });

    res.status(200).json({
      status: 'success',
      message: 'Application deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
