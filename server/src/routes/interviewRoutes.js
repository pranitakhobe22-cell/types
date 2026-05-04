const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');

router.post('/start-interview', interviewController.startInterview);
router.get('/next-question', interviewController.nextQuestion);
router.post('/submit-answer', interviewController.submitAnswer);
router.get('/report', interviewController.getReport);

module.exports = router;
