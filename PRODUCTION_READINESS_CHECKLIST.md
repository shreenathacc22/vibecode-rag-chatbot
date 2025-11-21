# Production Readiness Checklist
## RAG Chatbot Application - Pre-Deployment Checklist

> **Last Updated:** 2025-11-21
> **Application Version:** 2.0.0
> **Status:** Development → Production Migration

---

## 🔴 CRITICAL SECURITY ISSUES (Must Fix Before Production)

### 1. **API Key & Secrets Management** ⚠️ URGENT
- [ ] **CRITICAL:** Remove hardcoded Gemini API key from `.env` file
  - Current exposure: `AIzaSyBlwAFLq4P_FiHpl1nYqvBx6wRHbKSgjMs` (EXPOSED IN VERSION CONTROL)
  - Action: Rotate this key immediately in Google Cloud Console
  - Use environment variables or secrets manager (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)

- [ ] **CRITICAL:** Remove MongoDB Atlas credentials from `.env`
  - Current exposure: `mongodb+srv://shreenathacc22_db_user:QLjpncuj57XC1Rbj@...`
  - Action: Rotate MongoDB user password immediately
  - Use secure environment variable injection in production

- [ ] Change `SESSION_SECRET` from default value
  - Current: `chatbot-secret-key-change-in-production`
  - Generate strong random secret: `openssl rand -base64 32`
  - Store securely in environment variables

- [ ] Update `.gitignore` to prevent future leaks
  - Current `.gitignore` only has `.env`
  - Add:
    ```
    .env
    .env.*
    !.env.example
    node_modules/
    uploads/*
    !uploads/.gitkeep
    *.log
    chroma/
    .DS_Store
    ```

### 2. **CORS Configuration** ⚠️ HIGH PRIORITY
- [ ] **server.js:34-37** - Lock down CORS policy
  ```javascript
  // Current (INSECURE):
  app.use(cors({ origin: true, credentials: true }));

  // Production (SECURE):
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'https://yourdomain.com',
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  }));
  ```

- [ ] **server.js:62-67** - Same for Socket.io CORS
  ```javascript
  // Add to .env:
  ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
  ```

### 3. **Authentication & Authorization** ⚠️ HIGH PRIORITY
- [ ] Implement user authentication (JWT, OAuth2, or Passport.js)
  - Current: Anyone can access with any `userId` (**server.js:273**)
  - No password protection on conversations
  - No user verification

- [ ] Add authorization middleware
  - Verify users can only access their own conversations
  - Protect `/conversations/:userId` endpoint (**server.js:120-142**)
  - Validate socket connections with auth tokens

- [ ] Implement rate limiting per user
  - Prevent abuse of Gemini API (15 RPM free tier limit)
  - Use `express-rate-limit` package

### 4. **Input Validation & Sanitization** ⚠️ HIGH PRIORITY
- [ ] Validate all user inputs
  - **server.js:145-241** - File upload validation
    - Add file size limits (currently unlimited)
    - Validate file types beyond extension check
    - Scan uploaded files for malware

  - **server.js:286-379** - Message validation
    - Limit message length (currently unlimited)
    - Sanitize message content
    - Validate `convoId` and `userId` format

- [ ] Add input sanitization
  ```javascript
  // Install: npm install validator express-validator
  const { body, param, validationResult } = require('express-validator');
  ```

### 5. **Database Security**
- [ ] Enable MongoDB authentication (currently Atlas, but verify)
  - Current connection: MongoDB Atlas with embedded credentials
  - Ensure IP whitelist is configured in Atlas
  - Use connection with SSL/TLS

- [ ] Sanitize database queries (prevent NoSQL injection)
  ```javascript
  // Add to server.js
  const mongoSanitize = require('express-mongo-sanitize');
  app.use(mongoSanitize());
  ```

- [ ] Create database indexes for performance
  - Already indexed: `User.userId`, `Conversation.convoId`, `Conversation.userId`
  - Consider composite indexes for common queries

---

## 🟡 HIGH PRIORITY IMPROVEMENTS

### 6. **Error Handling & Logging**
- [ ] Implement comprehensive error handling
  - **server.js:100-104** - Gemini embedding API has fallback to random vectors (NOT ACCEPTABLE)
    ```javascript
    // Remove fallback, add proper error handling:
    } catch (err) {
      console.error('Gemini API Error:', err.message);
      throw new Error('Failed to generate embedding');
    }
    ```

- [ ] Add structured logging
  ```javascript
  // Replace console.log with winston or pino
  const winston = require('winston');
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });
  ```

- [ ] Log all critical events:
  - API failures
  - Database connection issues
  - Authentication failures
  - File upload errors
  - ChromaDB errors

