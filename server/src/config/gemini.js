const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

let currentKeyIndex = 0;
const getNextPoolKey = () => {
  const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) return "";
  const key = keys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
};

const modelProxy = {
  generateContent: async (args) => {
    const genAI = new GoogleGenerativeAI(getNextPoolKey());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    return model.generateContent(args);
  }
};

module.exports = modelProxy;
