const rateLimit = require('express-rate-limit');

const shouldSkip = (req) => {
  const isLocalhost = ['127.0.0.1', '::1', 'localhost'].includes(req.hostname) || req.ip === '::1';
  const useMock = process.env.USE_MOCK === '1' || process.env.NODE_ENV === 'development';
  return isLocalhost || useMock;
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests',
    message: 'Slow down! Max 100 requests per 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  handler: (req, res) => {
    console.log(`🚨 Rate limit hit by ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Slow down! Max 100 requests per 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: {
    error: 'Rate limit exceeded',
    message: 'Too fast! Max 10 requests per 5 minutes.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
});

const debateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: 'Debate limit reached',
    message: 'Creating debates too fast! Max 5 per minute.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  handler: (req, res) => {
    console.log(`🚨 Debate spam from ${req.ip}`);
    res.status(429).json({
      error: 'Debate limit reached',
      message: 'Max 5 debates per minute.',
      retryAfter: '60 seconds'
    });
  }
});

console.log('🛡️ Rate limiters loaded!');

module.exports = {
  generalLimiter,
  strictLimiter,
  debateLimiter
};