- [ ] Implement error monitoring service
  - Sentry, Rollbar, or New Relic
  - Track error rates and performance

### 7. **File Upload Security**
- [ ] Add file upload restrictions (**server.js:59, 145-241**)
  ```javascript
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
        cb(new Error('Invalid file type'));
      }
    }
  });
  ```

- [ ] Implement virus scanning (ClamAV or cloud service)
- [ ] Move uploaded files to secure storage (S3, GCS, Azure Blob)
- [ ] Clean up temporary files even on error
- [ ] Encrypt sensitive documents at rest

### 8. **API Rate Limiting**
- [ ] Implement rate limiting for REST endpoints
  ```javascript
  const rateLimit = require('express-rate-limit');

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests from this IP'
  });

  app.use('/api/', apiLimiter);
  ```

- [ ] Rate limit Socket.io connections
  ```javascript
  // Track connections per IP/user
  const connectionRateLimiter = new Map();
  ```

- [ ] Implement Gemini API call throttling
  - Current free tier: 15 RPM (requests per minute)
  - Add queue system or caching for responses

### 9. **Session Management**
- [ ] Review session configuration (**server.js:42-55**)
  - Current: 7-day cookie expiry
  - Enable `secure: true` in production (HTTPS only)
  - Consider shorter expiry for production

  ```javascript
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day for production
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    sameSite: 'strict' // CSRF protection
  }
  ```

- [ ] Implement session invalidation on logout
- [ ] Add session cleanup job for expired sessions

### 10. **ChromaDB Production Setup**
- [ ] Move ChromaDB from localhost to production instance
  - Current: `localhost:8000` (**server.js:23**)
  - Options: Self-hosted with Docker, or ChromaDB Cloud

  ```javascript
  const chroma = new ChromaClient({
    host: process.env.CHROMA_HOST || 'localhost',
    port: process.env.CHROMA_PORT || 8000
  });
  ```

- [ ] Enable ChromaDB authentication if available
- [ ] Set up persistent storage for ChromaDB data
  - Current: Local SQLite database
  - Production: Persistent volume or managed service

- [ ] Implement ChromaDB backup strategy
- [ ] Add error handling for ChromaDB failures (**server.js:157-178**)

---

## 🟢 MEDIUM PRIORITY ENHANCEMENTS

### 11. **Performance Optimization**
- [ ] Add response caching
  - Cache Gemini API responses for common queries
  - Use Redis for distributed caching

- [ ] Implement database query optimization
  - Limit conversation history retrieval (**server.js:123-126** already limits to 50)
  - Add pagination for conversations list
  - Use MongoDB aggregation pipelines

- [ ] Optimize text chunking (**server.js:80-87**)
  - Current: Simple 500-word chunks
  - Consider semantic chunking (sentence boundaries)
  - Add overlap between chunks for better context

- [ ] Enable gzip compression
  ```javascript
  const compression = require('compression');
  app.use(compression());
  ```

- [ ] Minify and bundle frontend assets
  - Current: Single `index.html` with inline JS/CSS
  - Use webpack or Vite for production builds

### 12. **Monitoring & Observability**
- [ ] Add health check endpoint enhancements (**server.js:117**)
  ```javascript
  app.get('/health', async (req, res) => {
    const health = {
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
      mongodb: 'checking',
      chromadb: 'checking',
      gemini: 'checking'
    };

    try {
      await mongoose.connection.db.admin().ping();
      health.mongodb = 'healthy';
    } catch (e) {
      health.mongodb = 'unhealthy';
      health.status = 'degraded';
    }

    // Add ChromaDB and Gemini health checks

    res.json(health);
  });
  ```

- [ ] Add `/readiness` endpoint for Kubernetes
- [ ] Implement metrics collection (Prometheus)
  - Request count, response time, error rates
  - Database connection pool stats
  - Gemini API usage and quota

- [ ] Set up application performance monitoring (APM)
  - New Relic, Datadog, or Elastic APM
  - Track slow queries and API calls

- [ ] Configure log aggregation
  - ELK stack, CloudWatch, or Datadog
  - Centralized logging for troubleshooting

### 13. **Backup & Disaster Recovery**
- [ ] Implement database backup strategy
  - MongoDB Atlas: Enable automatic backups (likely already enabled)
  - Define recovery point objective (RPO) and recovery time objective (RTO)
  - Test restore procedures

- [ ] Back up ChromaDB vector store
  - Export collections periodically
  - Store backups in S3/GCS

- [ ] Document disaster recovery procedures
- [ ] Create runbook for common issues

