# RAG-Enabled Chatbot with ChromaDB

A real-time chatbot with Retrieval Augmented Generation (RAG) capabilities, powered by Google Gemini AI and ChromaDB vector database.

## Features

- **Real-time Chat** - Socket.io powered instant messaging
- **RAG (Retrieval Augmented Generation)** - Upload documents and chat about their content
- **Vector Search** - ChromaDB for semantic document retrieval
- **AI-Powered** - Google Gemini 2.5 Flash model for intelligent responses
- **Document Support** - PDF and TXT file uploads
- **Embeddings** - Google Gemini embedding-001 model for vector generation
- **Auto-Clear on Upload** - Chat history automatically clears when new documents are uploaded

## Architecture

### Tech Stack
- **Backend**: Node.js + Express
- **Real-time**: Socket.io
- **Vector DB**: ChromaDB
- **AI Model**: Google Gemini 2.5 Flash (free tier)
- **Embeddings**: Google Gemini embedding-001
- **File Upload**: Multer
- **PDF Parsing**: pdf-parse

### Key Components
1. **Document Upload** - Processes PDF/TXT files, chunks text, generates embeddings
2. **Vector Storage** - Stores document chunks with embeddings in ChromaDB
3. **Semantic Search** - Retrieves relevant chunks based on query similarity
4. **Context-Aware Responses** - Gemini generates answers using retrieved context

## Quick Start

### Prerequisites
- Node.js installed
- Python 3.x installed (for ChromaDB)
- Google Gemini API key

### 1. Install Dependencies

```powershell
npm install
```

### 2. Set Up Environment

Create a `.env` file in the `simple-chatbot` directory:

```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Start ChromaDB Server

In a new terminal:

```powershell
chroma run --host localhost --port 8000
```

### 4. Start Node.js Server

```powershell
node server.js
```

The server will start on port 3000.

### 5. Open the Chat Interface

Open your browser and navigate to:
```
http://localhost:3000/index.html
```

## How to Use

### Upload Documents
1. Click "Choose Files" button
2. Select PDF or TXT files
3. Click "Upload"
4. Wait for "processed" status with word and chunk counts
5. **Note**: Uploading new documents automatically clears the chat history

### Chat with RAG
1. Type your question in the message box
2. Click "Send" or press Enter
3. The bot will:
   - Search ChromaDB for relevant document chunks
   - Use Gemini 2.5 Flash to generate context-aware responses
   - Provide answers based on your uploaded documents

### Example Workflow
```
1. Upload: "product_manual.pdf" → processed (1500 words, 3 chunks)
2. Ask: "What are the warranty terms?"
3. Bot: Retrieves relevant chunks and answers based on the manual
```

## API Endpoints

### Health Check
```
GET /health
```
Returns: `{ "ok": true }`

### Upload Documents
```
POST /upload
Content-Type: multipart/form-data

Form Data:
- files: Array of PDF/TXT files
- userId: User identifier (optional, defaults to "default")
```

Returns:
```json
{
  "results": [
    {
      "file": "document.pdf",
      "status": "processed",
      "words": 1234,
      "chunks": 3
    }
  ]
}
```

### WebSocket Events

**Client → Server**
- `join` - Join a conversation
  ```javascript
  { convoId: "demo-convo", user: "demo-user" }
  ```

- `send_message` - Send a message
  ```javascript
  { convoId: "demo-convo", message: "Hello", sender: "user" }
  ```

**Server → Client**
- `history` - Conversation history
- `new_message` - New message received

## Configuration

### Chunk Size
Default: 500 words per chunk

Modify in `server.js`:
```javascript
function chunkText(text, chunkSize = 500) {
  // ...
}
```

### Retrieval Settings
Default: Top 3 most similar chunks

Modify in `server.js`:
```javascript
const results = await collection.query({
  queryEmbeddings: [queryEmbedding],
  nResults: 3  // Change this number
});
```

### AI Model
Current: `gemini-2.5-flash` (free tier, 15 RPM)

Alternative options:
- `gemini-2.5-pro` - Better quality, slower (5 RPM)
- `gemini-1.5-flash` - Older version

Change in `server.js` line 177:
```javascript
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
```

## Dependencies

```json
{
  "axios": "^1.13.2",
  "chromadb": "^3.1.5",
  "chromadb-default-embed": "^2.14.0",
  "cors": "^2.8.5",
  "dotenv": "^17.2.3",
  "express": "^5.1.0",
  "multer": "^2.0.2",
  "pdf-parse": "^2.4.5",
  "socket.io": "^4.8.1"
}
```

## Troubleshooting

### ChromaDB Connection Issues
- Ensure ChromaDB server is running on port 8000
- Check: `curl http://localhost:8000/api/v1/heartbeat`

### Upload Failures
- Check file format (only PDF and TXT supported)
- Verify Gemini API key is valid
- Check rate limits (embedding API calls)

### No RAG Context in Responses
- Verify documents were uploaded successfully
- Check ChromaDB collection exists
- Ensure embeddings were generated

### Bot Not Responding
- Check Gemini API rate limits (429 errors)
- Verify GEMINI_API_KEY in .env file
- Check server logs for errors

## Project Structure

```
simple-chatbot/
├── server.js           # Main server file with RAG logic
├── index.html          # Chat interface
├── package.json        # Dependencies
├── .env               # Environment variables (create this)
├── .gitignore         # Git ignore file
├── uploads/           # Temporary upload directory (auto-created)
└── README.md          # This file
```

## How RAG Works

1. **Upload Phase**
   - User uploads PDF/TXT file
   - Server extracts text content
   - Text is chunked into 500-word segments
   - Each chunk is embedded using Gemini embedding-001
   - Chunks + embeddings stored in ChromaDB

2. **Query Phase**
   - User sends a question
   - Question is embedded using same model
   - ChromaDB finds top 3 most similar chunks
   - Chunks are combined as context
   - Gemini generates answer using context + question

3. **Response**
   - Bot returns context-aware answer
   - If no relevant chunks found, answers without context

## Free Tier Limits

### Gemini API (Free Tier)
- **gemini-2.5-flash**: 15 requests/min, 1.5M tokens/day
- **embedding-001**: Generous limits for embeddings

### ChromaDB
- Local instance: No limits
- Stores data in `./chroma` directory

## Next Steps

- [ ] Add user authentication
- [ ] Implement conversation persistence
- [ ] Add support for more file formats (DOCX, etc.)
- [ ] Implement document management (list, delete)
- [ ] Add citation/source tracking
- [ ] Deploy to production environment
- [ ] Add streaming responses
- [ ] Implement multi-user support with proper isolation

## License

ISC

## Support

For issues or questions, please check the server logs and ChromaDB output for error messages.
