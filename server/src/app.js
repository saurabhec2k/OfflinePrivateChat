// Express app initialization
import express from 'express';
import corsMiddleware from './middleware/cors.js';
import loggingMiddleware from './middleware/logger.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';
import logger from './utils/logger.js';
import config from './utils/config.js';

// Create Express app
const app = express();

// ===== Middleware Setup =====
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS
app.use(corsMiddleware);

// Logging
app.use(loggingMiddleware);

// ===== Health Check Endpoint =====
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Antigravity Chat Server',
    version: '1.0.0',
    environment: config.nodeEnv,
    apiVersion: 'v1',
    docs: 'http://localhost:5000/api',
  });
});

// ===== API Routes =====
app.use('/api', apiRoutes);

// ===== 404 Handler =====
app.use(notFoundHandler);

// ===== Global Error Handler (must be last) =====
app.use(globalErrorHandler);

// ===== Server Initialization =====
export const startServer = () => {
  return new Promise((resolve, reject) => {
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on http://localhost:${config.port}`);
      logger.info(`📡 API endpoint: http://localhost:${config.port}/api`);
      logger.info(`🦙 Ollama connected to: ${config.ollamaApiUrl}`);
      logger.info(`📁 Upload directory: ${config.uploadDir}`);
      logger.info(`🌍 CORS enabled for: ${config.corsOrigin}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      
      resolve(server);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
      }
      reject(error);
    });
  });
};

export default app;
