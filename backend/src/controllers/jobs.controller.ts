import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { jobMatchingService } from '../services/jobMatching.service';
import {
  AuthenticationError,
  NotFoundError,
  ConflictError,
} from '../errors/customErrors';

interface JobSearchQuery {
  page?: string;
  limit?: string;
  search?: string;
  location?: string;
  jobType?: string;
  industry?: string;
  experienceLevel?: string;
  salaryMin?: string;
  salaryMax?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getRecommendations = async (
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

    const existingMatches = await prisma.jobMatch.findMany({
      where: { userId: req.user.id },
      include: {
        job: true,
      },
      orderBy: { matchScore: 'desc' },
      skip,
      take: limit,
    });

    const totalMatches = await prisma.jobMatch.count({
      where: { userId: req.user.id },
    });

    if (existingMatches.length > 0) {
      res.status(200).json({
        status: 'success',
        data: {
          recommendations: existingMatches,
          pagination: {
            page,
            limit,
            total: totalMatches,
            totalPages: Math.ceil(totalMatches / limit),
          },
        },
      });
      return;
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.user.id },
    });

    const activeJobs = await prisma.jobListing.findMany({
      where: { isActive: true },
      take: 50,
      orderBy: [{ isFeatured: 'desc' }, { postedDate: 'desc' }],
    });

    const matchPromises = activeJobs.map((job) =>
      jobMatchingService
        .computeAndSaveMatch(req.user!.id, job.id)
        .catch(() => null)
    );
    await Promise.allSettled(matchPromises);

    const freshMatches = await prisma.jobMatch.findMany({
      where: { userId: req.user.id },
      include: { job: true },
      orderBy: { matchScore: 'desc' },
      skip,
      take: limit,
    });

    const freshTotal = await prisma.jobMatch.count({
      where: { userId: req.user.id },
    });

    res.status(200).json({
      status: 'success',
      data: {
        recommendations: freshMatches,
        preferences: preferences ? { hasPreferences: true } : { hasPreferences: false },
        pagination: {
          page,
          limit,
          total: freshTotal,
          totalPages: Math.ceil(freshTotal / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const searchJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      location,
      jobType,
      industry,
      experienceLevel,
      salaryMin,
      salaryMax,
      sortBy = 'postedDate',
      sortOrder = 'desc',
    } = req.query as JobSearchQuery;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.JobListingWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (jobType) {
      where.jobType = { equals: jobType, mode: 'insensitive' };
    }

    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' };
    }

    if (experienceLevel) {
      where.experienceLevel = { contains: experienceLevel, mode: 'insensitive' };
    }

    if (salaryMin || salaryMax) {
      where.AND = [];
      if (salaryMin) {
        (where.AND as Prisma.JobListingWhereInput[]).push({
          salaryMax: { gte: parseInt(salaryMin, 10) },
        });
      }
      if (salaryMax) {
        (where.AND as Prisma.JobListingWhereInput[]).push({
          salaryMin: { lte: parseInt(salaryMax, 10) },
        });
      }
    }

    const validSortFields = [
      'postedDate',
      'title',
      'company',
      'salaryMin',
      'salaryMax',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'postedDate';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    const [jobs, total] = await Promise.all([
      prisma.jobListing.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { [sortField]: order }],
        skip,
        take: limitNum,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          jobType: true,
          industry: true,
          experienceLevel: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          skills: true,
          postedDate: true,
          applicationDeadline: true,
          description: true,
          isFeatured: true,
          source: true,
          url: true,
          isActive: true,
        },
      }),
      prisma.jobListing.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        jobs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await prisma.jobListing.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundError('Job listing');
    }

    if (req.user) {
      await prisma.jobMatch.updateMany({
        where: { userId: req.user.id, jobId: id },
        data: { isViewed: true },
      });
    }

    res.status(200).json({
      status: 'success',
      data: { job },
    });
  } catch (err) {
    next(err);
  }
};

export const saveJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const { id: jobId } = req.params;

    const job = await prisma.jobListing.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundError('Job listing');
    }

    const existingMatch = await prisma.jobMatch.findUnique({
      where: { userId_jobId: { userId: req.user.id, jobId } },
    });

    if (existingMatch?.isSaved) {
      throw new ConflictError('Job is already saved');
    }

    if (existingMatch) {
      await prisma.jobMatch.update({
        where: { userId_jobId: { userId: req.user.id, jobId } },
        data: { isSaved: true },
      });
    } else {
      const matchResult = await jobMatchingService.calculateJobMatch(
        req.user.id,
        jobId
      );
      await prisma.jobMatch.create({
        data: {
          userId: req.user.id,
          jobId,
          matchScore: matchResult.matchScore,
          skillScore: matchResult.skillScore,
          experienceScore: matchResult.experienceScore,
          locationScore: matchResult.locationScore,
          matchReasons: matchResult.matchReasons as unknown as Prisma.JsonArray,
          skillGaps: matchResult.skillGaps,
          isSaved: true,
          isViewed: true,
        },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Job saved successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const unsaveJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const { id: jobId } = req.params;

    const existingMatch = await prisma.jobMatch.findUnique({
      where: { userId_jobId: { userId: req.user.id, jobId } },
    });

    if (!existingMatch || !existingMatch.isSaved) {
      throw new NotFoundError('Saved job');
    }

    await prisma.jobMatch.update({
      where: { userId_jobId: { userId: req.user.id, jobId } },
      data: { isSaved: false },
    });

    res.status(200).json({
      status: 'success',
      message: 'Job removed from saved list',
    });
  } catch (err) {
    next(err);
  }
};

export const applyToJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const { id: jobId } = req.params;
    const { coverLetter, resumeId } = req.body as {
      coverLetter?: string;
      resumeId?: string;
    };

    const job = await prisma.jobListing.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundError('Job listing');
    }

    const existingApplication = await prisma.application.findFirst({
      where: { userId: req.user.id, jobId },
    });

    if (existingApplication) {
      throw new ConflictError('You have already applied to this job');
    }

    if (resumeId) {
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId: req.user.id, isActive: true },
      });
      if (!resume) {
        throw new NotFoundError('Resume');
      }
    }

    const application = await prisma.application.create({
      data: {
        userId: req.user.id,
        jobId,
        status: 'pending',
        coverLetter: coverLetter ?? null,
        resumeId: resumeId ?? null,
        source: 'jobfinder',
      },
    });

    await prisma.jobMatch.upsert({
      where: { userId_jobId: { userId: req.user.id, jobId } },
      create: {
        userId: req.user.id,
        jobId,
        matchScore: 0,
        skillScore: 0,
        experienceScore: 0,
        locationScore: 0,
        matchReasons: [] as unknown as Prisma.JsonArray,
        skillGaps: [],
        isApplied: true,
      },
      update: {
        isApplied: true,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Application submitted successfully',
      data: { application },
    });
  } catch (err) {
    next(err);
  }
};

export const getSavedJobs = async (
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

    const [savedMatches, total] = await Promise.all([
      prisma.jobMatch.findMany({
        where: { userId: req.user.id, isSaved: true },
        include: { job: true },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.jobMatch.count({
        where: { userId: req.user.id, isSaved: true },
      }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        savedJobs: savedMatches,
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
