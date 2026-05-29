const GeminiProvider = require('./geminiProvider');
const OpenAIProvider = require('./openaiProvider');

const providerType = process.env.AI_PROVIDER || 'gemini';

let resolvedProvider;
if (providerType.toLowerCase() === 'openai') {
  resolvedProvider = new OpenAIProvider();
} else {
  resolvedProvider = new GeminiProvider();
}

module.exports = resolvedProvider;
