import 'dotenv/config';
import http from 'http';
import app from './app';
import { prisma } from './config/database';
import { redisClient } from './config/redis';
import { logger } from './middleware/errorHandler';

const PORT = parseInt(process.env.PORT || '5000', 10);

const server = http.createServer(app);

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connection established');

    await redisClient.connect();
    logger.info('Redis connection established');

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    await gracefulShutdown();
    process.exit(1);
  }
}

async function gracefulShutdown(): Promise<void> {
  logger.info('Initiating graceful shutdown...');

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await prisma.$disconnect();
      logger.info('Database connection closed');
    } catch (err) {
      logger.error('Error closing database connection', { err });
    }

    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (err) {
      logger.error('Error closing Redis connection', { err });
    }

    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received');
  gracefulShutdown();
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error });
  gracefulShutdown();
});

startServer();
