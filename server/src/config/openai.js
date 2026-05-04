const { OpenAI } = require('openai');
require('dotenv').config();

let openai;

if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn("⚠️  OPENAI_API_KEY missing. Using Mock AI (returns dummy evaluations).");
  openai = {
    chat: {
      completions: {
        create: async () => {
          console.log("[Mock AI] Generating dummy evaluation...");
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  accuracy: 8,
                  clarity: 9,
                  depth: 7,
                  confidence: 8,
                  feedback: "This is a mock evaluation because no OpenAI API key was provided. The answer seems solid and professional."
                })
              }
            }]
          };
        }
      }
    }
  };
}

module.exports = openai;

