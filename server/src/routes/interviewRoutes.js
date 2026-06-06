const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const interviewController = require('../controllers/interviewController');

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiters
// ─────────────────────────────────────────────────────────────────────────────
const startInterviewLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many interview starts from this IP, please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

const submitAnswerLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 5,
  message: { error: 'Too many answer submissions from this IP, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Rate limit exceeded. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

// Server clock sync (no rate limit needed — lightweight)
router.get('/time', interviewController.getServerTime);

// Start a new interview session
router.post('/start', startInterviewLimiter, interviewController.startInterview);

// Get session snapshot (reconnect/recovery)
router.get('/session/:id', generalLimiter, interviewController.getSession);

// Submit candidate answer
router.post('/submit-answer', submitAnswerLimiter, interviewController.submitAnswer);

// Pause interview
router.post('/pause', generalLimiter, interviewController.pauseInterview);

// Resume interview
router.post('/resume', generalLimiter, interviewController.resumeInterview);

// End / terminate interview
router.post('/end', generalLimiter, interviewController.endInterview);

// Submit proctoring report
router.post('/proctoring-report', generalLimiter, interviewController.submitProctoringReport);

module.exports = router;
