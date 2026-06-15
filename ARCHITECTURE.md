# Antigravity - Complete System Architecture

## 1. Project Overview

**Antigravity** is a full-stack chat application that enables users to interact with local LLMs (via Ollama) while uploading and processing documents/images. The system emphasizes modularity, scalability, and clean separation of concerns.

### Tech Stack
- **Frontend**: React 18 + Vite (development) + React Router + Axios
- **Backend**: Express.js (Node.js) with middleware-driven architecture
- **LLM Integration**: Ollama (local, no API keys required)
- **Document Processing**: pdf-parse, mammoth (DOCX), sharp (images)
- **File Handling**: Multer for multipart uploads
- **Development**: Concurrently (parallel dev servers)

---

## 2. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │         React SPA (Vite Dev Server)               │  │
│  │  ┌──────────────┐  ┌──────────────┐               │  │
│  │  │ ChatFeed.jsx │  │ ChatInput.jsx│  Sidebar.jsx  │  │
│  │  └──────────────┘  └──────────────┘               │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST (CORS)
                         │
┌────────────────────────▼────────────────────────────────┐
│              EXPRESS.JS SERVER (Port 5000)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ CORS Middleware | Error Handling | Logging       │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Routes Layer                                    │  │
│  │  ├─ /api/chat      (messaging)                  │  │
│  │  ├─ /api/documents (upload/process)             │  │
│  │  ├─ /api/models    (Ollama integration)         │  │
│  │  └─ /api/health    (system status)              │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Services Layer (Business Logic)                 │  │
│  │  ├─ ChatService    (message handling)            │  │
│  │  ├─ DocumentService(file processing)            │  │
│  │  ├─ OllamaService  (LLM integration)            │  │
│  │  └─ FileService    (file operations)            │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Utilities & Helpers                             │  │
│  │  ├─ validators    (input validation)             │  │
│  │  ├─ logger        (logging)                      │  │
│  │  ├─ errorHandler  (error processing)             │  │
│  │  └─ config        (environment config)           │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP
                         │
┌────────────────────────▼────────────────────────────────┐
│              OLLAMA (Local LLM Server)                  │
│              (Typically Port 11434)                     │
│  ├─ /api/generate     (text generation)                │
│  ├─ /api/embeddings   (embedding generation)           │
│  └─ /api/pull         (model management)               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              FILE SYSTEM & STORAGE                      │
│  ├─ /uploads/       (temporary uploads)                │
│  ├─ /data/          (processed data)                   │
│  └─ /cache/         (cached documents)                 │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Folder Structure

