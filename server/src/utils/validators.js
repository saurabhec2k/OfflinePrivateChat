// Input validation utilities
import config from './config.js';

export const validators = {
  // Validate file type
  isAllowedFileType: (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return config.allowedFileTypes.includes(ext);
  },

  // Validate file size
  isFileSizeValid: (size) => {
    return size <= config.maxFileSize;
  },

  // Validate message
  isValidMessage: (message) => {
    if (!message || typeof message !== 'string') return false;
    const trimmed = message.trim();
    return trimmed.length > 0 && trimmed.length <= 10000;
  },

  // Validate model name
  isValidModelName: (model) => {
    if (!model || typeof model !== 'string') return false;
    return /^[a-zA-Z0-9\-_:\.]+$/.test(model);
  },

  // Validate conversation ID (UUID format)
  isValidConversationId: (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  },

  // Validate document ID
  isValidDocumentId: (id) => {
    return typeof id === 'string' && id.length > 0;
  },

  // Sanitize filename
  sanitizeFilename: (filename) => {
    return filename
      .replace(/[^a-zA-Z0-9\.\-_]/g, '_')
      .slice(0, 255);
  },

  // Sanitize message content
  sanitizeMessage: (message) => {
    return message
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 10000);
  },
};

export default validators;
