const Redis = require('ioredis');
const redisConfig = require('../config/redis');
const { AnswerModel, SessionModel } = require('../models');
const timerEngine = require('./timerEngine');
const sessionManager = require('./sessionManager');
const eventBus = require('../events/eventBus');
const logger = require('./logger');

let redisClient = null;
const useMock = process.env.MOCK_REDIS === 'true' || process.env.NODE_ENV === 'test';

if (!useMock) {
  try {
    redisClient = new Redis(redisConfig);
  } catch (e) {
    logger.warn("AnswerProcessor: Redis failed to initialize. Using in-memory idempotency cache.");
  }
}

const localIdempotencyCache = new Set();

function sanitizeInput(text) {
  if (!text) return "";
  
  // 1. Strip script tags, HTML tags
  let sanitized = text.replace(/<[^>]*>?/gm, '');

  // 2. Remove malicious command patterns to prevent prompt injection
  const injectionPatterns = [
    /ignore\s+previous\s+instructions/gi,
    /ignore\s+all\s+previous\s+instructions/gi,
    /system\s+override/gi,
    /bypass\s+restriction/gi,
    /give\s+me\s+a\s+perfect\s+score/gi,
    /forget\s+what\s+i\s+said/gi,
    /new\s+role\s+context/gi
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[REMOVED_PROMPT_INJECTION_ATTEMPT]');
  }

  // 3. Limit total answer length to prevent buffer overruns/spam
  if (sanitized.length > 5000) {
    sanitized = sanitized.substring(0, 5000);
  }

  return sanitized.trim();
}

const AnswerProcessor = {
  async checkIdempotency(idempotencyKey) {
    if (!idempotencyKey) return true; // No key, bypass

    const key = `idempotency:${idempotencyKey}`;
    try {
      if (redisClient && redisClient.status === 'ready') {
        const result = await redisClient.set(key, 'processed', 'NX', 'EX', 86400); // 24 hours expiry
        return result === 'OK';
      }
    } catch (e) {
      logger.warn("Redis idempotency check failed. Using memory cache:", e.message);
    }

    if (localIdempotencyCache.has(idempotencyKey)) {
      return false;
    }
    localIdempotencyCache.add(idempotencyKey);
    // Auto-expiry fallback
    setTimeout(() => localIdempotencyCache.delete(idempotencyKey), 86400 * 1000);
    return true;
  },

  async processAnswer({ sessionId, questionId, answerText, rawTranscript, confidenceScore, transcriptConfidence, lowConfidenceSegments, detectedPauses, idempotencyKey, correlationId }) {
    // 1. Enforce idempotency header check
    const isUnique = await this.checkIdempotency(idempotencyKey);
    if (!isUnique) {
      logger.warn(`Duplicate submission detected (Idempotency Key): ${idempotencyKey}`);
      throw new Error("Duplicate submission blocked: request already processed");
    }

    // 2. Verify and load session
    const session = await sessionManager.loadSession(sessionId);
    if (!session) {
      throw new Error("Interview session not found");
    }

    if (session.status !== 'QUESTION_ACTIVE') {
      throw new Error(`Cannot submit answer. Session is currently in state: ${session.status}`);
    }

    // 3. Validate timer
    const remaining = await timerEngine.getRemainingTime(sessionId);
    if (remaining && remaining.isQuestionExpired) {
      logger.warn(`Submission blocked: Timer expired for session ${sessionId}`);
      // Transition session to EXPIRED
      await sessionManager.transitionState(sessionId, 'EXPIRED', 'question_timeout', correlationId);
      throw new Error("Cannot submit answer: Time has expired");
    }

    // 4. Sanitize input
    const cleanAnswer = sanitizeInput(answerText);

    // 5. Unique DB constraint check to prevent duplicate answers for same question
    const existing = await AnswerModel.findOne({
      where: { session_id: sessionId, question_id: questionId }
    });
    if (existing) {
      throw new Error("An answer has already been submitted for this question");
    }

    // 6. Transition state using FSM rules
    await sessionManager.transitionState(sessionId, 'ANSWER_SUBMITTED', 'candidate_submission', correlationId);

    // 7. Store in Database
    const answer = await AnswerModel.create({
      session_id: sessionId,
      question_id: questionId,
      answer_text: cleanAnswer,
      raw_transcript: rawTranscript,
      confidence_score: confidenceScore || 0,
      transcript_confidence: transcriptConfidence || 0,
      low_confidence_segments: lowConfidenceSegments || null,
      detected_pauses: detectedPauses || null,
      submitted_at: new Date()
    });

    // 8. Publish ANSWER_SUBMITTED event via eventBus
    // This will asynchronously trigger AI evaluation and other integrations in the background
    await eventBus.publish(sessionId, 'ANSWER_SUBMITTED', {
      answerId: answer.id,
      questionId,
      submittedAt: answer.submitted_at
    }, correlationId);

    logger.info(`Answer successfully saved and submission event emitted for session: ${sessionId}`);
    
    return {
      answerId: answer.id,
      status: 'submitted',
      message: 'Answer submission successfully queued for evaluation'
    };
  }
};

module.exports = AnswerProcessor;