```
antigravity/
├── frontend/                          # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatFeed.jsx          # Message display component
│   │   │   ├── ChatInput.jsx         # Input form component
│   │   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   │   ├── FileUpload.jsx        # File upload component
│   │   │   └── ModelSelector.jsx     # Ollama model selector
│   │   ├── pages/
│   │   │   ├── ChatPage.jsx          # Main chat interface
│   │   │   ├── DocumentsPage.jsx     # Document management
│   │   │   └── SettingsPage.jsx      # App settings
│   │   ├── services/
│   │   │   ├── api.js               # Axios instance & base config
│   │   │   ├── chatService.js       # Chat API calls
│   │   │   ├── documentService.js   # Document API calls
│   │   │   └── modelService.js      # Model API calls
│   │   ├── hooks/
│   │   │   ├── useChat.js           # Chat state management
│   │   │   └── useDocuments.js      # Document state management
│   │   ├── utils/
│   │   │   ├── formatting.js        # Text/date formatting
│   │   │   ├── validators.js        # Input validation
│   │   │   └── constants.js         # App constants
│   │   ├── styles/
│   │   │   ├── index.css            # Global styles
│   │   │   ├── components.css       # Component styles
│   │   │   └── responsive.css       # Media queries
│   │   ├── App.jsx                  # Root component
│   │   └── main.jsx                 # Entry point
│   ├── public/                       # Static assets
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── package.json
│
├── server/                            # Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── chat.js              # Chat endpoints
│   │   │   ├── documents.js         # Document endpoints
│   │   │   ├── models.js            # Model endpoints
│   │   │   ├── health.js            # Health check
│   │   │   └── index.js             # Route aggregator
│   │   ├── services/
│   │   │   ├── chatService.js       # Chat logic
│   │   │   ├── documentService.js   # Document processing
│   │   │   ├── ollamaService.js     # Ollama integration
│   │   │   ├── fileService.js       # File operations
│   │   │   └── embedService.js      # Embedding service
│   │   ├── middleware/
│   │   │   ├── errorHandler.js      # Error middleware
│   │   │   ├── logger.js            # Logging middleware
│   │   │   ├── cors.js              # CORS configuration
│   │   │   ├── validators.js        # Request validation
│   │   │   └── auth.js              # Auth middleware (future)
│   │   ├── utils/
│   │   │   ├── config.js            # Environment config
│   │   │   ├── logger.js            # Logger instance
│   │   │   ├── validators.js        # Validation helpers
│   │   │   ├── errorHandler.js      # Error handling utilities
│   │   │   └── constants.js         # Constants & enums
│   │   ├── models/
│   │   │   ├── Chat.js              # Chat data model
│   │   │   ├── Document.js          # Document model
│   │   │   └── Message.js           # Message model
│   │   ├── db/
│   │   │   ├── index.js             # Database connection
│   │   │   └── schemas.js           # Database schemas (future)
│   │   ├── server.js                # Express app setup
│   │   └── index.js                 # Entry point
│   ├── uploads/                      # Temporary file storage
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── server.js (legacy entry)
│
├── data/                              # Data storage
│   ├── datasets/                     # Training/reference data
│   ├── lists/                        # Data lists
│   └── stocks/                       # Stock data (if needed)
│
├── docs/                              # Documentation
│   ├── API.md                        # API reference
│   ├── DEPLOYMENT.md                 # Deployment guide
│   ├── CONTRIBUTING.md               # Contribution guidelines
│   └── DEV_SETUP.md                  # Development setup
│
├── .github/
│   ├── workflows/                    # CI/CD workflows
│   │   ├── lint.yml
│   │   ├── test.yml
│   │   └── deploy.yml
│   └── copilot-instructions.md       # Copilot custom instructions
│
├── docker/                            # Docker configurations
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
│
├── .env.example                       # Environment template
├── .gitignore
├── ARCHITECTURE.md                    # This file
├── README.md
├── AGENT.md
├── package.json                       # Root package.json
└── copilot-instructions.md
```

---

## 4. Component Architecture

### Frontend Components Hierarchy

```
App.jsx
├── Layout (Router setup)
│   ├── Sidebar
│   │   ├── NavLink(s)
│   │   └── ModelSelector
│   ├── MainContent
│   │   ├── ChatPage
│   │   │   ├── ChatFeed
│   │   │   │   └── Message(s)
│   │   │   ├── ChatInput
│   │   │   │   ├── FileUpload
│   │   │   │   └── TextInput
│   │   │   └── TypeIndicator
│   │   ├── DocumentsPage
│   │   │   ├── DocumentList
│   │   │   │   └── DocumentCard(s)
│   │   │   └── UploadZone
│   │   └── SettingsPage
│   │       ├── ModelSettings
│   │       ├── SystemPrompt
│   │       └── ParameterControls
│   └── Footer
└── ToastNotifications
```

### Backend Routes Architecture

```
/api
├── /chat
│   ├── POST   /              (send message)
│   ├── GET    /:conversationId  (get messages)
│   ├── DELETE /:conversationId  (delete chat)
│   └── GET    /conversations    (list all)
├── /documents
│   ├── POST   /upload        (upload file)
│   ├── GET    /              (list documents)
│   ├── GET    /:documentId   (get document details)
│   ├── DELETE /:documentId   (delete document)
│   └── POST   /:documentId/extract (extract content)
├── /models
│   ├── GET    /              (list available models)
│   ├── POST   /pull          (download model)
│   ├── DELETE /:modelId      (remove model)
│   └── GET    /active        (current model)
└── /health
    └── GET    /              (system status)
```

---

## 5. Data Flow

### Chat Message Flow
```
User Input (ChatInput)
    ↓
ChatService.sendMessage()
    ↓
POST /api/chat
    ↓
ChatService (server)
    - Validate message
    - Store in memory/DB
    - Send to Ollama
    ↓
OllamaService.generate()
    ↓
Ollama HTTP API
    ↓
LLM Response
    ↓
Response + Message store
    ↓
WebSocket/HTTP response
    ↓
ChatFeed (frontend) - updates UI
```

