import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AuthenticationError, AuthorizationError } from '../errors/customErrors';

export interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const authenticateToken = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return next(new AuthenticationError('No token provided'));
  }

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    return next(new Error('JWT_ACCESS_SECRET is not configured'));
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError('Token has expired'));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AuthenticationError('Invalid token'));
    }
    next(err);
  }
};

export const requireVerifiedEmail = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AuthenticationError('Not authenticated'));
  }
  prisma.user
    .findUnique({ where: { id: req.user.id }, select: { isVerified: true } })
    .then((user: { isVerified: boolean } | null) => {
      if (!user) {
        return next(new AuthenticationError('User not found'));
      }
      if (!user.isVerified) {
        return next(
          new AuthorizationError(
            'Email verification required. Please verify your email address.'
          )
        );
      }
      next();
    })
    .catch(next);
};
