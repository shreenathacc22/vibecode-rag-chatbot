// Minimal Node.js + Express + Socket.io example
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// MongoDB connection
const connectDB = require('./config/database');
const User = require('./models/User');
const Conversation = require('./models/Conversation');

// Supabase integration (optional)
let supabase = null;
let useSupabaseStorage = false;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    const supabaseConfig = require('./config/supabase');
    supabase = supabaseConfig.supabase;
    useSupabaseStorage = process.env.USE_SUPABASE_STORAGE === 'true';
    console.log('Supabase integration enabled');
  }
} catch (err) {
  console.log('Supabase not configured, using local storage');
}

// Vector DB integration (ChromaDB) - Using HTTP API directly
const CHROMA_HOST = process.env.CHROMA_HOST || 'localhost';
const CHROMA_PORT = parseInt(process.env.CHROMA_PORT || '8000', 10);

// Construct ChromaDB URL based on environment
let CHROMA_URL;
if (process.env.NODE_ENV === 'production') {
  // In production, if CHROMA_HOST doesn't include a protocol, add https://
  if (CHROMA_HOST.startsWith('http://') || CHROMA_HOST.startsWith('https://')) {
    CHROMA_URL = `${CHROMA_HOST}/api/v2`;
  } else {
    CHROMA_URL = `https://${CHROMA_HOST}.onrender.com/api/v2`;
  }
} else {
  CHROMA_URL = `http://${CHROMA_HOST}:${CHROMA_PORT}/api/v2`;
}

console.log(`ChromaDB URL: ${CHROMA_URL}`);

// ChromaDB HTTP API wrapper
const chroma = {
  async heartbeat() {
    const response = await axios.get(`${CHROMA_URL}/heartbeat`, { timeout: 5000 });
    return response.data;
  },
  async deleteCollection({ name }) {
    try {
      await axios.delete(`${CHROMA_URL}/collections/${name}`, { timeout: 10000 });
    } catch (error) {
      if (error.response?.status !== 404) throw error;
    }
  },
  async createCollection({ name }) {
    const response = await axios.post(`${CHROMA_URL}/collections`, {
      name,
      metadata: {}
    }, { timeout: 10000 });
    const collectionId = response.data.id;
    return {
      id: collectionId,
      name,
      async add({ ids, documents, embeddings }) {
        await axios.post(`${CHROMA_URL}/collections/${collectionId}/add`, {
          ids,
          documents,
          embeddings
        }, { timeout: 30000 });
      },
      async query({ queryEmbeddings, nResults }) {
        const response = await axios.post(`${CHROMA_URL}/collections/${collectionId}/query`, {
          query_embeddings: queryEmbeddings,
          n_results: nResults
        }, { timeout: 30000 });
        return response.data;
      }
    };
  },
  async getCollection({ name }) {
    const response = await axios.get(`${CHROMA_URL}/collections/${name}`, { timeout: 10000 });
    const collectionId = response.data.id;
    return {
      id: collectionId,
      name,
      async query({ queryEmbeddings, nResults }) {
        const response = await axios.post(`${CHROMA_URL}/collections/${collectionId}/query`, {
          query_embeddings: queryEmbeddings,
          n_results: nResults
        }, { timeout: 30000 });
        return response.data;
      }
    };
  }
};

// Helper: Get collection name for a conversation
function getCollectionName(convoId) {
  return `rag_${convoId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

// Connect to MongoDB
connectDB();

const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from current directory

// Session configuration with MongoDB store
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'chatbot-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot',
    touchAfter: 24 * 3600 // lazy session update (in seconds)
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
});

app.use(sessionMiddleware);

const upload = multer({ dest: 'uploads/' });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Share session between Express and Socket.io
io.engine.use(sessionMiddleware);

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Helper: chunk text into paragraphs (simple)
function chunkText(text, chunkSize = 500) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}

// Helper: real Gemini embedding API
async function embedText(text) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${GEMINI_API_KEY}`,
      {
        content: { parts: [{ text }] }
      }
    );
    // Gemini returns embedding in res.data.embedding.values
    return res.data.embedding?.values || [];
  } catch (err) {
    console.error('Gemini embedding API error:', err.message);
    throw new Error('Failed to generate embedding: ' + err.message);
  }
}

