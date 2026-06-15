// useDocuments hook for document management
import { useState, useCallback } from 'react';
import documentService from '../services/documentService.js';

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Load all documents
  const loadDocuments = useCallback(async () => {
    try {
      setError(null);
      const response = await documentService.getDocuments();
      setDocuments(response.data || []);
    } catch (err) {
      setError(err.error?.message || 'Failed to load documents');
    }
  }, []);

  // Upload a document
  const uploadDocument = useCallback(async (file) => {
    try {
      setUploading(true);
      setError(null);
      
      const response = await documentService.uploadDocument(file);
      
      setDocuments((prev) => [response.data, ...prev]);
      
      return response.data;
    } catch (err) {
      setError(err.error?.message || 'Failed to upload document');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  // Delete a document
  const deleteDocument = useCallback(async (documentId) => {
    try {
      await documentService.deleteDocument(documentId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (err) {
      setError(err.error?.message || 'Failed to delete document');
      throw err;
    }
  }, []);

  return {
    documents,
    uploading,
    error,
    loadDocuments,
    uploadDocument,
    deleteDocument,
  };
};

export default useDocuments;
