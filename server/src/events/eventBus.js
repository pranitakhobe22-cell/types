const EventEmitter = require('events');
const { EventModel } = require('../models');
const logger = require('../services/logger');

class EventBus extends EventEmitter {
  async publish(sessionId, eventType, payload = {}, correlationId = null) {
    try {
      // Get the next sequence number by counting existing events for this session
      const count = await EventModel.count({ where: { session_id: sessionId } });
      const nextSequence = count + 1;

      // Persist to database first (Audit Trail Immutability)
      const dbEvent = await EventModel.create({
        session_id: sessionId,
        event_type: eventType,
        event_payload: payload,
        event_sequence: nextSequence,
        correlation_id: correlationId
      });

      logger.info(`Event Published: ${eventType}`, {
        sessionId,
        eventType,
        eventSequence: nextSequence,
        correlationId
      });

      // Emit specific event type
      this.emit(eventType, {
        id: dbEvent.id,
        sessionId,
        eventType,
        payload,
        eventSequence: nextSequence,
        correlationId
      });

      // Emit general wildcard event
      this.emit('*', {
        id: dbEvent.id,
        sessionId,
        eventType,
        payload,
        eventSequence: nextSequence,
        correlationId
      });

      return dbEvent;
    } catch (error) {
      logger.error(`Failed to publish event ${eventType} for session ${sessionId}:`, {
        error,
        sessionId,
        correlationId
      });
      throw error;
    }
  }
}

const eventBus = new EventBus();
module.exports = eventBus;
