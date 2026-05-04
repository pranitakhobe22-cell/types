const { Queue } = require('bullmq');
const redisConfig = require('../config/redis');
const { processEvaluation } = require('../workers/evaluationWorker');

let evaluationQueue;

// Simple check to see if we should use mock mode
const useMock = process.env.MOCK_REDIS === 'true' || process.env.NODE_ENV === 'test';

if (useMock) {
  console.log("🛠️  Redis Mock Mode: ACTIVE (Processing jobs in-memory)");
  evaluationQueue = {
    add: async (name, data) => {
      console.log(`[Mock Queue] Immediately processing job: ${name}`);
      // Process in next tick to not block the request
      setImmediate(() => {
        processEvaluation(data).catch(err => console.error("[Mock Queue] Error:", err.message));
      });
      return { id: `mock-${Date.now()}` };
    },
    on: () => {},
    close: async () => {}
  };
} else {
  try {
    evaluationQueue = new Queue('evaluationQueue', {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
      }
    });
    
    evaluationQueue.on('error', (err) => {
      if (err.message.includes('ECONNREFUSED')) {
        console.warn("⚠️  Redis Connection Refused. Consider setting MOCK_REDIS=true in .env");
      } else {
        console.error("❌ Queue Error:", err.message);
      }
    });
    
  } catch (err) {
    console.warn("⚠️ Failed to initialize Redis Queue. Switching to Mock Mode.");
    evaluationQueue = {
      add: async (name, data) => {
        console.log(`[Mock Queue] Immediately processing job: ${name}`);
        setImmediate(() => {
          processEvaluation(data).catch(err => console.error("[Mock Queue] Error:", err.message));
        });
        return { id: `mock-${Date.now()}` };
      },
      on: () => {},
      close: async () => {}
    };
  }
}

module.exports = evaluationQueue;

