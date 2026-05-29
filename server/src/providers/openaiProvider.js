const AIProvider = require('./aiProvider');
const logger = require('../services/logger');

class OpenAIProvider extends AIProvider {
  async generateEvaluation({ questionText, candidateAnswer, difficulty, role }) {
    logger.info("OpenAIProvider stub generateEvaluation invoked");
    return {
      rawResponse: "{}",
      sanitizedResponse: "{}",
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      usage: {}
    };
  }

  async generateQuestion({ topic, difficulty, previousHistory, missingConcepts }) {
    logger.info("OpenAIProvider stub generateQuestion invoked");
    return {
      rawResponse: "{}",
      sanitizedResponse: "{}",
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      usage: {}
    };
  }
}

module.exports = OpenAIProvider;
