// Ollama LLM integration service
import fetch from 'node-fetch';
import config from '../utils/config.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import constants from '../utils/constants.js';

class OllamaService {
  constructor() {
    this.baseUrl = config.ollamaApiUrl;
    this.timeout = config.ollamaTimeout;
  }

  // Generate text using Ollama
  async generate(prompt, model = config.defaultModel, options = {}) {
    try {
      logger.debug(`Generating with model: ${model}`);
      
      const response = await this._fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          ...options,
        }),
      });

      if (!response.ok) {
        throw new AppError(
          `Ollama error: ${response.statusText}`,
          response.status,
          constants.ERROR_CODES.OLLAMA_CONNECTION_ERROR
        );
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      logger.error(`Ollama generate error: ${error.message}`);
      throw new AppError(
        'Failed to generate response from LLM',
        503,
        constants.ERROR_CODES.OLLAMA_CONNECTION_ERROR
      );
    }
  }

  // Get available models
  async getModels() {
    try {
      logger.debug('Fetching available models from Ollama');
      
      const response = await this._fetch('/api/tags');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      logger.warn(`Failed to fetch models: ${error.message}`);
      return [];
    }
  }

  // Pull/download a model
  async pullModel(modelName) {
    try {
      logger.info(`Pulling model: ${modelName}`);
      
      const response = await this._fetch('/api/pull', {
        method: 'POST',
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`Failed to pull model: ${error.message}`);
      throw new AppError(
        'Failed to download model',
        503,
        constants.ERROR_CODES.OLLAMA_CONNECTION_ERROR
      );
    }
  }

  // Check if Ollama is running
  async healthCheck() {
    try {
      const response = await this._fetch('/api/tags', { timeout: 5000 });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Helper method for fetch with timeout
  async _fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout || this.timeout;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export default new OllamaService();
