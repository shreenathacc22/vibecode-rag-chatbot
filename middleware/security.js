const multer = require('multer');
const rateLimit = require('express-rate-limit');

// Enhanced file upload configuration with security
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 5, // Max 5 files per upload
    fieldSize: 1 * 1024 * 1024 // 1MB max for text fields
  },
  fileFilter: (req, file, cb) => {
    // Whitelist allowed MIME types
    const allowedTypes = ['application/pdf', 'text/plain'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and TXT files are allowed.'));
    }
  }
});

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// File upload rate limiting (more restrictive)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count successful uploads
});

// Conversation access rate limiting
const conversationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    error: 'Too many conversation requests, please slow down.',
    retryAfter: '1 minute'
  }
});

// Message sending rate limiting
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: {
    error: 'Too many messages sent, please slow down.',
    retryAfter: '1 minute'
  }
});

// Input validation middleware
const validateMessageInput = (req, res, next) => {
  const { message, convoId, sender } = req.body;

  // Validate message
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }

  // Message length validation
  if (message.length === 0 || message.length > 5000) {
    return res.status(400).json({ error: 'Message must be between 1 and 5000 characters' });
  }

  // Validate convoId format
  if (!convoId || typeof convoId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(convoId)) {
    return res.status(400).json({ error: 'Invalid conversation ID format' });
  }

  // Validate sender
  if (!sender || (sender !== 'user' && sender !== 'bot')) {
    return res.status(400).json({ error: 'Invalid sender value' });
  }

  next();
};

// Validate conversation ID
const validateConvoId = (req, res, next) => {
  const { convoId } = req.params || req.body;

  if (!convoId || typeof convoId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(convoId)) {
    return res.status(400).json({ error: 'Invalid conversation ID format' });
  }

  next();
};

// Validate user ID
const validateUserId = (req, res, next) => {
  const { userId } = req.params || req.body;

  if (!userId || typeof userId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }

  next();
};

// Sanitize HTML/XSS
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 5 files.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field.' });
    }
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }

  if (err) {
    return res.status(400).json({ error: err.message });
  }

  next();
};

module.exports = {
  upload,
  apiLimiter,
  uploadLimiter,
  conversationLimiter,
  messageLimiter,
  validateMessageInput,
  validateConvoId,
  validateUserId,
  sanitizeInput,
  handleMulterError
};
