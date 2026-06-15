// Document routes
import express from 'express';
import multer from 'multer';
import path from 'path';
import documentService from '../services/documentService.js';
import fileService from '../services/fileService.js';
import { validateFileUpload } from '../middleware/validators.js';
import { errorHandler } from '../utils/errorHandler.js';
import { validators } from '../utils/validators.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorHandler.js';
import constants from '../utils/constants.js';
import config from '../utils/config.js';

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitized = validators.sanitizeFilename(file.originalname);
    const timestamp = Date.now();
    cb(null, `${timestamp}_${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
});

// POST /api/documents/upload - Upload document
router.post(
  '/upload',
  upload.single('file'),
  validateFileUpload,
  errorHandler.asyncHandler(async (req, res) => {
    const { file } = req;
    
    try {
      // Register document
      const document = documentService.registerDocument(
        file.originalname,
        file.path,
        {
          size: file.size,
          mimeType: file.mimetype,
        }
      );

      // Extract content asynchronously
      setImmediate(async () => {
        try {
          const content = await fileService.extractContent(file.path);
          documentService.updateDocumentStatus(document.id, 'processed', content);
          logger.info(`Document ${document.id} processed successfully`);
        } catch (error) {
          logger.error(`Failed to process document ${document.id}: ${error.message}`);
          documentService.updateDocumentStatus(document.id, 'error');
        }
      });

      res.status(201).json({
        success: true,
        data: document,
        message: 'File uploaded successfully. Processing in background...',
      });
    } catch (error) {
      logger.error(`Upload error: ${error.message}`);
      throw new AppError(
        'Failed to upload file',
        500,
        constants.ERROR_CODES.FILE_UPLOAD_FAILED
      );
    }
  })
);

// GET /api/documents - List all documents
router.get(
  '/',
  errorHandler.asyncHandler(async (req, res) => {
    const allDocuments = documentService.getAllDocuments();
    
    res.json({
      success: true,
      data: allDocuments,
      message: 'Documents retrieved successfully',
    });
  })
);

// GET /api/documents/:documentId - Get document details
router.get(
  '/:documentId',
  errorHandler.asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    
    const document = documentService.getDocument(documentId);
    if (!document) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: document,
      message: 'Document retrieved successfully',
    });
  })
);

// DELETE /api/documents/:documentId - Delete document
router.delete(
  '/:documentId',
  errorHandler.asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    
    const document = documentService.getDocument(documentId);
    if (!document) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }

    await documentService.deleteDocument(documentId);

    res.json({
      success: true,
      data: { deletedId: documentId },
      message: 'Document deleted successfully',
    });
  })
);

export default router;
