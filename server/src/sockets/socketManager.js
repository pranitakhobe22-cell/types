const socketIo = require('socket.io');
const logger = require('../services/logger');
const { SessionModel, EventModel } = require('../models');

class SocketManager {
  constructor() {
    this.io = null;
  }

  init(server) {
    // Initialize Socket.IO instance
    this.io = socketIo(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      logger.info(`Socket client connected: ${socket.id}`);

      // Reconnect / Join Room strategy
      socket.on('join_session', async ({ sessionId, lastEventSequence, correlationId }) => {
        try {
          if (!sessionId) {
            socket.emit('error', { message: 'Session ID is required' });
            return;
          }

          // 1. Verify / Load session
          const session = await SessionModel.findByPk(sessionId);
          if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
          }

          // 2. Join session room (room-based tracking)
          socket.join(sessionId);
          logger.info(`Socket ${socket.id} joined session room: ${sessionId}`, { correlationId });

          // 3. Fetch and re-emit latest state snapshot
          socket.emit('session_state', {
            status: session.status,
            current_round: session.current_round,
            current_question_index: session.current_question_index,
            round_timer: session.round_timer,
            question_timer: session.question_timer,
            session_snapshot: session.session_snapshot
          });

          // 4. Replay missed critical events (recovery support)
          if (lastEventSequence !== undefined && lastEventSequence !== null) {
            const { Op } = require('sequelize');
            const missedEvents = await EventModel.findAll({
              where: {
                session_id: sessionId,
                event_sequence: {
                  [Op.gt]: Number(lastEventSequence)
                }
              },
              order: [['event_sequence', 'ASC']]
            });

            for (const event of missedEvents) {
              socket.emit('replay_event', {
                eventType: event.event_type,
                payload: event.event_payload,
                eventSequence: event.event_sequence
              });
            }
          }

          socket.emit('joined_successfully', { sessionId });
        } catch (err) {
          logger.error(`Error on join_session for socket ${socket.id}:`, {
            error: err,
            sessionId
          });
          socket.emit('error', { message: 'Failed to join session room' });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Socket client disconnected: ${socket.id}`);
      });
    });

    logger.info("✅ SocketManager initialized successfully.");
  }

  emitToSession(sessionId, event, payload) {
    if (!this.io) {
      logger.warn(`SocketManager not initialized. Cannot emit ${event} to session ${sessionId}.`);
      return;
    }
    this.io.to(sessionId).emit(event, payload);
    logger.debug(`Socket emitted ${event} to session room: ${sessionId}`);
  }

  // Abstraction supporting streaming partial AI responses
  emitStreamToSession(sessionId, event, chunk, isFinal = false) {
    this.emitToSession(sessionId, event, { chunk, isFinal });
  }
}

const socketManager = new SocketManager();
module.exports = socketManager;
