const { loadEnv } = require('./config/env');
const { connectDB } = require('./config/database');
const { logger, httpLogger } = require('./utils/logger');

const config = loadEnv();

const express = require('express');
const http = require('http');
const cors = require('cors');

const { createLLM } = require('./llm');
const { createDebateRouter } = require('./routes/debate');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const { setupSecurity } = require('./middleware/security');
const { generalLimiter, debateLimiter } = require('./middleware/rateLimiter');
const { requestLogger } = require('./utils/requestLogger');

console.log('');
console.log('🎭 ============================================');
console.log('🎭    ATHENA DEBATE SERVER                   ');
console.log('🎭    Made by a 16yo who drinks too much     ');
console.log('🎭    coffee and codes at 2am ☕              ');
console.log('🎭 ============================================');
console.log('');
console.log('🚀 Starting server...');

const app = express();

const PORT = config.port;

setupSecurity(app);

app.use(requestLogger);

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'file://'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  credentials: true
}));

app.use(express.json());

app.use('/api/debate', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use('/api/', generalLimiter);

const llm = createLLM();

const debateRouter = createDebateRouter(llm);
app.use('/api/debate/start', debateLimiter);
app.use('/api/debate', debateRouter);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Server is running fr fr! 💯',
    timestamp: new Date().toISOString()
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    console.log('');
    console.log('🔌 Connecting to MongoDB...');
    
    try {
      await connectDB();
    } catch (dbError) {
      console.warn('⚠️ Running without database');
    }

    console.log('');
    console.log('🌐 Starting HTTP server...');
    
    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║                                              ║');
      console.log(`║  🎉 SERVER LIVE! Port ${PORT}                 ║`);
      console.log('║                                              ║');
      console.log('║  📍 Local:  http://localhost:' + PORT + '          ║');
      console.log('║                                              ║');
      console.log('║  🎯 Endpoints:                               ║');
      console.log('║     POST   /api/debate/start                 ║');
      console.log('║     GET    /api/debate/state                 ║');
      console.log('║     POST   /api/debate/conclude              ║');
      console.log('║     GET    /health                           ║');
      console.log('║                                              ║');
      console.log('║  Mode: HTTP Polling (WebSockets disabled)    ║');
      console.log('║                                              ║');
      console.log('║  💯 Ready to debate fr fr! 🔥                ║');
      console.log('║                                              ║');
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
      
      logger.info('Server started', { port: PORT });
    });

    process.on('SIGTERM', async () => {
      console.log('');
      console.log('⚠️ SIGTERM - shutting down...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('');
      console.log('⚠️ SIGINT (Ctrl+C) - shutting down...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('');
    console.error('💥 ═══════════════════════════════════════════');
    console.error('💥  FATAL: Server failed to start!');
    console.error('💥 ═══════════════════════════════════════════');
    console.error('');
    console.error('Error:', error);
    console.error('');
    
    logger.error('Server startup failed', { error: error.message });
    process.exit(1);
  }
}

startServer();
