// Request validation middleware
import { validators } from '../utils/validators.js';
import { AppError } from '../utils/errorHandler.js';
import constants from '../utils/constants.js';

export const validateMessage = (req, res, next) => {
  const { message } = req.body;
  
  if (!validators.isValidMessage(message)) {
    return next(
      new AppError(
        'Invalid message: must be a non-empty string (max 10,000 characters)',
        400,
        constants.ERROR_CODES.INVALID_MESSAGE
      )
    );
  }
  
  // Sanitize message
  req.body.message = validators.sanitizeMessage(message);
  next();
};

export const validateModel = (req, res, next) => {
  const { model } = req.body || req.query;
  
  if (model && !validators.isValidModelName(model)) {
    return next(
      new AppError(
        'Invalid model name',
        400,
        constants.ERROR_CODES.INVALID_INPUT
      )
    );
  }
  
  next();
};

export const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return next(
      new AppError(
        'No file provided',
        400,
        constants.ERROR_CODES.INVALID_INPUT
      )
    );
  }

  const { filename, size } = req.file;

  if (!validators.isAllowedFileType(filename)) {
    return next(
      new AppError(
        `File type not allowed. Allowed types: ${constants.MAX.allowedFileTypes.join(', ')}`,
        400,
        constants.ERROR_CODES.INVALID_FILE_TYPE
      )
    );
  }

  if (!validators.isFileSizeValid(size)) {
    return next(
      new AppError(
        `File size exceeds maximum limit of ${(constants.MAX.FILE_SIZE / 1024 / 1024).toFixed(0)}MB`,
        400,
        constants.ERROR_CODES.FILE_TOO_LARGE
      )
    );
  }

  next();
};

export default {
  validateMessage,
  validateModel,
  validateFileUpload,
};
