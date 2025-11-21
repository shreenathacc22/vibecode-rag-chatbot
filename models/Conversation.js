const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'bot']
  },
  message: {
    type: String,
    required: true
  },
  ts: {
    type: Date,
    default: Date.now
  },
  metadata: {
    ragContext: {
      type: Boolean,
      default: false
    },
    chunks: {
      type: Number,
      default: 0
    }
  }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  convoId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  messages: [messageSchema],
  documentContext: {
    files: [{
      filename: String,
      uploadedAt: Date,
      chunks: Number,
      words: Number
    }],
    lastUpload: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add message to conversation
conversationSchema.methods.addMessage = function(message) {
  this.messages.push(message);
  this.updatedAt = Date.now();
  return this.save();
};

// Clear messages
conversationSchema.methods.clearMessages = function() {
  this.messages = [];
  this.updatedAt = Date.now();
  return this.save();
};

// Get recent messages
conversationSchema.methods.getRecentMessages = function(limit = 50) {
  return this.messages.slice(-limit);
};

module.exports = mongoose.model('Conversation', conversationSchema);
