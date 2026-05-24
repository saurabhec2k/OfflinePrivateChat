import React, { useRef, useEffect } from 'react';
import { 
  Paperclip, 
  Send, 
  Square, 
  Image as ImageIcon, 
  FileText, 
  X,
  Loader
} from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  generating,
  onStopGeneration,
  onSendMessage,
  queuedFiles,
  setQueuedFiles,
  onUploadDocumentFile,
  activeDocuments
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize the text area on input changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // Convert image to base64
  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
      
      if (isImage) {
        try {
          const dataUrl = await processImage(file);
          setQueuedFiles(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            type: 'image',
            name: file.name,
            size: file.size,
            dataUrl: dataUrl
          }]);
        } catch (err) {
          console.error("Error loading image:", err);
          alert(`Failed to load image ${file.name}`);
        }
      } else {
        // Text Document parsing via Express
        const tempId = Math.random().toString(36).substring(7);
        
        // Add a loading/parsing state in queue
        setQueuedFiles(prev => [...prev, {
          id: tempId,
          type: 'doc',
          name: file.name,
          size: file.size,
          parsing: true
        }]);

        try {
          const parsedDoc = await onUploadDocumentFile(file);
          // Update the queue state from parsing to loaded
          setQueuedFiles(prev => 
            prev.map(f => f.id === tempId ? { ...f, parsing: false, docData: parsedDoc } : f)
          );
        } catch (err) {
          console.error("Error parsing document:", err);
          alert(`Failed to parse document ${file.name}: ${err.message}`);
          // Remove from queue on error
          setQueuedFiles(prev => prev.filter(f => f.id !== tempId));
        }
      }
    }
    
    // Clear input value to allow uploading same file again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeQueuedFile = (id) => {
    setQueuedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (generating) return;
    if (!input.trim() && queuedFiles.length === 0) return;

    // Separate images and docs in queue
    const images = queuedFiles.filter(f => f.type === 'image').map(f => f.dataUrl);
    const docs = queuedFiles.filter(f => f.type === 'doc' && !f.parsing).map(f => f.docData);

    onSendMessage(input, images, docs);
    setInput('');
    setQueuedFiles([]);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const activeDocsCount = activeDocuments.filter(d => d.active).length;

  return (
    <div className="chat-input-panel">
      <div className="chat-input-container">
        {/* Attachment Queue Previews */}
        {queuedFiles.length > 0 && (
          <div className="attachment-queue">
            {queuedFiles.map((file) => (
              <div key={file.id} className="queued-file">
                {file.type === 'image' ? (
                  <>
                    <img src={file.dataUrl} alt="thumbnail" className="queued-img-thumb" />
                    <span className="queued-file-name">{file.name}</span>
                  </>
                ) : (
                  <>
                    {file.parsing ? (
                      <Loader size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <FileText size={14} color="var(--accent-cyan)" />
                    )}
                    <span className="queued-file-name" style={{ color: file.parsing ? 'var(--text-muted)' : 'inherit' }}>
                      {file.name} {file.parsing && '(Parsing...)'}
                    </span>
                  </>
                )}
                <button 
                  type="button" 
                  className="btn-remove-queued"
                  onClick={() => removeQueuedFile(file.id)}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Text Form */}
        <form onSubmit={handleSubmit} className="input-form">
          <button 
            type="button" 
            className="btn-attach" 
            onClick={handleFileClick}
            title="Attach file (PDF, DOCX, TXT, images)"
            disabled={generating}
          >
            <Paperclip size={18} />
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            style={{ display: 'none' }} 
            accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp" 
          />

          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder={
              activeDocsCount > 0 
                ? `Ask about your ${activeDocsCount} active document${activeDocsCount > 1 ? 's' : ''}...` 
                : "Type a message or drag files..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={generating}
          />

          {generating ? (
            <button 
              type="button" 
              className="btn-stop" 
              onClick={onStopGeneration}
              title="Stop generating"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button 
              type="submit" 
              className="btn-send"
              disabled={!input.trim() && queuedFiles.length === 0}
              title="Send message"
            >
              <Send size={14} />
            </button>
          )}
        </form>
      </div>

      <div className="input-note">
        {activeDocsCount > 0 && (
          <span style={{ color: 'var(--accent-cyan)', marginRight: '12px', fontWeight: 600 }}>
            ✓ {activeDocsCount} active document{activeDocsCount > 1 ? 's' : ''} injected as prompt context
          </span>
        )}
        Supports PDF, DOCX, TXT, MD and images. Model outputs depend on the selected Ollama model.
      </div>
      
      {/* Inline Spin CSS Helper */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
