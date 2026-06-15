# Development Setup Guide

## Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **Ollama** (for LLM functionality)

## Installation

### 1. Clone/Setup Project
```bash
cd c:\Project\Antigravity
```

### 2. Install Dependencies
```bash
# Install all dependencies (root, server, and frontend)
npm run install-all

# Or individually:
npm install                  # Root dependencies
npm run install:server      # Backend dependencies
npm run install:frontend    # Frontend dependencies
```

### 3. Setup Ollama

Download and install Ollama from: https://ollama.ai

Start Ollama (it runs on `http://localhost:11434` by default):
```bash
ollama serve
```

### 4. Configure Environment

Create `.env` file in `/server` directory (or copy from `.env.example`):

```bash
NODE_ENV=development
PORT=5000
OLLAMA_API_URL=http://localhost:11434
DEFAULT_MODEL=mistral
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173
```

### 5. Download a Model

```bash
ollama pull mistral
# or
ollama pull llama2
```

## Running the Application

### Development Mode (All in One)
```bash
npm run dev
```
This starts both the backend server and frontend dev server concurrently.

### Backend Only
```bash
npm run server
# or
cd server && npm start
```
Server runs on `http://localhost:5000`

### Frontend Only
```bash
npm run frontend
# or
cd frontend && npm run dev
```
Frontend runs on `http://localhost:5173`

## Project Structure

```
antigravity/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/                   # Express.js backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utilities
│   │   ├── app.js           # Express setup
│   │   └── index.js         # Entry point
│   ├── uploads/             # Temporary file storage
│   ├── .env                 # Environment config
│   └── package.json
│
└── docs/                     # Documentation
```

## Common Tasks

### Add a New Route

1. Create file in `/server/src/routes/`
2. Define route handlers
3. Import and mount in `/server/src/routes/index.js`

Example:
```javascript
// /server/src/routes/myroute.js
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Hello' });
});

export default router;
```

Mount in `/server/src/routes/index.js`:
```javascript
import myRoutes from './myroute.js';
router.use('/myroute', myRoutes);
```

### Add a New Service

1. Create file in `/server/src/services/`
2. Export as default

Example:
```javascript
class MyService {
  doSomething() {
    // implementation
  }
}

export default new MyService();
```

### Add a New React Component

1. Create file in `/frontend/src/components/`
2. Use existing hooks/services

Example:
```jsx
import { useChat } from '../hooks/useChat';

export function MyComponent() {
  const { messages, sendMessage } = useChat();
  
  return <div>Component</div>;
}

export default MyComponent;
```

## Debugging

### Backend Logging

Logs are controlled by `LOG_LEVEL` environment variable:
- `error` - Only errors
- `warn` - Warnings and errors
- `info` - General info (default)
- `debug` - Detailed debugging

### Frontend DevTools

Use React DevTools and browser DevTools for debugging:
- **React DevTools:** Browser extension for component inspection
- **Network Tab:** Monitor API calls
- **Console:** Check for JavaScript errors

### Common Issues

**Issue: Port 5000 already in use**
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Issue: Ollama not connecting**
- Ensure Ollama is running: `ollama serve`
- Check `OLLAMA_API_URL` in `.env`
- Verify Ollama port (default 11434)

**Issue: CORS errors**
- Check `CORS_ORIGIN` matches frontend URL
- Ensure backend is running with correct CORS config

## Testing the API

### Using cURL
```bash
# Send a message
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'

# Get models
curl http://localhost:5000/api/models
```

### Using Postman
Import the API endpoints and test them manually.

## Production Build

### Build Frontend
```bash
cd frontend
npm run build
```
Output: `frontend/dist/`

### Prepare Backend
- Set `NODE_ENV=production`
- Install only production dependencies: `npm ci --only=production`

## Performance Tips

1. **Frontend:**
   - Use code splitting with React.lazy()
   - Implement virtual scrolling for large lists
   - Memoize expensive components

2. **Backend:**
   - Implement request caching
   - Use connection pooling for databases (future)
   - Monitor Ollama response times

## Next Steps

1. Add user authentication
2. Implement database (MongoDB/PostgreSQL)
3. Add message persistence
4. Implement rate limiting
5. Add Docker support
6. Setup CI/CD pipeline

## Resources

- [Ollama Documentation](https://ollama.ai)
- [Express.js Guide](https://expressjs.com)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
