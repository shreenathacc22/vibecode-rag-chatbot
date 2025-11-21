# 🚀 MongoDB Integration - Quick Reference

## ✅ Integration Complete!

Your chatbot application now includes **MongoDB** for persistent user sessions and conversation history.

---

## 📋 What's New

### Before (In-Memory Storage)
- ❌ Conversations lost on server restart
- ❌ No user session persistence
- ❌ No conversation history
- ❌ No document tracking

### After (MongoDB Storage)
- ✅ **Persistent conversations** across restarts
- ✅ **User sessions** saved in database
- ✅ **Full chat history** with metadata
- ✅ **Document tracking** and analytics
- ✅ **RAG usage metrics** for every response

---

## 🎯 Quick Start

### Option 1: MongoDB Atlas (Recommended - No Installation!)

1. **Create Free Account:** https://www.mongodb.com/cloud/atlas
2. **Create Free Cluster** (512MB free tier)
3. **Get Connection String:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/chatbot
   ```
4. **Update `.env`:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot
   ```
5. **Start the application!**

### Option 2: Local MongoDB

1. **Install MongoDB:**
   - Windows: `choco install mongodb`
   - macOS: `brew install mongodb-community`
   - Linux: `sudo apt-get install mongodb-org`

2. **Start MongoDB:**
   ```bash
   mongod --dbpath C:\data\db   # Windows
   # OR
   brew services start mongodb-community  # macOS
   # OR
   sudo systemctl start mongod  # Linux
   ```

3. **Start the application!**

---

## 🏃 Running the Application

### With MongoDB Atlas (Cloud):
```powershell
# Terminal 1: Start ChromaDB
chroma run --host localhost --port 8000

# Terminal 2: Start Application
cd "path/to/simple-chatbot"
node server.js
```

Expected output:
```
MongoDB Connected: cluster0-shard-00-00.mongodb.net
Demo server listening on 3000
```

### With Local MongoDB:
```powershell
# Terminal 1: Start MongoDB
mongod --dbpath C:\data\db

# Terminal 2: Start ChromaDB
chroma run --host localhost --port 8000

# Terminal 3: Start Application
cd "path/to/simple-chatbot"
node server.js
```

Expected output:
```
MongoDB Connected: localhost
Demo server listening on 3000
```

---

## 📊 Database Schema

### Collections Created

1. **users** - User profiles and sessions
2. **conversations** - Chat history with messages
3. **sessions** - Express session store (auto-managed)

### Example Data

**User:**
```json
{
  "userId": "demo-user",
  "username": "Guest User",
  "socketId": "abc123xyz",
  "lastActive": "2025-11-20T10:30:00Z",
  "preferences": {
    "theme": "light",
    "notifications": true
  }
}
```

**Conversation:**
```json
{
  "convoId": "demo-convo",
  "userId": "demo-user",
  "messages": [
    {
      "sender": "user",
      "message": "What is AI?",
      "metadata": { "ragContext": true, "chunks": 3 }
    },
    {
      "sender": "bot",
      "message": "AI stands for...",
      "metadata": { "ragContext": true, "chunks": 3 }
    }
  ],
  "documentContext": {
    "files": [{
      "filename": "ai_guide.pdf",
      "chunks": 15,
      "words": 7500
    }]
  }
}
```

---

## 🔍 View Your Data

### Using MongoDB Compass (GUI)
1. Download: https://www.mongodb.com/products/compass
2. Connect to: `mongodb://localhost:27017` or your Atlas URI
3. Browse `chatbot` database

### Using mongosh (CLI)
```bash
mongosh

use chatbot
show collections

# View conversations
db.conversations.find().pretty()

# View users
db.users.find().pretty()

# Count messages
db.conversations.aggregate([
  { $project: { messageCount: { $size: "$messages" } } }
])
```

---

## 🎨 Key Features

### 1. Session Persistence
- Sessions survive server restarts
- 7-day automatic expiration
- Secure session cookies

### 2. Conversation History
- All messages permanently stored
- Query by user, date, or conversation
- Full metadata tracking

### 3. User Management
- Auto-creation on first visit
- Activity tracking
- Preferences storage

### 4. Document Tracking
- Record all uploads
- Link to conversations
- Track file metadata

### 5. RAG Analytics
- Track RAG usage per message
- Count context chunks used
- Analyze retrieval effectiveness

---

## 🛠️ Configuration

### Environment Variables (`.env`)

```env
# Required
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=mongodb://localhost:27017/chatbot

# Optional (have defaults)
PORT=3000
SESSION_SECRET=change-this-in-production
NODE_ENV=development
```

### MongoDB URI Formats

**Local:**
```
mongodb://localhost:27017/chatbot
```

**Atlas (Cloud):**
```
mongodb+srv://username:password@cluster.mongodb.net/chatbot
```

**With Authentication:**
```
mongodb://username:password@localhost:27017/chatbot
```

---

## 🐛 Troubleshooting

### "MongoDB Connection Error"
**Solution:** Install/start MongoDB or use MongoDB Atlas
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# Start MongoDB
mongod --dbpath C:\data\db
```

### "Port 3000 already in use"
**Solution:**
```powershell
# Stop process on port 3000
powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force"
```

### Sessions not persisting
**Check:**
- MongoDB connection is active
- `SESSION_SECRET` is set in `.env`
- Browser cookies enabled

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| [MONGODB_SETUP.md](MONGODB_SETUP.md) | Complete installation guide |
| [MONGODB_INTEGRATION_SUMMARY.md](MONGODB_INTEGRATION_SUMMARY.md) | Technical details |
| [README_MONGODB.md](README_MONGODB.md) | This quick reference |
| [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md) | Original system documentation |

---

## 🔗 Useful Links

- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **MongoDB Compass:** https://www.mongodb.com/products/compass
- **Mongoose Docs:** https://mongoosejs.com/
- **Express Session:** https://www.npmjs.com/package/express-session

---

## 📦 New Dependencies

```json
{
  "mongoose": "^8.x",          // MongoDB ODM
  "express-session": "^1.x",   // Session middleware
  "connect-mongo": "^5.x"      // MongoDB session store
}
```

Already installed via: `npm install`

---

## 🎯 Testing Checklist

- [ ] MongoDB is installed/Atlas account created
- [ ] MongoDB is running (local) or connection string updated (Atlas)
- [ ] ChromaDB is running on port 8000
- [ ] Server starts and shows "MongoDB Connected"
- [ ] Can send messages in browser
- [ ] Messages persist after page refresh
- [ ] Can view data in MongoDB Compass or mongosh

---

## 🚀 Next Steps

1. **Install MongoDB** (local or Atlas)
2. **Update `.env`** with MongoDB URI
3. **Start services** (MongoDB, ChromaDB, Node.js)
4. **Test the application**
5. **View stored data** in MongoDB

---

## 💡 Pro Tips

- Use **MongoDB Atlas** for easy setup (no installation)
- Use **MongoDB Compass** for visual database browsing
- Check server logs for connection status
- Set a strong `SESSION_SECRET` in production
- Enable MongoDB authentication in production
- Set up regular database backups

---

## 📞 Support

If you encounter issues:
1. Check [MONGODB_SETUP.md](MONGODB_SETUP.md) for detailed troubleshooting
2. Verify MongoDB is running: `mongosh --eval "db.version()"`
3. Check `.env` configuration
4. Review server logs for errors

---

**Status:** ✅ Integration Complete
**Last Updated:** 2025-11-20
**Version:** 1.0.0
