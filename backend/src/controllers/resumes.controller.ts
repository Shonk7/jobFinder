import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { prisma } from '../config/database';
import { parseResume } from '../services/resumeParser.service';
import {
  AuthenticationError,
  NotFoundError,
  AuthorizationError,
  AppError,
} from '../errors/customErrors';

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.',
        400,
        'INVALID_FILE_TYPE'
      )
    );
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

export const uploadResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    const parsed = await parseResume(req.file.buffer, req.file.originalname);

    const existingCount = await prisma.resume.count({
      where: { userId: req.user.id, isActive: true },
    });

    if (existingCount >= 5) {
      throw new AppError(
        'Maximum of 5 active resumes allowed. Please delete an existing resume first.',
        400,
        'RESUME_LIMIT_EXCEEDED'
      );
    }

    const resume = await prisma.resume.create({
      data: {
        userId: req.user.id,
        fileName: req.file.originalname,
        filePath: `memory://${req.file.originalname}`,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        parsedContent: parsed as unknown as Prisma.JsonObject,
        skills: parsed.skills,
        experienceYears: parsed.experienceYears,
        educationLevel: parsed.educationLevel,
        isActive: true,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Resume uploaded and parsed successfully',
      data: { resume },
    });
  } catch (err) {
    next(err);
  }
};

export const getResumes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const resumes = await prisma.resume.findMany({
      where: { userId: req.user.id, isActive: true },
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
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: {
        resumes,
        count: resumes.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const { id } = req.params;

    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      throw new NotFoundError('Resume');
    }

    if (resume.userId !== req.user.id) {
      throw new AuthorizationError('You do not have access to this resume');
    }

    res.status(200).json({
      status: 'success',
      data: { resume },
    });
  } catch (err) {
    next(err);
  }
};

export const updateResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const { id } = req.params;
    const { skills, experienceYears, educationLevel } = req.body as {
      skills?: string[];
      experienceYears?: number;
      educationLevel?: string;
    };

    const resume = await prisma.resume.findUnique({ where: { id } });

    if (!resume) {
      throw new NotFoundError('Resume');
    }

    if (resume.userId !== req.user.id) {
      throw new AuthorizationError('You do not have access to this resume');
    }

    const updatedResume = await prisma.resume.update({
      where: { id },
      data: {
        ...(skills !== undefined && { skills }),
        ...(experienceYears !== undefined && { experienceYears }),
        ...(educationLevel !== undefined && { educationLevel }),
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Resume updated successfully',
      data: { resume: updatedResume },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const { id } = req.params;

    const resume = await prisma.resume.findUnique({ where: { id } });

    if (!resume) {
      throw new NotFoundError('Resume');
    }

    if (resume.userId !== req.user.id) {
      throw new AuthorizationError('You do not have access to this resume');
    }

    await prisma.resume.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({
      status: 'success',
      message: 'Resume deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
