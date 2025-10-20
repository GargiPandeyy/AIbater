const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

function loadEnv() {
  dotenv.config();
  console.log('📄 Loaded .env file');
  
  const localEnvPath = path.join(__dirname, '..', 'env.local');
  
  if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath, override: true });
    console.log('✅ Loaded env.local with overrides');
  } else {
    console.log('ℹ️ No env.local file');
  }

  const config = {
    port: parseInt(process.env.PORT, 10) || 3001,
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    mongodbUri: process.env.MONGODB_URI || process.env.DATABASE_URL || '',
    nodeEnv: process.env.NODE_ENV || 'development',
    allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173'
  };

  console.log('⚙️ Config loaded:', {
    port: config.port,
    hasGeminiKey: !!config.geminiApiKey,
    hasMongoUri: !!config.mongodbUri,
    nodeEnv: config.nodeEnv,
    origins: config.allowedOrigins
  });

  return config;
}

module.exports = { loadEnv };
