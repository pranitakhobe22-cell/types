const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const logger = require('../services/logger');

// ─────────────────────────────────────────────────────────────────────────────
// GET /health — Basic server liveness
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage()
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /health/db — Database connectivity check
// ─────────────────────────────────────────────────────────────────────────────
router.get('/db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'healthy',
      database: sequelize.getDialect(),
      message: 'Database connection is active'
    });
  } catch (error) {
    logger.error('Health check DB failed:', { error });
    res.status(503).json({
      status: 'unhealthy',
      database: sequelize.getDialect(),
      message: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /health/redis — Redis connectivity check
// ─────────────────────────────────────────────────────────────────────────────
router.get('/redis', async (req, res) => {
  const useMock = process.env.MOCK_REDIS === 'true' || process.env.NODE_ENV === 'test';

  if (useMock) {
    return res.status(200).json({
      status: 'healthy',
      mode: 'mock',
      message: 'Redis is running in mock/in-memory mode'
    });
  }

  try {
    const Redis = require('ioredis');
    const redisConfig = require('../config/redis');
    const client = new Redis({ ...redisConfig, lazyConnect: true, connectTimeout: 3000 });
    await client.connect();
    const pong = await client.ping();
    await client.disconnect();

    res.status(200).json({
      status: 'healthy',
      mode: 'redis',
      ping: pong
    });
  } catch (error) {
    logger.error('Health check Redis failed:', { error });
    res.status(503).json({
      status: 'unhealthy',
      mode: 'redis',
      message: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /health/ai — AI provider availability check
// ─────────────────────────────────────────────────────────────────────────────
router.get('/ai', async (req, res) => {
  try {
    const circuitOpen = global.aiCircuitOpen && (Date.now() < global.aiCircuitResetTime);

    if (circuitOpen) {
      return res.status(200).json({
        status: 'degraded',
        provider: process.env.AI_PROVIDER || 'gemini',
        circuitBreaker: 'OPEN',
        failureCount: global.aiFailureCount || 0,
        message: 'AI provider circuit breaker is open — using static fallback questions'
      });
    }

    // Attempt a lightweight model call to verify connectivity
    const aiProvider = require('../providers');
    if (typeof aiProvider.generateQuestion === 'function') {
      // Don't actually generate — just verify the provider is instantiated
      return res.status(200).json({
        status: 'healthy',
        provider: process.env.AI_PROVIDER || 'gemini',
        circuitBreaker: 'CLOSED',
        failureCount: global.aiFailureCount || 0,
        apiKeyConfigured: !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)
      });
    }

    res.status(200).json({
      status: 'unknown',
      message: 'AI provider interface not fully resolved'
    });
  } catch (error) {
    logger.error('Health check AI failed:', { error });
    res.status(503).json({
      status: 'unhealthy',
      provider: process.env.AI_PROVIDER || 'gemini',
      message: error.message
    });
  }
});

module.exports = router;