app.get('/health', async (req, res) => {
  const health = { ok: true, services: {} };

  // Test MongoDB
  try {
    health.services.mongodb = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  } catch (e) {
    health.services.mongodb = 'error';
  }

  // Test ChromaDB
  try {
    await chroma.heartbeat();
    health.services.chromadb = 'connected';
  } catch (e) {
    health.services.chromadb = `error: ${e.message}`;
    health.ok = false;
  }

  res.json(health);
});

// Get all conversations for a user
app.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = await Conversation.find({ userId })
      .select('convoId messages documentContext createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50);

    const conversationList = conversations.map(conv => ({
      convoId: conv.convoId,
      messageCount: conv.messages.length,
      lastMessage: conv.messages[conv.messages.length - 1]?.message || 'No messages',
      lastMessageTime: conv.updatedAt,
      createdAt: conv.createdAt,
      hasDocuments: conv.documentContext?.files?.length > 0
    }));

    res.json({ conversations: conversationList });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Helper: Upload file to Supabase Storage
async function uploadToSupabaseStorage(file, userId, convoId) {
  if (!supabase || !useSupabaseStorage) return null;

  try {
    const fileName = `${userId}/${convoId}/${Date.now()}-${file.originalname}`;
    const fileBuffer = fs.readFileSync(file.path);

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET || 'chatbot-uploads')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET || 'chatbot-uploads')
      .getPublicUrl(fileName);

    return { path: data.path, url: urlData.publicUrl };
  } catch (err) {
    console.error('Supabase storage upload error:', err.message);
    return null;
  }
}

// Enhanced document upload: chunk, embed, index in ChromaDB (per conversation)
app.post('/upload', upload.array('files'), async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded.' });
  const userId = req.body.userId || 'default';
  const convoId = req.body.convoId || 'default-convo';
  let results = [];

  try {
    // Get collection name for this specific conversation
    const collectionName = getCollectionName(convoId);

    // Delete and recreate collection for THIS conversation only
    try {
      await chroma.deleteCollection({ name: collectionName });
    } catch (e) {
      // Collection might not exist, that's fine
    }

    // Clear message history for THIS conversation only
    await Conversation.updateOne(
      { convoId },
      {
        messages: [],
        'documentContext.lastUpload': new Date()
      }
    );

    // Notify clients in THIS conversation to clear their chat display
    io.to(convoId).emit('clear_history');

    // Create collection for this conversation
    let collection = await chroma.createCollection({
      name: collectionName
    });

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      let text = '';
      let supabaseUrl = null;

      try {
        // Upload to Supabase Storage if enabled
        if (useSupabaseStorage) {
          const uploadResult = await uploadToSupabaseStorage(file, userId, convoId);
          if (uploadResult) {
            supabaseUrl = uploadResult.url;
            console.log(`File uploaded to Supabase: ${supabaseUrl}`);
          }
        }

        if (ext === '.pdf') {
          const dataBuffer = fs.readFileSync(file.path);
          const parser = new PDFParse({ data: dataBuffer });
          const pdfData = await parser.getText();
          await parser.destroy();
          text = pdfData.text;
        } else if (ext === '.txt') {
          text = fs.readFileSync(file.path, 'utf8');
        } else {
          results.push({ file: file.originalname, status: 'unsupported format' });
          continue;
        }

        // Chunk and embed
        const chunks = chunkText(text);
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = await embedText(chunk);
          // Store in ChromaDB
          await collection.add({
            ids: [`${userId}-${file.originalname}-${i}-${Date.now()}`],
            embeddings: [embedding],
            metadatas: [{ userId, file: file.originalname, chunkIdx: i, supabaseUrl }],
            documents: [chunk]
          });
        }

        // Update THIS conversation's document context
        await Conversation.updateOne(
          { convoId },
          {
            $push: {
              'documentContext.files': {
                filename: file.originalname,
                uploadedAt: new Date(),
                chunks: chunks.length,
                words: text.split(/\s+/).length,
                supabaseUrl
              }
            },
            'documentContext.lastUpload': new Date()
          },
          { upsert: true }
        );

        results.push({
          file: file.originalname,
          status: 'processed',
          words: text.split(/\s+/).length,
          chunks: chunks.length,
          supabaseUrl
        });
      } catch (err) {
        results.push({ file: file.originalname, status: 'error', error: err.message });
      }

      // Clean up uploaded file from local disk
      fs.unlinkSync(file.path);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Processing error: ' + err.message });
  }

  res.json({ results });
});

