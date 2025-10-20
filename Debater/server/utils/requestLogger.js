const { logger } = require('./logger');

function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;
    
    logger.info(`${method} ${url} - ${statusCode} - ${duration}ms - ${ip}`);
  });
  
  next();
}

module.exports = { requestLogger };