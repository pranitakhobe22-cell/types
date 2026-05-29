const geminiModel = require('../config/gemini');
const { buildEvaluationPrompt } = require('../prompts/evaluationPrompt');
const { buildQuestionGenerationPrompt } = require('../prompts/questionGenerationPrompt');
const AIProvider = require('./aiProvider');
const logger = require('../services/logger');

function sanitizeResponse(text) {
  if (!text) return '{}';
  let cleanText = text.trim();
  // Strip potential LLM markdown wraps
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');
  }
  return cleanText.trim();
}

class GeminiProvider extends AIProvider {
  async callWithTimeoutAndRetry(prompt, retries = 3, timeoutMs = 10000) {
    let attempt = 0;
    while (attempt < retries) {
      attempt++;
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI Provider Timeout: Gemini API call timed out')), timeoutMs);
      });

      try {
        const start = Date.now();
        // Configure options with low temperature for deterministic evaluation
        const apiPromise = geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1, 
            responseMimeType: "application/json"
          }
        });

        const result = await Promise.race([apiPromise, timeoutPromise]);
        const duration = Date.now() - start;
        
        logger.metric('gemini_api_latency', duration, { attempt });
        return result;
      } catch (err) {
        logger.warn(`Gemini call attempt ${attempt} failed: ${err.message}`);
        if (attempt >= retries) {
          throw err;
        }
      }
    }
  }

  async generateEvaluation({ questionText, candidateAnswer, difficulty, role }) {
    const prompt = buildEvaluationPrompt({ questionText, candidateAnswer, difficulty, role });
    
    const result = await this.callWithTimeoutAndRetry(prompt);
    const response = await result.response;
    const rawText = response.text();
    const cleanText = sanitizeResponse(rawText);

    // Cost tracking calculations
    // Gemini 1.5 Flash input: $0.075/1M tokens ($0.000000075 each), output: $0.30/1M ($0.0000003 each)
    const usage = response.usageMetadata || {};
    const inputTokens = usage.promptTokenCount || 0;
    const outputTokens = usage.candidatesTokenCount || 0;
    const estimatedCost = (inputTokens * 0.000000075) + (outputTokens * 0.0000003);

    return {
      rawResponse: rawText,
      sanitizedResponse: cleanText,
      inputTokens,
      outputTokens,
      estimatedCost,
      usage
    };
  }

  async generateQuestion({ topic, difficulty, previousHistory, missingConcepts }) {
    const prompt = buildQuestionGenerationPrompt({ topic, difficulty, previousHistory, missingConcepts });
    
    const result = await this.callWithTimeoutAndRetry(prompt);
    const response = await result.response;
    const rawText = response.text();
    const cleanText = sanitizeResponse(rawText);

    const usage = response.usageMetadata || {};
    const inputTokens = usage.promptTokenCount || 0;
    const outputTokens = usage.candidatesTokenCount || 0;
    const estimatedCost = (inputTokens * 0.000000075) + (outputTokens * 0.0000003);

    return {
      rawResponse: rawText,
      sanitizedResponse: cleanText,
      inputTokens,
      outputTokens,
      estimatedCost,
      usage
    };
  }
}

module.exports = GeminiProvider;
