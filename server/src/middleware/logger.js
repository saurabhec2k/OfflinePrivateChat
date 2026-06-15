// Logging middleware
import logger from '../utils/logger.js';

export const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const statusColor = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
    
    logger.info(
      `${req.method} ${req.path} - ${statusColor}${status}\x1b[0m (${duration}ms)`
    );
  });

  next();
};

export default loggingMiddleware;