### Document Upload & Processing Flow
```
FileUpload component (select file)
    ↓
FormData + multipart upload
    ↓
POST /api/documents/upload
    ↓
Multer (file handling)
    ↓
DocumentService
    - Validate file type
    - Store temporarily
    - Parse content (PDF/DOCX/Image)
    ↓
FileService (processing)
    - Extract text
    - Generate embeddings (optional)
    - Store metadata
    ↓
Response with document ID
    ↓
DocumentsPage (frontend) - list updated
```

---

## 6. Service Layer Details

### ChatService (Backend)
- `sendMessage(conversationId, message, model)` - Process and send message
- `getMessages(conversationId)` - Retrieve chat history
- `createConversation()` - Start new chat
- `deleteConversation(conversationId)` - Remove chat

### DocumentService (Backend)
- `uploadDocument(file, metadata)` - Handle file upload
- `parseDocument(filePath)` - Extract text content
- `getDocuments()` - List all documents
- `deleteDocument(documentId)` - Remove document
- `extractContent(documentId)` - Get document text

### OllamaService (Backend)
- `generate(prompt, model, options)` - Call LLM
- `getModels()` - List available models
- `pullModel(modelName)` - Download model
- `getModelInfo(modelName)` - Get model details

### FileService (Backend)
- `saveTempFile(file)` - Store uploaded file
- `deleteTempFile(filePath)` - Cleanup files
- `extractTextFromPDF(filePath)` - PDF parsing
- `extractTextFromDOCX(filePath)` - DOCX parsing
- `processImage(filePath)` - Image handling

---

## 7. State Management (Frontend)

### Global State (via useContext/useReducer or Zustand)
```javascript
// ChatContext
{
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null
}

// DocumentContext
{
  documents: [],
  uploading: false,
  error: null
}

// ModelContext
{
  models: [],
  activeModel: null,
  ollamaStatus: 'connected' | 'disconnected'
}
```

---

## 8. Configuration & Environment

### Backend .env
```
NODE_ENV=development
PORT=5000
OLLAMA_API_URL=http://localhost:11434
LOG_LEVEL=debug
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=optional_for_future
```

### Frontend .env
```
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Antigravity
```

---

## 9. Error Handling Strategy

### Backend Error Handling
1. **Input Validation** → 400 Bad Request
2. **Authentication/Authorization** → 401/403
3. **Resource Not Found** → 404
4. **Service Errors** → 500 Internal Server Error
5. **Ollama Connection Issues** → 503 Service Unavailable

### Frontend Error Handling
- Try-catch in async operations
- Graceful degradation
- User-friendly error messages via Toast notifications
- Retry mechanisms for transient failures

---

## 10. Performance Considerations

### Frontend Optimization
- Code splitting via React.lazy()
- Image optimization with sharp/WebP
- Memoization of expensive computations
- Virtual scrolling for large chat feeds

### Backend Optimization
- Message queuing for Ollama (prevent overload)
- Document caching after parsing
- Streaming responses for long generations
- Rate limiting per client

---

## 11. Security Considerations

- **CORS**: Configured for localhost/production origin
- **Input Validation**: Server-side validation on all inputs
- **File Type Validation**: Whitelist allowed file types
- **File Size Limits**: Prevent abuse
- **Ollama**: Local-only (no internet exposure recommended)
- **Environment Secrets**: Never commit .env files

---

## 12. Scalability Path

### Phase 1 (Current)
- Single server instance
- In-memory chat history
- Local file storage

### Phase 2 (Future)
- Database integration (MongoDB/PostgreSQL)
- Redis for caching/session management
- Message queuing (Bull/RabbitMQ)
- User authentication & multi-user support

### Phase 3 (Production)
- Containerization (Docker)
- Kubernetes orchestration
- Load balancing
- CDN for static assets
- Separate Ollama deployment

---

## 13. Development Workflow

1. **Install dependencies**: `npm run install-all`
2. **Start dev servers**: `npm run dev` (runs both backend & frontend)
3. **Backend only**: `npm run server`
4. **Frontend only**: `npm run frontend`
5. **Linting**: `npm run lint` (in frontend folder)

---

## 14. API Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "details": {}
  }
}
```

---

This architecture provides a solid foundation that is:
- ✅ Modular and maintainable
- ✅ Scalable for future features
- ✅ Well-documented and organized
- ✅ Ready for team collaboration
- ✅ Production-ready patterns
