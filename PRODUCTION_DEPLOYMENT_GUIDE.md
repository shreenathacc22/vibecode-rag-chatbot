# 🚀 Production Deployment Guide - Step by Step

> **Goal:** Deploy your RAG Chatbot to production in 2-3 hours
> **Recommended Platform:** Google Cloud Platform (GCP) Cloud Run
> **Estimated Cost:** $40-70/month

---

## 📋 **Pre-Deployment Checklist**

Before deploying, complete these critical tasks:

### ✅ **Security Fixes (REQUIRED)**

#### 1. Rotate API Keys & Credentials

**Gemini API Key:**
```bash
# 1. Go to: https://makersuite.google.com/app/apikey
# 2. Delete old key: AIzaSyBlwAFLq4P_FiHpl1nYqvBx6wRHbKSgjMs
# 3. Create new API key
# 4. Copy new key to safe location
```

**MongoDB Atlas Password:**
```bash
# 1. Go to: https://cloud.mongodb.com
# 2. Database Access → Edit user: shreenathacc22_db_user
# 3. Edit Password → Autogenerate Secure Password
# 4. Copy new password
# 5. Update connection string
```

**Generate Session Secret:**
```bash
openssl rand -base64 32
# Output example: xK8jP2mN9vL4qR7tY5uW3zA1bC6dE0fG...
```

#### 2. Update Environment Variables

Create production `.env.production`:
```env
# Server
PORT=8080
NODE_ENV=production

# MongoDB (NEW CREDENTIALS)
MONGODB_URI=mongodb+srv://shreenathacc22_db_user:NEW_PASSWORD@shree1-chatbot.kzq2ow2.mongodb.net/chatbot?retryWrites=true&w=majority

# Google Gemini API (NEW KEY)
GEMINI_API_KEY=your_new_api_key_here

# Session Secret (NEW)
SESSION_SECRET=xK8jP2mN9vL4qR7tY5uW3zA1bC6dE0fG...

# CORS (Your Production Domain)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# ChromaDB (Will be deployed separately)
CHROMA_HOST=chromadb-internal-url
CHROMA_PORT=8000

# Supabase (Optional)
USE_SUPABASE_STORAGE=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_BUCKET=chatbot-uploads
```

#### 3. Add Input Validation & File Limits

Create file: `simple-chatbot/middleware/security.js`

```javascript
const multer = require('multer');
const rateLimit = require('express-rate-limit');

// File upload limits
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // Max 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and TXT allowed.'));
    }
  }
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: 'Too many uploads, please try again later.'
});

module.exports = { upload, apiLimiter, uploadLimiter };
```

Install rate limiting:
```bash
npm install express-rate-limit
```

---

## 🌐 **Option 1: Deploy to GCP Cloud Run** (Recommended)

### **Why GCP Cloud Run?**
- ✅ Serverless (auto-scaling)
- ✅ Same ecosystem as Gemini API
- ✅ Pay only for usage
- ✅ Built-in HTTPS & load balancing
- ✅ Easy CI/CD

### **Prerequisites**

1. **GCP Account with Billing:**
   - Sign up: https://cloud.google.com
   - Enable billing (free $300 credit for new accounts)

2. **Install Google Cloud CLI:**
   ```bash
   # Windows: Download from https://cloud.google.com/sdk/docs/install
   # Mac: brew install google-cloud-sdk
   # Linux: curl https://sdk.cloud.google.com | bash
   ```

3. **Authenticate:**
   ```bash
   gcloud auth login
   gcloud config set project your-project-id
   ```

---

### **Step 1: Create Dockerfile** (15 minutes)

Create `simple-chatbot/Dockerfile`:

```dockerfile
# Use official Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port (Cloud Run uses PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start application
CMD ["node", "server.js"]
```

Create `simple-chatbot/.dockerignore`:

```
node_modules
npm-debug.log
.env
.env.*
!.env.example
.git
.gitignore
*.md
uploads/*
chroma/
*.log
.DS_Store
.vscode
.idea
```

---

### **Step 2: Deploy ChromaDB** (20 minutes)

**Option A: Deploy ChromaDB on Compute Engine (Recommended)**

```bash
# Create VM for ChromaDB
gcloud compute instances create chromadb-instance \
  --machine-type=e2-medium \
  --zone=us-central1-a \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --tags=chromadb-server

# Create firewall rule (internal only)
gcloud compute firewall-rules create allow-chromadb-internal \
  --allow=tcp:8000 \
  --source-ranges=10.0.0.0/8 \
  --target-tags=chromadb-server

# SSH into instance
gcloud compute ssh chromadb-instance --zone=us-central1-a
```

