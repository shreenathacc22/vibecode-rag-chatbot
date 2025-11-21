# 🆓 FREE Deployment Guide - RAG Chatbot

> **Goal:** Deploy your chatbot for FREE (or under $5/month)
> **Best Option:** Render.com + Free tiers
> **Total Cost:** $0-5/month

---

## 💰 **Cost Breakdown (FREE Plan)**

| Service | Plan | Cost |
|---------|------|------|
| **Render.com** | Free Web Service | $0/month |
| **MongoDB Atlas** | M0 Free Tier | $0/month |
| **Supabase** | Free Tier | $0/month |
| **Google Gemini API** | Free Tier | $0/month |
| **ChromaDB** | Render Free Service | $0/month |
| **TOTAL** | | **$0/month** 🎉 |

**Limitations:**
- Auto-sleeps after 15 min inactivity (cold start ~30s)
- 750 hours/month free (enough for hobby projects)
- 100GB bandwidth/month
- 512MB RAM per service

---

## 🚀 **Option 1: Render.com** (RECOMMENDED - 100% FREE)

### **Why Render?**
- ✅ Completely FREE tier
- ✅ No credit card required
- ✅ Auto-deploy from GitHub
- ✅ Free SSL/HTTPS
- ✅ Easy setup (30 minutes)
- ✅ Better than Heroku free tier (discontinued)

---

## 📋 **Step-by-Step: Deploy to Render.com**

### **Prerequisites**
1. GitHub account (free)
2. Render.com account (free, no credit card)
3. MongoDB Atlas account (free)
4. Your code pushed to GitHub

---

### **Step 1: Prepare Your Code** (10 minutes)

#### 1.1 Update PORT Configuration

Your app already uses `process.env.PORT`, which is perfect for Render.

#### 1.2 Create `render.yaml` (Optional but Recommended)

Create file: `simple-chatbot/render.yaml`

```yaml
services:
  # Main Chatbot Application
  - type: web
    name: chatbot-app
    env: node
    region: oregon
    plan: free
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: GEMINI_API_KEY
        sync: false
      - key: MONGODB_URI
        sync: false
      - key: SESSION_SECRET
        generateValue: true
      - key: ALLOWED_ORIGINS
        value: https://chatbot-app.onrender.com
      - key: CHROMA_HOST
        value: chatbot-chromadb.onrender.com
      - key: CHROMA_PORT
        value: 8000
      - key: USE_SUPABASE_STORAGE
        value: false

  # ChromaDB Service
  - type: web
    name: chatbot-chromadb
    env: docker
    region: oregon
    plan: free
    dockerfilePath: ./Dockerfile.chromadb
    envVars:
      - key: CHROMA_HOST
        value: 0.0.0.0
      - key: CHROMA_PORT
        value: 8000
```

#### 1.3 Create Dockerfile for ChromaDB

Create file: `simple-chatbot/Dockerfile.chromadb`

