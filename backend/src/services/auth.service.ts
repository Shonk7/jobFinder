import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { logger } from '../middleware/errorHandler';

export interface TokenPayload {
  id: string;
  email: string;
}

export const generateAccessToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }
  return jwt.sign({ id: userId, email } as TokenPayload, secret, {
    expiresIn: '15m',
  });
};

export const generateRefreshToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  return jwt.sign({ id: userId, email } as TokenPayload, secret, {
    expiresIn: '7d',
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }
  return jwt.verify(token, secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  return jwt.verify(token, secret) as TokenPayload;
};

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  if (process.env.NODE_ENV !== 'production') {
    logger.info('Verification email (dev mode)', {
      to: email,
      verificationUrl,
    });
    return;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP not configured, skipping verification email send', {
      to: email,
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"JobFinder" <noreply@jobfinder.com>',
    to: email,
    subject: 'Verify your JobFinder account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to JobFinder!</h1>
        <p>Please verify your email address by clicking the button below:</p>
        <a
          href="${verificationUrl}"
          style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #4f46e5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          "
        >
          Verify Email
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          If you did not create an account, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 24 hours.
        </p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  if (process.env.NODE_ENV !== 'production') {
    logger.info('Password reset email (dev mode)', {
      to: email,
      resetUrl,
    });
    return;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP not configured, skipping password reset email send', {
      to: email,
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"JobFinder" <noreply@jobfinder.com>',
    to: email,
    subject: 'Reset your JobFinder password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Password Reset</h1>
        <p>You requested to reset your password. Click the button below:</p>
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #4f46e5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          "
        >
          Reset Password
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour.
        </p>
      </div>
    `,
  });
};
