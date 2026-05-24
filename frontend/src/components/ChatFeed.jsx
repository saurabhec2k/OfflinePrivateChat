import React, { useEffect, useRef, useState } from 'react';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  FileText, 
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

// Code Block Component with Copy functionality
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span>{language.toUpperCase() || 'CODE'}</span>
        <button className="btn-copy-code" onClick={handleCopy}>
          {copied ? (
            <>
              <Check size={12} color="var(--accent-emerald)" />
              <span style={{ color: 'var(--accent-emerald)' }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Inline Style Parser (**bold** and `code`)
function parseInlineStyles(str) {
  // Matches markdown bold "**" or inline code "`"
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = str.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// Paragraph/List Formatter
function FormattedText({ text }) {
  const paragraphs = text.split('\n\n');

  return paragraphs.map((para, pIdx) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    // Check if it's a heading
    if (trimmed.startsWith('# ')) {
      return <h1 key={pIdx} style={{ fontSize: '1.5rem', margin: '16px 0 8px', fontWeight: 'bold' }}>{parseInlineStyles(trimmed.slice(2))}</h1>;
    }
    if (trimmed.startsWith('## ')) {
      return <h2 key={pIdx} style={{ fontSize: '1.25rem', margin: '14px 0 6px', fontWeight: 'bold' }}>{parseInlineStyles(trimmed.slice(3))}</h2>;
    }
    if (trimmed.startsWith('### ')) {
      return <h3 key={pIdx} style={{ fontSize: '1.1rem', margin: '12px 0 6px', fontWeight: 'bold' }}>{parseInlineStyles(trimmed.slice(4))}</h3>;
    }

    const lines = trimmed.split('\n');
    
    // Check if it's a bullet list
    const isBulletList = lines.every(line => line.trim().startsWith('- ') || line.trim().startsWith('* '));
    if (isBulletList && lines.length > 0) {
      return (
        <ul key={pIdx} style={{ listStyleType: 'disc', paddingLeft: '20px', margin: '10px 0' }}>
          {lines.map((line, lIdx) => (
            <li key={lIdx} style={{ marginBottom: '4px' }}>
              {parseInlineStyles(line.trim().substring(2))}
            </li>
          ))}
        </ul>
      );
    }

    // Check if it's a numbered list
    const isNumberedList = lines.every(line => /^\d+\.\s/.test(line.trim()));
    if (isNumberedList && lines.length > 0) {
      return (
        <ol key={pIdx} style={{ listStyleType: 'decimal', paddingLeft: '20px', margin: '10px 0' }}>
          {lines.map((line, lIdx) => {
            const content = line.trim().replace(/^\d+\.\s/, '');
            return (
              <li key={lIdx} style={{ marginBottom: '4px' }}>
                {parseInlineStyles(content)}
              </li>
            );
          })}
        </ol>
      );
    }

    // Regular paragraph (handling line breaks)
    return (
      <p key={pIdx} style={{ marginBottom: '10px', wordBreak: 'break-word' }}>
        {lines.map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {parseInlineStyles(line)}
            {lIdx < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

export default function ChatFeed({ messages, generating }) {
  const feedEndRef = useRef(null);

  // Auto-scroll on new message content
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating]);

  // Main Markdown Parser
  const parseMarkdown = (text) => {
    if (!text) return '';
    
    const parts = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const index = match.index;
      if (index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, index) });
      }
      parts.push({ type: 'code', language: match[1] || 'code', content: match[2].trim() });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return <CodeBlock key={index} language={part.language} code={part.content} />;
      } else {
        return <FormattedText key={index} text={part.content} />;
      }
    });
  };

  return (
    <div className="messages-feed">
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
              {/* Message Content Text */}
              {msg.content === '' && msg.role === 'assistant' && generating ? (
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              ) : (
                parseMarkdown(msg.content)
              )}

              {/* Attachments inside this bubble */}
              {((msg.images && msg.images.length > 0) || (msg.documents && msg.documents.length > 0)) && (
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
                  {/* Documents */}
                  {msg.documents?.map((doc, docIdx) => (
                    <div key={docIdx} className="msg-doc-ref" title="Referenced in response prompt">
                      <FileText size={12} />
                      <span>{doc.name}</span>
                    </div>
                  ))}
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
