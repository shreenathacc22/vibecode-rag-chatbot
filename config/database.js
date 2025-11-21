const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot', {
      serverSelectionTimeoutMS: 30000, // Timeout after 30s instead of 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      retryWrites: true,
      w: 'majority'
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Make sure MongoDB is running and network access is configured.');
    console.error('For MongoDB Atlas: Check Network Access allows 0.0.0.0/0');
    process.exit(1);
  }
};

module.exports = connectDB;
