import React, { useEffect, useRef } from 'react';
import { 
  Bot, 
  User, 
  FileText, 
  FileAudio,
  Sparkles,
  ExternalLink,
  Globe
} from 'lucide-react';
import { marked } from 'marked';
import GraphCard from './GraphCard';

// Configure marked GFM options
marked.setOptions({
  breaks: true,
  gfm: true,
  mangle: false,
  headerIds: false
});

// Create custom renderer to style tables and code blocks beautifully
const renderer = new marked.Renderer();

renderer.code = (code, language) => {
  const lang = language || 'code';
  // Escape html characters to prevent script injection in the code block itself
  const escapedCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
    
  return `
    <div class="code-block-container">
      <div class="code-block-header">
        <span>${lang.toUpperCase()}</span>
        <button class="btn-copy-code" data-code="${escapedCode}">
          Copy
        </button>
      </div>
      <pre><code>${escapedCode}</code></pre>
    </div>
  `;
};

renderer.table = (header, body) => {
  return `
    <div class="table-container">
      <table class="markdown-table">
        <thead>${header}</thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
};

marked.use({ renderer });

const extractGraphData = (content) => {
  try {
    if (!content || typeof content !== 'string') return null;

    const match = content.match(/GRAPH_DATA:\s*(\{[\s\S]*?\})\s*$/i);
    if (!match) return null;

    const parsed = JSON.parse(match[1]);
    // Validate structure to prevent rendering with missing data
    if (parsed && parsed.chartType && parsed.title && parsed.labels && parsed.series) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.warn('Graph data parse error:', error.message);
    return null;
  }
};

const stripGraphData = (content) => {
  try {
    if (!content || typeof content !== 'string') return '';
    return content.replace(/\s*GRAPH_DATA:\s*\{[\s\S]*?\}\s*$/i, '').trim();
  } catch (error) {
    console.warn('Strip graph data error:', error);
    return content || '';
  }
};

export default function ChatFeed({ messages, generating }) {
  const feedEndRef = useRef(null);

  // Auto-scroll on new message content
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating]);

  // Click Handler for Event Delegation (Copy Button)
  const handleFeedClick = (e) => {
    const copyBtn = e.target.closest('.btn-copy-code');
    if (copyBtn) {
      const code = copyBtn.getAttribute('data-code');
      if (code) {
        navigator.clipboard.writeText(code);
        
        // Show "Copied!" feedback
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = 'Copied!';
        copyBtn.style.color = 'var(--accent-emerald)';
        
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
          copyBtn.style.color = '';
        }, 1500);
      }
    }
  };

  const renderMessageContent = (msg) => {
    if (msg.content === '' && msg.role === 'assistant' && generating) {
      return (
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      );
    }

    const cleanContent = stripGraphData(msg.content || '');
    const graphData = msg.graphData || extractGraphData(msg.content || '');
    const htmlContent = marked.parse(cleanContent || '');

    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        {graphData && <GraphCard data={graphData} />}
      </>
    );
  };

  return (
    <div className="messages-feed" onClick={handleFeedClick}>
      {messages.length === 0 ? (
        <div className="empty-chat">
          <div className="empty-icon">
            <Sparkles size={48} color="#ffffff" />
          </div>
          <h2>Interact with Ollama</h2>
          <p>
            Upload text files (PDF, DOCX, TXT) and attach images to inject them as context directly into your chat. Select your desired model in the sidebar, configure temperature, and start generating!
          </p>
        </div>
      ) : (
        messages.map((msg, index) => (
          <div key={msg.id || index} className={`message-wrapper ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className="message-bubble">
              {/* Message Content HTML */}
              {renderMessageContent(msg)}

              {/* Attachments inside this bubble */}
              {((msg.images && msg.images.length > 0) || (msg.audios && msg.audios.length > 0) || (msg.documents && msg.documents.length > 0)) && (
                <div className="msg-attachments">
                  {/* Images */}
                  {msg.images?.map((img, imgIdx) => (
                    <img 
                      key={imgIdx} 
                      src={img} 
                      alt="User uploaded attachment" 
                      className="msg-img-preview" 
                    />
                  ))}
                  {/* Audio */}
                  {msg.audios?.map((audio, audioIdx) => (
                    <div key={audioIdx} className="msg-audio-ref">
                      <div className="msg-audio-title">
                        <FileAudio size={12} />
                        <span>{audio.name}</span>
                      </div>
                      <audio controls src={audio.dataUrl} preload="metadata" />
                    </div>
                  ))}
                  {/* Documents */}
                  {msg.documents?.map((doc, docIdx) => (
                    <div key={docIdx} className="msg-doc-ref" title="Referenced in response prompt">
                      <FileText size={12} />
                      <span>{doc.name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Web Search Source Cards */}
              {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                <div className="sources-section">
                  <div className="sources-header">
                    <Globe size={12} />
                    <span>Web Sources</span>
                  </div>
                  <div className="sources-grid">
                    {msg.sources.map((src, sIdx) => (
                      <a
                        key={sIdx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-card"
                        title={src.snippet}
                      >
                        <div className="source-card-title">
                          <span>{src.title}</span>
                          <ExternalLink size={11} style={{ flexShrink: 0 }} />
                        </div>
                        <div className="source-card-url">
                          {src.url.replace(/^https?:\/\//, '').split('/')[0]}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Metrics */}
              {msg.role === 'assistant' && msg.responseTime && (
                <div className="message-metrics">
                  <span>Generated in {msg.responseTime}s</span>
                  {msg.isAborted && <span style={{ color: 'var(--accent-rose)', marginLeft: '4px' }}>(Stopped)</span>}
                </div>
              )}
            </div>
          </div>
        ))
      )}
      <div ref={feedEndRef} />
    </div>
  );
}
