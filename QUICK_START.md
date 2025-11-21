# 🚀 Quick Start - RAG Chatbot Demo

> **Goal:** Get the chatbot running locally in 5 minutes

---

## Prerequisites Check ✅

Before starting, ensure you have:

- [x] **Node.js** installed (v18+) - `node --version`
- [x] **Python** installed (v3.8+) - `python --version`
- [x] **Internet connection** (for MongoDB Atlas & Gemini API)

---

## 3-Step Quick Start

### Step 1: Install Dependencies

```bash
cd simple-chatbot
npm install
```

**Expected output:**
```
added 150+ packages
```

---

### Step 2: Start ChromaDB

**Open Terminal 1:**

```bash
# Install ChromaDB (first time only)
pip install chromadb

# Start ChromaDB server
chroma run --host localhost --port 8000
```

**Expected output:**
```
Running Chroma on http://localhost:8000
```

**✅ Keep this terminal running**

---

### Step 3: Start Application

**Open Terminal 2:**

```bash
npm start
```

**Expected output:**
```
MongoDB Connected: shree1-chatbot.kzq2ow2.mongodb.net
Supabase not configured, using local storage
Demo server listening on 3000
```

**✅ Keep this terminal running**

---

## Open in Browser

Navigate to: **http://localhost:3000**

You should see the chatbot interface! 🎉

---

## Quick Test

### 1. Test Basic Chat

- Type: "Hello, who are you?"
- Press **Send**
- Bot should respond

### 2. Test Document Upload

- Create a simple text file: `test.txt`
  ```
  This is a test document about cats.
  Cats are friendly animals that like to sleep.
  ```
- Click **Choose File** → Select `test.txt`
- Click **Upload**
- Wait for: "✅ Upload Results: processed"
- Ask: "What animals are mentioned in the document?"
- Bot should mention cats

### 3. Test New Conversation

- Click **"+ New Chat"**
- Type a message
- Previous chat is preserved in sidebar

---

## Troubleshooting

### Problem: "Cannot find module"
**Solution:**
```bash
npm install
```

### Problem: "ChromaDB connection refused"
**Solution:**
```bash
# Start ChromaDB in Terminal 1
chroma run --host localhost --port 8000
```

### Problem: "Port 3000 already in use"
**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Problem: "MongoDB connection failed"
**Solution:**
- Check internet connection
- MongoDB Atlas credentials are already configured

---

## What's Configured

✅ **MongoDB Atlas** - Cloud database (already configured)
✅ **Google Gemini API** - AI responses (already configured)
✅ **ChromaDB** - Vector database (runs locally)
✅ **CORS** - Locked to localhost origins
✅ **Dynamic URLs** - Works on any port
✅ **Supabase** - Optional (disabled by default)

---

## Optional: Enable Supabase Storage

If you want to store files in the cloud:

1. Create account at https://supabase.com (free)
2. Create new project
3. Get credentials from dashboard
4. Update `.env`:
   ```env
   USE_SUPABASE_STORAGE=true
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_key_here
   SUPABASE_BUCKET=chatbot-uploads
   ```
5. Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for bucket creation
6. Restart: `npm start`

---

## Architecture Overview

```
Browser (http://localhost:3000)
    ↓
Node.js Server (Express + Socket.io)
    ↓
├─→ MongoDB Atlas (Conversations & Users)
├─→ ChromaDB (Vector Embeddings)
├─→ Google Gemini API (AI Responses)
└─→ Supabase Storage (Optional - File Uploads)
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Vanilla HTML/CSS/JavaScript + Socket.io |
| **Backend** | Node.js + Express.js |
| **Real-time** | Socket.io |
| **Database** | MongoDB Atlas |
| **Vector DB** | ChromaDB |
| **AI/LLM** | Google Gemini 2.5 Flash |
| **Storage** | Local files OR Supabase (optional) |
| **Sessions** | express-session + connect-mongo |

---

## File Structure

```
simple-chatbot/
├── server.js           ← Main application
├── index.html          ← Frontend UI
├── package.json        ← Dependencies
├── .env               ← Configuration (already set)
├── .env.example       ← Template for new setup
├── config/
│   ├── database.js    ← MongoDB connection
│   └── supabase.js    ← Supabase client (optional)
├── models/
│   ├── User.js        ← User schema
│   └── Conversation.js ← Conversation schema
├── uploads/           ← Temporary file storage
└── Documentation/
    ├── LOCAL_DEPLOYMENT_GUIDE.md      ← Detailed setup
    ├── SUPABASE_SETUP.md              ← Supabase guide
    ├── PRODUCTION_READINESS_CHECKLIST.md
    └── DEPLOYMENT_OPTIONS.md
