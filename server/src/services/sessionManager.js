const Redis = require('ioredis');
const redisConfig = require('../config/redis');
const { SessionModel, QuestionModel, AnswerModel, EventModel, AntiCheatLogModel } = require('../models');
const logger = require('./logger');
const timerEngine = require('./timerEngine');
const socketManager = require('../sockets/socketManager');
const eventBus = require('../events/eventBus');

let redisClient = null;
const useMock = process.env.MOCK_REDIS === 'true' || process.env.NODE_ENV === 'test';

if (!useMock) {
  try {
    redisClient = new Redis(redisConfig);
  } catch (e) {
    logger.warn("SessionManager: Redis failed to initialize. Using database locking.");
  }
}

// State Machine transitions rules
const transitions = {
  CREATED: ["WAITING_FOR_CANDIDATE", "TERMINATED"],
  WAITING_FOR_CANDIDATE: ["INSTRUCTIONS", "TERMINATED"],
  INSTRUCTIONS: ["ROUND_STARTED", "TERMINATED"],
  ROUND_STARTED: ["QUESTION_ACTIVE", "TERMINATED"],
  QUESTION_ACTIVE: [
    "ANSWER_SUBMITTED",
    "PAUSED",
    "DISCONNECTED",
    "TERMINATED",
    "CHEATING_FLAGGED",
    "EXPIRED",
    "AUTO_SUBMITTED",
    "ABANDONED",
    "FAILED"
  ],
  PAUSED: ["QUESTION_ACTIVE", "TERMINATED", "ABANDONED"],
  ANSWER_SUBMITTED: ["AI_EVALUATING", "TERMINATED"],
  AI_EVALUATING: ["NEXT_QUESTION", "ROUND_COMPLETED", "TERMINATED"],
  NEXT_QUESTION: ["QUESTION_ACTIVE", "TERMINATED"],
  ROUND_COMPLETED: ["ROUND_STARTED", "FINAL_EVALUATION", "TERMINATED"],
  FINAL_EVALUATION: ["INTERVIEW_COMPLETED", "TERMINATED"],
  DISCONNECTED: ["QUESTION_ACTIVE", "TERMINATED", "ABANDONED"],
  CHEATING_FLAGGED: ["QUESTION_ACTIVE", "TERMINATED"],
  
  // Terminal States
  INTERVIEW_COMPLETED: [],
  TERMINATED: [],
  EXPIRED: [],
  AUTO_SUBMITTED: [],
  ABANDONED: [],
  FAILED: []
};

const SessionManager = {
  async acquireLock(sessionId) {
    const lockKey = `session_lock:${sessionId}`;
    try {
      if (redisClient && redisClient.status === 'ready') {
        const acquired = await redisClient.set(lockKey, 'locked', 'NX', 'PX', 10000); // 10s lease time
        return acquired === 'OK';
      }
    } catch (e) {
      logger.warn("Redis acquireLock error, using DB locking:", e.message);
    }

    // Database Fallback Lock
    const session = await SessionModel.findByPk(sessionId);
    if (!session) return false;
    if (session.processing_lock) {
      return false;
    }
    session.processing_lock = true;
    await session.save();
    return true;
  },

  async releaseLock(sessionId) {
    const lockKey = `session_lock:${sessionId}`;
    try {
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.del(lockKey);
      }
    } catch (e) {
      logger.warn("Redis releaseLock error:", e.message);
    }
    const session = await SessionModel.findByPk(sessionId);
    if (session) {
      session.processing_lock = false;
      await session.save();
    }
  },

  async createSession(candidateId, jobId, config = {}) {
    const defaultSettings = {
      question_time_limit: 90,
      round_duration: 1200,
      difficulty_progression: true,
      adaptive_questioning: true,
      max_pause_count: 2,
      max_pause_duration_seconds: 300,
      enable_adaptive_questions: true,
      enable_behavior_analysis: false
    };

    const session = await SessionModel.create({
      candidate_id: candidateId,
      job_id: jobId,
      status: 'CREATED',
      current_round: 1,
      current_question_index: 0,
      session_snapshot: {
        config: { ...defaultSettings, ...config },
        pauses_left: config.max_pause_count || defaultSettings.max_pause_count
      }
    });

    await eventBus.publish(session.id, 'SESSION_CREATED', { candidateId, jobId });
    return session;
  },

  async loadSession(sessionId) {
    return await SessionModel.findByPk(sessionId);
  },

  async updateSession(sessionId, updates) {
    const session = await SessionModel.findByPk(sessionId);
    if (!session) throw new Error("Session not found");
    return await session.update(updates);
  },

  async transitionState(sessionId, toState, reason = 'standard_flow', correlationId = null) {
    const lockAcquired = await this.acquireLock(sessionId);
    if (!lockAcquired) {
      throw new Error(`Concurreny Lock: Session ${sessionId} is currently processing another action`);
    }

    try {
      const session = await SessionModel.findByPk(sessionId);
      if (!session) throw new Error("Session not found");

      const fromState = session.status;

      // 1. FSM state validation check
      const allowed = transitions[fromState] || [];
      if (!allowed.includes(toState)) {
        throw new Error(`Invalid State Transition: Cannot transition session ${sessionId} from ${fromState} to ${toState}`);
      }

      // 2. Condition Guards Validation
      if (toState === 'ANSWER_SUBMITTED') {
        const remaining = await timerEngine.getRemainingTime(sessionId);
        if (remaining && remaining.isQuestionExpired) {
          logger.warn(`Transition Guard Triggered: Answer submitted after question timer expired for session: ${sessionId}`);
          // Redirecting to soft termination or auto-submission
          toState = 'AUTO_SUBMITTED';
        }
      }

      // Perform update
      session.status = toState;
      
      // Update dates if starting/ending
      if (toState === 'ROUND_STARTED' && !session.started_at) {
        session.started_at = new Date();
      }
      if (['INTERVIEW_COMPLETED', 'TERMINATED', 'EXPIRED', 'ABANDONED', 'FAILED'].includes(toState)) {
        session.completed_at = new Date();
        await timerEngine.clearTimer(sessionId);
      }

      await session.save();

      // Log to EventBus (Audit Trail Immutability)
      await eventBus.publish(sessionId, 'STATE_TRANSITION', {
        from_state: fromState,
        to_state: toState,
        reason
      }, correlationId);

      // Notify clients via sockets
      socketManager.emitToSession(sessionId, 'STATE_CHANGED', {
        sessionId,
        fromState,
        toState,
        reason
      });

      logger.info(`Session ${sessionId} successfully transitioned ${fromState} -> ${toState}`, { correlationId });
      return session;
    } finally {
      await this.releaseLock(sessionId);
    }
  },

  async recoverSession(sessionId) {
    const session = await SessionModel.findByPk(sessionId, {
      include: [
        { model: QuestionModel, as: 'questions' },
        { model: AnswerModel, as: 'answers' }
      ]
    });
    if (!session) return null;

    // Load active timer state
    const timers = await timerEngine.getRemainingTime(sessionId);

    // Build hydrated state
    const snapshot = {
      session_id: session.id,
      candidate_id: session.candidate_id,
      job_id: session.job_id,
      status: session.status,
      current_round: session.current_round,
      current_question_index: session.current_question_index,
      timers,
      evaluation_summary: session.evaluation_summary,
      ai_memory: session.ai_memory,
      session_snapshot: session.session_snapshot,
      questions: session.questions,
      answers: session.answers
    };

    logger.info(`Session ${sessionId} rehydrated and recovered successfully`);
    return snapshot;
  }
};

module.exports = SessionManager;
