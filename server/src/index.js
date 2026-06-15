// Main server entry point
import app, { startServer } from './app.js';
import logger from './utils/logger.js';
import config from './utils/config.js';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
startServer()
  .then(() => {
    logger.info('✅ Server started successfully');
  })
  .catch((error) => {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  });
