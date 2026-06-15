// useChat hook for chat state management
import { useState, useCallback } from 'react';
import chatService from '../services/chatService.js';

export const useChat = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.getConversations();
      setConversations(response.data || []);
    } catch (err) {
      setError(err.error?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.getMessages(conversationId);
      setMessages(response.data?.messages || []);
      setCurrentConversationId(conversationId);
    } catch (err) {
      setError(err.error?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(
    async (message, model = null) => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await chatService.sendMessage(
          message,
          currentConversationId,
          model
        );
        
        // Update current conversation
        setCurrentConversationId(response.data.conversationId);
        
        // Add messages to state
        setMessages((prev) => [
          ...prev,
          response.data.userMessage,
          response.data.assistantMessage,
        ]);
        
        return response.data;
      } catch (err) {
        setError(err.error?.message || 'Failed to send message');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentConversationId]
  );

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await chatService.deleteConversation(conversationId);
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId)
      );
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err.error?.message || 'Failed to delete conversation');
      throw err;
    }
  }, [currentConversationId]);

  return {
    conversations,
    currentConversationId,
    messages,
    loading,
    error,
    loadConversations,
    loadMessages,
    sendMessage,
    deleteConversation,
  };
};

export default useChat;
