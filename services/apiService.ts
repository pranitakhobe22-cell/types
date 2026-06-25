import { Candidate, EvaluationResult, Question, RoleSettings, VisualMetrics } from "../types";
import { StorageService } from "./storageService";
import { ErrorLogService } from "./errorLogService";
import { SupabaseService } from "./supabaseService";

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
          temperature: 0.1,
          response_format: { type: "json_object" },
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.choices || data.choices.length === 0) {
        throw new Error("OpenRouter API returned no choices.");
      }

      // Track token usage
      if (data.usage) {
        const promptTokens = data.usage.prompt_tokens || 0;
        const completionTokens = data.usage.completion_tokens || 0;
        SupabaseService.incrementSystemUsageStats(promptTokens, completionTokens).catch(e => {
          console.error("Failed to log system metric:", e);
        });
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

// Derive answerQuality from answerType primarily, score secondarily
function deriveAnswerQuality(
  answerType: 'honest_unknown' | 'keyword_list_only' | 'partial_explanation' | 'full_explanation',
  contentScore: number
): 'HONEST_UNKNOWN' | 'KEYWORD_LIST' | 'SURFACE_LEVEL' | 'COMPETENT' | 'STRONG' | 'EXPERT' {
  if (answerType === 'honest_unknown') return 'HONEST_UNKNOWN';
  // answerType is the primary signal — structure over score
  if (answerType === 'keyword_list_only') return 'KEYWORD_LIST';
  if (answerType === 'partial_explanation') {
    if (contentScore >= 8) return 'COMPETENT'; // partial but high-scoring edge case
    if (contentScore >= 5) return 'SURFACE_LEVEL';
    return 'SURFACE_LEVEL';
  }
  // full_explanation
  if (contentScore >= 9.5) return 'EXPERT';
  if (contentScore >= 8) return 'STRONG';
  if (contentScore >= 6) return 'COMPETENT';
  return 'SURFACE_LEVEL'; // full_explanation but low score = weak explanation
}

const honestUnknownPatterns = [
  "i don't know", "i do not know", "not sure", "haven't learned", "never studied",
  "don't remember", "not familiar", "no idea", "can't recall", "cannot recall",
  "haven't worked with", "not confident answering", "don't know much"
];

export function buildEvaluationResult(
  currentQuestion: Question,
  answer: string,
  evalJson: any,
  visualMetrics?: VisualMetrics,
  isBehavioral = false
): EvaluationResult {
  // ── 0. Classify answer type ──
  let answerType: 'honest_unknown' | 'keyword_list_only' | 'partial_explanation' | 'full_explanation' =
    (evalJson.answerType === 'honest_unknown' || evalJson.answerType === 'keyword_list_only' || evalJson.answerType === 'partial_explanation' || evalJson.answerType === 'full_explanation')
      ? evalJson.answerType
      : 'partial_explanation'; // safe default

  const answerLower = answer.toLowerCase().trim();
  const matchesHonestPattern = honestUnknownPatterns.some(pat => answerLower.includes(pat));

  let accuracy = Math.max(0, Math.min(10, evalJson.accuracy ?? 5));
  let conceptCoverage = Math.max(0, Math.min(10, evalJson.conceptCoverage ?? 5));
  let conceptUnderstanding = Math.max(0, Math.min(10, evalJson.conceptUnderstanding ?? 5));
  let reasoning = Math.max(0, Math.min(10, evalJson.reasoning ?? 5));
  let depth = Math.max(0, Math.min(10, evalJson.depth ?? 5));
  
  const clarity = Math.max(0, Math.min(10, evalJson.clarity ?? 5));
  const structure = Math.max(0, Math.min(10, evalJson.structure ?? 5));
  let confidenceScoreVal = Math.max(0, Math.min(10, evalJson.confidence ?? 5));
  const consistency = Math.max(0, Math.min(10, evalJson.consistency ?? 5));
  
  const answerDirectnessScore = Math.max(0, Math.min(10, evalJson.answerDirectnessScore ?? 5));
  const tradeoffReasoningScore = evalJson.tradeoffReasoningScore !== null && evalJson.tradeoffReasoningScore !== undefined
    ? Math.max(0, Math.min(10, evalJson.tradeoffReasoningScore))
    : undefined;

  const curiosity = Math.max(0, Math.min(10, evalJson.curiosity ?? 5));
  const selfCorrection = Math.max(0, Math.min(10, evalJson.selfCorrection ?? 5));

  const rawKnowledgeScore = (accuracy * 0.40) + (conceptCoverage * 0.30) + (conceptUnderstanding * 0.30);
  
  const isHonestUnknown = answerType === 'honest_unknown' || (matchesHonestPattern && rawKnowledgeScore <= 2);

  // ── 1. KEYWORD-ONLY HARD CAPS (enforced before any scoring) ──
  if (answerType === 'keyword_list_only') {
    accuracy = Math.min(4, accuracy);
    conceptCoverage = Math.min(4, conceptCoverage);
    conceptUnderstanding = Math.min(2, conceptUnderstanding);
    depth = Math.min(1, depth);
    reasoning = Math.min(2, reasoning);
  }

  // ── 2. Word-count heuristic (NEVER overrides answerType) ──
  const wordsList = answer.trim().split(/\s+/).filter(Boolean);
  const wordCount = wordsList.length;
  if (wordCount < 20 && answerType !== 'full_explanation' && answerType !== 'honest_unknown') {
    // Short answer that isn't a full explanation — apply conservative caps
    conceptUnderstanding = Math.min(3, conceptUnderstanding);
    depth = Math.min(2, depth);
  }

  // ── 3. Calculate Knowledge & Problem Solving Scores (0-10) ──
  let knowledgeScore = (accuracy * 0.40) + (conceptCoverage * 0.30) + (conceptUnderstanding * 0.30);
  let problemSolvingScore = (reasoning * 0.40) + (depth * 0.30) + (answerDirectnessScore * 0.30);

  // ── 4. Anti-Inflation Guardrails & Floor Protection ──
  if (accuracy < 4) {
    knowledgeScore = Math.min(5, knowledgeScore);
  }
  if (conceptUnderstanding < 4) {
    knowledgeScore = Math.min(6, knowledgeScore);
  }
  if (reasoning < 4) {
    problemSolvingScore = Math.min(5, problemSolvingScore);
  }
  if (accuracy <= 2 && conceptUnderstanding <= 2) {
    knowledgeScore = Math.min(4, knowledgeScore);
  }

  // ── 5. Conditional Positive Evidence Bonus (blocked for keyword-only) ──
  let evidenceBonus = 0;
  if (answerType !== 'keyword_list_only' && answerType !== 'honest_unknown' && (knowledgeScore >= 6 || problemSolvingScore >= 6)) {
    if (evalJson.positiveEvidence?.strongExample) evidenceBonus += 0.25;
    if (evalJson.positiveEvidence?.realProject) evidenceBonus += 0.25;
    if (evalJson.positiveEvidence?.tradeoffDiscussion) evidenceBonus += 0.25;
    if (evalJson.positiveEvidence?.practicalExperience) evidenceBonus += 0.25;
    evidenceBonus = Math.min(1.0, evidenceBonus);
  }

  // ── 6. Reduced Technical Error Penalties ──
  const errors = evalJson.technicalErrors || [];
  let errorDeduction = 0;
  for (const err of errors) {
    if (err.severity === 'low') errorDeduction += 0.15;
    else if (err.severity === 'medium') errorDeduction += 0.40;
    else if (err.severity === 'high') errorDeduction += 0.80;
  }
  errorDeduction = Math.min(1.5, errorDeduction);

  // ── 7. Final Adjusted Content Score with HARD CAP for keyword-only ──
  const rawContent = (0.60 * knowledgeScore) + (0.40 * problemSolvingScore);
  let contentScore = Math.round(Math.max(0, Math.min(10, rawContent + evidenceBonus - errorDeduction)) * 10) / 10;

  // HARD CAP: keyword-only answers can never exceed 4.0 regardless of bonuses
  if (answerType === 'keyword_list_only') {
    contentScore = Math.min(4.0, contentScore);
  }

  // ── 8. Communication Score ──
  let communicationScore = Math.round(((clarity + structure + confidenceScoreVal + consistency) / 4) * 10) / 10;

  // ── 9. Clamped Confidence Alignment / Gap ──
  let effectiveConfidence = Math.min(confidenceScoreVal, knowledgeScore + 2);
  // Safety: keyword-only answers — cap confidence so buzzword-reciters don't appear aligned
  if (answerType === 'keyword_list_only') {
    effectiveConfidence = Math.min(effectiveConfidence, 4);
  }
  let confidenceGap = effectiveConfidence - knowledgeScore; // range -10 to +10

  // ── 10. Constrained Learning Potential ──
  let learningPotentialScore = (0.40 * curiosity) + (0.30 * reasoning) + (0.30 * selfCorrection);

  // ── 10.1 Honesty and Bluff Logic ──
  let finalHonestyScore = Math.max(0, Math.min(10, evalJson.honestyScore ?? (isHonestUnknown ? 10 : 8.5)));
  let finalKnowledgeAdmissionScore = Math.max(0, Math.min(10, evalJson.knowledgeAdmissionScore ?? (isHonestUnknown ? 4 : 0)));

  if (isHonestUnknown) {
    answerType = 'honest_unknown';
    
    // Evaluate honestyScore and knowledgeAdmissionScore based on rules
    if (wordCount <= 3) {
      // Very short dismissal (e.g. "Don't know")
      finalHonestyScore = 7.5;
      finalKnowledgeAdmissionScore = 2.0;
    } else if (rawKnowledgeScore > 0.5) {
      // Partial knowledge + admits uncertainty (e.g., Candidate B)
      finalHonestyScore = 9.5;
      if (!evalJson.knowledgeAdmissionScore || evalJson.knowledgeAdmissionScore < 5) {
        finalKnowledgeAdmissionScore = 8.5;
      }
    } else {
      // Pure admission (e.g. "I don't know normalization.")
      finalHonestyScore = 10;
      finalKnowledgeAdmissionScore = 4.0;
    }

    // Force strict scoring guardrail overrides for honest unknowns
    contentScore = 0;
    knowledgeScore = 0;
    problemSolvingScore = 0;
    learningPotentialScore = 0;
    confidenceGap = 0;
    evidenceBonus = 0;
    communicationScore = 0;
  }

  let bluffRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (isHonestUnknown) {
    bluffRisk = 'LOW';
  } else {
    const confidenceGapVal = confidenceScoreVal - (Math.round(knowledgeScore * 10) / 10);
    if ((confidenceScoreVal >= 7 && knowledgeScore <= 3) || confidenceGapVal >= 4) {
      bluffRisk = 'HIGH';
    } else if (confidenceGapVal >= 2) {
      bluffRisk = 'MEDIUM';
    } else {
      bluffRisk = 'LOW';
    }
  }

  // ── 11. Verdict ──
  let verdict: 'Excellent' | 'Good' | 'Pass' | 'Borderline' | 'Fail';
  if (contentScore >= 8) verdict = 'Excellent';
  else if (contentScore >= 6) verdict = 'Good';
  else if (contentScore >= 4) verdict = 'Borderline';
  else verdict = 'Fail';

  const evaluationConfidence = Math.round(
    (conceptCoverage * 0.3 + conceptUnderstanding * 0.3 + reasoning * 0.2 + consistency * 0.2) * 10
  );

  // ── 12. Concepts: mentioned vs explained ──
  const mentionedConcepts: string[] = evalJson.mentionedConcepts || evalJson.matchedKeyPoints || [];
  const explainedConcepts: string[] = isHonestUnknown ? [] : (evalJson.explainedConcepts || []);

  // ── 13. Answer Quality (answerType-primary, score-secondary) ──
  const answerQuality = deriveAnswerQuality(answerType, contentScore);

  // ── 14. Generate beautiful mentor feedback ──
  let feedback = '';
  if (answerType === 'honest_unknown') {
    const checklist = currentQuestion.evaluationGuide || [];
    const checklistStr = checklist.length > 0
      ? checklist.slice(0, 3).map(area => `\n• ${area}`).join('')
      : '\n• Core fundamentals';
    feedback = `You correctly identified that this topic was outside your current knowledge. For future interviews, review:${checklistStr}\n\nHonest answers are preferable to confident guesses because they help interviewers accurately assess your strengths and learning needs.`;
  } else if (answerType === 'keyword_list_only') {
    feedback = `You listed several relevant terms (${mentionedConcepts.join(', ') || 'keywords'}), but did not explain them. In future discussions, try to elaborate on what these terms mean and how they apply in practice.`;
  } else if (answerType === 'partial_explanation') {
    const explained = explainedConcepts.length > 0 ? explainedConcepts.join(', ') : 'some parts';
    const missed = (evalJson.missingKeyPoints || []).length > 0 ? (evalJson.missingKeyPoints || []).join(', ') : 'other expected areas';
    feedback = `You explained ${explained} well, but missed key technical concepts like ${missed}. Try to structure your answers to cover both theoretical principles and practical trade-offs.`;
  } else {
    feedback = `You provided a clear and well-structured explanation of the concepts. To stand out, try adding examples from your past projects or discussing architectural alternatives.`;
  }

  return {
    questionId: Number(currentQuestion.id),
    questionText: currentQuestion.question,
    userAnswer: answer,
    contentScore,
    knowledgeScore: Math.round(knowledgeScore * 10) / 10,
    problemSolvingScore: Math.round(problemSolvingScore * 10) / 10,
    learningPotentialScore: Math.round(learningPotentialScore * 10) / 10,
    confidenceGap: Math.round(confidenceGap * 10) / 10,
    grammarScore: 0,
    fluencyScore: 0,
    communicationScore,
    mentionedConcepts,
    explainedConcepts,
    matchedKeyPoints: mentionedConcepts, // backward compat
    missingKeyPoints: evalJson.missingKeyPoints || [],
    answerType,
    answerQuality,
    verdict,
    feedback,
    honestyScore: finalHonestyScore,
    knowledgeAdmissionScore: finalKnowledgeAdmissionScore,
    bluffRisk,
    analysis: {
      technicalAccuracy: isHonestUnknown ? 0 : accuracy,
      problemSolving: isHonestUnknown ? 0 : depth,
      practicalExecution: isHonestUnknown ? 0 : answerDirectnessScore,
      communication: isHonestUnknown ? 0 : communicationScore,
      coverage: isHonestUnknown ? 0 : conceptCoverage,
      understanding: isHonestUnknown ? 0 : conceptUnderstanding,
      reasoning: isHonestUnknown ? 0 : reasoning,
      depth: isHonestUnknown ? 0 : depth,
      clarity: isHonestUnknown ? 0 : clarity,
      structure: isHonestUnknown ? 0 : structure,
      confidence: isHonestUnknown ? 0 : confidenceScoreVal,
      consistency: isHonestUnknown ? 0 : consistency,
      answerDirectnessScore: isHonestUnknown ? 0 : answerDirectnessScore,
      tradeoffReasoningScore: isHonestUnknown ? 0 : tradeoffReasoningScore,
      curiosity: isHonestUnknown ? 0 : curiosity,
      selfCorrection: isHonestUnknown ? 0 : selfCorrection,
      learningPotential: isHonestUnknown ? 0 : (Math.round(learningPotentialScore * 10) / 10),
      technicalErrors: isHonestUnknown ? [] : errors
    },
    behavioralMetrics: isBehavioral ? {
      communication: isHonestUnknown ? 0 : communicationScore,
      problemSolving: isHonestUnknown ? 0 : depth,
      ownership: isHonestUnknown ? 0 : accuracy,
      teamwork: isHonestUnknown ? 0 : conceptCoverage,
      adaptability: isHonestUnknown ? 0 : depth,
      leadershipPotential: isHonestUnknown ? 0 : Math.round((accuracy + communicationScore) / 2),
      responseStructure: isHonestUnknown ? 0 : structure,
      evidenceStrength: isHonestUnknown ? 0 : depth
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

  // Slim evaluation prompt: scores + concepts + answerType + honestyScore + knowledgeAdmissionScore only.
  // Narrative feedback is generated locally from the structured data.
  const evalPrompt = `You are evaluating a SPOKEN interview answer (transcribed via speech-to-text).
The transcript may contain minor speech errors or filler words. Focus on SUBSTANCE, not grammar.

QUESTION: "${currentQuestion.question}"
${currentQuestion.ideal_answer ? `IDEAL/REFERENCE ANSWER: "${currentQuestion.ideal_answer}"` : ''}
TYPE: ${currentQuestion.type || 'Technical'}

EVALUATION CHECKLIST (expected areas):
${guideStr}

CANDIDATE'S SPOKEN ANSWER: "${answer}"

=== CRITICAL RULE (HIGHEST PRIORITY) ===
FIRST, classify the answer as one of:
- "honest_unknown": Candidate admits they do not know or are unfamiliar with the topic/concept.
- "keyword_list_only": Candidate ONLY lists names/terms without explaining what they mean, how they work, or giving context/examples.
- "partial_explanation": Candidate explains SOME concepts but not all expected areas.
- "full_explanation": Candidate explains the concepts with understanding, examples, or reasoning.

IF answerType is "honest_unknown":
- accuracy, conceptCoverage, conceptUnderstanding, reasoning, depth, clarity, structure, confidence, consistency, and answerDirectnessScore MUST all be 0/10.
- honestyScore MUST be scored based on:
  * 10: Polite/structured pure admission of gap (e.g. "I haven't worked with Kafka...").
  * 9-10: Admitting uncertainty but trying to explain related concepts.
  * 7-8: Very short dismissals ("don't know").
- knowledgeAdmissionScore MUST be scored based on:
  * 8-10: Candidate clearly identifies what they know vs what they don't (e.g. comparing Kafka to RabbitMQ).
  * 5-7: Moderate attempt to explain related knowledge when admitting a gap.
  * 1-4: Minimal effort (e.g. pure "don't know").
  * 0: No gap admitted or bluffing.

IF answerType is "keyword_list_only":
- accuracy and conceptCoverage MUST NOT exceed 4/10
- conceptUnderstanding MUST NOT exceed 2/10
- depth MUST NOT exceed 1/10
- reasoning MUST NOT exceed 2/10

IF answerType is NOT "honest_unknown":
- Evaluate honestyScore (0-10):
  * 9-10: Demonstrates strong self-awareness, calls out areas of uncertainty or limits of their knowledge.
  * 7-8: Standard answer, no obvious overclaiming but no specific self-awareness.
  * 3-6: Overstates weak knowledge (weak explanation but confident).
  * 0-2: Confidently wrong / bluffing.
- knowledgeAdmissionScore should default to 0 (or low score unless they explicitly admitted a sub-concept gap within a larger answer).
=== END CRITICAL RULE ===

SCORING BANDS:
* 9-10: Deep, flawless understanding with practical nuance
* 8-9: Good understanding, depth, and details
* 6-7: Genuine understanding with minor gaps
* 4-5: Basic or limited understanding, partial credit
* 0-3: Significant inaccuracies, empty, or pure keyword listing

Evaluate like an experienced interviewer, not an exam checker. If the candidate demonstrates correct understanding in their own words, award reasonable marks even without exact terminology. But listing keywords without explanation is NOT understanding.

For mentionedConcepts: list concepts the candidate NAMED or IDENTIFIED (even without explaining).
For explainedConcepts: list ONLY concepts the candidate actually EXPLAINED with understanding (stated what it means, how it works, or gave an example).
A concept in explainedConcepts MUST also appear in mentionedConcepts.

Return strictly the following JSON (no markdown, no extra text):
{
  "answerType": "honest_unknown" | "keyword_list_only" | "partial_explanation" | "full_explanation",
  "accuracy": number,
  "conceptCoverage": number,
  "conceptUnderstanding": number,
  "reasoning": number,
  "depth": number,
  "clarity": number,
  "structure": number,
  "confidence": number,
  "consistency": number,
  "answerDirectnessScore": number,
  "tradeoffReasoningScore": number | null,
  "curiosity": number,
  "selfCorrection": number,
  "honestyScore": number,
  "knowledgeAdmissionScore": number,
  "technicalErrors": [{ "error": "string", "severity": "low" | "medium" | "high" }],
  "positiveEvidence": {
    "strongExample": boolean,
    "realProject": boolean,
    "tradeoffDiscussion": boolean,
    "practicalExperience": boolean
  },
  "mentionedConcepts": ["concepts the candidate named/identified"],
  "explainedConcepts": ["concepts the candidate actually explained with understanding"],
  "missingKeyPoints": ["expected areas the candidate did not cover at all"]
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

  // Same slim prompt as submitAnswer
  const prompt = `You are evaluating a SPOKEN interview answer (transcribed via speech-to-text).
The transcript may contain minor speech errors or filler words. Focus on SUBSTANCE, not grammar.

QUESTION: "${question.question}"
${question.ideal_answer ? `IDEAL/REFERENCE ANSWER: "${question.ideal_answer}"` : ''}
TYPE: ${question.type || 'Technical'}

EVALUATION CHECKLIST (expected areas):
${guideStr}

CANDIDATE'S SPOKEN ANSWER: "${answer}"

=== CRITICAL RULE (HIGHEST PRIORITY) ===
FIRST, classify the answer as one of:
- "honest_unknown": Candidate admits they do not know or are unfamiliar with the topic/concept.
- "keyword_list_only": Candidate ONLY lists names/terms without explaining what they mean, how they work, or giving context/examples.
- "partial_explanation": Candidate explains SOME concepts but not all expected areas.
- "full_explanation": Candidate explains the concepts with understanding, examples, or reasoning.

IF answerType is "honest_unknown":
- accuracy, conceptCoverage, conceptUnderstanding, reasoning, depth, clarity, structure, confidence, consistency, and answerDirectnessScore MUST all be 0/10.
- honestyScore MUST be scored based on:
  * 10: Polite/structured pure admission of gap (e.g. "I haven't worked with Kafka...").
  * 9-10: Admitting uncertainty but trying to explain related concepts.
  * 7-8: Very short dismissals ("don't know").
- knowledgeAdmissionScore MUST be scored based on:
  * 8-10: Candidate clearly identifies what they know vs what they don't (e.g. comparing Kafka to RabbitMQ).
  * 5-7: Moderate attempt to explain related knowledge when admitting a gap.
  * 1-4: Minimal effort (e.g. pure "don't know").
  * 0: No gap admitted or bluffing.

IF answerType is "keyword_list_only":
- accuracy and conceptCoverage MUST NOT exceed 4/10
- conceptUnderstanding MUST NOT exceed 2/10
- depth MUST NOT exceed 1/10
- reasoning MUST NOT exceed 2/10

IF answerType is NOT "honest_unknown":
- Evaluate honestyScore (0-10):
  * 9-10: Demonstrates strong self-awareness, calls out areas of uncertainty or limits of their knowledge.
  * 7-8: Standard answer, no obvious overclaiming but no specific self-awareness.
  * 3-6: Overstates weak knowledge (weak explanation but confident).
  * 0-2: Confidently wrong / bluffing.
- knowledgeAdmissionScore should default to 0 (or low score unless they explicitly admitted a sub-concept gap within a larger answer).
=== END CRITICAL RULE ===

SCORING BANDS:
* 9-10: Deep, flawless understanding with practical nuance
* 8-9: Good understanding, depth, and details
* 6-7: Genuine understanding with minor gaps
* 4-5: Basic or limited understanding, partial credit
* 0-3: Significant inaccuracies, empty, or pure keyword listing

Evaluate like an experienced interviewer. If the candidate demonstrates correct understanding in their own words, award reasonable marks. But listing keywords without explanation is NOT understanding.

For mentionedConcepts: list concepts the candidate NAMED or IDENTIFIED.
For explainedConcepts: list ONLY concepts the candidate actually EXPLAINED with understanding.
A concept in explainedConcepts MUST also appear in mentionedConcepts.

Return strictly the following JSON (no markdown, no extra text):
{
  "answerType": "honest_unknown" | "keyword_list_only" | "partial_explanation" | "full_explanation",
  "accuracy": number,
  "conceptCoverage": number,
  "conceptUnderstanding": number,
  "reasoning": number,
  "depth": number,
  "clarity": number,
  "structure": number,
  "confidence": number,
  "consistency": number,
  "answerDirectnessScore": number,
  "tradeoffReasoningScore": number | null,
  "curiosity": number,
  "selfCorrection": number,
  "honestyScore": number,
  "knowledgeAdmissionScore": number,
  "technicalErrors": [{ "error": "string", "severity": "low" | "medium" | "high" }],
  "positiveEvidence": {
    "strongExample": boolean,
    "realProject": boolean,
    "tradeoffDiscussion": boolean,
    "practicalExperience": boolean
  },
  "mentionedConcepts": ["concepts the candidate named/identified"],
  "explainedConcepts": ["concepts the candidate actually explained with understanding"],
  "missingKeyPoints": ["expected areas the candidate did not cover at all"]
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

