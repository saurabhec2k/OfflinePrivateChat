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

// Helper: Search DuckDuckGo and return top results
async function searchWeb(query, maxResults = 5) {
  const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  if (!response.ok) throw new Error(`DDG fetch failed: ${response.status}`);
  const html = await response.text();
  const results = [];
  const blocks = html.split('class="result results_links');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const urlMatch  = block.match(/href="([^"]+)"/);
    const titleMatch   = block.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/);
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
    if (urlMatch && titleMatch) {
      let cleanUrl = urlMatch[1];
      if (cleanUrl.includes('uddg=')) {
        cleanUrl = decodeURIComponent(cleanUrl.split('uddg=')[1].split('&')[0]);
      }
      results.push({
        url: cleanUrl,
        title:   titleMatch[1].replace(/<[^>]*>/g, '').trim(),
        snippet: snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : ''
      });
      if (results.length >= maxResults) break;
    }
  }
  return results;
}

function normalizeDocumentText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function chunkText(text, maxChars = 6000) {
  const normalized = normalizeDocumentText(text);
  if (normalized.length <= maxChars) return [normalized];

  const chunks = [];
  let remaining = normalized;

  while (remaining.length > 0) {
    let nextChunk = remaining.slice(0, maxChars);
    const paragraphBreak = nextChunk.lastIndexOf('\n\n');
    const sentenceBreak = nextChunk.lastIndexOf('. ');
    const splitAt = paragraphBreak > maxChars * 0.5
      ? paragraphBreak + 2
      : sentenceBreak > maxChars * 0.5
        ? sentenceBreak + 2
        : maxChars;

    nextChunk = remaining.slice(0, splitAt).trim();
    if (nextChunk) chunks.push(nextChunk);
    remaining = remaining.slice(splitAt).trim();
  }

  return chunks;
}

function shouldUseDocumentSummaryFlow(prompt, usableDocuments) {
  if (!usableDocuments.length) return false;
  return /\b(summarize|summarise|summary|summarized|summarised|overview|brief)\b/i.test(prompt);
}

function shouldUseAudioTranscriptFlow(prompt, audioFiles) {
  if (!audioFiles.length) return false;
  return /\b(audio|recording|voice|transcribe|transcript|summarize|summarise|summary|listen)\b/i.test(prompt);
}

function supportsNativeAudio(model) {
  const normalized = String(model || '').toLowerCase();
  if (!normalized.includes('gemma4')) return false;
  return /(^|[:\-_])(e?2b|e?4b|12b)([:\-_]|$)/i.test(normalized);
}

function stripDataUrl(value) {
  const text = String(value || '');
  const commaIndex = text.indexOf(',');
  return text.startsWith('data:') && commaIndex !== -1
    ? text.slice(commaIndex + 1)
    : text;
}

function getAudioFormat(audio) {
  const mimeType = String(audio.mimeType || '').toLowerCase();
  const extension = String(audio.name || '').split('.').pop().toLowerCase();
  const fromMime = mimeType.includes('/')
    ? mimeType.split('/').pop().split(';')[0]
    : '';
  return (fromMime || extension || 'wav').replace('mpeg', 'mp3');
}

function getAudioFilesFromHistory(history = []) {
  if (!Array.isArray(history)) return [];

  return history.flatMap((message) => {
    if (!message || !Array.isArray(message.audios)) return [];
    return message.audios
      .filter(audio => audio && audio.name && audio.dataUrl)
      .map(audio => ({
        name: audio.name,
        size: audio.size,
        mimeType: audio.mimeType,
        dataUrl: audio.dataUrl
      }));
  });
}

