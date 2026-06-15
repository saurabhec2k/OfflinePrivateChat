# API Reference - Antigravity Chat Application

## Base URL
```
http://localhost:5000/api
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
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
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

## Chat Endpoints

### 1. Send a Message
**POST** `/api/chat`

Send a message and get a response from the LLM.

**Request Body:**
```json
{
  "message": "Hello, what is machine learning?",
  "conversationId": "uuid-string (optional)",
  "model": "mistral (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "550e8400-e29b-41d4-a716-446655440000",
    "userMessage": {
      "id": "msg-1",
      "role": "user",
      "content": "Hello, what is machine learning?",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "assistantMessage": {
      "id": "msg-2",
      "role": "assistant",
      "content": "Machine learning is...",
      "createdAt": "2024-01-15T10:30:05Z"
    },
    "conversation": { /* conversation data */ }
  },
  "message": "Message processed successfully"
}
```

**Error Codes:**
- `INVALID_MESSAGE` - Message validation failed
- `OLLAMA_CONNECTION_ERROR` - Unable to connect to Ollama
- `INTERNAL_ERROR` - Server error

---

### 2. Get All Conversations
**GET** `/api/chat/conversations`

Retrieve all conversations for the user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "New Chat",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "messageCount": 10
    }
  ],
  "message": "Conversations retrieved successfully"
}
```

---

### 3. Get Messages in Conversation
**GET** `/api/chat/:conversationId`

Retrieve all messages in a specific conversation.

**Path Parameters:**
- `conversationId` (string, UUID) - ID of the conversation

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": { /* conversation data */ },
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "Hello",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "message": "Messages retrieved successfully"
}
```

---

### 4. Delete Conversation
**DELETE** `/api/chat/:conversationId`

Delete a conversation and all its messages.

**Path Parameters:**
- `conversationId` (string, UUID) - ID of the conversation to delete

**Response:**
```json
{
  "success": true,
  "data": { "deletedId": "550e8400-e29b-41d4-a716-446655440000" },
  "message": "Conversation deleted successfully"
}
```

---

## Document Endpoints

### 1. Upload Document
**POST** `/api/documents/upload`

Upload a document for processing.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (multipart file)

**Supported File Types:**
- PDF (`.pdf`)
- DOCX (`.docx`)
- TXT (`.txt`)
- JPG/JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)

**Max File Size:** 50 MB

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-123",
    "filename": "document.pdf",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "status": "pending",
    "size": 2048576
  },
  "message": "File uploaded successfully. Processing in background..."
}
```

---

### 2. Get All Documents
**GET** `/api/documents`

Retrieve all uploaded documents.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-123",
      "filename": "document.pdf",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "status": "processed",
      "size": 2048576,
      "contentLength": 5000
    }
  ],
  "message": "Documents retrieved successfully"
}
```

---

### 3. Get Document Details
**GET** `/api/documents/:documentId`

Get details and content of a specific document.

**Path Parameters:**
- `documentId` (string) - ID of the document

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-123",
    "filename": "document.pdf",
    "status": "processed",
    "content": "Document text content...",
    "contentLength": 5000
  },
  "message": "Document retrieved successfully"
}
```

---

### 4. Delete Document
**DELETE** `/api/documents/:documentId`

Delete a document and its content.

**Path Parameters:**
- `documentId` (string) - ID of the document to delete

**Response:**
```json
{
  "success": true,
  "data": { "deletedId": "doc-123" },
  "message": "Document deleted successfully"
}
```

---

## Model Endpoints

### 1. Get Available Models
**GET** `/api/models`

List all models available in Ollama.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "mistral:latest",
      "modified_at": "2024-01-15T10:00:00Z",
      "size": 4109181349,
      "digest": "sha256:..."
    }
  ],
  "message": "Models retrieved successfully"
}
```

---

### 2. Pull/Download Model
**POST** `/api/models/pull`

Download a new model to Ollama.

**Request Body:**
```json
{
  "model": "llama2"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "success",
    "model": "llama2:latest"
  },
  "message": "Model llama2 downloaded successfully"
}
```

---

### 3. Check Ollama Health
**GET** `/api/models/health`

Check if Ollama server is running and accessible.

**Response (Connected):**
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "ollamaUrl": "http://localhost:11434"
  },
  "message": "Ollama is running and accessible"
}
```

**Response (Disconnected):**
```json
{
  "success": false,
  "data": {
    "status": "disconnected",
    "ollamaUrl": "http://localhost:11434"
  },
  "message": "Ollama is not accessible. Make sure it is running.",
  "error": { /* error details */ }
}
```

---

## Health Check Endpoints

### System Health
**GET** `/api/health`

Check overall system health and component status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "services": {
      "ollama": {
        "status": "connected",
        "url": "http://localhost:11434"
      },
      "chat": {
        "status": "operational",
        "totalConversations": 5,
        "totalMessages": 42
      },
      "documents": {
        "status": "operational",
        "totalDocuments": 3,
        "byStatus": {
          "processed": 2,
          "pending": 1
        }
      }
    }
  },
  "message": "System is healthy"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_INPUT | 400 | Invalid request input |
| INVALID_MESSAGE | 400 | Message validation failed |
| INVALID_FILE_TYPE | 400 | Unsupported file type |
| FILE_TOO_LARGE | 400 | File exceeds size limit |
| FILE_UPLOAD_FAILED | 500 | File upload/processing failed |
| OLLAMA_CONNECTION_ERROR | 503 | Cannot connect to Ollama |
| MODEL_NOT_FOUND | 404 | Requested model not found |
| NOT_FOUND | 404 | Resource not found |
| UNAUTHORIZED | 401 | Authentication required |
| INTERNAL_ERROR | 500 | Server error |

---

## Example Usage with cURL

### Send a Message
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "model": "mistral"
  }'
```

### Upload a Document
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -F "file=@document.pdf"
```

### Get Available Models
```bash
curl http://localhost:5000/api/models
```

---

## Rate Limiting

Currently, no rate limiting is implemented. For production deployment, consider implementing rate limiting using middleware like `express-rate-limit`.

---

## CORS Configuration

CORS is enabled for requests from:
- `http://localhost:5173` (default frontend)

Configure via `CORS_ORIGIN` environment variable.

---

## Timeouts

- **Ollama Requests:** 30 seconds (configurable)
- **File Upload:** 30 seconds
- **HTTP Requests:** 30 seconds

---

## Versioning

Current API version: **v1**

All endpoints are prefixed with `/api` in the router.
