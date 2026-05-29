const { z } = require('zod');
const { QuestionModel, SessionModel, AnswerModel } = require('../models');
const aiProvider = require('../providers');
const logger = require('./logger');

const questionSchema = z.object({
  question_text: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topic: z.string(),
  ideal_answer: z.string()
});

const STATIC_FALLBACK_QUESTIONS = [
  { question_text: "What is your experience with React hooks and when would you use useMemo?", difficulty: "medium", topic: "React Hooks", ideal_answer: "Explain hooks, dependency arrays, performance optimization, and memoization." },
  { question_text: "Explain how Node.js handles asynchronous operations behind the scenes.", difficulty: "hard", topic: "Node.js Architecture", ideal_answer: "Mention the event loop, V8 engine, libuv library, and worker thread pool." },
  { question_text: "What are the key differences between SQL and NoSQL databases?", difficulty: "easy", topic: "Databases", ideal_answer: "Structure, schemas, scaling (vertical vs horizontal), transactions vs performance." }
];

const AIOrchestrator = {
  async generateNextQuestion(sessionId) {
    const session = await SessionModel.findByPk(sessionId);
    if (!session) throw new Error("Session not found");

    // 1. Collect history and performance metrics to adapt difficulty
    const previousAnswers = await AnswerModel.findAll({
      where: { session_id: sessionId },
      include: [{ model: QuestionModel, as: 'question' }],
      order: [['created_at', 'ASC']]
    });

    let currentDifficulty = 'medium';
    const previousHistory = [];
    const missingConcepts = [];

    if (previousAnswers.length > 0) {
      const lastAnswer = previousAnswers[previousAnswers.length - 1];
      const lastScore = lastAnswer.confidence_score || 5;

      // Dynamic difficulty progression
      if (lastScore >= 8) {
        currentDifficulty = 'hard';
      } else if (lastScore < 5) {
        currentDifficulty = 'easy';
      } else {
        currentDifficulty = 'medium';
      }

      // Collect history details for prompting
      for (const ans of previousAnswers) {
        const qText = ans.evaluation_result?.prompt_used || 'Question';
        previousHistory.push({
          question: qText,
          answer: ans.answer_text,
          score: ans.confidence_score
        });

        // Collect missing concepts for adaptive targeting
        if (ans.evaluation_result && ans.evaluation_result.missing_concepts) {
          missingConcepts.push(...ans.evaluation_result.missing_concepts);
        }
      }
    }

    let questionData = null;
    let fallbackUsed = false;

    // Check circuit breaker status
    const isCircuitOpen = global.aiCircuitOpen && (Date.now() < global.aiCircuitResetTime);

    if (isCircuitOpen) {
      logger.warn(`AI Provider circuit open. Generating static fallback question for session: ${sessionId}`);
      fallbackUsed = true;
      // Select a static question that hasn't been asked yet
      const askedQuestions = previousHistory.map(h => h.question);
      const remaining = STATIC_FALLBACK_QUESTIONS.filter(q => !askedQuestions.includes(q.question_text));
      
      questionData = remaining.length > 0 
        ? remaining[0] 
        : STATIC_FALLBACK_QUESTIONS[Math.floor(Math.random() * STATIC_FALLBACK_QUESTIONS.length)];
    } else {
      try {
        const topic = session.session_snapshot?.config?.role || 'Software Engineer';
        
        // Generate via dynamically resolved provider
        const aiResult = await aiProvider.generateQuestion({
          topic,
          difficulty: currentDifficulty,
          previousHistory,
          missingConcepts
        });

        const parsed = JSON.parse(aiResult.sanitizedResponse);
        questionData = questionSchema.parse(parsed);
      } catch (err) {
        logger.error(`AI Question Generation failed: ${err.message}. Using static fallback.`, { error: err });
        fallbackUsed = true;
        questionData = STATIC_FALLBACK_QUESTIONS[previousHistory.length % STATIC_FALLBACK_QUESTIONS.length];
      }
    }

    // 2. Save new Question
    const nextOrder = session.current_question_index + 1;
    const dbQuestion = await QuestionModel.create({
      session_id: sessionId,
      question_text: questionData.question_text,
      difficulty: questionData.difficulty,
      topic: questionData.topic,
      question_order: nextOrder,
      question_version: 'v1.0',
      generated_by: fallbackUsed ? 'static_fallback' : (process.env.AI_PROVIDER || 'gemini')
    });

    // 3. Update Session state snapshot (State Integrity / Recoverability)
    const updatedSnapshot = {
      ...session.session_snapshot,
      active_question: {
        id: dbQuestion.id,
        question_text: dbQuestion.question_text,
        difficulty: dbQuestion.difficulty,
        topic: dbQuestion.topic,
        ideal_answer: questionData.ideal_answer
      }
    };

    await session.update({
      current_question_index: nextOrder,
      session_snapshot: updatedSnapshot
    });

    logger.info(`Generated and saved question #${nextOrder} for session: ${sessionId}`, { questionData });

    return dbQuestion;
  }
};

module.exports = AIOrchestrator;
