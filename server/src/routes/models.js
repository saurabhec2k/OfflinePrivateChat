// Model/Ollama routes
import express from 'express';
import ollamaService from '../services/ollamaService.js';
import { validateModel } from '../middleware/validators.js';
import { errorHandler } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import constants from '../utils/constants.js';

const router = express.Router();

// GET /api/models - List available models
router.get(
  '/',
  errorHandler.asyncHandler(async (req, res) => {
    const models = await ollamaService.getModels();
    
    res.json({
      success: true,
      data: models,
      message: 'Models retrieved successfully',
    });
  })
);

// POST /api/models/pull - Download model
router.post(
  '/pull',
  validateModel,
  errorHandler.asyncHandler(async (req, res) => {
    const { model } = req.body;
    
    if (!model) {
      throw new AppError(
        'Model name is required',
        400,
        constants.ERROR_CODES.INVALID_INPUT
      );
    }

    try {
      const result = await ollamaService.pullModel(model);
      
      res.json({
        success: true,
        data: result,
        message: `Model ${model} downloaded successfully`,
      });
    } catch (error) {
      logger.error(`Model pull error: ${error.message}`);
      throw new AppError(
        `Failed to pull model: ${error.message}`,
        503,
        constants.ERROR_CODES.OLLAMA_CONNECTION_ERROR
      );
    }
  })
);

// GET /api/models/health - Check Ollama health
router.get(
  '/health',
  errorHandler.asyncHandler(async (req, res) => {
    const isHealthy = await ollamaService.healthCheck();
    
    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'connected' : 'disconnected',
        ollamaUrl: ollamaService.baseUrl,
      },
      message: isHealthy
        ? 'Ollama is running and accessible'
        : 'Ollama is not accessible. Make sure it is running.',
    });
  })
);

export default router;