### 14. **Environment Configuration**
- [ ] Create `.env.example` file
  ```env
  # Server Configuration
  PORT=3000
  NODE_ENV=production

  # Database
  MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/chatbot

  # ChromaDB
  CHROMA_HOST=localhost
  CHROMA_PORT=8000

  # Google Gemini API
  GEMINI_API_KEY=your_api_key_here

  # Session
  SESSION_SECRET=your_random_secret_here

  # CORS
  ALLOWED_ORIGINS=https://yourdomain.com

  # File Upload
  MAX_FILE_SIZE=10485760
  UPLOAD_DIR=uploads
  ```

- [ ] Set up environment-specific configs
  - `development`, `staging`, `production`
  - Use tools like `dotenv-flow` or `config` package

- [ ] Validate required environment variables on startup
  ```javascript
  const requiredEnvVars = [
    'GEMINI_API_KEY',
    'MONGODB_URI',
    'SESSION_SECRET'
  ];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  });
  ```

### 15. **Code Quality & Testing**
- [ ] Add unit tests
  - Test database models (**models/User.js**, **models/Conversation.js**)
  - Test RAG chunking and embedding functions
  - Target: 70%+ code coverage

- [ ] Add integration tests
  - Test Socket.io event handlers
  - Test file upload endpoint
  - Test Gemini API integration

- [ ] Add end-to-end tests
  - Test complete chat flow
  - Test document upload and RAG retrieval
  - Use Playwright or Cypress

- [ ] Set up linting and formatting
  ```bash
  npm install --save-dev eslint prettier eslint-config-prettier
  ```

- [ ] Add pre-commit hooks (Husky)
  - Run linter before commit
  - Run tests before push

### 16. **Frontend Security**
- [ ] Update Socket.io CDN version (**index.html:270**)
  - Current: 4.7.2
  - Latest: Check for updates
  - Use SRI (Subresource Integrity) hashes

- [ ] Implement Content Security Policy (CSP)
  ```javascript
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "ws:", "wss:"]
      }
    }
  }));
  ```

- [ ] Fix hardcoded URLs in frontend (**index.html:272, 309, 452**)
  ```javascript
  // Replace hardcoded localhost:3000 with:
  const API_URL = window.location.origin;
  const socket = io(API_URL);
  ```

- [ ] Add CSRF protection for forms
  ```javascript
  const csrf = require('csurf');
  app.use(csrf({ cookie: true }));
  ```

- [ ] Implement XSS protection
  - Already has `escapeHtml()` function (**index.html:491-495**)
  - Verify it's used consistently

---

## 🔵 LOW PRIORITY / NICE-TO-HAVE

### 17. **Containerization**
- [ ] Create Dockerfile
  ```dockerfile
  FROM node:18-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .
  EXPOSE 3000
  CMD ["node", "server.js"]
  ```

- [ ] Create docker-compose.yml
  - Node.js app
  - MongoDB (or use Atlas)
  - ChromaDB
  - Redis (for caching)

- [ ] Create `.dockerignore`
  ```
  node_modules
  npm-debug.log
  .env
  .git
  .gitignore
  README.md
  uploads/*
  chroma/
  ```

### 18. **Kubernetes Deployment**
- [ ] Create Kubernetes manifests
  - Deployment
  - Service
  - ConfigMap
  - Secrets
  - Ingress

- [ ] Set up horizontal pod autoscaling (HPA)
- [ ] Configure persistent volumes for uploads
- [ ] Set up liveness and readiness probes

### 19. **CI/CD Pipeline**
- [ ] Set up GitHub Actions / GitLab CI
  ```yaml
  # .github/workflows/deploy.yml
  name: Deploy to Production
  on:
    push:
      branches: [main]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v2
        - run: npm install
        - run: npm test
    deploy:
      needs: test
      runs-on: ubuntu-latest
      steps:
        - name: Deploy to production
          run: # deployment commands
  ```

- [ ] Automated testing on PRs
- [ ] Automated deployment to staging
- [ ] Manual approval for production deployment

### 20. **Documentation**
- [ ] Create API documentation
  - Document REST endpoints
  - Document Socket.io events
  - Use Swagger/OpenAPI

- [ ] Write deployment guide
  - Step-by-step production deployment
  - Rollback procedures
  - Common troubleshooting

- [ ] Document architecture
  - System architecture diagram
  - Data flow diagrams
  - Database schema documentation

- [ ] Create runbook for operations team
  - How to monitor the system
  - How to scale resources
  - Emergency procedures

### 21. **Advanced Features**
- [ ] Implement conversation export
  - Allow users to download chat history
  - Support multiple formats (JSON, PDF, TXT)

- [ ] Add conversation search
  - Search across all user conversations
  - Full-text search in messages

- [ ] Implement conversation sharing
  - Generate shareable links
  - Control sharing permissions

- [ ] Add typing indicators
  - Show when bot is generating response
  - Show when other users are typing (if multi-user)

