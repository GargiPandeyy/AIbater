const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

function getTimestamp() {
  return new Date().toISOString();
}

function formatMessage(level, message, meta = {}) {
  const timestamp = getTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level}: ${message}${metaStr}`;
}

function logToConsole(level, message, meta) {
  const formatted = formatMessage(level, message, meta);
  
  if (level === LOG_LEVELS.ERROR) {
    console.error(formatted);
  } else if (level === LOG_LEVELS.WARN) {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

const logger = {
  error: (message, meta) => logToConsole(LOG_LEVELS.ERROR, message, meta),
  warn: (message, meta) => logToConsole(LOG_LEVELS.WARN, message, meta),
  info: (message, meta) => logToConsole(LOG_LEVELS.INFO, message, meta),
  debug: (message, meta) => logToConsole(LOG_LEVELS.DEBUG, message, meta)
};

function httpLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  
  next();
}

console.log('📊 Logger initialized');

module.exports = { logger, httpLogger };
