import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatFeed from './components/ChatFeed';
import ChatInput from './components/ChatInput';
import { Menu, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  // --- Persistent Settings States ---
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem('antigravity_api_url') || 'http://192.168.1.39:11434';
  });
  const [model, setModel] = useState(() => {
    return localStorage.getItem('antigravity_model') || 'llama3';
  });
  const [temperature, setTemperature] = useState(() => {
    const saved = localStorage.getItem('antigravity_temperature');
    return saved !== null ? parseFloat(saved) : 0.7;
  });
  const [systemPrompt, setSystemPrompt] = useState(() => {
    return localStorage.getItem('antigravity_system_prompt') || 
      'You are a helpful, creative, and clever assistant.';
  });

  // --- App Flow States ---
  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [activeDocuments, setActiveDocuments] = useState([]);
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('antigravity_conversations');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeChatId, setActiveChatId] = useState(() => {
    return localStorage.getItem('antigravity_active_chat_id') || '';
  });
  const [input, setInput] = useState('');
  const [queuedFiles, setQueuedFiles] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [webSearch, setWebSearch] = useState(false);

  // References
  const abortControllerRef = useRef(null);

  // --- LocalStorage Synchronization ---
  useEffect(() => {
    localStorage.setItem('antigravity_api_url', apiUrl);
  }, [apiUrl]);

  useEffect(() => {
    localStorage.setItem('antigravity_model', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('antigravity_temperature', temperature.toString());
  }, [temperature]);

  useEffect(() => {
    localStorage.setItem('antigravity_system_prompt', systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem('antigravity_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('antigravity_active_chat_id', activeChatId);
  }, [activeChatId]);

  // --- Initial Mount Actions ---
  useEffect(() => {
    fetchModels();
    
    // Automatically create a chat if empty
    if (conversations.length === 0) {
      handleNewChat();
    }
  }, []);

  // Fetch Ollama models
  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl })
      });
      if (response.ok) {
        const data = await response.json();
        const modelsList = data.models || [];
        setAvailableModels(modelsList);
        
        // If current model is not in the list, set to first one
        if (modelsList.length > 0 && !modelsList.some(m => m.name === model)) {
          setModel(modelsList[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  // Trigger model fetch when API URL changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchModels();
    }, 1500); // Debounce to prevent spamming
    return () => clearTimeout(delayDebounce);
  }, [apiUrl]);

  // --- Chat Lifecycle Handlers ---
  const handleNewChat = () => {
    const newId = Math.random().toString(36).substring(7);
    const newChat = {
      id: newId,
      title: 'New Conversation',
      messages: []
    };
    setConversations(prev => [newChat, ...prev]);
    setActiveChatId(newId);
  };

  const handleDeleteChat = (id) => {
    const remaining = conversations.filter(c => c.id !== id);
    setConversations(remaining);
    
    if (activeChatId === id) {
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else {
        const newId = Math.random().toString(36).substring(7);
        const newChat = {
          id: newId,
          title: 'New Conversation',
          messages: []
        };
        setConversations([newChat]);
        setActiveChatId(newId);
      }
    }
  };

  // --- Document Library Actions ---
  const handleUploadDocumentFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to parse file');
    }

    const data = await response.json();
    
    setActiveDocuments(prev => {
      if (prev.some(d => d.name === data.name)) {
        return prev.map(d => d.name === data.name ? { ...data, active: true } : d);
      }
      return [...prev, { ...data, active: true }];
    });

    return data;
  };

  const handleToggleDocument = (index) => {
    setActiveDocuments(prev => prev.map((doc, idx) => 
      idx === index ? { ...doc, active: !doc.active } : doc
    ));
  };

  const handleDeleteDocument = (index) => {
    setActiveDocuments(prev => prev.filter((_, idx) => idx !== index));
  };

  // Get current active conversation messages
  const currentChat = conversations.find(c => c.id === activeChatId) || conversations[0];
  const messages = currentChat ? currentChat.messages : [];

  // Helper to update messages list in specific conversation
  const updateChatMessages = (chatId, updater) => {
    setConversations(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: typeof updater === 'function' ? updater(chat.messages) : updater
        };
      }
      return chat;
    }));
  };

  // Helper to update specific assistant message text during stream
  const updateAssistantText = (chatId, messageId, text) => {
    setConversations(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(m => 
            m.id === messageId ? { ...m, content: text } : m
          )
        };
      }
      return chat;
    }));
  };

  const extractGraphData = (text) => {
    try {
      const match = text.match(/GRAPH_DATA:\s*(\{[\s\S]*?\})\s*$/i);
      if (!match) return null;

      const jsonStr = match[1];
      const parsed = JSON.parse(jsonStr);
      
      // Validate structure
      if (parsed.chartType && parsed.title && parsed.labels && parsed.series) {
        return parsed;
      }
      return null;
    } catch (error) {
      console.warn('Graph data extraction error:', error.message);
      return null;
    }
  };

  const stripGraphData = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/\s*GRAPH_DATA:\s*\{[\s\S]*?\}\s*$/i, '').trim();
  };

  // Helper to update specific assistant message metadata fields
  const updateAssistantMetadata = (chatId, messageId, metadata) => {
    setConversations(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(m => 
            m.id === messageId ? { ...m, ...metadata } : m
          )
        };
      }
      return chat;
    }));
  };

  // --- Streaming Generation Handler ---
  const handleSendMessage = async (text, attachedImages, attachedDocs, attachedAudios = []) => {
    if (!activeChatId) return;

    const activeDocsForPrompt = activeDocuments
      .filter(d => d.active)
      .map(d => ({ name: d.name, text: d.text }));
    const attachedDocsForPrompt = attachedDocs
      .filter(Boolean)
      .map(d => ({ name: d.name, text: d.text }));
    const docsForPrompt = [
      ...activeDocsForPrompt,
      ...attachedDocsForPrompt.filter(
        doc => !activeDocsForPrompt.some(activeDoc => activeDoc.name === doc.name)
      )
    ];

    // Create unique message IDs
    const userMsgId = Math.random().toString(36).substring(7);
    const assistantMsgId = Math.random().toString(36).substring(7);

    // 1. Create User Message
    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      images: attachedImages.length > 0 ? attachedImages : undefined,
      audios: attachedAudios.length > 0 ? attachedAudios : undefined,
      documents: attachedDocs.length > 0 ? attachedDocs : undefined
    };

    // 2. Create Placeholder Assistant Message
    const assistantMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      documents: docsForPrompt.map(d => ({ name: d.name })) // referenced documents
    };

    // 3. Update Conversation with User & Assistant message placeholders
    const isFirstMessage = messages.length === 0;
    updateChatMessages(activeChatId, prev => [...prev, userMessage, assistantMessage]);

    // Update Title if it was a new chat
    if (isFirstMessage && text.trim()) {
      setConversations(prev => prev.map(c => 
        c.id === activeChatId 
          ? { ...c, title: text.substring(0, 26) + (text.length > 26 ? '...' : '') } 
          : c
      ));
    }

    setGenerating(true);
    const startTime = Date.now();

    // Initialize controller for Stop Action
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl,
          model,
          prompt: text,
          systemPrompt,
          temperature,
          history: messages,
          documents: docsForPrompt,
          images: attachedImages,
          audios: attachedAudios.map(({ name, size, mimeType, dataUrl }) => ({
            name,
            size,
            mimeType,
            dataUrl
          })),
          webSearch
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Server returned an error');
      }

      // Stream Reader Setup
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep partial line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          try {
            const data = JSON.parse(trimmed);
            if (data.__meta && data.searchResults) {
              // Metadata line — attach search sources to the assistant message
              updateAssistantMetadata(activeChatId, assistantMsgId, { sources: data.searchResults });
            } else if (data.response) {
              assistantText += data.response;
              const graphData = extractGraphData(assistantText);
              if (graphData) {
                updateAssistantMetadata(activeChatId, assistantMsgId, { graphData });
                assistantText = stripGraphData(assistantText);
              }
              updateAssistantText(activeChatId, assistantMsgId, assistantText);
            }
          } catch (e) {
            console.warn('Chunk parse error:', trimmed, e);
          }
        }
      }

      // Read final leftover buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer.trim());
          if (data.__meta && data.searchResults) {
            updateAssistantMetadata(activeChatId, assistantMsgId, { sources: data.searchResults });
          } else if (data.response) {
            assistantText += data.response;
            const graphData = extractGraphData(assistantText);
            if (graphData) {
              updateAssistantMetadata(activeChatId, assistantMsgId, { graphData });
              assistantText = stripGraphData(assistantText);
            }
            updateAssistantText(activeChatId, assistantMsgId, assistantText);
          }
        } catch (e) {
          console.warn('Final buffer parse error:', buffer, e);
        }
      }

      const durationMs = Date.now() - startTime;
      const durationSec = (durationMs / 1000).toFixed(1);
      updateAssistantMetadata(activeChatId, assistantMsgId, { responseTime: durationSec });

    } catch (error) {
      const durationMs = Date.now() - startTime;
      const durationSec = (durationMs / 1000).toFixed(1);
      if (error.name === 'AbortError') {
        console.log('Generation aborted.');
        updateAssistantMetadata(activeChatId, assistantMsgId, { responseTime: durationSec, isAborted: true });
      } else {
        console.error('Chat error:', error);
        updateAssistantText(
          activeChatId, 
          assistantMsgId, 
          `⚠️ **Error generating response:** ${error.message}`
        );
        updateAssistantMetadata(activeChatId, assistantMsgId, { responseTime: durationSec });
      }
    } finally {
      setGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Stop Generation Handler
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setGenerating(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <Sidebar
        apiUrl={apiUrl}
        setApiUrl={setApiUrl}
        model={model}
        setModel={setModel}
        temperature={temperature}
        setTemperature={setTemperature}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        availableModels={availableModels}
        onFetchModels={fetchModels}
        activeDocuments={activeDocuments}
        onToggleDocument={handleToggleDocument}
        onDeleteDocument={handleDeleteDocument}
        conversations={conversations}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Backdrop blur overlay for mobile view when sidebar is open */}
      <div 
        className="backdrop-blur-overlay"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <main className="main-chat">
        <header className="chat-header">
          <button className="btn-sidebar-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          
          <div className="chat-title-container">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              {currentChat?.title || 'New Conversation'}
            </h3>
          </div>

          <div className="active-model-badge" title="Active Model">
            {loadingModels ? (
              <RefreshCw size={12} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
            ) : (
              <Sparkles size={12} />
            )}
            <span>{model}</span>
          </div>
        </header>

        {/* Message Feed Display */}
        <ChatFeed 
          messages={messages} 
          generating={generating} 
        />

        {/* User Input Board */}
        <ChatInput
          input={input}
          setInput={setInput}
          generating={generating}
          onStopGeneration={handleStopGeneration}
          onSendMessage={handleSendMessage}
          queuedFiles={queuedFiles}
          setQueuedFiles={setQueuedFiles}
          onUploadDocumentFile={handleUploadDocumentFile}
          activeDocuments={activeDocuments}
          webSearch={webSearch}
          setWebSearch={setWebSearch}
        />
      </main>
    </div>
  );
}
