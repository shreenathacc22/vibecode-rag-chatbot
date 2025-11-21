# Supabase Integration Setup Guide

## Overview
This guide will help you set up Supabase for your RAG Chatbot application. Supabase provides:
- **PostgreSQL Database** - Replace/supplement MongoDB
- **Storage Buckets** - For file uploads (PDFs, TXTs)
- **Real-time Subscriptions** - For live chat updates
- **Authentication** (optional for future)

---

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in project details:
   - **Name:** `chatbot-demo`
   - **Database Password:** Choose a strong password
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free tier (500MB database, 1GB storage)
5. Wait 2-3 minutes for project to be created

---

## Step 2: Get API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. Add to your `.env` file:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

## Step 3: Create Database Tables

### Option A: Using SQL Editor (Recommended)

1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New Query"**
3. Paste the following SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  username TEXT DEFAULT 'Guest User',
  socket_id TEXT,
  last_active TIMESTAMP DEFAULT NOW(),
  preferences JSONB DEFAULT '{"theme": "light", "notifications": true}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  convo_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  document_context JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_convo_id ON conversations(convo_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for demo)
CREATE POLICY "Allow all operations on users" ON users
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on conversations" ON conversations
FOR ALL USING (true) WITH CHECK (true);

-- Create function to get conversation history
CREATE OR REPLACE FUNCTION get_conversation_history(convo_id_param TEXT)
RETURNS TABLE (
  message JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_array_elements(messages) as message
  FROM conversations
  WHERE convo_id = convo_id_param;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_conversation_history TO anon, authenticated;
```

4. Click **"Run"** to execute

### Option B: Using JavaScript Migration (Advanced)

Save this as `migrations/001_initial_schema.sql` and run via Supabase CLI.

---

## Step 4: Create Storage Bucket for File Uploads

1. Go to **Storage** in Supabase dashboard
2. Click **"New Bucket"**
3. Configure:
   - **Name:** `chatbot-uploads`
   - **Public:** Yes (for demo purposes)
   - **File size limit:** 10MB
   - **Allowed MIME types:** `application/pdf,text/plain`
4. Click **"Create Bucket"**

### Set Bucket Policies

1. Click on the `chatbot-uploads` bucket
2. Go to **Policies** tab
3. Click **"New Policy"**
4. Add policy for uploads:

```sql
-- Policy: Allow authenticated uploads
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'chatbot-uploads');

-- Policy: Allow public reads
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chatbot-uploads');
```

---

## Step 5: Install Supabase Dependencies

```bash
cd simple-chatbot
npm install @supabase/supabase-js
```

---

## Step 6: Update Environment Variables

Create or update `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB (Keep for now - can migrate later)
MONGODB_URI=mongodb+srv://shreenathacc22_db_user:QLjpncuj57XC1Rbj@shree1-chatbot.kzq2ow2.mongodb.net/chatbot?retryWrites=true&w=majority&appName=shree1-chatbot

# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Google Gemini API
GEMINI_API_KEY=AIzaSyBlwAFLq4P_FiHpl1nYqvBx6wRHbKSgjMs

# Session
SESSION_SECRET=chatbot-secret-key-change-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Storage Configuration
USE_SUPABASE_STORAGE=true
SUPABASE_BUCKET=chatbot-uploads
```

---

## Step 7: Usage in Application

### File Storage Example

```javascript
const { supabase } = require('./config/supabase');

// Upload file to Supabase Storage
async function uploadFileToSupabase(file, userId, convoId) {
  const fileName = `${userId}/${convoId}/${Date.now()}-${file.originalname}`;

  const { data, error } = await supabase.storage
    .from('chatbot-uploads')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('chatbot-uploads')
    .getPublicUrl(fileName);

  return { path: data.path, url: urlData.publicUrl };
}

// Download file from Supabase Storage
async function downloadFileFromSupabase(filePath) {
  const { data, error } = await supabase.storage
    .from('chatbot-uploads')
    .download(filePath);

  if (error) throw error;
  return data;
}
```

### Database Example

```javascript
const { supabase } = require('./config/supabase');

// Create user
async function createUser(userId, username) {
  const { data, error } = await supabase
    .from('users')
    .insert([{ user_id: userId, username }])
    .select();

  if (error) throw error;
  return data[0];
}

