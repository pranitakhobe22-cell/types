const { z } = require('zod');
const { AnswerModel, SessionModel, QuestionModel } = require('../models');
const aiProvider = require('../providers');
const logger = require('./logger');
const eventBus = require('../events/eventBus');

// 1. Zod schema validation for Gemini output
const evaluationSchema = z.object({
  technical_accuracy: z.number().min(0).max(10),
  communication_clarity: z.number().min(0).max(10),
  problem_solving: z.number().min(0).max(10),
  evaluation_confidence: z.number().min(0).max(1),
  skills_detected: z.array(z.string()),
  missing_concepts: z.array(z.string()),
  explainability: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    evidence: z.array(z.string())
  }),
  feedback: z.string()
});

// Circuit Breaker State
global.aiFailureCount = global.aiFailureCount || 0;
global.aiCircuitOpen = global.aiCircuitOpen || false;
global.aiCircuitResetTime = global.aiCircuitResetTime || 0;

const CIRCUIT_THRESHOLD = 5;
const COOLDOWN_PERIOD_MS = 60000; // 1 minute

function checkCircuitBreaker() {
  if (global.aiCircuitOpen) {
    if (Date.now() > global.aiCircuitResetTime) {
      // Circuit resets to half-open/closed
      global.aiCircuitOpen = false;
      global.aiFailureCount = 0;
      logger.info("AI Provider Circuit Breaker: CLOSED (Resetting to normal operations)");
    } else {
      return true; // Circuit remains OPEN
    }
  }
  return false;
}

function recordFailure() {
  global.aiFailureCount++;
  logger.warn(`AI Failure Count: ${global.aiFailureCount}/${CIRCUIT_THRESHOLD}`);
  if (global.aiFailureCount >= CIRCUIT_THRESHOLD) {
    global.aiCircuitOpen = true;
    global.aiCircuitResetTime = Date.now() + COOLDOWN_PERIOD_MS;
    logger.error(`AI Provider Circuit Breaker: OPENED (Tripped due to repeated failures for 1 min)`);
  }
}

function recordSuccess() {
  global.aiFailureCount = 0;
}

const EvaluationEngine = {
  async evaluateAnswer(answerId, correlationId = null) {
    const start = Date.now();
    const answer = await AnswerModel.findByPk(answerId);
    if (!answer) {
      throw new Error(`Answer ${answerId} not found`);
    }

    const session = await SessionModel.findByPk(answer.session_id);
    if (!session) {
      throw new Error(`Session ${answer.session_id} not found`);
    }

    const question = await QuestionModel.findByPk(answer.question_id);
    if (!question) {
      throw new Error(`Question ${answer.question_id} not found`);
    }

    const isCircuitOpen = checkCircuitBreaker();
    let evaluationData = null;
    let fallbackUsed = false;
    let aiResult = null;

    if (isCircuitOpen) {
      logger.warn(`Circuit Breaker is OPEN. Using degraded evaluation fallback for answer ${answerId}`);
      fallbackUsed = true;
      evaluationData = {
        technical_accuracy: 5,
        communication_clarity: 5,
        problem_solving: 5,
        evaluation_confidence: 0.5,
        skills_detected: [],
        missing_concepts: [],
        explainability: {
          strengths: ["Answer recorded successfully"],
          weaknesses: ["AI evaluation engine currently degraded"],
          evidence: []
        },
        feedback: "Your response was safely recorded, but AI evaluation is temporarily running in static fallback mode."
      };
    } else {
      try {
        // Call unified AI provider
        aiResult = await aiProvider.generateEvaluation({
          questionText: question.question_text,
          candidateAnswer: answer.answer_text,
          difficulty: question.difficulty || 'medium',
          role: session.session_snapshot?.config?.role || 'Software Engineer'
        });

        // Parse and validate Zod schema
        const parsed = JSON.parse(aiResult.sanitizedResponse);
        evaluationData = evaluationSchema.parse(parsed);
        recordSuccess();
      } catch (err) {
        recordFailure();
        logger.error(`Failed structured AI evaluation: ${err.message}. Triggering fallback evaluation.`, { error: err });
        fallbackUsed = true;
        evaluationData = {
          technical_accuracy: 5,
          communication_clarity: 5,
          problem_solving: 5,
          evaluation_confidence: 0.5,
          skills_detected: [],
          missing_concepts: [],
          explainability: {
            strengths: ["Answer submitted successfully"],
            weaknesses: ["AI parser returned malformed JSON or timed out"],
            evidence: []
          },
          feedback: "Submission recorded. AI metrics failed schema validation fallback."
        };
      }
    }

    // Weighted Scoring Engine Calculations
    // Retrieve configuration weights
    const weights = session.session_snapshot?.config?.weights || { technical: 0.7, communication: 0.3 };
    const finalScore = (evaluationData.technical_accuracy * (weights.technical || 0.7)) + 
                       (evaluationData.communication_clarity * (weights.communication || 0.3));

    // Update Answer Record
    await answer.update({
      evaluation_result: evaluationData,
      evaluation_confidence: evaluationData.evaluation_confidence,
      evaluation_version: 'v1.0',
      prompt_version: 'eval_v1',
      raw_llm_response: aiResult ? aiResult.rawResponse : null,
      parsed_output: evaluationData,
      prompt_used: question.question_text,
      input_tokens: aiResult ? aiResult.inputTokens : 0,
      output_tokens: aiResult ? aiResult.outputTokens : 0,
      estimated_cost: aiResult ? aiResult.estimatedCost : 0,
      confidence_score: finalScore
    });

    const elapsed = Date.now() - start;
    logger.metric('evaluation_duration', elapsed, { answerId, sessionId: session.id });

    // Emit event that answer was evaluated
    await eventBus.publish(session.id, 'ANSWER_EVALUATED', {
      answerId: answer.id,
      finalScore,
      feedback: evaluationData.feedback,
      fallbackUsed
    }, correlationId);

    return evaluationData;
  }
};

module.exports = EvaluationEngine;
