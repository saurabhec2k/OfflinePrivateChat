// Chat message handling service
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import constants from '../utils/constants.js';

// In-memory storage (replace with DB later)
const conversations = new Map();
const messages = new Map();

class ChatService {
  // Create a new conversation
  createConversation(title = 'New Chat') {
    const conversationId = uuidv4();
    const conversation = {
      id: conversationId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };

    conversations.set(conversationId, conversation);
    messages.set(conversationId, []);

    logger.info(`Created conversation: ${conversationId}`);
    return conversation;
  }

  // Get all conversations
  getAllConversations() {
    return Array.from(conversations.values()).sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  }

  // Get conversation by ID
  getConversation(conversationId) {
    return conversations.get(conversationId);
  }

  // Get all messages in a conversation
  getMessages(conversationId) {
    if (!conversations.has(conversationId)) {
      return null;
    }
    return messages.get(conversationId) || [];
  }

  // Add a message to conversation
  addMessage(conversationId, role, content, metadata = {}) {
    if (!conversations.has(conversationId)) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const messageId = uuidv4();
    const message = {
      id: messageId,
      role, // 'user' or 'assistant'
      content,
      metadata,
      createdAt: new Date().toISOString(),
    };

    const conversationMessages = messages.get(conversationId) || [];
    conversationMessages.push(message);
    messages.set(conversationId, conversationMessages);

    // Update conversation
    const conversation = conversations.get(conversationId);
    conversation.updatedAt = new Date().toISOString();
    conversation.messageCount = conversationMessages.length;

    logger.debug(`Added message to conversation ${conversationId}`);
    return message;
  }

  // Delete conversation
  deleteConversation(conversationId) {
    if (conversations.has(conversationId)) {
      conversations.delete(conversationId);
      messages.delete(conversationId);
      logger.info(`Deleted conversation: ${conversationId}`);
      return true;
    }
    return false;
  }

  // Build context from conversation history
  buildContext(conversationId, limit = 10) {
    const conversationMessages = this.getMessages(conversationId);
    
    if (!conversationMessages) return '';

    return conversationMessages
      .slice(-limit)
      .map((msg) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n');
  }

  // Get summary of all conversations
  getSummary() {
    const allConversations = this.getAllConversations();
    return {
      totalConversations: allConversations.length,
      totalMessages: Array.from(messages.values()).reduce(
        (sum, msgs) => sum + msgs.length,
        0
      ),
      conversations: allConversations,
    };
  }
}

export default new ChatService();
