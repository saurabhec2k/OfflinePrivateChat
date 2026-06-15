// Error handling middleware
import { errorHandler } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
    },
  });
};

// Global error handler (must be last)
export const globalErrorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, err);
  
  const formattedError = errorHandler.formatError(err);
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json(formattedError);
};

export default {
  notFoundHandler,
  globalErrorHandler,
};
