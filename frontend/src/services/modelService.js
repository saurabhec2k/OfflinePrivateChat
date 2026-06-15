// Model service API calls
import apiClient from './api.js';

export const modelService = {
  // Get available models
  getModels: async () => {
    const response = await apiClient.get('/models');
    return response.data;
  },

  // Pull/download a model
  pullModel: async (modelName) => {
    const response = await apiClient.post('/models/pull', {
      model: modelName,
    });
    return response.data;
  },

  // Check Ollama health
  checkHealth: async () => {
    const response = await apiClient.get('/models/health');
    return response.data;
  },
};

export default modelService;
