import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Settings2, 
  FileText, 
  Database,
  ChevronDown,
  X,
  Sliders,
  Check,
  Flame,
  Globe
} from 'lucide-react';

export default function Sidebar({
  apiUrl,
  setApiUrl,
  model,
  setModel,
  temperature,
  setTemperature,
  systemPrompt,
  setSystemPrompt,
  availableModels,
  onFetchModels,
  activeDocuments,
  onToggleDocument,
  onDeleteDocument,
  conversations,
  activeChatId,
  setActiveChatId,
  onNewChat,
  onDeleteChat,
  sidebarOpen,
  setSidebarOpen
}) {
  const [showSettings, setShowSettings] = useState(false);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-icon">
          <Database size={20} color="#ffffff" />
        </div>
        <div className="logo-text">Antigravity Ollama</div>
        <button 
          className="btn-sidebar-toggle" 
          style={{ marginLeft: 'auto', display: sidebarOpen ? 'flex' : 'none' }}
          onClick={() => setSidebarOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-scrollable">
        <button className="btn-new-chat" onClick={() => {
          onNewChat();
          if (window.innerWidth <= 768) setSidebarOpen(false);
        }}>
          <Plus size={18} />
          New Chat
        </button>

        {/* Chats History Section */}
        <div>
          <div className="section-title">
            <span>Conversations</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ({conversations.length})
            </span>
          </div>
          <div className="chats-list">
            {conversations.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                No active chats. Start one!
              </div>
            ) : (
              conversations.map((chat) => (
                <div 
                  key={chat.id} 
                  className={`chat-item ${chat.id === activeChatId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    if (window.innerWidth <= 768) setSidebarOpen(false);
                  }}
                >
                  <div className="chat-item-name">
                    <FileText size={14} style={{ flexShrink: 0 }} />
                    <span>{chat.title || 'Untitled Conversation'}</span>
                  </div>
                  <button 
                    className="btn-delete-chat"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    title="Delete Conversation"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Document Library */}
        <div>
          <div className="section-title">
            <span>Document Library</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
              {activeDocuments.filter(d => d.active).length} Active
            </span>
          </div>
          <div className="doc-library">
            {activeDocuments.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                No documents uploaded. Attach a PDF/DOCX below.
              </div>
            ) : (
              activeDocuments.map((doc, idx) => (
                <div key={idx} className={`doc-item ${doc.active ? 'active' : ''}`}>
                  <div className="doc-info" onClick={() => onToggleDocument(idx)} title="Click to toggle context insertion">
                    <FileText size={14} color={doc.active ? 'var(--accent-cyan)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden' }}>
                      <div className="doc-name">{doc.name}</div>
                      <div className="doc-size">{formatSize(doc.size)}</div>
                    </div>
                  </div>
                  <div className="doc-actions">
                    <button 
                      className="btn-toggle-doc"
                      onClick={() => onToggleDocument(idx)}
                      title={doc.active ? "Exclude from prompt context" : "Include in prompt context"}
                    >
                      {doc.active ? <Check size={14} color="var(--accent-cyan)" /> : <Plus size={14} />}
                    </button>
                    <button 
                      className="btn-toggle-doc" 
                      onClick={() => onDeleteDocument(idx)}
                      style={{ hover: 'color: var(--accent-rose)' }}
                      title="Remove Document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Settings Panel Accordion */}
        <div>
          <button 
            className="btn-new-chat" 
            style={{ 
              background: 'transparent', 
              borderColor: 'var(--border-light)', 
              color: 'var(--text-secondary)',
              justifyContent: 'space-between',
              padding: '10px 14px'
            }}
            onClick={() => setShowSettings(!showSettings)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings2 size={16} />
              <span>Ollama Settings</span>
            </div>
            <ChevronDown 
              size={16} 
              style={{ 
                transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
          </button>

          {showSettings && (
            <div className="settings-panel" style={{ marginTop: '12px' }}>
              {/* API Connection URL */}
              <div className="setting-group">
                <label>
                  <Globe size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Ollama Host URL
                </label>
                <input 
                  type="text" 
                  className="setting-input" 
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="e.g., http://192.168.1.39:11434"
                />
              </div>

              {/* Model selection */}
              <div className="setting-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Model Name</label>
                  <button 
                    onClick={onFetchModels}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: 'var(--accent-indigo)', 
                      fontSize: '0.75rem', 
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Refresh List
                  </button>
                </div>
                {availableModels.length > 0 ? (
                  <select 
                    className="setting-select" 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    {availableModels.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    className="setting-input" 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g., llama3"
                  />
                )}
              </div>

              {/* Temperature */}
              <div className="setting-group">
                <label>
                  <Flame size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Temperature
                  <span className="range-val">{temperature}</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="1.5" 
                  step="0.1" 
                  className="setting-slider" 
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{
                    accentColor: 'var(--accent-indigo)',
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    height: '6px',
                    borderRadius: '4px'
                  }}
                />
              </div>

              {/* System instructions */}
              <div className="setting-group">
                <label>
                  <Sliders size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  System Instructions
                </label>
                <textarea 
                  className="setting-input" 
                  rows="3"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are a helpful assistant..."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