function dedupeAudioFiles(audioFiles) {
  const seen = new Set();

  return audioFiles.filter((audio) => {
    const key = `${audio.name || ''}:${audio.size || ''}:${audio.dataUrl ? audio.dataUrl.length : 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function looksLikeMissingAudioResponse(text) {
  return /\b(provide|upload|attach|send)\b[\s\S]{0,80}\baudio\b/i.test(text || '');
}

async function postOllamaJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const rawText = await response.text();
  let data = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(rawText || response.statusText);
  }

  return data;
}

async function generateOllamaAudioText({
  targetUrl,
  model,
  systemPrompt,
  temperature,
  prompt,
  audioFiles
}) {
  const audioPayloads = audioFiles
    .filter(audio => audio && audio.dataUrl)
    .map(audio => ({
      data: stripDataUrl(audio.dataUrl),
      format: getAudioFormat(audio),
      name: audio.name
    }));

  if (audioPayloads.length === 0) {
    throw new Error('No audio data was provided to the server.');
  }

  const baseOptions = {
    temperature: Number.isFinite(parseFloat(temperature)) ? parseFloat(temperature) : 0.2,
    num_ctx: 8192,
    num_predict: 900
  };
  const audioStrings = audioPayloads.map(audio => audio.data);
  const attempts = [
    {
      label: '/api/generate audio strings',
      url: `${targetUrl}/api/generate`,
      payload: {
        model,
        prompt,
        system: systemPrompt || undefined,
        audio: audioStrings,
        audios: audioStrings,
        options: baseOptions,
        stream: false
      },
      read: data => data?.response || ''
    },
    {
      label: '/api/generate audio objects',
      url: `${targetUrl}/api/generate`,
      payload: {
        model,
        prompt,
        system: systemPrompt || undefined,
        audio: audioPayloads,
        audios: audioPayloads,
        options: baseOptions,
        stream: false
      },
      read: data => data?.response || ''
    },
    {
      label: '/api/chat message audio',
      url: `${targetUrl}/api/chat`,
      payload: {
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
            audio: audioStrings,
            audios: audioStrings
          }
        ],
        options: baseOptions,
        stream: false
      },
      read: data => data?.message?.content || ''
    },
    {
      label: '/api/chat message audio objects',
      url: `${targetUrl}/api/chat`,
      payload: {
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
            audio: audioPayloads,
            audios: audioPayloads
          }
        ],
        options: baseOptions,
        stream: false
      },
      read: data => data?.message?.content || ''
    },
    {
      label: '/v1/chat/completions input_audio',
      url: `${targetUrl.replace(/\/api\/?$/, '')}/v1/chat/completions`,
      payload: {
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...audioPayloads.map(audio => ({
                type: 'input_audio',
                input_audio: {
                  data: audio.data,
                  format: audio.format
                }
              }))
            ]
          }
        ],
        temperature: baseOptions.temperature,
        max_tokens: baseOptions.num_predict,
        stream: false
      },
      read: data => data?.choices?.[0]?.message?.content || ''
    }
  ];

  const failures = [];

  for (const attempt of attempts) {
    try {
      const data = await postOllamaJson(attempt.url, attempt.payload);
      const text = attempt.read(data).trim();

      if (text && !looksLikeMissingAudioResponse(text)) {
        console.log(`[audio] Ollama accepted audio via ${attempt.label}`);
        return text;
      }

      failures.push(`${attempt.label}: ${text || 'empty response'}`);
    } catch (error) {
      failures.push(`${attempt.label}: ${error.message}`);
    }
  }

  throw new Error(`All native audio payload attempts failed. ${failures.join(' | ')}`);
}

async function generateOllamaText(targetUrl, payload) {
  const response = await fetch(`${targetUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, stream: false })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama error: ${errText}`);
  }

  const data = await response.json();
  return data.response || '';
}

async function summarizeDocuments({
  targetUrl,
  model,
  systemPrompt,
  temperature,
  userPrompt,
  documents
}) {
  const chunkSummaries = [];
  const chunkLimit = 10;

  for (const doc of documents) {
    const chunks = chunkText(doc.text).slice(0, chunkLimit);

    for (let index = 0; index < chunks.length; index += 1) {
      const chunkSummary = await generateOllamaText(targetUrl, {
      model,
      system: systemPrompt || undefined,
        prompt:
          `Summarize this section of "${doc.name || 'the uploaded document'}" in 4-6 factual bullet points. ` +
          `Capture concrete names, decisions, requirements, numbers, and conclusions. Do not start with "Based".\n\n` +
          `SECTION ${index + 1} OF ${chunks.length}:\n${chunks[index]}`,
      options: {
          temperature: Number.isFinite(parseFloat(temperature)) ? parseFloat(temperature) : 0.3,
        num_ctx: 8192,
          num_predict: 512
        }
      });

      if (chunkSummary.trim()) {
        chunkSummaries.push(`Document: ${doc.name || 'Untitled document'}, section ${index + 1}\n${chunkSummary.trim()}`);
      }
    }
  }

  if (chunkSummaries.length === 0) {
    return 'I could not extract enough readable text from the uploaded document to summarize it.';
  }

  return await generateOllamaText(targetUrl, {
    model,
    system: systemPrompt || undefined,
    prompt:
      `The user asked: "${userPrompt}"\n\n` +
      `Create a clear, useful summary of the uploaded document from these section notes. ` +
      `Use this structure:\n` +
      `1. Short overview\n2. Key points\n3. Important details or action items\n\n` +
      `Do not answer with a single word or a single sentence. Do not start with "Based".\n\n` +
      `SECTION NOTES:\n${chunkSummaries.join('\n\n')}`,
    options: {
      temperature: Number.isFinite(parseFloat(temperature)) ? parseFloat(temperature) : 0.3,
      num_ctx: 8192,
      num_predict: 900
    }
  });
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

// Endpoint: Standalone web search (for displaying results in sidebar/card)
app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query is required' });
  try {
    const results = await searchWeb(query, 6);
    res.json({ results });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: err.message });
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
    images,
    audios,
    webSearch
  } = req.body;

  const targetUrl = apiUrl || 'http://192.168.1.39:11434';
  const selectedModel = model || 'llama3';
  const hasDocuments = Array.isArray(documents) && documents.length > 0;
  const currentAudioFiles = Array.isArray(audios) ? audios.filter(audio => audio && audio.name) : [];
  const historyAudioFiles = getAudioFilesFromHistory(history);
  const audioFiles = dedupeAudioFiles([...currentAudioFiles, ...historyAudioFiles]);
  const hasAudio = audioFiles.length > 0;
  const usableDocuments = hasDocuments
    ? documents.filter(doc => doc && doc.text && doc.text.trim())
    : [];
  const userPrompt = typeof prompt === 'string' && prompt.trim()
    ? prompt.trim()
    : hasDocuments
      ? 'Please summarize the attached document.'
      : hasAudio
        ? 'Please help with the attached audio file.'
        : '';

  // Construct context-enriched prompt
  let finalPrompt = '';
  let searchResults = [];

  // 0. Optionally fetch live web search results and inject as context
  if (webSearch && userPrompt) {
    try {
      console.log(`[web-search] Searching for: "${userPrompt}"`);
      searchResults = await searchWeb(userPrompt, 5);
      if (searchResults.length > 0) {
        finalPrompt += `System context: The following are live web search results for the query "${userPrompt}". Use these as factual reference when answering.\n\n`;
        searchResults.forEach((r, idx) => {
          finalPrompt += `[${idx + 1}] **${r.title}**\n`;
          finalPrompt += `URL: ${r.url}\n`;
          finalPrompt += `Summary: ${r.snippet}\n\n`;
        });
      }
    } catch (err) {
      console.warn('[web-search] Search failed, continuing without results:', err.message);
    }
  }

  // 1. Inject parsed document context
  if (hasDocuments) {
    if (usableDocuments.length > 0) {
      finalPrompt += "System context: The user has attached documents. Use the document text below as the primary source when answering questions about uploaded files. If the user asks for a summary, summarize the document directly and do not answer with a single sentence.\n\n";

      usableDocuments.forEach((doc) => {
        finalPrompt += `--- START OF DOCUMENT: ${doc.name || 'Untitled document'} ---\n`;
        finalPrompt += normalizeDocumentText(doc.text).slice(0, 18000);
        finalPrompt += `\n--- END OF DOCUMENT: ${doc.name || 'Untitled document'} ---\n\n`;
      });
    } else {
      finalPrompt += "System context: The user attached documents, but no readable text was extracted. Tell the user the document could not be read instead of guessing.\n\n";
    }
  }

  if (hasAudio) {
    finalPrompt += supportsNativeAudio(selectedModel)
      ? "System context: The user attached audio files. Use the attached audio for ASR, translation, or audio summarization when the model/runtime supports native audio input. If the audio input is not available to the runtime, say so clearly and do not invent spoken content.\n\n"
      : "System context: The user attached audio files, but the selected model is not marked as native-audio capable in this app. Do not guess or invent spoken content from the audio. Ask the user to switch to a Gemma audio-capable model such as Gemma 4 E2B, E4B, or 12B.\n\n";

    audioFiles.forEach((audio, index) => {
      finalPrompt += `Audio attachment ${index + 1}: ${audio.name}`;
      if (audio.mimeType) finalPrompt += ` (${audio.mimeType})`;
      if (audio.size) finalPrompt += `, ${audio.size} bytes`;
      finalPrompt += '\n';
    });

    finalPrompt += '\n';
  }

  const wantsGraph = /\b(graph|chart|plot|visual|diagram|visualize)\b/i.test(userPrompt);
  if (wantsGraph) {
    finalPrompt += '\n\n**IMPORTANT:** If the user is asking for a graph, chart, or visualization: Provide a brief text explanation first, then END your response with exactly one line:\nGRAPH_DATA: {"chartType":"bar","title":"Your Title","labels":["Label1","Label2","Label3"],"series":[{"name":"Data","values":[10,20,15]}]}\n\nNever include markdown backticks or other text after GRAPH_DATA. Use simple numeric values.';
  }

  // 2. Format conversation history
  if (history && history.length > 0) {
    finalPrompt += "Conversation history:\n";
    history.forEach((msg) => {
      const roleName = msg.role === 'user' ? 'User' : 'Assistant';
      finalPrompt += `${roleName}: ${msg.content}\n`;
    });
    // Add current prompt
    finalPrompt += `User: ${userPrompt}\nAssistant:`;
  } else {
    finalPrompt += `User: ${userPrompt}\nAssistant:`;
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
    if (
      shouldUseAudioTranscriptFlow(userPrompt, audioFiles) &&
      usableDocuments.length === 0 &&
      (!images || images.length === 0)
    ) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      if (supportsNativeAudio(selectedModel)) {
        try {
          const audioResponse = await generateOllamaAudioText({
            targetUrl,
            model: selectedModel,
            systemPrompt,
            temperature,
            prompt:
              `${userPrompt}\n\n` +
              `Use the attached audio file(s) directly. For ASR, produce a transcript. ` +
              `For translation, include the translated text. For summarization, summarize the spoken content.`,
            audioFiles
          });

          res.write(JSON.stringify({ response: audioResponse.trim() }) + '\n');
          res.end();
          return;
        } catch (error) {
          console.warn('[audio] Native Ollama audio request failed:', error.message);
          res.write(JSON.stringify({
            response:
              `The selected model (${selectedModel}) is treated as audio-capable, but this Ollama server did not accept the native audio request. ` +
              `I could not transcribe the attached audio through Ollama. Details: ${error.message}`
          }) + '\n');
          res.end();
          return;
        }
      }

      res.write(JSON.stringify({
        response:
          `Audio was attached, but the selected model (${selectedModel}) is not enabled for native audio in this app. ` +
          `Switch to a Gemma audio-capable tag such as gemma4:2b/E2B, gemma4:4b/E4B, or gemma4:12b, then ask for transcription or translation again.`
      }) + '\n');
      res.end();
      return;
    }

    if (
      shouldUseDocumentSummaryFlow(userPrompt, usableDocuments) &&
      (!images || images.length === 0)
    ) {
      const summary = await summarizeDocuments({
        targetUrl,
        model: selectedModel,
        systemPrompt,
        temperature,
        userPrompt,
        documents: usableDocuments
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(JSON.stringify({ response: summary.trim() }) + '\n');

      if (searchResults.length > 0) {
        const metaLine = JSON.stringify({ __meta: true, searchResults }) + '\n';
        res.write(metaLine);
      }

      res.end();
      return;
    }

    const ollamaPayload = {
      model: selectedModel,
      prompt: finalPrompt,
      system: systemPrompt || undefined,
      images: cleanedImages,
      options: {
        temperature: temperature !== undefined ? parseFloat(temperature) : 0.7,
        num_ctx: 8192,
        num_predict: 900
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

    // After the stream, emit a special metadata event with search sources
    if (searchResults.length > 0) {
      const metaLine = JSON.stringify({ __meta: true, searchResults }) + '\n';
      res.write(metaLine);
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