Inside the VM:
```bash
# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io

# Run ChromaDB
sudo docker run -d \
  --name chromadb \
  --restart always \
  -p 8000:8000 \
  -v /var/lib/chroma:/chroma/chroma \
  chromadb/chroma:latest

# Get internal IP
hostname -I | awk '{print $1}'
# Note this IP (e.g., 10.128.0.2)

# Exit SSH
exit
```

**Note the internal IP address for later.**

---

### **Step 3: Set Up Secrets Manager** (15 minutes)

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create secrets
echo -n "your_new_gemini_api_key" | \
  gcloud secrets create gemini-api-key --data-file=-

echo -n "mongodb+srv://username:NEW_PASSWORD@cluster.mongodb.net/chatbot" | \
  gcloud secrets create mongodb-uri --data-file=-

echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create session-secret --data-file=-

# If using Supabase
echo -n "your_supabase_anon_key" | \
  gcloud secrets create supabase-anon-key --data-file=-

# Verify secrets created
gcloud secrets list
```

---

### **Step 4: Build and Push Docker Image** (10 minutes)

```bash
# Set your project ID
export PROJECT_ID=your-gcp-project-id

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

# Build image using Cloud Build
cd simple-chatbot
gcloud builds submit --tag gcr.io/$PROJECT_ID/chatbot-app

# Verify image
gcloud container images list
```

---

### **Step 5: Deploy to Cloud Run** (10 minutes)

```bash
# Get ChromaDB internal IP from Step 2
export CHROMA_HOST=10.128.0.2

# Deploy to Cloud Run
gcloud run deploy chatbot-app \
  --image gcr.io/$PROJECT_ID/chatbot-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --concurrency 80 \
  --min-instances 1 \
  --max-instances 10 \
  --port 8080 \
  --set-env-vars NODE_ENV=production,PORT=8080,CHROMA_HOST=$CHROMA_HOST,CHROMA_PORT=8000,USE_SUPABASE_STORAGE=true \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest,MONGODB_URI=mongodb-uri:latest,SESSION_SECRET=session-secret:latest,SUPABASE_ANON_KEY=supabase-anon-key:latest
```

**This will output a URL like:** `https://chatbot-app-xxxxx-uc.a.run.app`

---

### **Step 6: Configure Custom Domain** (Optional - 15 minutes)

```bash
# Map custom domain
gcloud beta run domain-mappings create \
  --service chatbot-app \
  --domain chatbot.yourdomain.com \
  --region us-central1

# Follow instructions to add DNS records:
# 1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
# 2. Add CNAME record:
#    Name: chatbot
#    Value: ghs.googlehosted.com
# 3. Wait for DNS propagation (5-30 minutes)
```

Update CORS in your environment:
```bash
gcloud run services update chatbot-app \
  --update-env-vars ALLOWED_ORIGINS=https://chatbot.yourdomain.com \
  --region us-central1
```

---

### **Step 7: Set Up Monitoring** (10 minutes)

```bash
# Cloud Run automatically provides:
# - Request logs
# - Error logs
# - Metrics dashboard

# View logs in real-time
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=chatbot-app" \
  --limit 50 \
  --format json

# Set up alerts
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Chatbot High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05
```

**Access Cloud Console:**
- Logs: https://console.cloud.google.com/logs
- Metrics: https://console.cloud.google.com/run

---

### **Step 8: Configure MongoDB Atlas** (5 minutes)

```bash
# 1. Go to MongoDB Atlas: https://cloud.mongodb.com
# 2. Network Access → Add IP Address
# 3. Add: 0.0.0.0/0 (allow from anywhere)
#    OR add Cloud Run IP ranges
# 4. Database Access → Verify user has readWrite permissions
```

---

### **Step 9: Test Production Deployment** (15 minutes)

```bash
# Get your Cloud Run URL
export APP_URL=$(gcloud run services describe chatbot-app --region us-central1 --format 'value(status.url)')

# Test health endpoint
curl $APP_URL/health

# Expected output:
# {"ok":true}

# Test in browser
echo "Open: $APP_URL"
```

**Manual Testing:**
1. Open URL in browser
2. Create a new chat
3. Send a message → Verify AI responds
4. Upload a PDF → Verify processing works
5. Ask question about PDF → Verify RAG works

---

### **Step 10: Set Up CI/CD** (Optional - 30 minutes)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

env:
  PROJECT_ID: your-gcp-project-id
  SERVICE_NAME: chatbot-app
  REGION: us-central1

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Authenticate to Google Cloud
      uses: google-github-actions/auth@v1
      with:
        credentials_json: ${{ secrets.GCP_SA_KEY }}

    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v1

    - name: Build and push Docker image
      run: |
        gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy $SERVICE_NAME \
          --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
          --region $REGION \
          --platform managed \
          --allow-unauthenticated \
          --memory 2Gi
