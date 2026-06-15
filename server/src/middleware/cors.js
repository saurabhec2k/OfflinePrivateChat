// CORS middleware configuration
import cors from 'cors';
import config from '../utils/config.js';
import logger from '../utils/logger.js';

export const corsMiddleware = cors({
  origin: config.corsOrigin.split(',').map(origin => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
});

export const corsOptions = (req, res, next) => {
  logger.debug(`CORS request from: ${req.origin}`);
  next();
};

export default corsMiddleware;
