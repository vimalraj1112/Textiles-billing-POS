require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  SERVER_PORT: parseInt(process.env.SERVER_PORT || '5000', 10),
  MONGODB_URI:
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mathi-collections',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Mathi Admin',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
};

module.exports = env;