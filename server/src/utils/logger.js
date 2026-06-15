// Simple logging utility
import config from './config.js';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  error: '\x1b[31m',    // Red
  warn: '\x1b[33m',     // Yellow
  info: '\x1b[36m',     // Cyan
  debug: '\x1b[35m',    // Magenta
  reset: '\x1b[0m',     // Reset
};

const currentLevel = levels[config.logLevel] || levels.info;

export const logger = {
  error: (message, error = null) => {
    if (currentLevel >= levels.error) {
      console.error(
        `${colors.error}[ERROR]${colors.reset} ${new Date().toISOString()} - ${message}`,
        error || ''
      );
    }
  },

  warn: (message) => {
    if (currentLevel >= levels.warn) {
      console.warn(
        `${colors.warn}[WARN]${colors.reset} ${new Date().toISOString()} - ${message}`
      );
    }
  },

  info: (message) => {
    if (currentLevel >= levels.info) {
      console.log(
        `${colors.info}[INFO]${colors.reset} ${new Date().toISOString()} - ${message}`
      );
    }
  },

  debug: (message, data = null) => {
    if (currentLevel >= levels.debug) {
      console.log(
        `${colors.debug}[DEBUG]${colors.reset} ${new Date().toISOString()} - ${message}`,
        data || ''
      );
    }
  },
};

export default logger;
