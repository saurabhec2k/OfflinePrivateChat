// Routes aggregator
import express from 'express';
import chatRoutes from './chat.js';
import documentRoutes from './documents.js';
import modelRoutes from './models.js';
import healthRoutes from './health.js';

const router = express.Router();

// Mount routes
router.use('/chat', chatRoutes);
router.use('/documents', documentRoutes);
router.use('/models', modelRoutes);
router.use('/health', healthRoutes);

// API base info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Antigravity Chat API v1.0',
    endpoints: {
      chat: '/api/chat',
      documents: '/api/documents',
      models: '/api/models',
      health: '/api/health',
    },
  });
});

export default router;
