const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log(`[db] MongoDB connected: ${env.MONGODB_URI}`);
  } catch (error) {
    console.error('[db] MongoDB connection error:', error.message);
    process.exit(1);
  }
  return mongoose.connection;
}

module.exports = connectDB;