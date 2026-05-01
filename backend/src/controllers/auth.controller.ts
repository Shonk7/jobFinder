import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/database';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  sendVerificationEmail,
} from '../services/auth.service';
import {
  ConflictError,
  AuthenticationError,
  NotFoundError,
  AppError,
} from '../errors/customErrors';

const SALT_ROUNDS = 12;

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    };

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        isVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        createdAt: true,
      },
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    await sendVerificationEmail(email, verificationToken);

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshExpiry,
      },
    });

    res.status(201).json({
      status: 'success',
      message:
        'Account created successfully. Please check your email to verify your account.',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account has been deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshExpiry,
      },
    });

    const { passwordHash: _pw, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const accessToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    const { refreshToken } = req.body as { refreshToken?: string };

    if (refreshToken) {
      await prisma.session.deleteMany({
        where: { token: refreshToken },
      });
    }

    if (accessToken && req.user) {
      await prisma.session.deleteMany({
        where: {
          userId: req.user.id,
          expiresAt: { gt: new Date() },
        },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body as { refreshToken: string };

    if (!token) {
      throw new AuthenticationError('Refresh token is required');
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session) {
      throw new AuthenticationError('Refresh token not found or already revoked');
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { token } });
      throw new AuthenticationError('Refresh token has expired');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('User account is not active');
    }

    await prisma.session.delete({ where: { token } });

    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id, user.email);

    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: newExpiry,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.query as { token?: string };

    if (!token) {
      throw new AppError('Verification token is required', 400, 'MISSING_TOKEN');
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      throw new AppError(
        'Invalid or expired verification token',
        400,
        'INVALID_TOKEN'
      );
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { token } });
      throw new AppError(
        'Verification token has expired. Please request a new one.',
        400,
        'TOKEN_EXPIRED'
      );
    }

    if (session.user.isVerified) {
      await prisma.session.delete({ where: { token } });
      res.status(200).json({
        status: 'success',
        message: 'Email is already verified',
      });
      return;
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { isVerified: true },
    });

    await prisma.session.delete({ where: { token } });

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const resendVerification = async (
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
      select: { id: true, email: true, isVerified: true },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.isVerified) {
      res.status(200).json({
        status: 'success',
        message: 'Email is already verified',
      });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    await sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({
      status: 'success',
      message: 'Verification email sent',
    });
  } catch (err) {
    next(err);
  }
};
