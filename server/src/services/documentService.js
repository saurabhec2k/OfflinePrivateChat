// Document handling service
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import config from '../utils/config.js';

// In-memory document storage (replace with DB later)
const documents = new Map();

class DocumentService {
  constructor() {
    this.uploadDir = config.uploadDir;
  }

  // Register uploaded document
  registerDocument(filename, filePath, metadata = {}) {
    const documentId = uuidv4();
    const document = {
      id: documentId,
      filename,
      filePath,
      uploadedAt: new Date().toISOString(),
      status: 'pending',
      size: metadata.size || 0,
      mimeType: metadata.mimeType || 'application/octet-stream',
      metadata,
    };

    documents.set(documentId, document);
    logger.info(`Registered document: ${documentId} (${filename})`);
    return document;
  }

  // Get all documents
  getAllDocuments() {
    return Array.from(documents.values()).sort(
      (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
    );
  }

  // Get document by ID
  getDocument(documentId) {
    return documents.get(documentId);
  }

  // Update document status
  updateDocumentStatus(documentId, status, content = null) {
    const document = documents.get(documentId);
    if (!document) return null;

    document.status = status;
    if (content) {
      document.content = content;
      document.contentLength = content.length;
    }
    document.updatedAt = new Date().toISOString();

    logger.debug(`Updated document ${documentId} status to: ${status}`);
    return document;
  }

  // Delete document
  async deleteDocument(documentId) {
    const document = documents.get(documentId);
    if (!document) return false;

    // Delete file from filesystem
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      logger.warn(`Failed to delete file ${document.filePath}: ${error.message}`);
    }

    documents.delete(documentId);
    logger.info(`Deleted document: ${documentId}`);
    return true;
  }

  // Get document summary
  getSummary() {
    const allDocuments = this.getAllDocuments();
    const byStatus = {};
    
    allDocuments.forEach((doc) => {
      byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
    });

    return {
      totalDocuments: allDocuments.length,
      byStatus,
      documents: allDocuments,
    };
  }
}

export default new DocumentService();