io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);

  // Get or create session user
  const sessionId = socket.request.session?.id || socket.id;

  socket.on('join', async ({ convoId, user }) => {
    try {
      socket.join(convoId);

      // Create or update user
      const userId = user || sessionId;
      let userDoc = await User.findOne({ userId });
      if (!userDoc) {
        userDoc = await User.create({
          userId,
          username: user || 'Guest User',
          socketId: socket.id
        });
      } else {
        userDoc.socketId = socket.id;
        await userDoc.updateActivity();
      }

      // Get or create conversation
      let conversation = await Conversation.findOne({ convoId });
      if (!conversation) {
        conversation = await Conversation.create({
          convoId,
          userId,
          messages: []
        });
      }

      // Send conversation history
      socket.emit('history', conversation.messages);
      console.log(`User ${userId} joined conversation ${convoId}`);
    } catch (error) {
      console.error('Join error:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  socket.on('send_message', async ({ convoId, message, sender }) => {
    try {
      const msg = {
        id: Date.now(),
        sender,
        message,
        ts: new Date().toISOString(),
        metadata: { ragContext: false, chunks: 0 }
      };

      // Save message to database
      let conversation = await Conversation.findOne({ convoId });
      if (!conversation) {
        const userId = socket.request.session?.id || socket.id;
        conversation = await Conversation.create({
          convoId,
          userId,
          messages: [msg]
        });
      } else {
        await conversation.addMessage(msg);
      }

      io.to(convoId).emit('new_message', msg);

      // Gemini AI response for bot
      if (sender === 'user') {
        try {
          // RAG: Retrieve relevant chunks from THIS conversation's ChromaDB collection
          let context = '';
          try {
            const queryEmbedding = await embedText(message);
            const collectionName = getCollectionName(convoId);
            let collection = await chroma.getCollection({
              name: collectionName
            });
            // Query ChromaDB for top-k chunks
            const results = await collection.query({
              queryEmbeddings: [queryEmbedding],
              nResults: 3
            });
            const topChunks = results.documents?.[0] || [];
            if (topChunks.length > 0) {
              context = topChunks.join('\n\n');
              msg.metadata.ragContext = true;
              msg.metadata.chunks = topChunks.length;
            }
          } catch (err) {
            // fallback: no context
            console.error('RAG retrieval error:', err.message);
          }

          const prompt = context
            ? `Use the following context to answer the question.\n\nContext:\n${context}\n\nQuestion: ${message}`
            : message;

          const geminiRes = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              contents: [{ role: 'user', parts: [{ text: prompt }] }]
            }
          );
          const botReply = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
          const botMsg = {
            id: Date.now()+1,
            sender: 'bot',
            message: botReply,
            ts: new Date().toISOString(),
            metadata: msg.metadata
          };

          // Save bot message to database
          await conversation.addMessage(botMsg);
          io.to(convoId).emit('new_message', botMsg);
        } catch (err) {
          console.error('Bot response error:', err.message);
          const botMsg = {
            id: Date.now()+1,
            sender: 'bot',
            message: "Sorry, I'm having trouble responding right now.",
            ts: new Date().toISOString(),
            metadata: { ragContext: false, chunks: 0 }
          };

          // Save error message to database
          await conversation.addMessage(botMsg);
          io.to(convoId).emit('new_message', botMsg);
        }
      }
    } catch (error) {
      console.error('Message error:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => console.log(`Demo server listening on ${PORT}`));
