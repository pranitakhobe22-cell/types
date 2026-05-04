const { Worker } = require('bullmq');
const redisConfig = require('../config/redis');
const geminiModel = require('../config/gemini');
const { Answer, Question } = require('../models');

const processEvaluation = async (data, jobId = 'internal') => {
  const { answerId } = data;
  const answer = await Answer.findByPk(answerId);
  if (!answer) {
    console.error(`[Worker] Answer ${answerId} not found`);
    return;
  }
  
  const question = await Question.findByPk(answer.question_id);
  if (!question) {
    console.error(`[Worker] Question for answer ${answerId} not found`);
    return;
  }

  const prompt = `
    Evaluate the following interview answer based on the question.
    Question: ${question.question_text}
    Answer: ${answer.answer_text}

    Return the evaluation in strict JSON format:
    {
      "accuracy": number (0-10),
      "clarity": number (0-10),
      "depth": number (0-10),
      "confidence": number (0-10),
      "feedback": string
    }
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");
    
    const evaluation = JSON.parse(jsonMatch[0]);
    const finalScore = (evaluation.accuracy + evaluation.clarity + evaluation.depth + evaluation.confidence) / 4;

    await answer.update({
      score: finalScore,
      feedback: evaluation.feedback,
      metrics: evaluation
    });

    console.log(`Job ${jobId} completed via Gemini: Score ${finalScore}`);
    return evaluation;
  } catch (error) {
    console.error(`Error processing job ${jobId} via Gemini:`, error.message);
    throw error;
  }
};


let worker = null;

// Only start worker if not in mock mode or if explicitly enabled
if (process.env.NODE_ENV !== 'test' && !process.env.MOCK_REDIS) {
  try {
    worker = new Worker('evaluationQueue', async job => {
      return await processEvaluation(job.data, job.id);
    }, {
      connection: redisConfig,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });

    worker.on('failed', (job, err) => {
      console.log(`Job ${job.id} failed after ${job.attemptsMade} attempts: ${err.message}`);
    });
    
    worker.on('error', err => {
      // Suppress connection errors if they are already handled by the queue
      if (err.message.includes('ECONNREFUSED')) {
        // Silent error to avoid spamming
      } else {
        console.error("Worker Error:", err.message);
      }
    });
  } catch (err) {
    console.warn("Worker could not be initialized (likely no Redis).");
  }
}

module.exports = {
  worker,
  processEvaluation
};