```dockerfile
FROM chromadb/chroma:latest

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8000/api/v1/heartbeat || exit 1

# Start ChromaDB
CMD ["uvicorn", "chromadb.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 1.4 Push to GitHub

```bash
cd simple-chatbot

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Render deployment"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/chatbot.git
git push -u origin main
```

---

### **Step 2: Set Up MongoDB Atlas** (FREE - Already Done!)

You already have MongoDB Atlas configured! Just verify:

1. Go to: https://cloud.mongodb.com
2. Verify M0 (Free) tier is active
3. Network Access → Add IP: `0.0.0.0/0` (allow from anywhere)
4. Copy connection string (you already have this)

**Your current MongoDB is FREE and stays FREE!** ✅

---

### **Step 3: Set Up Supabase** (FREE - Optional)

1. Go to: https://supabase.com
2. Sign up (free, no credit card)
3. Create new project (free tier)
4. Follow: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
5. Copy URL and anon key

**Free Tier Includes:**
- 500MB database
- 1GB file storage
- 2GB bandwidth
- 50,000 monthly active users

---

### **Step 4: Deploy to Render** (15 minutes)

#### 4.1 Create Render Account

1. Go to: https://render.com
2. Sign up with GitHub (no credit card required)
3. Authorize Render to access your GitHub repos

#### 4.2 Deploy Main Application

1. **Dashboard → New → Web Service**
2. **Connect Repository:** Select your `chatbot` repo
3. **Configure:**
   - **Name:** `chatbot-app`
   - **Region:** Oregon (US West)
   - **Branch:** `main`
   - **Root Directory:** `simple-chatbot`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

4. **Add Environment Variables:**
   Click "Advanced" → Add Environment Variables:

   ```
   NODE_ENV=production
   GEMINI_API_KEY=your_gemini_api_key
   MONGODB_URI=your_mongodb_atlas_connection_string
   SESSION_SECRET=your_random_secret
   ALLOWED_ORIGINS=https://chatbot-app.onrender.com
   CHROMA_HOST=chatbot-chromadb.onrender.com
   CHROMA_PORT=8000
   USE_SUPABASE_STORAGE=false
   ```

5. **Create Web Service** (Takes 2-3 minutes)

#### 4.3 Deploy ChromaDB

1. **Dashboard → New → Web Service**
2. **Connect Repository:** Same repo
3. **Configure:**
   - **Name:** `chatbot-chromadb`
   - **Region:** Oregon (same as main app)
   - **Branch:** `main`
   - **Root Directory:** `simple-chatbot`
   - **Environment:** Docker
   - **Dockerfile Path:** `Dockerfile.chromadb`
   - **Plan:** Free

4. **Create Web Service**

#### 4.4 Update Main App with ChromaDB URL

1. Go to `chatbot-chromadb` service
2. Copy the URL (e.g., `https://chatbot-chromadb.onrender.com`)
3. Go to `chatbot-app` service
4. Environment → Edit `CHROMA_HOST`
5. Set value to: `chatbot-chromadb.onrender.com` (without https://)
6. Save (app will redeploy)

---

### **Step 5: Test Your FREE Deployment** (5 minutes)

1. **Get Your URL:**
   - Render dashboard → `chatbot-app` → Copy URL
   - Example: `https://chatbot-app.onrender.com`

2. **Test Health Check:**
   ```bash
   curl https://chatbot-app.onrender.com/health
   ```
   Should return: `{"ok":true}`

3. **Test in Browser:**
   - Open: `https://chatbot-app.onrender.com`
   - Create new chat
   - Send message
   - Upload PDF
   - Ask question about PDF

---

## 🎉 **You're Live for FREE!**

Your chatbot is now running at:
```
https://chatbot-app.onrender.com
```

---

## 🆓 **Option 2: Railway.app** (FREE $5 Credit/Month)

### **Why Railway?**
- ✅ $5 free credit per month
- ✅ No credit card for trial
- ✅ Better performance than Render
- ✅ Easy GitHub integration

### **Quick Deploy:**

1. **Sign Up:** https://railway.app (GitHub login)
2. **New Project → Deploy from GitHub**
3. **Select your repo**
4. **Add Environment Variables** (same as Render)
5. **Deploy** (automatic)

**Limitations:**
- $5 credit = ~500 hours/month
- After credit, pay-as-you-go ($0.000463/GB-hour)
- Estimated: $3-10/month after free credit

---

## 🆓 **Option 3: Fly.io** (FREE Tier Available)

### **Why Fly.io?**
- ✅ 3 free VMs (256MB RAM each)
- ✅ 3GB persistent storage free
- ✅ No credit card required
- ✅ Good performance

### **Quick Deploy:**

```bash
# Install Fly CLI
# Windows: iwr https://fly.io/install.ps1 -useb | iex
# Mac: brew install flyctl

# Login
flyctl auth login

# Deploy
cd simple-chatbot
flyctl launch
```

**Limitations:**
- 256MB RAM per VM (low)
- Need to optimize for memory

---

## 🆓 **Option 4: Vercel + Railway** (FREE)

### **Architecture:**
- **Frontend:** Vercel (FREE)
- **Backend:** Railway (FREE $5/month)
- **Database:** MongoDB Atlas (FREE)
- **Storage:** Supabase (FREE)

### **Why This Combo?**
- ✅ Best performance
- ✅ Vercel's edge network (fast globally)
- ✅ Completely free

### **Setup:**

**Backend (Railway):**
1. Deploy `server.js` to Railway
2. Get backend URL

**Frontend (Vercel):**
1. Split `index.html` to separate repo
2. Update API_URL to Railway backend
3. Deploy to Vercel

---

## 📊 **Free Tier Comparison**

| Platform | Free Tier | Cold Start | RAM | Bandwidth | Best For |
|----------|-----------|------------|-----|-----------|----------|
| **Render** ⭐ | 750 hrs/mo | 30s | 512MB | 100GB | Your project |
| **Railway** | $5 credit | ~5s | 512MB | 100GB | Better performance |
| **Fly.io** | 3 VMs | ~10s | 256MB | 160GB | Multiple services |
| **Vercel+Railway** | Unlimited+$5 | ~5s | 512MB | 100GB | Best performance |

**Recommendation: Render.com** (easiest, completely free)

---

## ⚠️ **Free Tier Limitations**

### **All Free Plans Have:**

1. **Cold Starts:**
   - App sleeps after 15 min inactivity
   - First request takes 30-60 seconds
   - Subsequent requests are fast

2. **Limited Resources:**
   - 512MB RAM (enough for your app)
   - Slower CPU than paid plans
   - May struggle with large PDFs

3. **Uptime Restrictions:**
   - 750 hours/month = ~25 days
   - Not 24/7 availability
   - Fine for demos/personal projects

### **Workarounds:**

**Keep App Awake:**
```bash
# Use a free uptime monitor
# https://uptimerobot.com (free)
# Ping your app every 5 minutes
```

**Optimize for Cold Starts:**
- Use Supabase (no cold start for storage)
- Pre-warm app with health checks
- Keep ChromaDB lightweight

---

## 🔧 **Optimizations for Free Tier**

### **1. Reduce Memory Usage**

Update `simple-chatbot/server.js`:

```javascript
// Reduce chunk size for lower memory
function chunkText(text, chunkSize = 300) { // Changed from 500
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}
```

### **2. Add File Size Limits**

```javascript
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max (reduced from 10MB)
    files: 3 // Max 3 files (reduced from 5)
  }
});
```

### **3. Use Supabase Storage**

Enable Supabase to reduce local disk usage:
```env
USE_SUPABASE_STORAGE=true
```

---

## 💡 **Best FREE Setup (Recommended)**

```
┌─────────────────────────────────────┐
│         User Browser                │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│    Render.com (FREE Web Service)    │
│         chatbot-app                 │
│    • Node.js + Express + Socket.io  │
│    • 512MB RAM, 750 hrs/mo          │
└────────┬────────────────────────────┘
         │
         ├──→ MongoDB Atlas (FREE M0)
         │    • 512MB storage
         │    • No credit card needed
         │
         ├──→ Render ChromaDB Service (FREE)
         │    • 512MB RAM
         │    • Vector storage
         │
         ├──→ Google Gemini API (FREE)
         │    • 15 requests/min
         │    • 1,500 requests/day
         │
         └──→ Supabase (FREE)
              • 1GB file storage
              • 2GB bandwidth
```

**Total Cost: $0/month** 🎉

---

## 📋 **Quick Start Checklist**

- [ ] Push code to GitHub
- [ ] Sign up for Render.com (free, no card)
- [ ] Deploy main app to Render
- [ ] Deploy ChromaDB to Render
- [ ] Verify MongoDB Atlas is M0 (free)
- [ ] (Optional) Set up Supabase (free)
- [ ] Add environment variables
- [ ] Test deployment
- [ ] Share URL!

---

## 🎯 **Time & Cost Summary**

| Task | Time | Cost |
|------|------|------|
| Push to GitHub | 5 min | $0 |
| Sign up Render | 2 min | $0 |
| Deploy app | 15 min | $0 |
| Deploy ChromaDB | 5 min | $0 |
| Configure env vars | 5 min | $0 |
| Test | 5 min | $0 |
| **TOTAL** | **37 min** | **$0** |

---

## 🚨 **Important Notes**

### **Gemini API FREE Tier Limits:**
- ✅ 15 requests per minute
- ✅ 1,500 requests per day
- ✅ Completely free
- ❌ Will fail if exceeded

**Solution:** Add rate limiting (already in middleware)

### **MongoDB Atlas FREE Tier:**
- ✅ 512MB storage (enough for thousands of conversations)
- ✅ Shared cluster (slower than paid)
- ✅ No credit card required
- ✅ Never expires

### **Render FREE Tier:**
- ✅ 750 hours/month (enough for 24/7 with smart management)
- ✅ Auto-sleeps after 15 min
- ✅ Cold start: 30-60 seconds
- ❌ Not suitable for high-traffic production

---

## 🆙 **Upgrade Path**

When you outgrow free tier:

### **Option 1: Render Starter ($7/month)**
- No cold starts
- 512MB RAM
- 24/7 uptime
- Better performance

### **Option 2: Railway ($5-10/month)**
- Pay for usage
- Better performance
- No cold starts

### **Option 3: GCP Cloud Run ($40/month)**
- Auto-scaling
- Production-grade
- Follow: [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)

---

## 🎉 **Final Result**

After following this guide, you'll have:

✅ **FREE chatbot deployment**
- URL: `https://your-app.onrender.com`
- Cost: $0/month
- Uptime: 750 hours/month
- Auto-deploys from GitHub

✅ **All features working:**
- Real-time chat
- PDF/TXT upload
- RAG question answering
- Persistent conversations
- Multiple sessions

✅ **No credit card required**

---

## 📚 **Additional Resources**

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **Supabase:** https://supabase.com/docs
- **Gemini API:** https://ai.google.dev/pricing

---

## 🐛 **Troubleshooting FREE Tier**

### **Issue: App sleeps (cold start)**
**Solution:** Use UptimeRobot.com (free) to ping every 5 minutes

### **Issue: Out of memory**
**Solution:** Reduce chunk size, use Supabase storage

### **Issue: Gemini API rate limit**
**Solution:** Add caching, implement queue

### **Issue: MongoDB connection**
**Solution:** Verify IP whitelist includes `0.0.0.0/0`

---

## 🎓 **Next Steps**

1. **Deploy Now:** Follow Step 1-5 above (37 minutes)
2. **Test Everything:** Verify all features work
3. **Share URL:** Give to users/friends
4. **Monitor:** Check Render dashboard daily
5. **Upgrade Later:** When you need better performance

---

**🚀 Ready to deploy for FREE? Start with Step 1 above!**

**Questions? All steps are detailed above.**

---

*Last Updated: 2025-11-21*
*Tested on: Render.com Free Tier*
*Total Cost: $0/month* 🎉
