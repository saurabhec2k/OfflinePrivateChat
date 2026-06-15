// Health check routes
import express from 'express';
import chatService from '../services/chatService.js';
import documentService from '../services/documentService.js';
import ollamaService from '../services/ollamaService.js';
import { errorHandler } from '../utils/errorHandler.js';

const router = express.Router();

// GET /api/health - System health check
router.get(
  '/',
  errorHandler.asyncHandler(async (req, res) => {
    const ollamaHealthy = await ollamaService.healthCheck();
    const chatSummary = chatService.getSummary();
    const documentSummary = documentService.getSummary();

    res.status(ollamaHealthy ? 200 : 503).json({
      success: true,
      data: {
        status: ollamaHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          ollama: {
            status: ollamaHealthy ? 'connected' : 'disconnected',
            url: ollamaService.baseUrl,
          },
          chat: {
            status: 'operational',
            ...chatSummary,
          },
          documents: {
            status: 'operational',
            ...documentSummary,
          },
        },
      },
      message: ollamaHealthy
        ? 'System is healthy'
        : 'System is degraded - Ollama not accessible',
    });
  })
);

export default router;