```

---

## Key Features

✨ **Real-time Chat** - Instant messaging with Socket.io
📄 **RAG (Document Q&A)** - Upload PDFs/TXT and ask questions
💾 **Persistent History** - All conversations saved
🔀 **Multi-Session** - Create unlimited chat sessions
☁️ **Cloud Storage** - Optional Supabase integration
🤖 **AI-Powered** - Google Gemini API for responses

---

## Environment Variables

Current configuration in `.env`:

```env
# Already configured - no changes needed for demo
PORT=3000
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=AIza...
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Optional - enable Supabase
USE_SUPABASE_STORAGE=false
```

---

## Next Steps

### For Demo:
✅ You're ready! Start chatting and uploading documents

### For Supabase:
📖 Read [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### For Production:
📋 Review [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md)
☁️ Choose platform from [DEPLOYMENT_OPTIONS.md](./DEPLOYMENT_OPTIONS.md)

---

## Useful Commands

```bash
# Start application
npm start

# Install dependencies
npm install

# Start ChromaDB
chroma run --host localhost --port 8000

# Check if ports are in use (Windows)
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Check if ports are in use (Mac/Linux)
lsof -i :3000
lsof -i :8000

# Stop Node.js
Ctrl+C (in Terminal 2)

# Stop ChromaDB
Ctrl+C (in Terminal 1)
```

---

## Support

- **Detailed Setup:** [LOCAL_DEPLOYMENT_GUIDE.md](./LOCAL_DEPLOYMENT_GUIDE.md)
- **Supabase Guide:** [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Troubleshooting:** See LOCAL_DEPLOYMENT_GUIDE.md section
- **Production:** [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md)

---

## Demo Tips

### Good Test Documents:
- Product manuals (PDF)
- Company policies (TXT)
- Technical documentation (PDF)
- FAQs (TXT)

### Avoid:
- Files > 5MB (slow processing)
- Scanned PDFs (no text layer)
- Image-heavy documents

### Demo Flow:
1. Show basic chat → AI responds
2. Upload document → Show processing
3. Ask about document → Show RAG working
4. Create new chat → Show multi-session
5. Switch chats → Show persistence

---

## Status Indicators

When running correctly, you should see:

**Terminal 1 (ChromaDB):**
```
Running Chroma on http://localhost:8000
```

**Terminal 2 (Node.js):**
```
MongoDB Connected: shree1-chatbot.kzq2ow2.mongodb.net
Supabase not configured, using local storage
Demo server listening on 3000
```

**Browser:**
- Chat interface loads
- "RAG Chatbot" title visible
- Sidebar shows "Chat Sessions"
- Input field ready

---

## Configuration Summary

| Setting | Value | Configurable |
|---------|-------|--------------|
| **Port** | 3000 | Yes (`.env`) |
| **MongoDB** | Atlas Cloud | Yes (`.env`) |
| **ChromaDB** | localhost:8000 | Yes (`.env`) |
| **Gemini API** | Configured | Yes (`.env`) |
| **CORS** | localhost only | Yes (`.env`) |
| **Supabase** | Disabled | Yes (`.env`) |
| **Storage** | Local files | Yes (`.env`) |

---

**🎉 You're all set! Happy chatting!**

For detailed documentation, see [LOCAL_DEPLOYMENT_GUIDE.md](./LOCAL_DEPLOYMENT_GUIDE.md)
