import { AIService } from './services/aiService.ts';

async function testFlow() {
  console.log("--- 1. Generating 5 Questions ---");
  try {
    const questions = await AIService.generateQuestions('CSE', 'Intermediate', 'Technical', 5);
    console.log(`Generated ${questions.length} questions.`);
    questions.forEach((q, i) => console.log(`${i+1}: ${q.question}`));

    console.log("\n--- 2. Mocking 5 Answers ---");
    const history = questions.map(q => ({
      question: q.question,
      answer: "This is a detailed technical response explaining the core concepts clearly with high accuracy and depth.",
      ideal_answer: q.ideal_answer
    }));

    console.log("\n--- 3. Generating Evaluation ---");
    const evaluation = await AIService.evaluateInterview(history);
    console.log("\n--- EVALUATION RESULT ---");
    console.log(JSON.stringify(evaluation, null, 2));

  } catch (error) {
    console.error("Test failed:", error);
  }
}

testFlow();
