const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    default: 'Guest User'
  },
  socketId: {
    type: String
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  preferences: {
    theme: {
      type: String,
      default: 'light'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastActive on each interaction
userSchema.methods.updateActivity = function() {
  this.lastActive = Date.now();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
