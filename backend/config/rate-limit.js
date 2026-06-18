const rateLimit = require('express-rate-limit');

/**
 * Auth limiter: 10 requests / 15 minutes per IP
 * Protects login against brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Upload limiter: 30 requests / minute per IP
 * Prevents storage flooding via file upload endpoints.
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu tải lên. Vui lòng thử lại sau.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * AI limiter: 5 requests / minute per IP
 * Prevents AI API key exhaustion.
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu AI. Vui lòng thử lại sau 1 phút.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

module.exports = { authLimiter, uploadLimiter, aiLimiter };
