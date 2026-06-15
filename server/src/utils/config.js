// Environment configuration
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  // Ollama
  ollamaApiUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // File handling
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB default
  allowedFileTypes: ['pdf', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif'],
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Database (for future use)
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Ollama defaults
  defaultModel: process.env.DEFAULT_MODEL || 'mistral',
  ollamaTimeout: parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10), // 30 seconds
};

export default config;
