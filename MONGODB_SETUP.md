# MongoDB Integration Guide

## Overview
This chatbot application now uses MongoDB to persist user sessions and conversation history, replacing the in-memory storage system.

## What Changed

### Database Architecture
- **User Sessions**: Stored in MongoDB with express-session and connect-mongo
- **Conversation History**: Persisted conversations with full message history
- **Document Tracking**: Records of uploaded documents linked to conversations
- **User Management**: Track users, their socket connections, and activity

### Collections Created
1. **users**: User profiles and session information
2. **conversations**: Chat history with RAG metadata
3. **sessions**: Express session store (auto-managed)

## Installation Steps

### 1. Install MongoDB

#### Windows (Using Chocolatey):
```powershell
choco install mongodb
```

#### Windows (Manual):
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer
3. Add MongoDB to PATH: `C:\Program Files\MongoDB\Server\7.0\bin`

#### macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
```

#### Linux (Ubuntu):
```bash
sudo apt-get install -y mongodb-org
```

### 2. Start MongoDB Server

#### Windows:
```powershell
# Start as service (if installed as service)
net start MongoDB

# Or run manually
mongod --dbpath C:\data\db
```

#### macOS/Linux:
```bash
# Start as service
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux

# Or run manually
mongod --dbpath /data/db
```

### 3. Verify MongoDB is Running
```bash
# Check if MongoDB is accessible
mongosh --eval "db.version()"
```

Expected output: MongoDB version number (e.g., `7.0.2`)

## Environment Configuration

The `.env` file has been updated with MongoDB settings:

```env
GEMINI_API_KEY=your_key_here
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chatbot
SESSION_SECRET=chatbot-secret-key-change-in-production
NODE_ENV=development
```

### Configuration Options:

- **MONGODB_URI**: MongoDB connection string
  - Local: `mongodb://localhost:27017/chatbot`
  - Remote (MongoDB Atlas): `mongodb+srv://username:password@cluster.mongodb.net/chatbot`

- **SESSION_SECRET**: Secret key for session encryption
  - **IMPORTANT**: Change this in production!
  - Generate secure key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

- **NODE_ENV**: Environment mode
  - `development`: Local development (insecure cookies allowed)
  - `production`: Production mode (secure cookies required)

## Database Schema

### User Schema
```javascript
{
  userId: String,          // Unique user identifier
  username: String,        // Display name
  socketId: String,        // Current socket connection
  lastActive: Date,        // Last activity timestamp
  preferences: {
    theme: String,         // UI theme preference
    notifications: Boolean // Notification settings
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation Schema
```javascript
{
  convoId: String,         // Conversation identifier
  userId: String,          // Owner user ID
  messages: [{
    id: Number,
    sender: String,        // 'user' or 'bot'
    message: String,
    ts: Date,
    metadata: {
      ragContext: Boolean, // Whether RAG was used
      chunks: Number       // Number of context chunks
    }
  }],
  documentContext: {
    files: [{
      filename: String,
      uploadedAt: Date,
      chunks: Number,
      words: Number
    }],
    lastUpload: Date
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Running the Application

### Terminal 1: Start MongoDB
```powershell
# Windows
mongod --dbpath C:\data\db

# Or if running as service, just verify it's running
mongo --eval "db.version()"
```

### Terminal 2: Start ChromaDB
```powershell
chroma run --host localhost --port 8000
```

### Terminal 3: Start Node.js Server
```powershell
cd "c:\Users\shree\OneDrive\Desktop\VVIP VIBE CODING - 11072025\11172025-yash-simple-chatbot\simple-chatbot"
node server.js
```

Expected output:
```
MongoDB Connected: localhost
Demo server listening on 3000
```

### Open Browser
Navigate to: `http://localhost:3000/index.html`

## Features

### Session Persistence
- Sessions survive server restarts
- Automatic session management with 7-day expiration
- Session data shared between Express and Socket.io

### Conversation History
- All conversations stored in MongoDB
- Messages persist across page refreshes
- Full chat history available for analysis

### User Tracking
- Track unique users and their activity
- Monitor last active timestamps
- Link socket connections to user sessions

### Document Context
- Track which documents were uploaded
- Record upload timestamps and metadata
- Link documents to conversations

## Database Management

### View Data with Mongo Shell
```bash
# Connect to MongoDB
mongosh

# Switch to chatbot database
use chatbot

# View collections
show collections

# View users
db.users.find().pretty()

# View conversations
db.conversations.find().pretty()

# View sessions
db.sessions.find().pretty()

# Count documents
db.conversations.countDocuments()
```

### Clear All Data
```bash
mongosh
use chatbot
db.dropDatabase()
```

### Backup Database
```bash
# Backup
mongodump --db chatbot --out ./backup

# Restore
mongorestore --db chatbot ./backup/chatbot
```

## MongoDB Atlas (Cloud Database)

For production, consider using MongoDB Atlas:

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot
   ```

## Troubleshooting

### Error: MongoServerError: connect ECONNREFUSED
**Problem**: MongoDB server is not running
**Solution**:
```powershell
# Start MongoDB
net start MongoDB  # Windows service
# Or
mongod --dbpath C:\data\db
```

### Error: MongooseError: Operation buffering timed out
**Problem**: Cannot connect to MongoDB
**Solutions**:
1. Verify MongoDB is running: `mongosh`
2. Check MONGODB_URI in `.env`
3. Ensure port 27017 is not blocked

### Error: Session store timeout
**Problem**: MongoDB store connection issues
**Solution**: Verify MongoDB is accessible and `MONGODB_URI` is correct

### Sessions Not Persisting
**Problem**: Session secret keeps changing
**Solution**: Set a fixed `SESSION_SECRET` in `.env` file

## API Changes

### New Socket.io Events
No changes to client-side events - backward compatible!

### Session Access in Routes
```javascript
app.get('/profile', (req, res) => {
  console.log('Session ID:', req.session.id);
  console.log('Session data:', req.session);
});
```

## Performance Considerations

### Indexes
The schemas include indexes on:
- `userId` (User and Conversation collections)
- `convoId` (Conversation collection)

### Connection Pooling
Mongoose handles connection pooling automatically.

### Session Lazy Updates
Sessions are updated only once per 24 hours (`touchAfter: 24 * 3600`)

## Migration from In-Memory

The application seamlessly migrates from in-memory to MongoDB:
- No data migration needed (fresh start)
- All new conversations automatically saved
- Old in-memory data discarded on server restart

## Production Checklist

- [ ] Use MongoDB Atlas or dedicated MongoDB server
- [ ] Generate secure SESSION_SECRET
- [ ] Set NODE_ENV=production
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS (secure: true for cookies)
- [ ] Set up MongoDB backups
- [ ] Monitor database size and performance
- [ ] Configure proper MongoDB indexes
- [ ] Set up database connection retry logic

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [connect-mongo Documentation](https://www.npmjs.com/package/connect-mongo)
- [express-session Documentation](https://www.npmjs.com/package/express-session)
