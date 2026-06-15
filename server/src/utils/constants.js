// Application constants
export const constants = {
  // Message types
  MESSAGE_TYPES: {
    USER: 'user',
    ASSISTANT: 'assistant',
    SYSTEM: 'system',
  },

  // Chat status
  CHAT_STATUS: {
    ACTIVE: 'active',
    ARCHIVED: 'archived',
  },

  // Document status
  DOCUMENT_STATUS: {
    PENDING: 'pending',
    PROCESSED: 'processed',
    ERROR: 'error',
  },

  // Error codes
  ERROR_CODES: {
    INVALID_INPUT: 'INVALID_INPUT',
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    OLLAMA_CONNECTION_ERROR: 'OLLAMA_CONNECTION_ERROR',
    MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
    INVALID_MESSAGE: 'INVALID_MESSAGE',
    UNAUTHORIZED: 'UNAUTHORIZED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  },

  // Max values
  MAX: {
    MESSAGE_LENGTH: 10000,
    FILE_SIZE: 52428800, // 50MB
    UPLOAD_TIMEOUT: 30000, // 30s
    OLLAMA_TIMEOUT: 60000, // 60s
  },

  // API endpoints
  OLLAMA_ENDPOINTS: {
    GENERATE: '/api/generate',
    EMBEDDINGS: '/api/embeddings',
    PULL: '/api/pull',
    TAGS: '/api/tags',
  },
};

export default constants;
