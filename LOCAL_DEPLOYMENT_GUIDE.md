# Local Deployment Guide - RAG Chatbot Demo

> **Purpose:** This guide is for setting up and running the RAG Chatbot application locally for demo purposes.
> **Last Updated:** 2025-11-21
> **Version:** 2.0.0

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Configuration Options](#configuration-options)
5. [Supabase Integration (Optional)](#supabase-integration-optional)
6. [Running the Application](#running-the-application)
7. [Testing the Demo](#testing-the-demo)
8. [Troubleshooting](#troubleshooting)
9. [Demo Features](#demo-features)

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **MongoDB Atlas Account** (Free tier)
   - Sign up: https://www.mongodb.com/cloud/atlas
   - Already configured in this project

3. **Python 3.x** (for ChromaDB)
   - Download: https://www.python.org/
   - Verify: `python --version`

4. **Google Gemini API Key**
   - Get free API key: https://makersuite.google.com/app/apikey
   - Already configured in this project

### Optional (for Supabase)

5. **Supabase Account** (Free tier)
   - Sign up: https://supabase.com
   - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for details

---

## Quick Start

### 1. Clone/Open Project

```bash
cd simple-chatbot
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Express.js (web server)
- Socket.io (real-time chat)
- MongoDB drivers (database)
- ChromaDB client (vector database)
- Supabase client (optional cloud storage)
- PDF parser & other utilities

### 3. Start ChromaDB

**Terminal 1:**
```bash
# Install ChromaDB
pip install chromadb

# Run ChromaDB server
chroma run --host localhost --port 8000
```

Keep this terminal running.

### 4. Start the Application

**Terminal 2:**
```bash
npm start
```

### 5. Open in Browser

Navigate to: **http://localhost:3000**

---

## Detailed Setup

### Step 1: Environment Configuration

The project already has a `.env` file configured. If you need to modify it:

```bash
# Copy example file (optional)
cp .env.example .env
```

**Current Configuration (.env):**
```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB Atlas (Already Configured)
MONGODB_URI=mongodb+srv://shreenathacc22_db_user:QLjpncuj57XC1Rbj@shree1-chatbot.kzq2ow2.mongodb.net/chatbot

# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Google Gemini API (Already Configured)
GEMINI_API_KEY=AIzaSyBlwAFLq4P_FiHpl1nYqvBx6wRHbKSgjMs

# Session
SESSION_SECRET=chatbot-secret-key-change-in-production

# CORS (Allows local access)
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Supabase (Optional - See SUPABASE_SETUP.md)
USE_SUPABASE_STORAGE=false
```

### Step 2: Verify MongoDB Connection

MongoDB Atlas is already configured. The application will connect automatically on startup.

**You should see:**
```
MongoDB Connected: shree1-chatbot.kzq2ow2.mongodb.net
```

### Step 3: Start ChromaDB

ChromaDB is required for the RAG (Retrieval-Augmented Generation) feature.

**Install ChromaDB:**
```bash
pip install chromadb chromadb-default-embed
```

**Run ChromaDB:**
```bash
chroma run --host localhost --port 8000
```

**Verify it's running:**
- Open http://localhost:8000 in browser
- You should see ChromaDB API response

### Step 4: Start the Application

```bash
npm start
```

**You should see:**
```
MongoDB Connected: shree1-chatbot.kzq2ow2.mongodb.net
Supabase not configured, using local storage
Demo server listening on 3000
```

---

## Configuration Options

### Option 1: MongoDB Atlas Only (Default)
- Uses cloud MongoDB for data storage
- Uses local file system for uploads
- **Status:** ✅ Already configured

### Option 2: MongoDB + Supabase Storage
- Uses cloud MongoDB for data storage
- Uses Supabase for file uploads
- **Setup:** See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Enable:** Set `USE_SUPABASE_STORAGE=true` in `.env`

### Option 3: Local MongoDB (Advanced)
- Install MongoDB locally
- Update `MONGODB_URI` to `mongodb://localhost:27017/chatbot`
- Not recommended for demo

---

## Supabase Integration (Optional)

### Why Use Supabase?

1. **Cloud File Storage** - Files stored in cloud instead of local disk
2. **CDN Delivery** - Fast file access with global CDN
3. **Automatic Backups** - Files are backed up automatically
4. **Easy Sharing** - Public URLs for uploaded documents

### Enable Supabase Storage

1. **Follow setup guide:**
   ```bash
   # See detailed instructions
   cat SUPABASE_SETUP.md
   ```

2. **Get Supabase credentials:**
   - Create project at https://supabase.com
   - Get URL and anon key from dashboard

3. **Update .env:**
   ```env
   USE_SUPABASE_STORAGE=true
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_BUCKET=chatbot-uploads
   ```

4. **Restart application:**
   ```bash
   npm start
   ```

**With Supabase enabled, you'll see:**
```
Supabase integration enabled
```

---

## Running the Application

### Start Sequence

1. **Terminal 1: ChromaDB**
   ```bash
   chroma run --host localhost --port 8000
   ```

2. **Terminal 2: Application**
   ```bash
   npm start
   ```

3. **Browser: Open Application**
   ```
   http://localhost:3000
   ```

### Stopping the Application

- **Stop Node.js:** Press `Ctrl+C` in Terminal 2
- **Stop ChromaDB:** Press `Ctrl+C` in Terminal 1

### Restarting

```bash
# In Terminal 2
npm start
```

MongoDB Atlas and Supabase (if enabled) don't need restarting as they're cloud services.

---

## Testing the Demo

### Test 1: Basic Chat

1. Open http://localhost:3000
2. Type a message: "Hello, who are you?"
3. Press **Send**
4. Bot should respond using Gemini AI

**Expected:**
- User message appears on right (blue)
- Bot response appears on left (white)
- Timestamp shown below each message

### Test 2: Multiple Conversations

1. Click **"+ New Chat"** button
2. Send a message
3. Click **"+ New Chat"** again
4. Send a different message
5. Click on first conversation in sidebar
6. You should see previous messages

**Expected:**
- Conversations persist
- Can switch between conversations
- Message history loads correctly

### Test 3: Document Upload (RAG)

1. Download a sample PDF or create a .txt file
2. Click **"Upload"** under document section
3. Select your file
4. Wait for processing (should show chunks count)
5. Ask a question about the document

**Example:**
- Upload: product_manual.pdf
- Ask: "What is the warranty period?"
- Bot should answer using document context

**Expected:**
- Upload status shows: "✅ Upload Results: processed (X words, Y chunks)"
- Message shows: "🔍 RAG: 3 chunks" indicator
- Response is based on document content

**With Supabase Enabled:**
- File URL will be shown in upload results
- Files accessible at: `https://your-project.supabase.co/storage/v1/object/public/...`

### Test 4: Session Persistence

1. Chat with bot
2. Upload a document
3. Close browser
4. Reopen http://localhost:3000
5. Click on previous conversation

**Expected:**
- Previous conversations still visible
- Can continue chatting
- Documents still indexed (can ask questions)

---

## Demo Features

### ✅ Features Included

1. **Real-time Chat**
   - Socket.io powered instant messaging
   - No page refresh needed
   - Typing indicators (bot is thinking)

2. **RAG (Retrieval-Augmented Generation)**
   - Upload PDF or TXT files
   - Automatic text extraction
   - Semantic chunking (500 words per chunk)
   - Vector embedding using Gemini API
   - Similarity search using ChromaDB
   - Context-aware responses

3. **Multi-Conversation Support**
   - Create unlimited chat sessions
   - Each conversation isolated
   - Documents scoped to conversation
   - Sidebar shows all conversations

4. **Persistent Storage**
   - MongoDB Atlas for conversations
   - Automatic message history
   - User sessions saved
   - Document metadata stored

5. **Cloud Storage (Optional)**
   - Supabase file storage
   - CDN-delivered files
   - Public URLs for sharing

6. **Modern UI**
   - Clean, professional interface
   - Mobile-responsive design
   - Chat bubbles with timestamps
   - Upload progress indicators
   - Conversation preview

### 🚧 Demo Limitations

1. **No Authentication** - Anyone can access
2. **Single User Mode** - "demo-user" only
3. **No Message Editing** - Can't edit/delete messages
4. **No File Size Limits** - Could cause issues with large files
5. **No Rate Limiting** - Could exceed Gemini API limits

---

## Troubleshooting

### Issue 1: "Cannot connect to ChromaDB"

**Symptoms:**
```
ChromaDB error: connect ECONNREFUSED 127.0.0.1:8000
```

**Solutions:**
1. Start ChromaDB:
   ```bash
   chroma run --host localhost --port 8000
   ```

2. Verify it's running:
   ```bash
   curl http://localhost:8000
   ```

3. Check if port 8000 is available:
   ```bash
   # Windows
   netstat -ano | findstr :8000

   # Mac/Linux
   lsof -i :8000
   ```

### Issue 2: "MongoDB connection failed"

**Symptoms:**
```
MongoDB Connection Error: connect ETIMEDOUT
```

**Solutions:**
1. Check internet connection
2. Verify MongoDB Atlas is accessible
3. Check if IP is whitelisted in MongoDB Atlas:
   - Go to MongoDB Atlas dashboard
   - Network Access → Add IP Address
   - Add current IP or use 0.0.0.0/0 (allow all)

### Issue 3: "Gemini API error"

**Symptoms:**
```
Gemini embedding API error: 429 Resource Exhausted
```

**Solutions:**
1. You've exceeded free tier limits (15 requests/minute)
2. Wait 1 minute and try again
3. Upgrade to paid Gemini API tier
4. Reduce number of chunks per document

### Issue 4: "Module not found"

**Symptoms:**
```
Error: Cannot find module '@supabase/supabase-js'
```

**Solutions:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue 5: "Port 3000 already in use"

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

**Option A: Kill process on port 3000**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

**Option B: Use different port**
```bash
# In .env
PORT=3001

# Restart app
npm start
```

### Issue 6: "Upload failing"

**Symptoms:**
- Upload button does nothing
- Error 400 or 500 on upload

**Solutions:**
1. Check file format (only PDF and TXT supported)
2. Check file size (large files may timeout)
3. Ensure `uploads/` directory exists:
   ```bash
   mkdir uploads
   ```
4. Check ChromaDB is running
5. Check Gemini API key is valid

### Issue 7: "Supabase upload fails"

**Symptoms:**
```
Supabase storage upload error: Invalid JWT
```

**Solutions:**
1. Verify Supabase credentials in `.env`
2. Check bucket exists in Supabase dashboard
3. Verify bucket policies allow uploads
4. Disable Supabase: `USE_SUPABASE_STORAGE=false`

---

## Advanced Configuration

### Custom Port

```env
# .env
PORT=8080
```

```bash
npm start
# Open http://localhost:8080
```

### Custom ChromaDB Location

```env
# .env
CHROMA_HOST=192.168.1.100
CHROMA_PORT=9000
```

### Multiple Origins (CORS)

```env
# .env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,http://192.168.1.100:3000
```

### Enable Debug Logging

```env
# .env
NODE_ENV=development
DEBUG=*
```

---

## Demo Scripts

### Quick Demo Reset

Reset all data for fresh demo:

```bash
# Warning: This deletes all conversations and uploads!

# Stop the app
# Delete MongoDB data (use Atlas dashboard or)
mongo
use chatbot
db.conversations.deleteMany({})
db.users.deleteMany({})

# Delete ChromaDB data
rm -rf chroma/

# Delete uploaded files
rm -rf uploads/*

# Restart app
npm start
```

### Sample Data Generator

Create sample conversations for demo:

```bash
# Coming soon: sample-data-generator.js
node scripts/generate-demo-data.js
```

---

## Performance Tips

1. **Chunk Size:** Default 500 words. Reduce for faster processing:
   ```javascript
   // server.js line 79
   function chunkText(text, chunkSize = 300) // Changed from 500
   ```

2. **Limit Conversations:** Show only recent 10 in sidebar:
   ```javascript
   // server.js line 126
   .limit(10) // Changed from 50
   ```

3. **Cache Embeddings:** Reuse embeddings for same text (advanced)

---

## Security Notes for Demo

⚠️ **This configuration is for LOCAL DEMO ONLY**

- API keys are exposed in `.env` (for ease of demo)
- No authentication required
- CORS allows all local origins
- No rate limiting
- No file size limits

**For production deployment, see:**
- [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md)
- [DEPLOYMENT_OPTIONS.md](./DEPLOYMENT_OPTIONS.md)

---

## Demo Presentation Tips

1. **Start with basic chat** - Show AI responses
2. **Upload a document** - Explain RAG concept
3. **Ask document questions** - Show context retrieval
4. **Create new conversation** - Show multi-session
5. **Switch conversations** - Show persistence
6. **Show Supabase storage** - If enabled, show file URLs

### Sample Documents for Demo

Good demo documents:
- Product manuals (PDF)
- Company policies (TXT)
- FAQs (TXT)
- Technical specifications (PDF)

Avoid:
- Very large files (>5MB)
- Scanned PDFs (no text layer)
- Complex tables/images

---

## Resources

- **Project Documentation:**
  - [README.md](./README.md) - Main documentation
  - [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase guide
  - [MONGODB_SETUP.md](./MONGODB_SETUP.md) - MongoDB guide

- **Technologies:**
  - Node.js: https://nodejs.org/docs
  - Socket.io: https://socket.io/docs
  - ChromaDB: https://docs.trychroma.com
  - Supabase: https://supabase.com/docs
  - Gemini API: https://ai.google.dev/docs

- **Support:**
  - GitHub Issues: [Create Issue]
  - Email: support@example.com

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Start ChromaDB
chroma run --host localhost --port 8000

# Start application
npm start

# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# View logs (if running in background)
tail -f logs/app.log

# Check Node.js version
node --version

# Check npm version
npm --version

# Check Python version
python --version

# Test MongoDB connection
mongosh "mongodb+srv://cluster.mongodb.net/chatbot"

# Test Supabase connection (if configured)
curl -H "apikey: YOUR_KEY" https://your-project.supabase.co/rest/v1/
```

---

**Happy Demoing! 🚀**

For questions or issues, refer to [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or create a GitHub issue.
