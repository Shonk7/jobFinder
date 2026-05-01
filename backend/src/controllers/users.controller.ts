import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import {
  AuthenticationError,
  NotFoundError,
  ConflictError,
} from '../errors/customErrors';

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        preferences: true,
        resumes: {
          where: { isActive: true },
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            fileType: true,
            skills: true,
            experienceYears: true,
            educationLevel: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const { firstName, lastName, email } = req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
    };

    if (email && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new ConflictError('Email address is already in use');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const { password } = req.body as { password?: string };

    if (password) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { passwordHash: true },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new AuthenticationError('Password is incorrect');
      }
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { isActive: false },
    });

    await prisma.session.deleteMany({
      where: { userId: req.user.id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Account deactivated successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const updatePreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const {
      careerLevel,
      jobTypes,
      industries,
      locations,
      salaryMin,
      salaryMax,
      companySizes,
      workEnvironment,
      willingToRelocate,
      openToCareerChange,
      skillsToDevelop,
    } = req.body as {
      careerLevel: string;
      jobTypes: string[];
      industries: string[];
      locations: string[];
      salaryMin?: number;
      salaryMax?: number;
      companySizes?: string[];
      workEnvironment: string;
      willingToRelocate?: boolean;
      openToCareerChange?: boolean;
      skillsToDevelop?: string[];
    };

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        careerLevel,
        jobTypes,
        industries,
        locations,
        salaryMin: salaryMin ?? null,
        salaryMax: salaryMax ?? null,
        companySizes: companySizes ?? [],
        workEnvironment,
        willingToRelocate: willingToRelocate ?? false,
        openToCareerChange: openToCareerChange ?? false,
        skillsToDevelop: skillsToDevelop ?? [],
      },
      update: {
        careerLevel,
        jobTypes,
        industries,
        locations,
        salaryMin: salaryMin ?? null,
        salaryMax: salaryMax ?? null,
        companySizes: companySizes ?? [],
        workEnvironment,
        willingToRelocate: willingToRelocate ?? false,
        openToCareerChange: openToCareerChange ?? false,
        skillsToDevelop: skillsToDevelop ?? [],
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Preferences updated successfully',
      data: { preferences },
    });
  } catch (err) {
    next(err);
  }
};

export const getPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.user.id },
    });

    if (!preferences) {
      res.status(200).json({
        status: 'success',
        data: { preferences: null },
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { preferences },
    });
  } catch (err) {
    next(err);
  }
};
