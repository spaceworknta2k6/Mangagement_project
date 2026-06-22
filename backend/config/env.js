const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const loadEnv = () => {
  const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
  const envPath = path.join(__dirname, '..', envFile);
  const fallbackPath = path.join(__dirname, '..', '.env');

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    return envPath;
  }

  if (process.env.NODE_ENV === 'test') {
    if (process.env.MONGODB_URI) {
      console.warn('Warning: backend/.env.test not found; using existing test environment variables.');
      return null;
    }

    throw new Error('backend/.env.test is required for NODE_ENV=test. Refusing to fall back to backend/.env.');
  }

  dotenv.config({ path: fallbackPath });
  return fallbackPath;
};

module.exports = {
  loadEnv,
};
