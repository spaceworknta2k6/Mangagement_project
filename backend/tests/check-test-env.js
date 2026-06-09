const { loadEnv } = require('../config/env');
const { assertSafeTestDatabase } = require('./test-db-guard');

process.env.NODE_ENV = 'test';
loadEnv();
assertSafeTestDatabase();

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required test environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Test environment is configured with a safe test database.');
