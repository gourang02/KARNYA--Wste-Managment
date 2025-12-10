const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: '.env' });

// Environment
const env = process.env.NODE_ENV || 'development';

// Server
const port = process.env.PORT || 5000;
const host = process.env.HOST || '0.0.0.0';

// JWT
const jwtSecret = process.env.JWT_SECRET || 'karnya_secret_key';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30d';
const jwtCookieExpiresIn = process.env.JWT_COOKIE_EXPIRES_IN || 30;

// Database
const db = {
  name: process.env.DB_NAME || 'karnya',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 27017,
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
};

// Email
const email = {
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: process.env.EMAIL_PORT || 2525,
  username: process.env.EMAIL_USERNAME || '',
  password: process.env.EMAIL_PASSWORD || '',
  from: process.env.EMAIL_FROM || 'Karnya <noreply@karnya.com>',
};

// Frontend
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

module.exports = {
  env,
  port,
  host,
  jwtSecret,
  jwtExpiresIn,
  jwtCookieExpiresIn,
  db,
  email,
  frontendUrl,
};
