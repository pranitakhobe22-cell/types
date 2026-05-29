function buildQuestionGenerationPrompt({ topic, difficulty = 'medium', previousHistory = [], missingConcepts = [] }) {
  const historyText = previousHistory.length > 0 
    ? previousHistory.map(h => `Q: ${h.question}\nA: ${h.answer}\nScore: ${h.score}`).join('\n\n')
    : 'No previous question history.';

  const missingText = missingConcepts.length > 0
    ? `Target missing concepts to probe: ${missingConcepts.join(', ')}`
    : '';

  return `
    You are an expert HR interviewer. Generate the next interview question for the candidate.
    
    [TOPIC / ROLE]
    ${topic}

    [DIFFICULTY]
    ${difficulty}

    [PREVIOUS CONVERSATION HISTORY]
    ${historyText}

    ${missingText}

    INSTRUCTIONS:
    - The question should feel natural, professional, and conversational.
    - If there is conversation history, adapt to their weak areas, ask follow-up probing questions, or progress the difficulty.
    - Respond strictly in JSON format.

    JSON SCHEMA EXPECTED:
    {
      "question_text": "The text of the next question to ask",
      "difficulty": "easy" | "medium" | "hard",
      "topic": "The exact sub-topic being evaluated",
      "ideal_answer": "Brief summary of what a great answer must cover"
    }
  `;
}

module.exports = { buildQuestionGenerationPrompt };
