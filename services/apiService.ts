import { Candidate, EvaluationResult, Question, RoleSettings, VisualMetrics } from "../types";
import { StorageService } from "./storageService";

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

/**
 * Compute a local evaluation score when AI is unavailable.
 * Formula: 0.6 * keywordMatch + 0.2 * answerLength + 0.2 * conceptDensity
 */
export function localEvaluate(
  answer: string,
  question: Question
): { score: number; matched: string[]; missed: string[]; confidence: number } {
  const answerLower = answer.toLowerCase().trim();
  const words = answerLower.split(/\s+/).filter(Boolean);

  // 1. Keyword matching against keyConcepts
  const keyConcepts = question.keyConcepts || [];
  const keyPoints = question.keyPoints || [];

  const allConcepts = keyConcepts.length > 0
    ? keyConcepts
    : keyPoints.map(kp => ({ concept: kp, importance: 'medium' as const }));

  let matchedScore = 0;
  let totalPossible = 0;
  const matched: string[] = [];
  const missed: string[] = [];

  for (const kc of allConcepts) {
    const weight = kc.importance === 'high' ? 2 : kc.importance === 'low' ? 0.5 : 1;
    totalPossible += weight;

    // Check if any significant word from the concept appears in the answer
    const conceptWords = kc.concept.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchCount = conceptWords.filter(cw => answerLower.includes(cw)).length;
    const matchRatio = conceptWords.length > 0 ? matchCount / conceptWords.length : 0;

    if (matchRatio >= 0.4) {
      matchedScore += weight;
      matched.push(kc.concept);
    } else {
      missed.push(kc.concept);
    }
  }

  const keywordMatchScore = totalPossible > 0 ? (matchedScore / totalPossible) * 10 : 5;

  // 2. Answer length score (0-10)
  // Short answers (<20 words) score low, medium (20-80) score mid, long (80+) score high
  let lengthScore: number;
  if (words.length < 10) lengthScore = 1;
  else if (words.length < 20) lengthScore = 3;
  else if (words.length < 40) lengthScore = 5;
  else if (words.length < 80) lengthScore = 7;
  else if (words.length < 150) lengthScore = 8;
  else lengthScore = 9;

  // 3. Concept density = unique concept-related words / total words
  const conceptRelatedWords = new Set<string>();
  for (const kc of allConcepts) {
    kc.concept.toLowerCase().split(/\s+/).filter(w => w.length > 3).forEach(w => {
      if (answerLower.includes(w)) conceptRelatedWords.add(w);
    });
  }
  const densityRatio = words.length > 0 ? conceptRelatedWords.size / Math.min(words.length, 50) : 0;
  const densityScore = Math.min(10, densityRatio * 30); // Scale up

  // Final local score
  const rawScore = keywordMatchScore * 0.6 + lengthScore * 0.2 + densityScore * 0.2;
  const score = Math.round(Math.max(0, Math.min(10, rawScore)) * 10) / 10;

  // Confidence is low for local evaluation
  const confidence = Math.round(
    (matched.length / Math.max(allConcepts.length, 1)) * 40 + // Up to 40% from keyword coverage
    Math.min(20, words.length / 4) + // Up to 20% from answer length
    10 // Base 10%
  );

  return { score, matched, missed, confidence: Math.min(70, confidence) }; // Cap at 70% for local eval
}

/**
 * Local adaptive difficulty signal.
 * Used to determine next question difficulty without waiting for AI.
 * Returns 0-10 scale.
 */
export function localDifficultySignal(answer: string, question: Question): number {
  const answerLower = answer.toLowerCase().trim();
  const words = answerLower.split(/\s+/).filter(Boolean);

  // Keyword coverage (0-10)
  const keyConcepts = question.keyConcepts || [];
  const keyPoints = question.keyPoints || [];
  const allConcepts = keyConcepts.length > 0
    ? keyConcepts
    : keyPoints.map(kp => ({ concept: kp, importance: 'medium' as const }));

  let matchedCount = 0;
  for (const kc of allConcepts) {
    const conceptWords = kc.concept.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchCount = conceptWords.filter(cw => answerLower.includes(cw)).length;
    if (conceptWords.length > 0 && matchCount / conceptWords.length >= 0.4) {
      matchedCount++;
    }
  }
  const keywordCoverage = allConcepts.length > 0 ? (matchedCount / allConcepts.length) * 10 : 5;

  // Answer completeness (0-10) — based on length and structure
  let completeness: number;
  if (words.length < 10) completeness = 2;
  else if (words.length < 25) completeness = 4;
  else if (words.length < 50) completeness = 6;
  else if (words.length < 100) completeness = 8;
  else completeness = 9;

  // Formula: keywordCoverage * 0.7 + answerCompleteness * 0.3
  return Math.round((keywordCoverage * 0.7 + completeness * 0.3) * 10) / 10;
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
    keyPoints: ["Current Role", "Experience", "Skills"],
    maxScore: 10
  },
  {
    id: 2,
    question: "Describe a challenging project you worked on. What was your role and how did you overcome the obstacles?",
    difficulty: "medium" as const,
    ideal_answer: "Candidate defines problem, their specific action, and a positive result.",
    keyPoints: ["Problem definition", "Action taken", "Result"],
    maxScore: 10
  },
  {
    id: 3,
    question: "How do you handle disagreements with colleagues or managers?",
    difficulty: "medium" as const,
    ideal_answer: "Seeks to understand, communicates respectfully, finds compromise.",
    keyPoints: ["Communication", "Respect", "Compromise"],
    maxScore: 10
  },
  {
    id: 4,
    question: "Where do you see yourself professionally in five years?",
    difficulty: "easy" as const,
    ideal_answer: "Presents clear career progression goals aligned with the role.",
    keyPoints: ["Career goals", "Ambition", "Alignment"],
    maxScore: 10
  },
  {
    id: 5,
    question: "What do you consider your greatest professional strength?",
    difficulty: "easy" as const,
    ideal_answer: "Identifies a relevant strength and provides a quick example.",
    keyPoints: ["Relevance", "Self-awareness", "Example"],
    maxScore: 10
  },
  {
    id: 6,
    question: "Describe a time when you had to learn a new technology or skill quickly.",
    difficulty: "medium" as const,
    ideal_answer: "Shows adaptability, resourcefulness, and successfully applying the new skill.",
    keyPoints: ["Adaptability", "Learning process", "Application"],
    maxScore: 10
  },
  {
    id: 7,
    question: "How do you prioritize your work when dealing with multiple tight deadlines?",
    difficulty: "medium" as const,
    ideal_answer: "Uses a framework (like Eisenhower matrix), communicates with stakeholders, stays organized.",
    keyPoints: ["Time management", "Communication", "Organization"],
    maxScore: 10
  },
  {
    id: 8,
    question: "Tell me about a time you made a mistake. How did you handle it?",
    difficulty: "medium" as const,
    ideal_answer: "Takes accountability, fixes the issue, and learns from it.",
    keyPoints: ["Accountability", "Resolution", "Learning"],
    maxScore: 10
  },
  {
    id: 9,
    question: "What is your approach to giving and receiving constructive feedback?",
    difficulty: "medium" as const,
    ideal_answer: "Views it as an opportunity for growth; gives it specifically and kindly.",
    keyPoints: ["Open-mindedness", "Growth mindset", "Tact"],
    maxScore: 10
  },
  {
    id: 10,
    question: "Why are you interested in joining our company specifically?",
    difficulty: "easy" as const,
    ideal_answer: "Shows research about the company and aligns personal goals with company mission.",
    keyPoints: ["Research", "Alignment", "Enthusiasm"],
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
        keyPoints: ["Interest", "Goals"]
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
  const keyConceptsStr = currentQuestion.keyConcepts 
    ? currentQuestion.keyConcepts.map(kc => `[${kc.importance.toUpperCase()}] ${kc.concept}`).join("\n")
    : (currentQuestion.keyPoints?.join(", ") || "Analyze based on general knowledge.");

  const difficulty = settings?.difficulty ?? "Medium";
  let scoringGuide = `SCORING ANCHORS:
- 8-10: Covers most HIGH concepts clearly, shows depth and practical understanding
- 5-7: Covers at least 1-2 HIGH concepts, partially addresses others
- 3-4: Shows basic awareness but misses critical concepts or is vague
- 0-2: Completely wrong, irrelevant, or no meaningful content`;

  if (difficulty === 'Very Easy' || difficulty === 'Easy') {
    scoringGuide = `SCORING ANCHORS (LENIENT):
- 7-10: Mentions key concepts even if explanation is basic
- 4-6: Shows some awareness of the topic
- 2-3: Very vague but on-topic
- 0-1: Completely irrelevant`;
  } else if (difficulty === 'Hard' || difficulty === 'Very Hard') {
    scoringGuide = `SCORING ANCHORS (STRICT):
- 9-10: Expert-level depth, covers all HIGH concepts with examples
- 6-8: Solid understanding, covers most concepts with some depth
- 3-5: Basic understanding, missing key nuances
- 0-2: Surface-level or incorrect`;
  }

  const evalPrompt = `You are evaluating a SPOKEN interview answer (transcribed via speech-to-text).
IMPORTANT: The transcript may contain minor speech errors, informal phrasing, or filler words. Focus on the SUBSTANCE of what was said, not grammar or polish.

QUESTION: "${currentQuestion.question}"
${currentQuestion.ideal_answer ? `IDEAL/REFERENCE ANSWER: "${currentQuestion.ideal_answer}"` : ''}
TYPE: ${currentQuestion.type || 'Technical'}

KEY CONCEPTS TO CHECK:
${keyConceptsStr}

CANDIDATE'S SPOKEN ANSWER: "${answer}"

${scoringGuide}

INTERNAL RUBRICS:
- Coverage:
  0-2 = no relevant concepts
  3-5 = mentions some concepts
  6-8 = covers most concepts
  9-10 = covers nearly all concepts
- Understanding:
  0-2 = superficial mentions or copy-paste words without explaining
  3-5 = demonstrates basic comprehension of some concepts
  6-8 = demonstrates solid comprehension of most concepts, can explain key ideas
  9-10 = demonstrates expert-level comprehension and clarity
- Reasoning:
  0-2 = no logical connection or reasoning
  3-5 = makes basic logical steps but contains holes
  6-8 = solid logical structure and supports conclusions
  9-10 = exemplary logical progression and analysis
- Depth:
  0-2 = surface-level only
  3-5 = basic details provided
  6-8 = substantial detail and nuance
  9-10 = excellent depth with comprehensive details

CRITICAL RULE ON KEYWORD LISTING / SHORT UNEXPLAINED ANSWERS:
If the candidate's answer simply lists the names of the key concepts, terms, or keywords (e.g., just listing the terms "encapsulation, inheritance, polymorphism, abstraction" for OOP, or "HTML, CSS, JS" for web development) without actually explaining what they mean, how they function, or giving any context/examples, the answer is NOT complete.
In this case, you MUST penalize the scores strictly:
- "conceptUnderstanding" MUST NOT exceed 2/10 (since they only gave superficial mentions or recited terms without explaining).
- "depth" MUST NOT exceed 1/10 (since there is no elaboration or detail).
- "reasoning" MUST NOT exceed 2/10.
- "accuracy" and "conceptCoverage" MUST NOT exceed 4/10 (since reciting terms is only a superficial identification and lacks full coverage or accuracy of the required knowledge).
- Make sure to list these terms under "matchedKeyPoints" if they are present, but the scores must reflect the severe lack of understanding and explanation.
- State in the "feedback" that the candidate only listed the concepts without explaining them.

Evaluate the candidate's answer against the key concepts and rubrics.
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
  "matchedKeyPoints": ["concepts the candidate covered"],
  "missingKeyPoints": ["concepts the candidate missed"],
  "feedback": "2-sentence specific feedback. State what was good and what was missing. NO generic praise."
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
  } catch (error) {
    console.error("OpenRouter Evaluation Failed, falling back to local evaluation:", error);
    const local = localEvaluate(answer, currentQuestion);

    let verdict: 'Excellent' | 'Good' | 'Borderline' | 'Fail';
    if (local.score >= 8) verdict = 'Excellent';
    else if (local.score >= 6) verdict = 'Good';
    else if (local.score >= 4) verdict = 'Borderline';
    else verdict = 'Fail';

    const fallbackEval: EvaluationResult = {
      questionId: Number(currentQuestion.id),
      questionText: currentQuestion.question,
      userAnswer: answer,
      contentScore: local.score,
      grammarScore: 0,
      fluencyScore: 0,
      communicationScore: 0,
      matchedKeyPoints: local.matched,
      missingKeyPoints: local.missed,
      verdict,
      feedback: `Evaluated locally (AI unavailable). Score based on keyword coverage and answer completeness.`,
      confidenceScore: visualMetrics?.confidenceLevel ?? 0,
      expressionAnalysis: "N/A",
      timestamp: new Date().toISOString(),
      evaluationPending: true,
      evaluationConfidence: local.confidence,
      analysis: {
        technicalAccuracy: local.score,
        problemSolving: local.score,
        practicalExecution: local.score,
        communication: 0,
        coverage: local.score,
        understanding: local.score,
        reasoning: local.score,
        depth: local.score,
        clarity: 0,
        structure: 0,
        confidence: 0,
        consistency: 0,
        answerDirectnessScore: local.score,
        tradeoffReasoningScore: undefined,
        technicalErrors: []
      }
    };
    return { evaluation: fallbackEval, nextQuestion: null };
  }
};

export const retryEvaluation = async (
  question: Question,
  answer: string,
  sessionId?: string
): Promise<EvaluationResult> => {
  const keyConceptsStr = question.keyConcepts 
    ? question.keyConcepts.map(kc => `[${kc.importance.toUpperCase()}] ${kc.concept}`).join("\n")
    : (question.keyPoints?.join(", ") || "Analyze based on general knowledge.");

  const isBehavioral = question.type?.startsWith("Behavioral");

  const prompt = `You are evaluating a SPOKEN interview answer (transcribed via speech-to-text).
IMPORTANT: The transcript may contain minor speech errors, informal phrasing, or filler words. Focus on the SUBSTANCE of what was said, not grammar or polish.

QUESTION: "${question.question}"
${question.ideal_answer ? `IDEAL/REFERENCE ANSWER: "${question.ideal_answer}"` : ''}
TYPE: ${question.type || 'Technical'}

KEY CONCEPTS TO CHECK:
${keyConceptsStr}

ANSWER: "${answer}"

INTERNAL RUBRICS:
- Coverage:
  0-2 = no relevant concepts
  3-5 = mentions some concepts
  6-8 = covers most concepts
  9-10 = covers nearly all concepts
- Understanding:
  0-2 = superficial mentions or copy-paste words without explaining
  3-5 = demonstrates basic comprehension of some concepts
  6-8 = demonstrates solid comprehension of most concepts, can explain key ideas
  9-10 = demonstrates expert-level comprehension and clarity
- Reasoning:
  0-2 = no logical connection or reasoning
  3-5 = makes basic logical steps but contains holes
  6-8 = solid logical structure and supports conclusions
  9-10 = exemplary logical progression and analysis
- Depth:
  0-2 = surface-level only
  3-5 = basic details provided
  6-8 = substantial detail and nuance
  9-10 = excellent depth with comprehensive details

CRITICAL RULE ON KEYWORD LISTING / SHORT UNEXPLAINED ANSWERS:
If the candidate's answer simply lists the names of the key concepts, terms, or keywords (e.g., just listing the terms "encapsulation, inheritance, polymorphism, abstraction" for OOP, or "HTML, CSS, JS" for web development) without actually explaining what they mean, how they function, or giving any context/examples, the answer is NOT complete.
In this case, you MUST penalize the scores strictly:
- "conceptUnderstanding" MUST NOT exceed 2/10 (since they only gave superficial mentions or recited terms without explaining).
- "depth" MUST NOT exceed 1/10 (since there is no elaboration or detail).
- "reasoning" MUST NOT exceed 2/10.
- "accuracy" and "conceptCoverage" MUST NOT exceed 4/10 (since reciting terms is only a superficial identification and lacks full coverage or accuracy of the required knowledge).
- Make sure to list these terms under "matchedKeyPoints" if they are present, but the scores must reflect the severe lack of understanding and explanation.
- State in the "feedback" that the candidate only listed the concepts without explaining them.

Evaluate the candidate's answer against the key concepts and rubrics.
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
  "feedback": "2-sentence feedback"
}`;

  try {
    let cleanText = await generateWithOpenRouter(prompt);
    cleanText = cleanText.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
    else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');

    const evalJson = JSON.parse(cleanText);
    return buildEvaluationResult(question, answer, evalJson, undefined, isBehavioral);
  } catch (err) {
    console.warn("Retry evaluation failed, using local scoring:", err);
    
    const local = localEvaluate(answer, question);
    let verdict: 'Excellent' | 'Good' | 'Borderline' | 'Fail';
    if (local.score >= 8) verdict = 'Excellent';
    else if (local.score >= 6) verdict = 'Good';
    else if (local.score >= 4) verdict = 'Borderline';
    else verdict = 'Fail';

    return {
      questionId: Number(question.id),
      questionText: question.question,
      userAnswer: answer,
      contentScore: local.score,
      grammarScore: 0,
      fluencyScore: 0,
      communicationScore: 0,
      matchedKeyPoints: local.matched,
      missingKeyPoints: local.missed,
      verdict,
      feedback: `Evaluated locally after retry failed. Score based on keyword coverage and answer completeness.`,
      confidenceScore: 0,
      expressionAnalysis: "Local evaluation.",
      timestamp: new Date().toISOString(),
      evaluationPending: false,
      evaluationConfidence: local.confidence,
      analysis: {
        technicalAccuracy: local.score,
        problemSolving: local.score,
        practicalExecution: local.score,
        communication: 0,
        coverage: local.score,
        understanding: local.score,
        reasoning: local.score,
        depth: local.score,
        clarity: 0,
        structure: 0,
        confidence: 0,
        consistency: 0,
        answerDirectnessScore: local.score,
        tradeoffReasoningScore: undefined,
        technicalErrors: []
      }
    };
  }
};
