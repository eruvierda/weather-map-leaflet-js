import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/config.js';
import { connectDatabase } from './utils/database.js';
import weatherRoutes from './api/weatherRoutes.js';

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/weather', weatherRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.nodeEnv
  });
});

// Serve static files from frontend directory
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Catch-all route for SPA (if needed)
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.url.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.server.nodeEnv === 'development' ? err.message : undefined
  });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start Express server
    app.listen(config.server.port, config.server.host, () => {
      console.log('\n🚀 Weather API Server Running');
      console.log('================================');
      console.log(`   Environment: ${config.server.nodeEnv}`);
      console.log(`   URL: http://${config.server.host}:${config.server.port}`);
      console.log(`   Database: ${config.mongodb.dbName}`);
      console.log('================================\n');
      console.log('📡 Available endpoints:');
      console.log('   GET  /api/weather/city');
      console.log('   GET  /api/weather/grid');
      console.log('   GET  /api/weather/port');
      console.log('   GET  /api/weather/port/metadata');
      console.log('   GET  /api/weather/all');
      console.log('   GET  /api/weather/summary');
      console.log('   GET  /api/health');
      console.log('\n✨ Ready to serve weather data!\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
