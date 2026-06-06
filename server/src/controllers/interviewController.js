const { v4: uuidv4 } = require('uuid');
const sessionManager = require('../services/sessionManager');
const answerProcessor = require('../services/answerProcessor');
const aiOrchestrator = require('../services/aiOrchestrator');
const timerEngine = require('../services/timerEngine');
const evaluationEngine = require('../services/evaluationEngine');
const logger = require('../services/logger');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/start
// Body: { candidateId, jobId, config? }
// ─────────────────────────────────────────────────────────────────────────────
exports.startInterview = async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  try {
    const { candidateId, jobId, config = {} } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({
        error: 'candidateId and jobId are required',
        correlationId
      });
    }

    // 1. Create session via SessionManager (state: CREATED)
    const session = await sessionManager.createSession(candidateId, jobId, config);

    // 2. Transition to WAITING_FOR_CANDIDATE
    await sessionManager.transitionState(session.id, 'WAITING_FOR_CANDIDATE', 'session_start', correlationId);

    // 3. Transition to INSTRUCTIONS
    await sessionManager.transitionState(session.id, 'INSTRUCTIONS', 'instructions_phase', correlationId);

    // 4. Transition to ROUND_STARTED and kick off interview-level timer
    await sessionManager.transitionState(session.id, 'ROUND_STARTED', 'round_1_start', correlationId);
    const interviewDuration = config.interviewDuration || 3600;
    const roundDuration = config.roundDuration || 1200;
    await timerEngine.startTimer(session.id, { interviewDuration, roundDuration });

    // 5. Generate first question via AI Orchestrator
    const firstQuestion = await aiOrchestrator.generateNextQuestion(session.id);

    // 6. Start question timer and transition to QUESTION_ACTIVE
    const questionDuration = config.questionDuration || 90;
    await timerEngine.startTimer(session.id, { questionDuration });
    await sessionManager.transitionState(session.id, 'QUESTION_ACTIVE', 'first_question_ready', correlationId);

    logger.info(`Interview started for candidate ${candidateId}`, { sessionId: session.id, correlationId });

    return res.status(201).json({
      success: true,
      sessionId: session.id,
      status: 'QUESTION_ACTIVE',
      currentQuestion: {
        id: firstQuestion.id,
        questionText: firstQuestion.question_text,
        difficulty: firstQuestion.difficulty,
        topic: firstQuestion.topic
      },
      timers: {
        interviewDurationSeconds: interviewDuration,
        roundDurationSeconds: roundDuration,
        questionDurationSeconds: questionDuration
      },
      correlationId
    });
  } catch (error) {
    logger.error('startInterview error:', { error, correlationId });
    return res.status(500).json({ error: error.message, correlationId });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/interview/session/:id
// Returns full session snapshot (for reconnect/recovery)
// ─────────────────────────────────────────────────────────────────────────────
exports.getSession = async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  try {
    const { id } = req.params;
    const snapshot = await sessionManager.recoverSession(id);

    if (!snapshot) {
      return res.status(404).json({ error: 'Session not found', correlationId });
    }

    return res.status(200).json({ success: true, snapshot, correlationId });
  } catch (error) {
    logger.error('getSession error:', { error, correlationId });
    return res.status(500).json({ error: error.message, correlationId });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/submit-answer
// Body: { sessionId, questionId, answerText, rawTranscript?, confidenceScore? }
// Headers: Idempotency-Key (optional)
// ─────────────────────────────────────────────────────────────────────────────
exports.submitAnswer = async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  const idempotencyKey = req.headers['idempotency-key'] || null;

  try {
    const {
      sessionId,
      questionId,
      answerText,
      rawTranscript,
      confidenceScore,
      transcriptConfidence,
      lowConfidenceSegments,
      detectedPauses
    } = req.body;

    if (!sessionId || !questionId || !answerText) {
      return res.status(400).json({
        error: 'sessionId, questionId, and answerText are required',
        correlationId
      });
    }

    // Process answer (idempotency, state guards, sanitization, FSM, DB write, event emit)
    const result = await answerProcessor.processAnswer({
      sessionId,
      questionId,
      answerText,
      rawTranscript,
      confidenceScore,
      transcriptConfidence,
      lowConfidenceSegments,
      detectedPauses,
      idempotencyKey,
      correlationId
    });

    // Async: kick off AI evaluation → transition → next question
    setImmediate(() => _handlePostSubmission(sessionId, result.answerId, correlationId));

    return res.status(200).json({
      success: true,
      ...result,
      correlationId
    });
  } catch (error) {
    // Duplicate submission: 409 Conflict
    if (error.message.includes('Duplicate submission')) {
      return res.status(409).json({ error: error.message, correlationId });
    }
    // Timer expired or wrong state: 422
    if (error.message.includes('Time has expired') || error.message.includes('Cannot submit answer')) {
      return res.status(422).json({ error: error.message, correlationId });
    }
    logger.error('submitAnswer error:', { error, correlationId });
    return res.status(500).json({ error: error.message, correlationId });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/pause
// Body: { sessionId }
// ─────────────────────────────────────────────────────────────────────────────
exports.pauseInterview = async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required', correlationId });

    const session = await sessionManager.loadSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found', correlationId });

    // Guard: check pauses remaining
    const pausesLeft = session.session_snapshot?.pauses_left ?? 0;
    if (pausesLeft <= 0) {
      return res.status(422).json({ error: 'No pause allowances remaining', correlationId });
    }

    await sessionManager.transitionState(sessionId, 'PAUSED', 'candidate_pause_request', correlationId);

    // Decrement pauses_left in snapshot
    const updatedSnapshot = {
      ...session.session_snapshot,
      pauses_left: pausesLeft - 1,
      paused_at: Date.now()
    };
    await sessionManager.updateSession(sessionId, { session_snapshot: updatedSnapshot });

    return res.status(200).json({
      success: true,
      message: 'Interview paused',
      pausesRemaining: pausesLeft - 1,
      correlationId
    });
  } catch (error) {
    logger.error('pauseInterview error:', { error, correlationId });
    return res.status(500).json({ error: error.message, correlationId });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/resume
// Body: { sessionId }
// ─────────────────────────────────────────────────────────────────────────────
exports.resumeInterview = async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required', correlationId });

    await sessionManager.transitionState(sessionId, 'QUESTION_ACTIVE', 'candidate_resume_request', correlationId);

    return res.status(200).json({
      success: true,
      message: 'Interview resumed',
      correlationId
    });
  } catch (error) {
    logger.error('resumeInterview error:', { error, correlationId });
    return res.status(500).json({ error: error.message, correlationId });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/end
// Body: { sessionId }
// ─────────────────────────────────────────────────────────────────────────────
exports.endInterview = async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required', correlationId });

    await sessionManager.transitionState(sessionId, 'TERMINATED', 'admin_terminate', correlationId);

    return res.status(200).json({
      success: true,
      message: 'Interview terminated',
      correlationId
    });
  } catch (error) {
    logger.error('endInterview error:', { error, correlationId });
    return res.status(500).json({ error: error.message, correlationId });
  }
};

const proctoringValidator = require('../services/proctoringValidator');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/proctoring-report
// Body: { sessionId, report }
// ─────────────────────────────────────────────────────────────────────────────
exports.submitProctoringReport = async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  try {
    const { sessionId, report } = req.body;
    if (!sessionId || !report) {
       return res.status(400).json({ error: 'sessionId and report are required', correlationId });
    }

    const session = await sessionManager.loadSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found', correlationId });
    }

    const validationResult = proctoringValidator.validateProctoringReport(report, session.session_snapshot?.config);
    
    if (!validationResult.isValid) {
       logger.warn('Proctoring report validation failed', { sessionId, reason: validationResult.reason, correlationId });
       // We can choose to reject it, or accept it but flag the session. 
       // For now, let's flag the session.
       await sessionManager.updateSession(sessionId, {
         proctoring_flagged: true,
         proctoring_flag_reason: validationResult.reason
       });
    }

    // Save report to session snapshot or a dedicated proctoring table
    const updatedSnapshot = {
      ...session.session_snapshot,
      proctoring_report: report
    };
    await sessionManager.updateSession(sessionId, { session_snapshot: updatedSnapshot });

    logger.info(`Proctoring report saved for session ${sessionId}`, { correlationId, isValid: validationResult.isValid });

    return res.status(200).json({
      success: true,
      isValid: validationResult.isValid,
      message: 'Proctoring report processed',
      correlationId
    });
  } catch (error) {
    logger.error('submitProctoringReport error:', { error, correlationId });
    return res.status(500).json({ error: error.message, correlationId });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/interview/time
// Server clock sync endpoint
// ─────────────────────────────────────────────────────────────────────────────
exports.getServerTime = (req, res) => {
  return res.status(200).json({
    serverTime: Date.now(),
    iso: new Date().toISOString()
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: Async post-submission pipeline
// Runs in background after answer submitted:
//   AI_EVALUATING → NEXT_QUESTION or ROUND_COMPLETED
// ─────────────────────────────────────────────────────────────────────────────
async function _handlePostSubmission(sessionId, answerId, correlationId) {
  try {
    // 1. Transition to AI_EVALUATING
    await sessionManager.transitionState(sessionId, 'AI_EVALUATING', 'ai_evaluation_start', correlationId);

    // 2. Run evaluation via EvaluationEngine
    await evaluationEngine.evaluateAnswer(answerId, correlationId);

    // 3. Load session to check question limits
    const session = await sessionManager.loadSession(sessionId);
    const config = session.session_snapshot?.config || {};
    const maxQuestions = config.max_questions || 5;

    if (session.current_question_index >= maxQuestions) {
      // 4a. Final round — transition to ROUND_COMPLETED then FINAL_EVALUATION
      await sessionManager.transitionState(sessionId, 'ROUND_COMPLETED', 'round_limit_reached', correlationId);
      await sessionManager.transitionState(sessionId, 'FINAL_EVALUATION', 'final_evaluation_start', correlationId);
      await sessionManager.transitionState(sessionId, 'INTERVIEW_COMPLETED', 'evaluation_done', correlationId);
    } else {
      // 4b. Generate next question and continue
      await sessionManager.transitionState(sessionId, 'NEXT_QUESTION', 'next_question_generation', correlationId);
      const nextQuestion = await aiOrchestrator.generateNextQuestion(sessionId);

      // Restart question timer
      const questionDuration = config.questionDuration || 90;
      await timerEngine.startTimer(sessionId, { questionDuration });
      await sessionManager.transitionState(sessionId, 'QUESTION_ACTIVE', 'next_question_ready', correlationId);

      logger.info(`Next question ready for session ${sessionId}`, {
        questionId: nextQuestion.id,
        correlationId
      });
    }
  } catch (err) {
    logger.error(`Post-submission pipeline failed for session ${sessionId}:`, {
      error: err,
      correlationId
    });
    // Attempt graceful degraded state
    try {
      await sessionManager.transitionState(sessionId, 'FAILED', 'pipeline_error', correlationId);
    } catch (_) {
      // Already in terminal state — ignore
    }
  }
}
