const express = require('express');
const router = express.Router();
const AntiCheatEngine = require('../services/antiCheatEngine');
const logger = require('../services/logger');

// POST /api/anti-cheat/log
// Receives cheating violations from the frontend and securely logs them
router.post('/log', async (req, res) => {
  const { sessionId, violationType, severity, metadata } = req.body;
  const correlationId = req.headers['x-correlation-id'];

  if (!sessionId || !violationType || !severity) {
    return res.status(400).json({ error: 'Missing required fields: sessionId, violationType, severity' });
  }

  try {
    const log = await AntiCheatEngine.logViolation(sessionId, {
      violationType,
      severity,
      metadata,
      correlationId
    });

    res.status(201).json({ success: true, logId: log.id });
  } catch (error) {
    logger.error('Error logging anti-cheat violation via API:', error);
    res.status(500).json({ error: 'Failed to log violation' });
  }
});

module.exports = router;