// Get conversations
async function getConversations(userId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

// Save message to conversation
async function saveMessage(convoId, message) {
  // Get existing conversation
  const { data: conv, error: fetchError } = await supabase
    .from('conversations')
    .select('messages')
    .eq('convo_id', convoId)
    .single();

  if (fetchError) throw fetchError;

  // Append message
  const updatedMessages = [...(conv.messages || []), message];

  const { data, error } = await supabase
    .from('conversations')
    .update({ messages: updatedMessages })
    .eq('convo_id', convoId)
    .select();

  if (error) throw error;
  return data[0];
}
```

---

## Step 8: Integration Options

### Option 1: Dual Database (MongoDB + Supabase)
- Keep MongoDB for existing data
- Use Supabase for file storage only
- Gradual migration path

### Option 2: Full Supabase Migration
- Migrate all data to Supabase PostgreSQL
- Use Supabase Storage for files
- Remove MongoDB dependency

### Option 3: Hybrid Approach (Recommended for Demo)
- Use MongoDB for conversations (already working)
- Use Supabase Storage for file uploads
- Use Supabase for analytics/reporting tables (future)

---

## Step 9: Test Supabase Integration

```bash
# Run the application
npm start

# Test file upload
# Upload a PDF file through the UI
# Check Supabase Storage dashboard to see uploaded file

# Test database
# Create a conversation
# Check Supabase Table Editor to see data
```

---

## Features You Get with Supabase

### ✅ Built-in Features
- **Auto-generated REST API** for all tables
- **Real-time subscriptions** for live updates
- **Row Level Security (RLS)** for data protection
- **Automatic backups** (daily on free tier)
- **SQL Editor** for direct queries
- **Table Editor** for visual data management
- **Storage with CDN** for fast file access
- **Logs and monitoring** dashboard

### ✅ Free Tier Limits
- **Database:** 500MB
- **Storage:** 1GB
- **Bandwidth:** 2GB
- **API requests:** 50,000/month
- **Real-time connections:** 200 concurrent

---

## Migration Plan (MongoDB → Supabase)

### Phase 1: Add Supabase Storage (This PR)
- Install Supabase client
- Create storage bucket
- Update file upload to use Supabase Storage
- Keep MongoDB for conversations

### Phase 2: Parallel Database (Future)
- Write to both MongoDB and Supabase
- Read from MongoDB (primary)
- Validate data consistency

### Phase 3: Switch Primary (Future)
- Read from Supabase (primary)
- Keep MongoDB as backup
- Monitor performance

### Phase 4: Full Migration (Future)
- Remove MongoDB dependency
- Use Supabase exclusively
- Archive old MongoDB data

---

## Troubleshooting

### Issue: "Invalid API key"
**Solution:** Check that you copied the correct `anon` key from Supabase dashboard

### Issue: "Row Level Security policy violation"
**Solution:** Run the RLS policy SQL commands to allow operations

### Issue: "Storage bucket not found"
**Solution:** Create the `chatbot-uploads` bucket in Supabase dashboard

### Issue: "CORS error"
**Solution:** Supabase automatically handles CORS, check your `ALLOWED_ORIGINS` in `.env`

---

## Useful Supabase CLI Commands

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --project-id your-project-id > types/supabase.ts

# View logs
supabase logs
```

---

## Security Best Practices

1. **Never commit Supabase keys to version control**
   - Already added `.env` to `.gitignore`
   - Use environment variables

2. **Use Row Level Security (RLS)**
   - Already enabled in setup SQL
   - Customize policies for production

3. **Rotate keys regularly**
   - Generate new anon keys from dashboard
   - Update `.env` file

4. **Use service role key only server-side**
   - Never expose in frontend
   - Use for admin operations only

5. **Enable email confirmation** (for production)
   - Go to Authentication → Settings
   - Enable email confirmation

---

## Next Steps

1. ✅ Complete Supabase setup
2. ✅ Test file upload to Supabase Storage
3. ✅ Optionally migrate conversations to Supabase
4. ✅ Set up real-time subscriptions for live chat
5. ✅ Add authentication (future enhancement)

---

**For Support:**
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues
