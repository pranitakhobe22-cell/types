import { Candidate, EvaluationResult, Question, RoleSettings, VisualMetrics } from "../types";
import { StorageService } from "./storageService";
import { ErrorLogService } from "./errorLogService";

export const DEFAULT_SETTINGS: RoleSettings = {
  difficulty: 'Medium',
  preset: 'Normal',
  weights: { concept: 70, grammar: 10, fluency: 10, camera: 10 },
  proctoring: {
    maxWarnings: 3,
    sensitivity: 'Medium',
    includeInScore: true
  }
};

// ============================================================================
// API KEY MANAGEMENT - OpenRouter DeepSeek Exclusive
// ============================================================================

const getOpenRouterKey = () => {
  return (import.meta.env?.VITE_OPENROUTER_API_KEY) || (typeof process !== 'undefined' ? process.env.VITE_OPENROUTER_API_KEY : "") || "";
};

async function generateWithOpenRouter(prompt: string, maxRetries = 2): Promise<string> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured. Please set VITE_OPENROUTER_API_KEY.");
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Reincrew AI"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.choices || data.choices.length === 0) {
        throw new Error("OpenRouter API returned no choices.");
      }
      return data.choices[0].message.content;
    } catch (err: any) {
      console.warn(`OpenRouter DeepSeek attempt ${attempt + 1} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      ErrorLogService.logError('api', `OpenRouter DeepSeek API call failed: ${err.message || err}`, err);
      throw err;
    }
  }
  throw new Error("Failed to generate content with OpenRouter DeepSeek.");
}

// Simple string hash → consistent key per session
export const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

const ai = {
  models: {
    generateContent: async (args: any) => {
      // Used by startInterview for dynamic question generation (Live Interview)
      const text = await generateWithOpenRouter(args.contents);
      return { text };
    }
  }
};

// ============================================================================
// LOCAL SCORING — Keyword match + answer length + concept density
// ============================================================================

export function localEvaluate(
  answer: string,
  question: Question
): { score: number; matched: string[]; missed: string[]; confidence: number; evaluationAvailable: boolean; reason: string } {
  return {
    score: 0,
    matched: [],
    missed: question.evaluationGuide || [],
    confidence: 0,
    evaluationAvailable: false,
    reason: "AI evaluator unavailable"
  };
}

/**
 * Local adaptive difficulty signal.
 * Used to determine next question difficulty without waiting for AI.
 * Returns 0-10 scale.
 */
export function localDifficultySignal(answer: string, question: Question): number {
  const answerLower = answer.toLowerCase().trim();
  const words = answerLower.split(/\s+/).filter(Boolean);

  // Simple length-based heuristic instead of keyword fallback grading
  if (words.length < 15) return 3;
  if (words.length < 40) return 6;
  return 8;
}

// ============================================================================
// INTERVIEW START
// ============================================================================

const DIRECT_INTERVIEW_FALLBACK = [
  {
    id: 1,
    question: "Tell me about your professional background and what you are looking for in your next role.",
    difficulty: "easy" as const,
    ideal_answer: "Candidate should clearly state their current role, years of experience, and key skills.",
    evaluationGuide: ["Current Role", "Experience", "Skills"],
    maxScore: 10
  },
  {
    id: 2,
    question: "Describe a challenging project you worked on. What was your role and how did you overcome the obstacles?",
    difficulty: "medium" as const,
    ideal_answer: "Candidate defines problem, their specific action, and a positive result.",
    evaluationGuide: ["Problem definition", "Action taken", "Result"],
    maxScore: 10
  },
  {
    id: 3,
    question: "How do you handle disagreements with colleagues or managers?",
    difficulty: "medium" as const,
    ideal_answer: "Seeks to understand, communicates respectfully, finds compromise.",
    evaluationGuide: ["Communication", "Respect", "Compromise"],
    maxScore: 10
  },
  {
    id: 4,
    question: "Where do you see yourself professionally in five years?",
    difficulty: "easy" as const,
    ideal_answer: "Presents clear career progression goals aligned with the role.",
    evaluationGuide: ["Career goals", "Ambition", "Alignment"],
    maxScore: 10
  },
  {
    id: 5,
    question: "What do you consider your greatest professional strength?",
    difficulty: "easy" as const,
    ideal_answer: "Identifies a relevant strength and provides a quick example.",
    evaluationGuide: ["Relevance", "Self-awareness", "Example"],
    maxScore: 10
  },
  {
    id: 6,
    question: "Describe a time when you had to learn a new technology or skill quickly.",
    difficulty: "medium" as const,
    ideal_answer: "Shows adaptability, resourcefulness, and successfully applying the new skill.",
    evaluationGuide: ["Adaptability", "Learning process", "Application"],
    maxScore: 10
  },
  {
    id: 7,
    question: "How do you prioritize your work when dealing with multiple tight deadlines?",
    difficulty: "medium" as const,
    ideal_answer: "Uses a framework (like Eisenhower matrix), communicates with stakeholders, stays organized.",
    evaluationGuide: ["Time management", "Communication", "Organization"],
    maxScore: 10
  },
  {
    id: 8,
    question: "Tell me about a time you made a mistake. How did you handle it?",
    difficulty: "medium" as const,
    ideal_answer: "Takes accountability, fixes the issue, and learns from it.",
    evaluationGuide: ["Accountability", "Resolution", "Learning"],
    maxScore: 10
  },
  {
    id: 9,
    question: "What is your approach to giving and receiving constructive feedback?",
    difficulty: "medium" as const,
    ideal_answer: "Views it as an opportunity for growth; gives it specifically and kindly.",
    evaluationGuide: ["Open-mindedness", "Growth mindset", "Tact"],
    maxScore: 10
  },
  {
    id: 10,
    question: "Why are you interested in joining our company specifically?",
    difficulty: "easy" as const,
    ideal_answer: "Shows research about the company and aligns personal goals with company mission.",
    evaluationGuide: ["Research", "Alignment", "Enthusiasm"],
    maxScore: 10
  }
];

export const startInterview = async (candidate: Candidate): Promise<{ question: Question; totalQuestions: number; settings?: RoleSettings; questionsList: Question[] }> => {
  // Fetch questions specific to the candidate's job role
  let questions: Question[] = [];
  let settings: RoleSettings | undefined;

  // Mini Demo Logic: Generate dynamic questions if isDemo is true
  if (candidate.isDemo && candidate.customTopic) {
    try {
      const topic = candidate.customTopic;
      const prompt = `
        Generate 5 distinct interview questions for a candidate interested in "${topic}".
        Questions should range from easy to medium difficulty.
        Return strictly a JSON array of objects:
        [{ "id": 1, "question": "Question text", "difficulty": "Easy", "maxScore": 10, "keyPoints": ["key1", "key2"] }]
      `;

      const result = await ai.models.generateContent({
        contents: prompt
      });

      let cleanText = result.text || "[]";
      // Sanitize markdown if present
      if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
      else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');

      const genQuestions = JSON.parse(cleanText);
      questions = genQuestions.map((q: any, i: number) => ({
        ...q,
        id: i + 1,
        maxScore: 10
      }));

      // Set Demo Settings
      settings = {
        ...DEFAULT_SETTINGS,
        difficulty: 'Medium',
        preset: 'Normal',
        proctoring: { ...DEFAULT_SETTINGS.proctoring, includeInScore: false }
      };

    } catch (err) {
      console.error("OpenRouter Question generation failed, using static fallback question:", err);
      questions = [{
        id: 1,
        question: `Tell me about your interest in ${candidate.customTopic} and what you hope to achieve.`,
        difficulty: "easy",
        ideal_answer: "The candidate should relate their skills and goals clearly.",
        maxScore: 10,
        evaluationGuide: ["Interest", "Goals"]
      }];
      settings = {
        ...DEFAULT_SETTINGS,
        difficulty: 'Medium',
        preset: 'Normal',
        proctoring: { ...DEFAULT_SETTINGS.proctoring, includeInScore: false }
      };
    }
  } else if (candidate.jobPostId) {
    const job = await StorageService.getJobById(candidate.jobPostId);
    if (job) {
      questions = job.questions;
      settings = job.settings;
    }
  }

  // Fallback to a default set of 10 questions if no job found or no questions
  if (questions.length === 0) {
    questions = [...DIRECT_INTERVIEW_FALLBACK];
  }

  // Shuffle questions randomly
  const shuffled = questions.sort(() => 0.5 - Math.random());
  // Pick 5 questions randomly
  const selectedQuestions = shuffled.slice(0, 5);

  // Fetch global config for proctoring toggles
  const config = await StorageService.getConfig();

  // Merge or override with role-specific settings
  const finalSettings: RoleSettings = settings || {
    ...DEFAULT_SETTINGS,
    difficulty: config.defaultDifficulty as any,
  };

  // Force global proctoring toggles
  if (!config.enableEyeTracking) finalSettings.proctoring.sensitivity = 'Low'; // Effectively disable or reduce impact

  return {
    question: selectedQuestions[0],
    totalQuestions: selectedQuestions.length,
    settings: finalSettings,
    questionsList: selectedQuestions
  };
};

// ============================================================================
// ANSWER EVALUATION — Simplified prompt, local score computation
// ============================================================================

export function buildEvaluationResult(
  currentQuestion: Question,
  answer: string,
  evalJson: any,
  visualMetrics?: VisualMetrics,
  isBehavioral = false
): EvaluationResult {
  const accuracy = Math.max(0, Math.min(10, evalJson.accuracy ?? 5));
  const conceptCoverage = Math.max(0, Math.min(10, evalJson.conceptCoverage ?? 5));
  const conceptUnderstanding = Math.max(0, Math.min(10, evalJson.conceptUnderstanding ?? 5));
  const reasoning = Math.max(0, Math.min(10, evalJson.reasoning ?? 5));
  const depth = Math.max(0, Math.min(10, evalJson.depth ?? 5));
  
  const clarity = Math.max(0, Math.min(10, evalJson.clarity ?? 5));
  const structure = Math.max(0, Math.min(10, evalJson.structure ?? 5));
  const confidenceScoreVal = Math.max(0, Math.min(10, evalJson.confidence ?? 5));
  const consistency = Math.max(0, Math.min(10, evalJson.consistency ?? 5));
  
  const answerDirectnessScore = Math.max(0, Math.min(10, evalJson.answerDirectnessScore ?? 5));
  const tradeoffReasoningScore = evalJson.tradeoffReasoningScore !== null && evalJson.tradeoffReasoningScore !== undefined
    ? Math.max(0, Math.min(10, evalJson.tradeoffReasoningScore))
    : undefined;

  const errors = evalJson.technicalErrors || [];
  let errorDeduction = 0;
  for (const err of errors) {
    if (err.severity === 'low') errorDeduction += 0.25;
    else if (err.severity === 'medium') errorDeduction += 0.75;
    else if (err.severity === 'high') errorDeduction += 1.50;
  }
  errorDeduction = Math.min(2.0, errorDeduction);

  let rawContentScore = (accuracy * 0.30) + (conceptUnderstanding * 0.25) + (reasoning * 0.20) + (depth * 0.15) + (conceptCoverage * 0.10);
  rawContentScore -= errorDeduction;
  const contentScore = Math.round(Math.max(0, Math.min(10, rawContentScore)) * 10) / 10;

  const communicationScore = Math.round(((clarity + structure + confidenceScoreVal + consistency) / 4) * 10) / 10;

  let verdict: 'Excellent' | 'Good' | 'Borderline' | 'Fail';
  if (contentScore >= 8) verdict = 'Excellent';
  else if (contentScore >= 6) verdict = 'Good';
  else if (contentScore >= 4) verdict = 'Borderline';
  else verdict = 'Fail';

  const evaluationConfidence = Math.round(
    (conceptCoverage * 0.3 + conceptUnderstanding * 0.3 + reasoning * 0.2 + consistency * 0.2) * 10
  );

  return {
    questionId: Number(currentQuestion.id),
    questionText: currentQuestion.question,
    userAnswer: answer,
    contentScore,
    grammarScore: 0,
    fluencyScore: 0,
    communicationScore,
    matchedKeyPoints: evalJson.matchedKeyPoints || [],
    missingKeyPoints: evalJson.missingKeyPoints || [],
    verdict,
    feedback: evalJson.feedback || "Answer recorded.",
    analysis: {
      technicalAccuracy: accuracy,
      problemSolving: depth,
      practicalExecution: answerDirectnessScore,
      communication: communicationScore,
      coverage: conceptCoverage,
      understanding: conceptUnderstanding,
      reasoning,
      depth,
      clarity,
      structure,
      confidence: confidenceScoreVal,
      consistency,
      answerDirectnessScore,
      tradeoffReasoningScore,
      technicalErrors: errors
    },
    behavioralMetrics: isBehavioral ? {
      communication: communicationScore,
      problemSolving: depth,
      ownership: accuracy,
      teamwork: conceptCoverage,
      adaptability: depth,
      leadershipPotential: Math.round((accuracy + communicationScore) / 2),
      responseStructure: structure,
      evidenceStrength: depth
    } : undefined,
    confidenceScore: visualMetrics?.confidenceLevel ?? 0,
    expressionAnalysis: "Visual analysis processed.",
    timestamp: new Date().toISOString(),
    evaluationConfidence: Math.max(0, Math.min(100, evaluationConfidence))
  };
}

export const submitAnswer = async (
  candidate: Candidate,
  currentQuestion: Question,
  answer: string,
  visualMetrics?: VisualMetrics,
  settings?: RoleSettings,
  sessionId?: string
): Promise<{ evaluation: EvaluationResult; nextQuestion: Question | null }> => {

  const isBehavioral = currentQuestion.type?.startsWith("Behavioral");
  const guideStr = currentQuestion.evaluationGuide
    ? currentQuestion.evaluationGuide.map(area => `- ${area}`).join("\n")
    : "- Explain the core concepts of the question.";

  const difficulty = settings?.difficulty ?? "Medium";
  const scoringGuidelines = `SCORING GUIDELINES (IMPORTANT):

1. CONCEPT OVER KEYWORDS:
    If the candidate demonstrates correct conceptual understanding in their own words, award reasonable marks even if exact keywords or textbook terminology are missing.
2. MODERATE LENIENCY:
    Do not require perfect answers for medium scores. A partially correct explanation with clear understanding should typically score between 5-7/10 rather than being heavily penalized.
3. REAL-WORLD INTERVIEW STANDARD:
    Evaluate like an experienced interviewer, not an exam checker. Candidates may use simple language, informal phrasing, or imperfect grammar while still demonstrating understanding.
4. UNDERSTANDING > MEMORIZATION:
    Reward explanations, examples, reasoning, and practical understanding more than keyword matching.
5. AVOID OVER-PENALIZATION:
    Minor omissions, communication mistakes, stuttering, or imperfect wording should not significantly reduce scores if the core concept is correct.
6. PARTIAL CREDIT:
    If approximately 50-70% of the expected concept is explained correctly, award proportional credit instead of treating the answer as incorrect.
7. STRICT ONLY FOR FACTUAL ERRORS:
    Apply stronger penalties only when the candidate provides technically incorrect information, contradictions, hallucinations, or clearly misunderstands the concept.
8. SCORING CALIBRATION (Difficulty Level: ${difficulty}):
    * Excellent understanding: 8-10 ${difficulty.includes('Hard') ? '(strict, requires some examples/depth)' : difficulty.includes('Easy') ? '(lenient, basic explanation is enough)' : ''}
    * Good understanding with minor gaps: 6-8
    * Partial understanding: 4-6
    * Limited understanding: 2-4
    * Incorrect or irrelevant answer: 0-2

Maintain evidence-based evaluation and avoid generic praise, but do not be excessively strict when the candidate demonstrates genuine conceptual understanding.`;

  const evalPrompt = `You are evaluating a SPOKEN interview answer (transcribed via speech-to-text).
IMPORTANT: The transcript may contain minor speech errors, informal phrasing, or filler words. Focus on the SUBSTANCE of what was said, not grammar or polish.

QUESTION: "${currentQuestion.question}"
${currentQuestion.ideal_answer ? `IDEAL/REFERENCE ANSWER: "${currentQuestion.ideal_answer}"` : ''}
TYPE: ${currentQuestion.type || 'Technical'}

EVALUATION GUIDE CHECKLIST AREAS TO CHECK:
${guideStr}

CANDIDATE'S SPOKEN ANSWER: "${answer}"

${scoringGuidelines}

INTERNAL RUBRICS (Aligned with Scoring Calibration):
- Coverage:
  8-10 = Explains almost all expected checklist areas correctly, showing clear coverage.
  6-8 = Explains most expected checklist areas, with minor gaps or omission of non-critical details.
  4-6 = Explains some expected checklist areas correctly (partial credit), showing partial coverage.
  2-4 = Only mentions or superficially covers areas without explaining them (limited coverage).
  0-2 = No relevant areas mentioned or answered.
- Understanding:
  8-10 = Explains core ideas in their own words clearly with examples, showing excellent understanding.
  6-8 = Demonstrates good understanding, can explain key details but has minor gaps.
  4-6 = Shows partial understanding, understands basic terms but struggles to explain deeply.
  2-4 = Superficial mentions or copy-pasted terms without explaining what they mean.
  0-2 = Incorrect information or total misunderstanding of the concept.
- Reasoning:
  8-10 = Core reasoning is solid, logical, and supports design choices or tradeoffs.
  6-8 = Clear reasoning with minor logical gaps or incomplete pros/cons.
  4-6 = Partial reasoning, some logic is present but has notable holes.
  2-4 = Limited logical connection, unstructured or vague logic.
  0-2 = Confused reasoning, technical contradictions, or irrelevant logic.
- Depth:
  8-10 = Provides excellent detail and nuance; explains design tradeoffs, examples, or practical applications.
  6-8 = Substantial detail and context provided, but misses some advanced nuances.
  4-6 = Basic details provided; answers the question directly but lacks elaboration.
  2-4 = Very surface-level, lists keywords without elaboration.
  0-2 = No depth, incorrect assertions, or empty answer.

CRITICAL RULE ON KEYWORD LISTING / SHORT UNEXPLAINED ANSWERS:
If the candidate's answer simply lists the names of the expected areas or keywords (e.g., just listing the terms "encapsulation, inheritance, polymorphism, abstraction" for OOP, or "HTML, CSS, JS" for web development) without actually explaining what they mean, how they function, or giving any context/examples, the answer is NOT complete.
In this case, you MUST penalize the scores strictly:
- "conceptUnderstanding" MUST NOT exceed 2/10 (since they only gave superficial mentions or recited terms without explaining).
- "depth" MUST NOT exceed 1/10 (since there is no elaboration or detail).
- "reasoning" MUST NOT exceed 2/10.
- "accuracy" and "conceptCoverage" MUST NOT exceed 4/10 (since reciting terms is only a superficial identification and lacks full coverage or accuracy of the required knowledge).
- Make sure to list these terms under "matchedKeyPoints" if they are present, but the scores must reflect the severe lack of understanding and explanation.
- State in the "feedback" that the candidate only listed the concepts without explaining them.

Evaluate the candidate's answer against the expected checklist areas and rubrics.
Check for any hallucinated, factually incorrect, or contradictory technical statements and return them as technicalErrors with severity (low, medium, or high).
Provide score for answerDirectnessScore (0-10) which measures how directly they answered the question without keyword stuffing or bluffing.
Provide tradeoffReasoningScore (0-10 or null) which evaluates how well they discuss design tradeoffs, pros/cons, or alternative approaches (return null if not applicable to this question).

Return strictly the following JSON structure:
{
  "accuracy": number, // 0-10
  "conceptCoverage": number, // 0-10
  "conceptUnderstanding": number, // 0-10
  "reasoning": number, // 0-10
  "depth": number, // 0-10
  "clarity": number, // 0-10
  "structure": number, // 0-10
  "confidence": number, // 0-10
  "consistency": number, // 0-10
  "answerDirectnessScore": number, // 0-10
  "tradeoffReasoningScore": number | null, // 0-10 or null
  "technicalErrors": [
    { "error": "description of incorrect or hallucinated statement", "severity": "low" | "medium" | "high" }
  ],
  "matchedKeyPoints": ["areas from the evaluation guide checklist that the candidate covered"],
  "missingKeyPoints": ["areas from the evaluation guide checklist that the candidate missed"],
  "feedback": "2-sentence objective, evidence-based feedback focusing strictly on the candidate's actual response. State exactly what expected areas they explained correctly and what they missed or got wrong in their words. Avoid generic praise, boilerplate, or explaining the ideal answer in general."
}`;

  const generateEval = async (prompt: string): Promise<EvaluationResult> => {
    let cleanText = await generateWithOpenRouter(prompt);
    cleanText = cleanText.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
    else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');

    const evalJson = JSON.parse(cleanText);
    return buildEvaluationResult(currentQuestion, answer, evalJson, visualMetrics, isBehavioral);
  };

  try {
    const evaluation = await generateEval(evalPrompt);
    return { evaluation, nextQuestion: null };
  } catch (error: any) {
    console.error("OpenRouter Evaluation Failed:", error);
    ErrorLogService.logError('evaluation', `Answer evaluation failed for question "${currentQuestion.question.substring(0, 30)}...": ${error.message || error}`, error, sessionId, candidate.name);
    throw error;
  }
};

export const retryEvaluation = async (
  question: Question,
  answer: string,
  sessionId?: string
): Promise<EvaluationResult> => {
  const guideStr = question.evaluationGuide
    ? question.evaluationGuide.map(area => `- ${area}`).join("\n")
    : "- Explain the core concepts of the question.";

  const isBehavioral = question.type?.startsWith("Behavioral");

  const scoringGuidelines = `SCORING GUIDELINES (IMPORTANT):

1. CONCEPT OVER KEYWORDS:
    If the candidate demonstrates correct conceptual understanding in their own words, award reasonable marks even if exact keywords or textbook terminology are missing.
2. MODERATE LENIENCY:
    Do not require perfect answers for medium scores. A partially correct explanation with clear understanding should typically score between 5-7/10 rather than being heavily penalized.
3. REAL-WORLD INTERVIEW STANDARD:
    Evaluate like an experienced interviewer, not an exam checker. Candidates may use simple language, informal phrasing, or imperfect grammar while still demonstrating understanding.
4. UNDERSTANDING > MEMORIZATION:
    Reward explanations, examples, reasoning, and practical understanding more than keyword matching.
5. AVOID OVER-PENALIZATION:
    Minor omissions, communication mistakes, stuttering, or imperfect wording should not significantly reduce scores if the core concept is correct.
6. PARTIAL CREDIT:
    If approximately 50-70% of the expected concept is explained correctly, award proportional credit instead of treating the answer as incorrect.
7. STRICT ONLY FOR FACTUAL ERRORS:
    Apply stronger penalties only when the candidate provides technically incorrect information, contradictions, hallucinations, or clearly misunderstands the concept.
8. SCORING CALIBRATION:
    * Excellent understanding: 8-10
    * Good understanding with minor gaps: 6-8
    * Partial understanding: 4-6
    * Limited understanding: 2-4
    * Incorrect or irrelevant answer: 0-2

Maintain evidence-based evaluation and avoid generic praise, but do not be excessively strict when the candidate demonstrates genuine conceptual understanding.`;

  const prompt = `You are evaluating a SPOKEN interview answer (transcribed via speech-to-text).
IMPORTANT: The transcript may contain minor speech errors, informal phrasing, or filler words. Focus on the SUBSTANCE of what was said, not grammar or polish.

QUESTION: "${question.question}"
${question.ideal_answer ? `IDEAL/REFERENCE ANSWER: "${question.ideal_answer}"` : ''}
TYPE: ${question.type || 'Technical'}

EVALUATION GUIDE CHECKLIST AREAS TO CHECK:
${guideStr}

ANSWER: "${answer}"

${scoringGuidelines}

INTERNAL RUBRICS (Aligned with Scoring Calibration):
- Coverage:
  8-10 = Explains almost all expected checklist areas correctly, showing clear coverage.
  6-8 = Explains most expected checklist areas, with minor gaps or omission of non-critical details.
  4-6 = Explains some expected checklist areas correctly (partial credit), showing partial coverage.
  2-4 = Only mentions or superficially covers areas without explaining them (limited coverage).
  0-2 = No relevant areas mentioned or answered.
- Understanding:
  8-10 = Explains core ideas in their own words clearly with examples, showing excellent understanding.
  6-8 = Demonstrates good understanding, can explain key details but has minor gaps.
  4-6 = Shows partial understanding, understands basic terms but struggles to explain deeply.
  2-4 = Superficial mentions or copy-pasted terms without explaining what they mean.
  0-2 = Incorrect information or total misunderstanding of the concept.
- Reasoning:
  8-10 = Core reasoning is solid, logical, and supports design choices or tradeoffs.
  6-8 = Clear reasoning with minor logical gaps or incomplete pros/cons.
  4-6 = Partial reasoning, some logic is present but has notable holes.
  2-4 = Limited logical connection, unstructured or vague logic.
  0-2 = Confused reasoning, technical contradictions, or irrelevant logic.
- Depth:
  8-10 = Provides excellent detail and nuance; explains design tradeoffs, examples, or practical applications.
  6-8 = Substantial detail and context provided, but misses some advanced nuances.
  4-6 = Basic details provided; answers the question directly but lacks elaboration.
  2-4 = Very surface-level, lists keywords without elaboration.
  0-2 = No depth, incorrect assertions, or empty answer.

CRITICAL RULE ON KEYWORD LISTING / SHORT UNEXPLAINED ANSWERS:
If the candidate's answer simply lists the names of the expected areas or keywords (e.g., just listing the terms "encapsulation, inheritance, polymorphism, abstraction" for OOP, or "HTML, CSS, JS" for web development) without actually explaining what they mean, how they function, or giving any context/examples, the answer is NOT complete.
In this case, you MUST penalize the scores strictly:
- "conceptUnderstanding" MUST NOT exceed 2/10 (since they only gave superficial mentions or recited terms without explaining).
- "depth" MUST NOT exceed 1/10 (since there is no elaboration or detail).
- "reasoning" MUST NOT exceed 2/10.
- "accuracy" and "conceptCoverage" MUST NOT exceed 4/10 (since reciting terms is only a superficial identification and lacks full coverage or accuracy of the required knowledge).
- Make sure to list these terms under "matchedKeyPoints" if they are present, but the scores must reflect the severe lack of understanding and explanation.
- State in the "feedback" that the candidate only listed the concepts without explaining them.

Evaluate the candidate's answer against the expected checklist areas and rubrics.
Check for any hallucinated, factually incorrect, or contradictory technical statements and return them as technicalErrors with severity (low, medium, or high).
Provide score for answerDirectnessScore (0-10) which measures how directly they answered the question without keyword stuffing or bluffing.
Provide tradeoffReasoningScore (0-10 or null) which evaluates how well they discuss design tradeoffs, pros/cons, or alternative approaches (return null if not applicable to this question).

Return strictly the following JSON structure:
{
  "accuracy": number, // 0-10
  "conceptCoverage": number, // 0-10
  "conceptUnderstanding": number, // 0-10
  "reasoning": number, // 0-10
  "depth": number, // 0-10
  "clarity": number, // 0-10
  "structure": number, // 0-10
  "confidence": number, // 0-10
  "consistency": number, // 0-10
  "answerDirectnessScore": number, // 0-10
  "tradeoffReasoningScore": number | null, // 0-10 or null
  "technicalErrors": [
    { "error": "description of incorrect or hallucinated statement", "severity": "low" | "medium" | "high" }
  ],
  "matchedKeyPoints": [],
  "missingKeyPoints": [],
  "feedback": "2-sentence objective, evidence-based feedback focusing strictly on the candidate's actual response. State exactly what expected areas they explained correctly and what they missed or got wrong in their words. Avoid generic praise, boilerplate, or explaining the ideal answer in general."
}`;

  try {
    let cleanText = await generateWithOpenRouter(prompt);
    cleanText = cleanText.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
    else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');

    const evalJson = JSON.parse(cleanText);
    return buildEvaluationResult(question, answer, evalJson, undefined, isBehavioral);
  } catch (err: any) {
    console.error("Retry evaluation failed:", err);
    ErrorLogService.logError('evaluation', `Retry evaluation failed: ${err.message || err}`, err, sessionId);
    throw err;
  }
};
