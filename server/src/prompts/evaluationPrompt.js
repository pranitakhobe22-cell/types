function buildEvaluationPrompt({ questionText, candidateAnswer, difficulty = 'medium', role = 'Software Engineer' }) {
  let rubric = '';
  if (difficulty.toLowerCase() === 'easy') {
    rubric = 'Focus primarily on basic conceptual understanding. Ignore minor grammar stutters or filler words.';
  } else if (difficulty.toLowerCase() === 'hard') {
    rubric = 'Focus on technical precision, depth, and communication fluency. Stuttering, filler words (um, like), or lack of structures should lower the score.';
  } else {
    rubric = 'Balanced evaluation of correctness and clarity. Hit key concepts.';
  }

  return `
    You are a strict, objective, evidence-based AI Interview Evaluator.
    Evaluate the candidate's answer against the given question context.

    [ROLE CONTEXT]
    Position: ${role}
    Difficulty Level: ${difficulty}

    [EVALUATION RUBRIC]
    ${rubric}

    [QUESTION]
    ${questionText}

    [CANDIDATE ANSWER]
    ${candidateAnswer}

    CRITICAL INSTRUCTIONS:
    1. Do NOT assume candidate knows something if they did not explicitly mention it.
    2. Write constructive feedback without generic praise.
    3. Return your analysis in strict JSON format.

    JSON SCHEMA EXPECTED:
    {
      "technical_accuracy": 0-10 (integer),
      "communication_clarity": 0-10 (integer),
      "problem_solving": 0-10 (integer),
      "evaluation_confidence": 0.0-1.0 (float),
      "skills_detected": ["Skill A", "Skill B"],
      "missing_concepts": ["Concept X"],
      "explainability": {
        "strengths": ["Detailed point 1", "Detailed point 2"],
        "weaknesses": ["Detailed point 1", "Detailed point 2"],
        "evidence": ["Direct quote or evidence reference showing candidate knowledge", "Direct quote showing error"]
      },
      "feedback": "Two-sentence summary feedback"
    }
  `;
}

module.exports = { buildEvaluationPrompt };
