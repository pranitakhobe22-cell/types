const { AntiCheatLogModel } = require('../models');
const eventBus = require('../events/eventBus');
const logger = require('./logger');

const AntiCheatEngine = {
  async logViolation(sessionId, { violationType, severity, metadata, correlationId = null }) {
    try {
      // Event sequence is monotonic per session
      const count = await AntiCheatLogModel.count({ where: { session_id: sessionId } });
      const nextSequence = count + 1;

      const log = await AntiCheatLogModel.create({
        session_id: sessionId,
        violation_type: violationType,
        severity,
        metadata,
        event_sequence: nextSequence,
        correlation_id: correlationId
      });

      logger.warn(`Anti-Cheat Violation detected for session ${sessionId}: ${violationType} (${severity})`, {
        sessionId,
        violationType,
        severity,
        correlationId
      });

      // Publish cheating flagged event
      await eventBus.publish(sessionId, 'CHEATING_FLAGGED', {
        violationId: log.id,
        violationType,
        severity,
        metadata
      }, correlationId);

      return log;
    } catch (error) {
      logger.error(`Failed to log anti-cheat violation for session ${sessionId}:`, error);
      throw error;
    }
  }
};

module.exports = AntiCheatEngine;
