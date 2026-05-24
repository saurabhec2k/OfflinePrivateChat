import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS and parsing of large JSON payloads (necessary for base64 images)
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Use memory storage for Multer to keep the file system clean
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB file limit
});

// Helper to extract text from buffer based on file extension
async function extractTextFromFile(file) {
  const extension = file.originalname.split('.').pop().toLowerCase();
  
  if (extension === 'pdf') {
    const data = await pdf(file.buffer);
    return data.text;
  } else if (extension === 'docx') {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  } else if (extension === 'txt' || extension === 'md' || extension === 'json') {
    return file.buffer.toString('utf-8');
  } else {
    throw new Error(`Unsupported file type: .${extension}`);
  }
}

// Endpoint: Fetch available models from Ollama
app.post('/api/models', async (req, res) => {
  const { apiUrl } = req.body;
  const targetUrl = apiUrl || 'http://192.168.1.39:11434';
  
  try {
    const response = await fetch(`${targetUrl}/api/tags`);
    if (!response.ok) {
      throw new Error(`Failed to fetch models from Ollama: ${response.statusText}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching models from Ollama:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Parse uploaded document files (PDF, DOCX, TXT)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const text = await extractTextFromFile(req.file);
    res.json({
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      text: text
    });
  } catch (error) {
    console.error('Error parsing file:', error.message);
    res.status(500).json({ error: `Failed to parse document: ${error.message}` });
  }
});

// Endpoint: Handle Chat Generation and stream response from Ollama
app.post('/api/chat', async (req, res) => {
  const {
    apiUrl,
    model,
    prompt,
    systemPrompt,
    temperature,
    history,
    documents,
    images
  } = req.body;

  const targetUrl = apiUrl || 'http://192.168.1.39:11434';
  const selectedModel = model || 'llama3';

  // Construct context-enriched prompt
  let finalPrompt = '';

  // 1. Inject parsed document context
  if (documents && documents.length > 0) {
    finalPrompt += "System context: The user has attached documents. Refer to these documents to answer their question if relevant.\n\n";
    documents.forEach((doc) => {
      finalPrompt += `--- START OF DOCUMENT: ${doc.name} ---\n`;
      finalPrompt += doc.text;
      finalPrompt += `\n--- END OF DOCUMENT: ${doc.name} ---\n\n`;
    });
  }

  // 2. Format conversation history
  if (history && history.length > 0) {
    finalPrompt += "Conversation history:\n";
    history.forEach((msg) => {
      const roleName = msg.role === 'user' ? 'User' : 'Assistant';
      finalPrompt += `${roleName}: ${msg.content}\n`;
    });
    // Add current prompt
    finalPrompt += `User: ${prompt}\nAssistant:`;
  } else {
    finalPrompt += prompt;
  }

  // Clean image base64 strings by removing data-URI header metadata (e.g., "data:image/png;base64,")
  const cleanedImages = images && images.length > 0
    ? images.map(img => {
        if (img.startsWith('data:')) {
          const commaIdx = img.indexOf(',');
          return commaIdx !== -1 ? img.substring(commaIdx + 1) : img;
        }
        return img;
      })
    : undefined;

  try {
    const ollamaPayload = {
      model: selectedModel,
      prompt: finalPrompt,
      system: systemPrompt || undefined,
      images: cleanedImages,
      options: {
        temperature: temperature !== undefined ? parseFloat(temperature) : 0.7
      },
      stream: true
    };

    const response = await fetch(`${targetUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Ollama error: ${errText}` });
    }

    // Set headers for Server-Sent Events / Chunked Streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the data from Ollama response to client
    for await (const chunk of response.body) {
      res.write(chunk);
    }
    
    res.end();
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
