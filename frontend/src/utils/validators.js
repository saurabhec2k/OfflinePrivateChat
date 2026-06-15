// Frontend validation utilities
export const validationUtils = {
  // Validate message
  isValidMessage: (message) => {
    if (!message || typeof message !== 'string') return false;
    const trimmed = message.trim();
    return trimmed.length > 0 && trimmed.length <= 10000;
  },

  // Validate file
  isValidFile: (file) => {
    if (!file) return false;
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'image/gif'];
    return allowedTypes.includes(file.type);
  },

  // Validate file size
  isFileSizeValid: (size) => {
    return size <= 52428800; // 50MB
  },

  // Validate model name
  isValidModelName: (model) => {
    if (!model || typeof model !== 'string') return false;
    return /^[a-zA-Z0-9\-_:\.]+$/.test(model);
  },

  // Get file error message
  getFileErrorMessage: (file) => {
    if (!file) return 'No file selected';
    if (!validationUtils.isValidFile(file)) {
      return 'Invalid file type. Supported: PDF, DOCX, TXT, JPG, PNG, GIF';
    }
    if (!validationUtils.isFileSizeValid(file.size)) {
      return 'File size exceeds 50MB limit';
    }
    return null;
  },
};

export default validationUtils;
