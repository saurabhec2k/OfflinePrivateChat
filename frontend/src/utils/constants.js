// Frontend constants
export const CONSTANTS = {
  // Message types
  MESSAGE_TYPES: {
    USER: 'user',
    ASSISTANT: 'assistant',
    SYSTEM: 'system',
  },

  // UI limits
  MAX_MESSAGE_LENGTH: 10000,
  MAX_FILE_SIZE: 52428800, // 50MB

  // Default models
  DEFAULT_MODELS: [
    'mistral',
    'llama2',
    'neural-chat',
    'starling-lm',
  ],

  // Toast messages
  TOAST: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
  },

  // Status codes
  STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCESS: 'success',
    ERROR: 'error',
  },
};

export default CONSTANTS;