- [ ] Add message read receipts
- [ ] Add message reactions/feedback
- [ ] Implement conversation tags/categories

---

## 📊 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All critical security issues fixed
- [ ] All high priority improvements implemented
- [ ] Environment variables configured in production
- [ ] Database backups enabled
- [ ] Monitoring and logging set up
- [ ] Load testing completed
- [ ] Security audit completed

### Deployment Day
- [ ] Deploy to staging environment first
- [ ] Run smoke tests on staging
- [ ] Backup production database
- [ ] Deploy to production
- [ ] Verify health checks pass
- [ ] Monitor error rates and performance
- [ ] Test critical user flows

### Post-Deployment
- [ ] Monitor application logs for 24 hours
- [ ] Check error rates in monitoring dashboard
- [ ] Verify database performance
- [ ] Monitor API quota usage (Gemini)
- [ ] Collect user feedback
- [ ] Document any issues encountered
- [ ] Create post-mortem if issues occurred

---

## 🚨 INCIDENT RESPONSE PLAN

### Severity Levels
- **P0 (Critical):** Complete service outage - respond within 15 minutes
- **P1 (High):** Major functionality broken - respond within 1 hour
- **P2 (Medium):** Minor issues affecting some users - respond within 4 hours
- **P3 (Low):** Cosmetic issues - respond within 24 hours

### Common Issues & Solutions

#### 1. MongoDB Connection Failed
- Check MongoDB Atlas status
- Verify IP whitelist includes production server
- Check connection string environment variable
- Restart application if connection pool exhausted

#### 2. ChromaDB Not Responding
- Check ChromaDB service status
- Restart ChromaDB container/process
- Verify network connectivity
- Check disk space for SQLite database

#### 3. Gemini API Rate Limit Exceeded
- Implement request queuing
- Add caching for common queries
- Upgrade to paid Gemini API tier
- Show user-friendly error message

#### 4. High Memory Usage
- Check for memory leaks (use heap snapshots)
- Increase Node.js memory limit: `--max-old-space-size=4096`
- Scale horizontally (add more instances)
- Optimize in-memory `ragDocuments` (**server.js:76-77** - currently unused, can be removed)

#### 5. Slow Response Times
- Check database query performance
- Check Gemini API response times
- Check network latency
- Enable caching for responses
- Scale application instances

---

## 📝 CONFIGURATION REVIEW

### Current Issues in Code

#### ⚠️ server.js Issues
1. **Line 76-77:** `ragDocuments` and `ragIndex` defined but never used (dead code)
2. **Line 100-104:** Fallback to random vectors on error is NOT acceptable
3. **Line 273:** Hardcoded `userId = 'demo-user'` in frontend
4. **Line 334-336:** No error handling for ChromaDB retrieval failures (just logs)
5. **No input validation:** Message length, convoId format, userId format

#### ⚠️ index.html Issues
1. **Line 272:** Hardcoded `http://localhost:3000`
2. **Line 309, 452:** More hardcoded localhost URLs
3. **Line 491-495:** XSS prevention implemented (good!)
4. **No loading states:** Should show loading spinner when bot is thinking

#### ⚠️ Missing Files
1. No `package-lock.json` in version control (should be committed)
2. No `.env.example` file
3. No Dockerfile or docker-compose.yml
4. No test files

---

## ✅ SIGN-OFF

### Stakeholder Approvals Required
- [ ] **Development Team Lead** - Code review completed
- [ ] **Security Team** - Security audit passed
- [ ] **DevOps Team** - Infrastructure ready
- [ ] **Product Owner** - Features approved
- [ ] **QA Team** - Testing completed

### Final Production Deployment Approval
- [ ] All critical issues resolved
- [ ] All high priority issues resolved
- [ ] Rollback plan documented and tested
- [ ] On-call team notified and ready
- [ ] Go/No-Go meeting completed

**Deployment Authorized By:** _________________
**Date:** _________________
**Time:** _________________

---

## 📚 USEFUL COMMANDS

```bash
# Environment setup
cp .env.example .env
npm install

# Run in development
npm run dev

# Run in production
NODE_ENV=production npm start

# Check dependencies for vulnerabilities
npm audit
npm audit fix

# Database operations
mongodump --uri="<your-mongodb-uri>" --out=./backup
mongorestore --uri="<your-mongodb-uri>" ./backup

# Docker operations
docker build -t chatbot-app .
docker-compose up -d
docker-compose logs -f

# Kubernetes operations
kubectl apply -f k8s/
kubectl get pods
kubectl logs <pod-name>
kubectl rollout restart deployment/chatbot-app
```

---

**Document Version:** 1.0
**Prepared By:** VVIP Vibe Coding Team
**Next Review Date:** After Production Deployment
