// Chat service API calls
import apiClient from './api.js';

export const chatService = {
  // Send a message
  sendMessage: async (message, conversationId = null, model = null) => {
    const response = await apiClient.post('/chat', {
      message,
      conversationId,
      model,
    });
    return response.data;
  },

  // Get all conversations
  getConversations: async () => {
    const response = await apiClient.get('/chat/conversations');
    return response.data;
  },

  // Get messages in a conversation
  getMessages: async (conversationId) => {
    const response = await apiClient.get(`/chat/${conversationId}`);
    return response.data;
  },

  // Delete a conversation
  deleteConversation: async (conversationId) => {
    const response = await apiClient.delete(`/chat/${conversationId}`);
    return response.data;
  },
};

export default chatService;
