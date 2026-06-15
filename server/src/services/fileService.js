// File processing service (PDF, DOCX, images)
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import constants from '../utils/constants.js';

class FileService {
  // Extract text from PDF
  async extractFromPDF(filePath) {
    try {
      logger.debug(`Extracting text from PDF: ${filePath}`);
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text || '';
    } catch (error) {
      logger.error(`PDF extraction error: ${error.message}`);
      throw new AppError(
        'Failed to extract text from PDF',
        400,
        constants.ERROR_CODES.FILE_UPLOAD_FAILED
      );
    }
  }

  // Extract text from DOCX
  async extractFromDOCX(filePath) {
    try {
      logger.debug(`Extracting text from DOCX: ${filePath}`);
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    } catch (error) {
      logger.error(`DOCX extraction error: ${error.message}`);
      throw new AppError(
        'Failed to extract text from DOCX',
        400,
        constants.ERROR_CODES.FILE_UPLOAD_FAILED
      );
    }
  }

  // Extract text from plain text file
  async extractFromTXT(filePath) {
    try {
      logger.debug(`Extracting text from TXT: ${filePath}`);
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      logger.error(`TXT extraction error: ${error.message}`);
      throw new AppError(
        'Failed to extract text from TXT',
        400,
        constants.ERROR_CODES.FILE_UPLOAD_FAILED
      );
    }
  }

  // Process image (currently just returns metadata)
  async processImage(filePath) {
    try {
      logger.debug(`Processing image: ${filePath}`);
      const stats = await fs.stat(filePath);
      return {
        type: 'image',
        size: stats.size,
        path: filePath,
        message: 'Image uploaded successfully. Text extraction not yet implemented.',
      };
    } catch (error) {
      logger.error(`Image processing error: ${error.message}`);
      throw new AppError(
        'Failed to process image',
        400,
        constants.ERROR_CODES.FILE_UPLOAD_FAILED
      );
    }
  }

  // Main extraction method based on file type
  async extractContent(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);

    switch (ext) {
      case 'pdf':
        return await this.extractFromPDF(filePath);
      case 'docx':
        return await this.extractFromDOCX(filePath);
      case 'txt':
        return await this.extractFromTXT(filePath);
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return await this.processImage(filePath);
      default:
        throw new AppError(
          `Unsupported file type: ${ext}`,
          400,
          constants.ERROR_CODES.INVALID_FILE_TYPE
        );
    }
  }

  // Delete file
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.debug(`Deleted file: ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }
}

export default new FileService();
