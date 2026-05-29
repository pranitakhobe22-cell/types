require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const sequelize = require('./src/config/database');
const { runMigrations } = require('./src/config/migrationsRunner');
const socketManager = require('./src/sockets/socketManager');

// Routes
const interviewRoutes = require('./src/routes/interviewRoutes');
const healthRoutes = require('./src/routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Inject correlation ID on every incoming request if not present
app.use((req, res, next) => {
  if (!req.headers['x-correlation-id']) {
    req.headers['x-correlation-id'] = uuidv4();
  }
  res.setHeader('X-Correlation-ID', req.headers['x-correlation-id']);
  next();
});

// ─── Route Mounting ──────────────────────────────────────────────────────────

// New interview workflow routes
app.use('/api/interview', interviewRoutes);

// Health check endpoints
app.use('/health', healthRoutes);

// Backward-compatible legacy routes (keep existing frontend working)
try {
  const legacyRoutes = require('./src/routes/legacyRoutes');
  app.use('/api/interviews', legacyRoutes);
} catch (e) {
  // Legacy routes file may not exist — that's fine
  console.log('ℹ️  No legacy routes found, skipping /api/interviews mount.');
}

// ─── Database Sync & Server Start ────────────────────────────────────────────
async function startServer() {
  try {
    console.log("⏳ Authenticating database connection...");
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Run migrations instead of sync({ alter: true })
    console.log("⏳ Running database migrations...");
    await runMigrations(sequelize);
    console.log('✅ Migrations complete.');

    // Still sync remaining models that don't have explicit migrations
    // (backward-compat Interview/Question/Answer models)
    console.log("⏳ Synchronizing legacy models...");
    await sequelize.sync();
    console.log('✅ Legacy model sync complete.');

    // Create HTTP server (needed for Socket.IO)
    const server = http.createServer(app);

    // Initialize Socket.IO via SocketManager
    socketManager.init(server);
    console.log('✅ Socket.IO initialized.');

    // Start listening
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API Server running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
      console.log(`📋 Interview API: http://localhost:${PORT}/api/interview`);
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err.message);
    process.exit(1);
  }
}

startServer();
