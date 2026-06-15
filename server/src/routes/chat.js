// Chat routes
import express from 'express';
import chatService from '../services/chatService.js';
import ollamaService from '../services/ollamaService.js';
import { validateMessage, validateModel } from '../middleware/validators.js';
import { errorHandler } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import constants from '../utils/constants.js';

const router = express.Router();

// POST /api/chat - Send a message
router.post(
  '/',
  validateMessage,
  validateModel,
  errorHandler.asyncHandler(async (req, res) => {
    const { message, conversationId, model = null } = req.body;
    
    // Get or create conversation
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const conversation = chatService.createConversation();
      currentConversationId = conversation.id;
    }

    const conversation = chatService.getConversation(currentConversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404, constants.ERROR_CODES.INVALID_INPUT);
    }

    // Add user message
    const userMessage = chatService.addMessage(
      currentConversationId,
      constants.MESSAGE_TYPES.USER,
      message
    );

    // Build context from conversation history
    const context = chatService.buildContext(currentConversationId, 10);
    const fullPrompt = context ? `${context}\nUser: ${message}` : message;

    try {
      // Generate response from Ollama
      const response = await ollamaService.generate(
        fullPrompt,
        model || constants.defaultModel || 'mistral'
      );

      // Add assistant message
      const assistantMessage = chatService.addMessage(
        currentConversationId,
        constants.MESSAGE_TYPES.ASSISTANT,
        response
      );

      res.json({
        success: true,
        data: {
          conversationId: currentConversationId,
          userMessage,
          assistantMessage,
          conversation: chatService.getConversation(currentConversationId),
        },
        message: 'Message processed successfully',
      });
    } catch (error) {
      logger.error(`Chat generation error: ${error.message}`);
      throw new AppError(
        'Failed to generate response',
        503,
        constants.ERROR_CODES.OLLAMA_CONNECTION_ERROR
      );
    }
  })
);

// GET /api/chat/conversations - Get all conversations
router.get(
  '/conversations',
  errorHandler.asyncHandler(async (req, res) => {
    const allConversations = chatService.getAllConversations();
    res.json({
      success: true,
      data: allConversations,
      message: 'Conversations retrieved successfully',
    });
  })
);

// GET /api/chat/:conversationId - Get messages in conversation
router.get(
  '/:conversationId',
  errorHandler.asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    
    const conversation = chatService.getConversation(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    const messages = chatService.getMessages(conversationId);
    
    res.json({
      success: true,
      data: {
        conversation,
        messages,
      },
      message: 'Messages retrieved successfully',
    });
  })
);

// DELETE /api/chat/:conversationId - Delete conversation
router.delete(
  '/:conversationId',
  errorHandler.asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    
    const deleted = chatService.deleteConversation(conversationId);
    
    if (!deleted) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: { deletedId: conversationId },
      message: 'Conversation deleted successfully',
    });
  })
);

export default router;
