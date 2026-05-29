class AIProvider {
  async generateEvaluation({ questionText, candidateAnswer, difficulty, role }) {
    throw new Error("generateEvaluation method not implemented");
  }

  async generateQuestion({ topic, difficulty, previousHistory, missingConcepts }) {
    throw new Error("generateQuestion method not implemented");
  }
}

module.exports = AIProvider;