```

---

## 💰 **GCP Cost Breakdown**

| Resource | Usage | Cost/Month |
|----------|-------|------------|
| Cloud Run (2GB, 2 CPU) | 100k requests, 5s avg | $15-25 |
| Compute Engine (ChromaDB) | e2-medium 24/7 | $25-30 |
| Cloud Build | 10 builds/month | $0 (free tier) |
| Container Registry | 10GB storage | $1 |
| Secret Manager | 5 secrets | $0 (free tier) |
| MongoDB Atlas | M0/M10 tier | $0-9 |
| Supabase | Free tier | $0 |
| **TOTAL** | | **$41-65/month** |

**Free Tier Eligible:**
- Cloud Run: 2M requests/month free
- Cloud Build: 120 build-minutes/day free
- Secret Manager: 6 secrets free

---

## 🔄 **Updating Your Application**

### **Manual Update:**
```bash
cd simple-chatbot

# Make changes to code
# ...

# Rebuild and deploy
gcloud builds submit --tag gcr.io/$PROJECT_ID/chatbot-app
gcloud run deploy chatbot-app \
  --image gcr.io/$PROJECT_ID/chatbot-app \
  --region us-central1
```

### **Rollback:**
```bash
# List revisions
gcloud run revisions list --service chatbot-app --region us-central1

# Rollback to previous revision
gcloud run services update-traffic chatbot-app \
  --to-revisions=chatbot-app-00001-xyz=100 \
  --region us-central1
```

---

## 🐛 **Troubleshooting Production**

### **Issue: Cloud Run won't start**
```bash
# Check logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Common causes:
# 1. PORT env var not set (must be 8080 for Cloud Run)
# 2. Missing secrets
# 3. MongoDB connection failed
```

### **Issue: ChromaDB connection failed**
```bash
# Check ChromaDB is running
gcloud compute ssh chromadb-instance --zone=us-central1-a
sudo docker ps

# Restart if needed
sudo docker restart chromadb

# Check internal IP hasn't changed
hostname -I
```

### **Issue: High costs**
```bash
# Reduce min instances to 0 (allow scaling to zero)
gcloud run services update chatbot-app \
  --min-instances 0 \
  --region us-central1

# Reduce resources
gcloud run services update chatbot-app \
  --memory 1Gi \
  --cpu 1 \
  --region us-central1
```

---

## 📊 **Monitoring Dashboard**

Access your production monitoring:

1. **Cloud Console:** https://console.cloud.google.com
2. **Cloud Run Dashboard:** Navigation → Cloud Run → chatbot-app
3. **Logs:** Logs Explorer
4. **Metrics:**
   - Request count
   - Request latency
   - Error rate
   - Instance count
   - CPU/Memory usage

**Set Up Alerts:**
1. Go to Monitoring → Alerting
2. Create Policy:
   - **Condition:** Error rate > 5%
   - **Notification:** Email/SMS
   - **Documentation:** Link to runbook

---

## ✅ **Post-Deployment Checklist**

- [ ] Application accessible at public URL
- [ ] Health check returns `{"ok":true}`
- [ ] Chat functionality works
- [ ] File upload works
- [ ] RAG (document Q&A) works
- [ ] MongoDB connection successful
- [ ] ChromaDB connection successful
- [ ] Supabase storage works (if enabled)
- [ ] Logs are being collected
- [ ] Alerts are configured
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS working
- [ ] CORS configured for your domain

---

## 🚨 **Emergency Rollback Procedure**

If something goes wrong:

```bash
# Option 1: Rollback to previous revision
gcloud run revisions list --service chatbot-app --region us-central1
gcloud run services update-traffic chatbot-app \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region us-central1

# Option 2: Scale to zero (stop serving traffic)
gcloud run services update chatbot-app \
  --max-instances 0 \
  --region us-central1

# Option 3: Delete service (nuclear option)
gcloud run services delete chatbot-app --region us-central1
```

---

## 📞 **Support Resources**

- **GCP Cloud Run Docs:** https://cloud.google.com/run/docs
- **GCP Support:** https://cloud.google.com/support
- **Stack Overflow:** Tag: `google-cloud-run`
- **GCP Community:** https://www.googlecloudcommunity.com

---

## 🎉 **You're Live!**

Your chatbot is now running in production on GCP Cloud Run!

**Next Steps:**
1. Monitor logs for 24-48 hours
2. Test all features thoroughly
3. Share URL with users
4. Set up regular backups
5. Plan for scaling

**Your Production URL:**
```
https://chatbot-app-xxxxx-uc.a.run.app
```

---

**Need help?** Check the [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md) for additional production tips.
