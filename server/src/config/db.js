const mongoose = require('mongoose');
const env = require('./env');

function maskUri(uri) {
  try {
    return uri.replace(/\/\/[^@]+@/, '//***:***@');
  } catch {
    return 'UNREADABLE_URI';
  }
}

async function connectDB() {
  try {
    console.log(`[db] connecting to: ${maskUri(env.MONGODB_URI)}`);
    await mongoose.connect(env.MONGODB_URI);
    console.log(`[db] MongoDB connected: ${maskUri(env.MONGODB_URI)}`);
  } catch (error) {
    console.error('[db] MongoDB connection error:', error.message);
    process.exit(1);
  }
  return mongoose.connection;
}

module.exports = connectDB;