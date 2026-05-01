import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { AppError, ValidationError } from '../errors/customErrors';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
    }),
  ],
});

if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  );
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

export { logger };

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn('Operational error', {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
      path: req.path,
      method: req.method,
    });

    const responseBody: Record<string, unknown> = {
      status: 'error',
      message: err.message,
      code: err.code,
    };

    if (err instanceof ValidationError && err.details.length > 0) {
      responseBody['details'] = err.details;
    }

    res.status(err.statusCode).json(responseBody);
    return;
  }

  logger.error('Unexpected error', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    status: 'error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
