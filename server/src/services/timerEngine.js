const Redis = require('ioredis');
const redisConfig = require('../config/redis');
const logger = require('./logger');
const socketManager = require('../sockets/socketManager');

let redisClient = null;
const useMock = process.env.MOCK_REDIS === 'true' || process.env.NODE_ENV === 'test';

if (!useMock) {
  try {
    redisClient = new Redis(redisConfig);
    redisClient.on('error', (err) => {
      logger.warn("TimerEngine: Redis Connection Error. Falling back to local cache.");
    });
  } catch (err) {
    logger.warn("TimerEngine: Redis client could not be created. Falling back to local cache.");
  }
}

// In-memory fallback
const localCache = new Map();

async function getTimerState(sessionId) {
  try {
    if (redisClient && redisClient.status === 'ready') {
      const data = await redisClient.get(`session_timer:${sessionId}`);
      return data ? JSON.parse(data) : null;
    }
  } catch (e) {
    logger.warn("TimerEngine failed reading from Redis:", e.message);
  }
  return localCache.get(sessionId) || null;
}

async function setTimerState(sessionId, timerState) {
  try {
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.set(`session_timer:${sessionId}`, JSON.stringify(timerState), 'EX', 7200); // 2 hours TTL
      return;
    }
  } catch (e) {
    logger.warn("TimerEngine failed writing to Redis:", e.message);
  }
  localCache.set(sessionId, timerState);
}

async function clearTimerState(sessionId) {
  try {
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.del(`session_timer:${sessionId}`);
      return;
    }
  } catch (e) {
    logger.warn("TimerEngine failed deleting from Redis:", e.message);
  }
  localCache.delete(sessionId);
}

const TimerEngine = {
  async startTimer(sessionId, { interviewDuration, roundDuration, questionDuration }) {
    const now = Date.now();
    const currentState = await getTimerState(sessionId) || {};

    const timerState = {
      sessionId,
      interview_started_at: currentState.interview_started_at || now,
      interview_duration_seconds: currentState.interview_duration_seconds || interviewDuration || 3600,
      
      round_started_at: roundDuration ? now : currentState.round_started_at || null,
      round_duration_seconds: roundDuration ? roundDuration : currentState.round_duration_seconds || null,
      
      question_started_at: questionDuration ? now : null,
      question_duration_seconds: questionDuration ? questionDuration : null
    };

    await setTimerState(sessionId, timerState);
    logger.info(`Timers initialized/updated for session: ${sessionId}`, { timerState });

    // Sync state via WebSockets
    this.broadcastTimerUpdate(sessionId, timerState);
  },

  async getRemainingTime(sessionId) {
    const timerState = await getTimerState(sessionId);
    if (!timerState) return null;

    const now = Date.now();

    // Dynamically calculate remaining seconds using server timestamp delta
    const interviewElapsed = Math.floor((now - timerState.interview_started_at) / 1000);
    const remainingInterview = Math.max(0, timerState.interview_duration_seconds - interviewElapsed);

    let remainingRound = null;
    if (timerState.round_started_at) {
      const roundElapsed = Math.floor((now - timerState.round_started_at) / 1000);
      remainingRound = Math.max(0, timerState.round_duration_seconds - roundElapsed);
    }

    let remainingQuestion = null;
    if (timerState.question_started_at) {
      const questionElapsed = Math.floor((now - timerState.question_started_at) / 1000);
      remainingQuestion = Math.max(0, timerState.question_duration_seconds - questionElapsed);
    }

    return {
      remainingInterview,
      remainingRound,
      remainingQuestion,
      isQuestionExpired: remainingQuestion !== null && remainingQuestion <= 0,
      isRoundExpired: remainingRound !== null && remainingRound <= 0,
      isInterviewExpired: remainingInterview <= 0
    };
  },

  async clearTimer(sessionId) {
    await clearTimerState(sessionId);
    logger.info(`Cleared timers for session: ${sessionId}`);
  },

  broadcastTimerUpdate(sessionId, timerState) {
    const now = Date.now();
    const updatePayload = {
      sessionId,
      serverTime: now,
      interview: {
        startedAt: timerState.interview_started_at,
        duration: timerState.interview_duration_seconds
      },
      round: timerState.round_started_at ? {
        startedAt: timerState.round_started_at,
        duration: timerState.round_duration_seconds
      } : null,
      question: timerState.question_started_at ? {
        startedAt: timerState.question_started_at,
        duration: timerState.question_duration_seconds
      } : null
    };

    socketManager.emitToSession(sessionId, 'TIMER_UPDATED', updatePayload);
  }
};

module.exports = TimerEngine;
