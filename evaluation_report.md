# Reicrew AI - Evaluation Logic & Algorithms Report

This document outlines the detailed inner workings of the Reicrew AI Interview platform, breaking down how candidate responses are evaluated, how metrics are computed, the exact prompts used, and hidden algorithms running beneath the surface.

## 1. Per-Question Evaluation Scoring

When a candidate submits an answer, their response is immediately evaluated against the generated `ideal_answer` using a Large Language Model (primarily `gemini-2.5-flash`). 

### Core Returned Q/A Metrics
For each question, the AI returns the following base scores (from 0 to 10):
- **`contentScore`**: The depth, relevance, and accuracy of the technical or conceptual answer.
- **`grammarScore`**: The syntactic correctness of the candidate's speech.
- **`fluencyScore`**: How smoothly the candidate delivered the answer.
- **`communicationScore`**: Derived locally as the average of grammar and fluency `(grammarScore + fluencyScore) / 2`.

### Hidden / Unreported Question Parameters
The AI also calculates parameters that are saved to the database but may not be explicitly broken down in the high-level candidate report:
- **`analysis` object**: Evaluates sub-components out of 10, including:
  - `technicalAccuracy`
  - `problemSolving`
  - `practicalExecution`
  - `communication`
- **Expression Analysis**: A brief LLM-generated note correlating the candidate's answer quality with their detected visual expression (e.g., "Candidate seemed nervous but recovered well").

---

## 2. Overall Score & Category Calculation

At the end of the interview, the system aggregates the scores across all questions (typically 5) to compute a final **Total Score (0-100)**. 

### The Weighting Algorithm
The final score is NOT a simple average. It uses a specific weighted algorithm:

```javascript
weightedScore = 
  ((averageContent / 10) * 100) * 0.50 +       // 50% Technical / Content weight
  ((averageCommunication / 10) * 100) * 0.20 + // 20% Communication weight
  (averageKeywordCoverage) * 0.15 +            // 15% Keyword match density
  (averageConfidence) * 0.15                   // 15% Visual confidence score
```

### Breakdown of specific metrics requested:
- **Relevance, Accuracy, Depth**: These UI metrics are directly tied to the aggregated `averageContent` score. 
- **Clarity, Vocabulary**: These UI metrics are directly tied to the aggregated `averageCommunication` score.
- **Keyword Coverage**: Calculated dynamically by dividing `matchedKeyPoints` by `(matchedKeyPoints + missingKeyPoints)`.

### Categorization & Recommendation
- **Excellent (85+)**: "Strong Hire" or "Hire"
- **Good (70-84)**: "Hire"
- **Average (50-69)**: "Consider"
- **Poor (< 50)**: "Reject"

---

## 3. Proctoring Violations & Integrity Score

Proctoring is handled by a local WebGL engine (MediaPipe) that continuously tracks the user. 

### Violation Accumulation
Violations (e.g., `NO_FACE`, `GAZE_AWAY`, `MULTIPLE_FACES`, `TAB_HIDDEN`, `COPY_PASTE`) accrue points on a `violationScore`.
- **Threshold 5**: UI Warning.
- **Threshold 10**: Severe Warning.
- **Threshold 15**: Immediate Interview Termination.

### Effect on Final Score
- **Integrity Score Algorithm**: `Math.max(0, 100 - (violationScore * 10))`
- **Does it affect the Total Score?** Interestingly, no. While the settings contain an `includeInScore` toggle, the current evaluation logic keeps the `totalScore` pure to the candidate's actual performance. The `integrityScore` is saved independently as a trust metric for the HR admin. If the Integrity Score drops below 70, the dashboard flags the session as "Suspicious", and below 40 as "Critical".

---

## 4. Hidden Algorithms & Telemetry

There are several background algorithms running that are not prominently featured in the final PDF/UI report:

### A. Monitoring Quality Score
The system tracks the health of the interview itself to ensure the AI didn't penalize a candidate due to bad internet or lag.
`monitoringQualityScore = (trackingConfidence * 0.6) + (fpsScore * 0.2) + (facePresenceScore * 0.2)`

### B. Fallback / Resiliency Algorithm
If the primary LLM (`gemini-2.5-flash`) gets rate-limited (429) or overloaded (503):
1. **Exponential Backoff**: It waits `attempt * 1000ms` and retries.
2. **Model Chain**: It cascades down to lighter models (`gemini-1.5-flash`, `gemini-1.5-flash-8b`).
3. **NVIDIA NIM Fallback**: If all Google models fail, it silently redirects the prompt to NVIDIA's API using `meta/llama-3.1-70b-instruct` so the candidate never experiences a crash.

---

## 5. System Prompts

The AI utilizes 4 main prompts throughout the interview lifecycle.

### Prompt A: Dynamic Question Generation
```text
You are an expert interviewer. Generate the next logical question for a candidate.
Role: {role}
Interview History: {history}
Instructions:
1. Analyze the candidate's last answer.
2. Does it show deep knowledge or surface-level? 
3. Adapt difficulty: If they did well, go harder. If they struggled, pivot to a slightly easier or different conceptual area...
```

### Prompt B: Ideal Answer Pre-computation
```text
For these {role} interview questions, provide a concise but comprehensive "ideal_answer" for each one.
The ideal answer should cover all key technical points a strong candidate would mention.
```

### Prompt C: Single Answer Evaluation (The Core Rubric)
```text
You are an advanced AI Interview Evaluator designed to perform STRICT, EVIDENCE-BASED candidate evaluation.

CORE RULES (MANDATORY):
1. NO ASSUMPTIONS: Do NOT assume skills, knowledge, or intent. If not explicitly shown -> treat as weak/missing.
2. NO GENERIC PRAISE: Every judgment must be backed by a specific reason/evidence.
3. DEPTH OVER SURFACE: Penalize shallow/memorized answers. Reward structured thinking.
4. REALISTIC EVALUATION: Only evaluate what can be inferred from text.

[ROLE CONTEXT]
Position: {position}
Interview Difficulty: {difficulty}

[EVALUATION RUBRIC]
{difficultyRubric} // Adjusts leniency based on Easy/Medium/Hard settings

[INTERVIEW PROGRESS]
Question: "{question}"
Reference/Ideal Key Points: {keyPoints}
Candidate's Answer: "{answer}"

[VISUAL DATA]
Vision Analysis Summary: {visualMetrics.currentExpression}
Confidence: {visualMetrics.confidenceLevel}%

Return strict JSON...
```

### Prompt D: Executive Summary Synthesis
```text
You are an expert technical interviewer compiling a final executive summary.
Do NOT re-evaluate the questions. We already have the detailed scores.

INTERVIEW DATA: {aggregatedData}
Overall Weighted Score: {totalScore}/100

Provide a brief executive summary.
OUTPUT REQUIREMENTS: ExecutiveSummary, KeyStrengths, KeyWeaknesses, HiringRecommendation, FinalVerdict.
```


## Appendix: Source Code

### apiService.ts

``typescript


import { GoogleGenAI, Type } from "@google/genai";
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

let currentKeyIndex = 0;
const getGeminiKeys = () => {
  const keysStr = import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_EVAL_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "";
  return keysStr.split(',').map((k: string) => k.trim()).filter(Boolean);
};

const getDedicatedKey = () => {
  const keys = getGeminiKeys();
  return keys[0] || ""; // Dedicated Key A for latency-sensitive tasks
};

const getNextPoolKey = () => {
  const keys = getGeminiKeys();
  if (keys.length === 0) return "";
  const key = keys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
};

const ai = {
  models: {
    generateContent: async (args: any) => {
      // Used by startInterview for dynamic question generation (Live Interview)
      const instance = new GoogleGenAI({ apiKey: getDedicatedKey() });
      return instance.models.generateContent(args);
    }
  }
};

const getEvalAi = () => {
  // Used by submitAnswer for question-level evaluation
  return new GoogleGenAI({ apiKey: getNextPoolKey() });
};
const MODEL_FAST = "gemini-2.5-flash";

const DIRECT_INTERVIEW_FALLBACK = [
  {
    id: 1,
    question: "Tell me about your professional background and what you are looking for in your next role.",
    difficulty: "Easy" as const,
    ideal_answer: "Candidate should clearly state their current role, years of experience, and key skills.",
    keyPoints: ["Current Role", "Experience", "Skills"],
    maxScore: 10
  },
  {
    id: 2,
    question: "Describe a challenging project you worked on. What was your role and how did you overcome the obstacles?",
    difficulty: "Medium" as const,
    ideal_answer: "Candidate defines problem, their specific action, and a positive result.",
    keyPoints: ["Problem definition", "Action taken", "Result"],
    maxScore: 10
  },
  {
    id: 3,
    question: "How do you handle disagreements with colleagues or managers?",
    difficulty: "Medium" as const,
    ideal_answer: "Seeks to understand, communicates respectfully, finds compromise.",
    keyPoints: ["Communication", "Respect", "Compromise"],
    maxScore: 10
  },
  {
    id: 4,
    question: "Where do you see yourself professionally in five years?",
    difficulty: "Easy" as const,
    ideal_answer: "Presents clear career progression goals aligned with the role.",
    keyPoints: ["Career goals", "Ambition", "Alignment"],
    maxScore: 10
  },
  {
    id: 5,
    question: "What do you consider your greatest professional strength?",
    difficulty: "Easy" as const,
    ideal_answer: "Identifies a relevant strength and provides a quick example.",
    keyPoints: ["Relevance", "Self-awareness", "Example"],
    maxScore: 10
  },
  {
    id: 6,
    question: "Describe a time when you had to learn a new technology or skill quickly.",
    difficulty: "Medium" as const,
    ideal_answer: "Shows adaptability, resourcefulness, and successfully applying the new skill.",
    keyPoints: ["Adaptability", "Learning process", "Application"],
    maxScore: 10
  },
  {
    id: 7,
    question: "How do you prioritize your work when dealing with multiple tight deadlines?",
    difficulty: "Medium" as const,
    ideal_answer: "Uses a framework (like Eisenhower matrix), communicates with stakeholders, stays organized.",
    keyPoints: ["Time management", "Communication", "Organization"],
    maxScore: 10
  },
  {
    id: 8,
    question: "Tell me about a time you made a mistake. How did you handle it?",
    difficulty: "Medium" as const,
    ideal_answer: "Takes accountability, fixes the issue, and learns from it.",
    keyPoints: ["Accountability", "Resolution", "Learning"],
    maxScore: 10
  },
  {
    id: 9,
    question: "What is your approach to giving and receiving constructive feedback?",
    difficulty: "Medium" as const,
    ideal_answer: "Views it as an opportunity for growth; gives it specifically and kindly.",
    keyPoints: ["Open-mindedness", "Growth mindset", "Tact"],
    maxScore: 10
  },
  {
    id: 10,
    question: "Why are you interested in joining our company specifically?",
    difficulty: "Easy" as const,
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
        model: MODEL_FAST,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
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
      console.warn("Gemini generation failed, attempting NVIDIA fallback...");
      try {
        const topic = candidate.customTopic;
        const prompt = `
          Generate 5 distinct interview questions for a candidate interested in "${topic}".
          Questions should range from easy to medium difficulty.
          Return strictly a JSON array of objects:
          [{ "id": 1, "question": "Question text", "difficulty": "Easy", "maxScore": 10, "keyPoints": ["key1", "key2"] }]
        `;
        const text = await fallbackToNvidia(prompt);
        let cleanText = text || "[]";
        if (cleanText.startsWith('\`\`\`json')) cleanText = cleanText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '');
        else if (cleanText.startsWith('\`\`\`')) cleanText = cleanText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '');
        
        const genQuestions = JSON.parse(cleanText);
        questions = genQuestions.map((q: any, i: number) => ({
          ...q,
          id: i + 1,
          maxScore: 10
        }));
        settings = {
          ...DEFAULT_SETTINGS,
          difficulty: 'Medium',
          preset: 'Normal',
          proctoring: { ...DEFAULT_SETTINGS.proctoring, includeInScore: false }
        };
      } catch (nvidiaErr) {
        console.error("NVIDIA fallback also failed:", nvidiaErr);
        // Fallback if AI fails completely
      questions = [{
        id: 1,
        question: `Tell me about your interest in ${candidate.customTopic} and what you hope to achieve.`,
        difficulty: "Easy",
        ideal_answer: "The candidate should relate their skills and goals clearly.",
        maxScore: 10,
        keyPoints: ["Interest", "Goals"]
      }];
      }
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

export const submitAnswer = async (
  candidate: Candidate,
  currentQuestion: Question,
  answer: string,
  visualMetrics?: VisualMetrics,
  settings?: RoleSettings
): Promise<{ evaluation: EvaluationResult; nextQuestion: Question | null }> => {

  const referenceAnswer = currentQuestion.ideal_answer || "A coherent and professional response.";
  const keyPoints = currentQuestion.keyPoints || [];

  // Construct persona based on settings
  const difficulty = settings?.difficulty ?? "Medium";
  const preset = settings?.preset ?? "Normal";

  let personaInstruction = "You are an expert HR Interviewer.";
  if (preset === 'Strict') {
    personaInstruction += " You are extremely critical and strict. Deduct points for any vagueness.";
  } else if (preset === 'Relaxed') {
    personaInstruction += " You are friendly and lenient. Focus on the general idea rather than technical perfection.";
  }

  // 1. Difficulty-based Rubric Construction
  let difficultyRubric = "Generic Evaluation";
  if (difficulty === 'Very Easy' || difficulty === 'Easy') {
    difficultyRubric = `Difficulty: EASY. 
      - Focus: CONCEPTUAL UNDERSTANDING.
      - Ignore minor grammar or stuttering.
      - Passing score: 5/10.
      - Look for: Basic grasp of the topic.`;
  } else if (difficulty === 'Hard' || difficulty === 'Very Hard') {
    difficultyRubric = `Difficulty: STRICT/HARD.
      - Focus: PROFESSIONALISM, PRECISION, and GRAMMAR.
      - Penalty for: Filler words (um, ah), repetitive phrasing, or vague answers.
      - Passing score: 8/10.
      - Requirements: Must hit ALL key points. Stuttering or lack of fluency should significantly affect the score.`;
  } else {
    difficultyRubric = `Difficulty: MEDIUM.
      - Focus: Balanced evaluation of concept and communication.
      - Passing score: 7/10.
      - Requirements: Hits most key points with clear delivery.`;
  }

  const evalPrompt = `
    You are an advanced AI Interview Evaluator designed to perform STRICT, EVIDENCE-BASED candidate evaluation.

    CORE RULES (MANDATORY):
    1. NO ASSUMPTIONS: Do NOT assume skills, knowledge, or intent. If not explicitly shown -> treat as weak/missing.
    2. NO GENERIC PRAISE: Every judgment must be backed by a specific reason/evidence.
    3. DEPTH OVER SURFACE: Penalize shallow/memorized answers. Reward structured thinking.
    4. REALISTIC EVALUATION: Only evaluate what can be inferred from text.

    [ROLE CONTEXT]
    Position: ${candidate.position}
    Interview Difficulty: ${difficulty}
    
    [EVALUATION RUBRIC]
    ${difficultyRubric}

    [INTERVIEW PROGRESS]
    Question: "${currentQuestion.question}"
    Reference/Ideal Key Points: ${keyPoints.join(", ") || "Analyze based on general knowledge"}
    Candidate's Answer: "${answer}"
    
    [VISUAL DATA]
    Vision Analysis Summary: ${visualMetrics?.currentExpression || 'Neutral'}
    Confidence: ${visualMetrics?.confidenceLevel || 0}%

    Return strict JSON with:
    {
      "contentScore": number (0-10),
      "grammarScore": number (0-10),
      "fluencyScore": number (0-10),
      "verdict": "Pass" | "Borderline" | "Fail",
      "feedback": "Concise 2-sentence feedback, NO GENERIC PRAISE",
      "matchedKeyPoints": ["point1", ...],
      "missingKeyPoints": ["point1", ...],
      "expressionAnalysis": "Brief note on confidence/smile seen in vision analysis",
      "analysis": {
        "technicalAccuracy": 0-10,
        "problemSolving": 0-10,
        "practicalExecution": 0-10,
        "communication": 0-10
      }
    }
  `;

  try {
    const evalAi = getEvalAi();
    const evalResponse = await evalAi.models.generateContent({
      model: MODEL_FAST,
      contents: evalPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contentScore: { type: Type.NUMBER },
            grammarScore: { type: Type.NUMBER },
            fluencyScore: { type: Type.NUMBER },
            matchedKeyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            missingKeyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            verdict: { type: Type.STRING, enum: ["Pass", "Borderline", "Fail"] },
            feedback: { type: Type.STRING },
            expressionAnalysis: { type: Type.STRING },
            analysis: {
              type: Type.OBJECT,
              properties: {
                technicalAccuracy: { type: Type.NUMBER },
                problemSolving: { type: Type.NUMBER },
                practicalExecution: { type: Type.NUMBER },
                communication: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    });

    // Cleanup potential Markdown formatting from AI response
    let cleanText = evalResponse.text || "{}";
    cleanText = cleanText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');
    }

    const evalJson = JSON.parse(cleanText);

    const evaluation: EvaluationResult = {
      questionId: Number(currentQuestion.id),
      questionText: currentQuestion.question,
      userAnswer: answer,

      contentScore: evalJson.contentScore ?? 0,
      grammarScore: evalJson.grammarScore ?? 0,
      fluencyScore: evalJson.fluencyScore ?? 0,
      // Calculated legacy communication score for backward compatibility
      communicationScore: ((evalJson.grammarScore ?? 0) + (evalJson.fluencyScore ?? 0)) / 2,

      matchedKeyPoints: evalJson.matchedKeyPoints || [],
      missingKeyPoints: evalJson.missingKeyPoints || [],
      verdict: evalJson.verdict || "Borderline",
      feedback: evalJson.feedback || "No feedback provided.",

      analysis: evalJson.analysis,

      confidenceScore: visualMetrics?.confidenceLevel ?? 0,
      expressionAnalysis: evalJson.expressionAnalysis || "Visual analysis unavailable.",
      timestamp: new Date().toISOString(),
    };

    // Returning only evaluation, nextQuestion logic moved to InterviewScreen
    return { evaluation, nextQuestion: null };

  } catch (error) {
    console.warn("Gemini Evaluation Failed, attempting NVIDIA fallback...");
    
    try {
      const text = await fallbackToNvidia(evalPrompt);
      let cleanText = text || "{}";
      cleanText = cleanText.trim();
      if (cleanText.startsWith('\`\`\`json')) {
        cleanText = cleanText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '');
      } else if (cleanText.startsWith('\`\`\`')) {
        cleanText = cleanText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '');
      }
      
      const evalJson = JSON.parse(cleanText);

      const evaluation: EvaluationResult = {
        questionId: Number(currentQuestion.id),
        questionText: currentQuestion.question,
        userAnswer: answer,
        contentScore: evalJson.contentScore ?? 0,
        grammarScore: evalJson.grammarScore ?? 0,
        fluencyScore: evalJson.fluencyScore ?? 0,
        communicationScore: ((evalJson.grammarScore ?? 0) + (evalJson.fluencyScore ?? 0)) / 2,
        matchedKeyPoints: evalJson.matchedKeyPoints || [],
        missingKeyPoints: evalJson.missingKeyPoints || [],
        verdict: evalJson.verdict || "Borderline",
        feedback: evalJson.feedback || "No feedback provided.",
        analysis: evalJson.analysis,
        confidenceScore: visualMetrics?.confidenceLevel ?? 0,
        expressionAnalysis: evalJson.expressionAnalysis || "Visual analysis unavailable.",
        timestamp: new Date().toISOString(),
      };
      return { evaluation, nextQuestion: null };
    } catch (nvidiaErr) {
      console.error("NVIDIA Evaluation Fallback also failed:", nvidiaErr);
      // Return a graceful fallback result so the app doesn't crash
    const fallbackEval: EvaluationResult = {
      questionId: Number(currentQuestion.id),
      questionText: currentQuestion.question,
      userAnswer: answer,
      contentScore: 5,
      grammarScore: 5,
      fluencyScore: 5,
      communicationScore: 5,
      matchedKeyPoints: [],
      missingKeyPoints: [],
      verdict: "Borderline",
      feedback: "System could not generate detailed feedback at this time. Answer recorded.",
      confidenceScore: visualMetrics?.confidenceLevel ?? 0,
      expressionAnalysis: "N/A",
      timestamp: new Date().toISOString()
    };
    return { evaluation: fallbackEval, nextQuestion: null };
    }
  }
};

const getNvidiaApiKey = () => {
  return (import.meta.env?.VITE_NVIDIA_API_KEY) || (typeof process !== 'undefined' ? process.env.VITE_NVIDIA_API_KEY : "") || "";
};

async function fallbackToNvidia(prompt: string): Promise<string> {
  const apiKey = getNvidiaApiKey();
  if (!apiKey) throw new Error("NVIDIA API key not configured.");
  
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "meta/llama-3.1-70b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    throw new Error(`NVIDIA API Error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

``

### aiService.ts

``typescript

import { GoogleGenerativeAI } from "@google/generative-ai";
import { CSE_QUESTION_BANK, ECE_QUESTION_BANK } from "./questionBank";

let currentKeyIndex = 0;
const getGeminiKeys = () => {
  const keysStr = (import.meta.env?.VITE_GEMINI_API_KEYS) || (typeof process !== 'undefined' ? process.env.VITE_GEMINI_API_KEYS : "") || (import.meta.env?.VITE_GEMINI_API_KEY) || (typeof process !== 'undefined' ? process.env.VITE_GEMINI_API_KEY : "") || "";
  const keys = keysStr.split(',').map((k: string) => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    console.warn("Gemini API Key not found in environment variables.");
  }
  return keys;
};

const getDedicatedKey = () => getGeminiKeys()[0] || "";

const getNextPoolKey = () => {
  const keys = getGeminiKeys();
  if (keys.length === 0) return "";
  const key = keys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
};

const getGenAI = (purpose: 'live' | 'eval' | 'report' = 'eval') => {
  const key = purpose === 'live' ? getDedicatedKey() : getNextPoolKey();
  return new GoogleGenerativeAI(key);
};

// Model priority chain: try best model first, fall back on 503/429
const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

async function resilientGenerate(prompt: string, maxRetries = 2, purpose: 'live' | 'eval' | 'report' = 'eval'): Promise<string> {
  for (const modelName of MODEL_CHAIN) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const model = getGenAI(purpose).getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err: any) {
        const status = err?.status || 0;
        // 503 = overloaded, 429 = rate limit — retry or try next model
        if (status === 503 || status === 429) {
          if (attempt < maxRetries) {
            // Wait briefly before retry (exponential backoff)
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          // Exhausted retries for this model, try next
          console.warn(`Model ${modelName} failed after ${maxRetries + 1} attempts (${status}), trying next...`);
          break;
        }
        // 404 = model not found — skip immediately to next model
        if (status === 404) {
          console.warn(`Model ${modelName} not found (404), trying next...`);
          break;
        }
        // Any other error — throw immediately
        throw err;
      }
    }
  }
  
  console.warn("All Gemini models failed, falling back to NVIDIA NIM...");
  try {
    return await fallbackToNvidia(prompt);
  } catch (nvidiaErr: any) {
    console.error("NVIDIA fallback failed:", nvidiaErr);
    throw new Error("All AI models (Gemini & NVIDIA) are currently unavailable. Please try again later.");
  }
}

const getNvidiaApiKey = () => {
  return (import.meta.env?.VITE_NVIDIA_API_KEY) || (typeof process !== 'undefined' ? process.env.VITE_NVIDIA_API_KEY : "") || "";
};

async function fallbackToNvidia(prompt: string): Promise<string> {
  const apiKey = getNvidiaApiKey();
  if (!apiKey) throw new Error("NVIDIA API key not configured.");
  
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "meta/llama-3.1-70b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    throw new Error(`NVIDIA API Error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

export interface GeneratedQuestion {
  question: string;
  ideal_answer: string;
}

export interface QuestionFeedback {
  question: string;
  candidateAnswer: string;
  score: number; // 0-10
  verdict: "Excellent" | "Good" | "Partial" | "Poor";
  feedback: string;
  keyPointsHit: string[];
  keyPointsMissed: string[];
  idealAnswerSummary: string;
}

export interface EvaluationReport {
  totalScore: number; // 0-100
  category: "Excellent" | "Good" | "Average" | "Poor";
  detailedAnalysis: {
    strengths: string[];
    failures: string[];
    metrics: {
      relevance: number;
      accuracy: number;
      clarity: number;
      depth: number;
      vocabulary: number;
    };
  };
  questionBreakdown: QuestionFeedback[];
  finalVerdict: string;
  verdictJustification: string;
  hiringRecommendation: "Strong Hire" | "Hire" | "Consider" | "Reject";
}

export const AIService = {
  async generateQuestions(
    role: string,
    experienceLevel: string,
    interviewType: string,
    count: number,
    skills: string = ""
  ): Promise<GeneratedQuestion[]> {
    const bank = role === "CSE" ? CSE_QUESTION_BANK : ECE_QUESTION_BANK;

    let selected: any[] = [];
    
    if (role === 'CSE') {
      selected = [
        ...this._pick(bank.filter(q => q.topic === 'DSA'), 1),
        ...this._pick(bank.filter(q => ['DBMS', 'OS', 'CN', 'Web'].includes(q.topic!)), 1),
        ...this._pick(bank.filter(q => q.topic === 'PS'), 1),
        ...this._pick(bank.filter(q => q.category === 'Behavioral'), 2),
      ];
    } else {
      selected = [
        ...this._pick(bank.filter(q => q.topic === 'Core'), 1),
        ...this._pick(bank.filter(q => ['Embedded', 'Comm'].includes(q.topic!)), 1),
        ...this._pick(bank.filter(q => q.topic === 'Numerical'), 1),
        ...this._pick(bank.filter(q => q.category === 'Behavioral'), 2),
      ];
    }

    // Return questions immediately so the interview can start without waiting for the LLM
    return selected.map(q => ({
      question: q.question,
      ideal_answer: "" // Will be populated in the background
    }));
  },

  async populateIdealAnswers(role: string, questions: GeneratedQuestion[]): Promise<void> {
    if (questions.length === 0) return;
    
    const prompt = `
    For these ${role} interview questions, provide a concise but comprehensive "ideal_answer" for each one.
    The ideal answer should cover all key technical points a strong candidate would mention.
    
    Questions:
    ${questions.map((q, i) => `${i+1}. ${q.question}`).join('\n')}

    Output format (STRICT JSON ARRAY OF STRINGS ONLY):
    ["answer 1 text", "answer 2 text", ...]`;

    try {
      const text = await resilientGenerate(prompt);
      const idealAnswers = JSON.parse(text.match(/\[[\s\S]*\]/)![0]);
      
      questions.forEach((q, i) => {
        q.ideal_answer = idealAnswers[i] || "High quality technical response expected.";
      });
    } catch (error) {
      console.error("Ideal answer generation failed, using fallback:", error);
      questions.forEach(q => {
        if (!q.ideal_answer) q.ideal_answer = "Detailed technical response required.";
      });
    }
  },

  _pick(arr: any[], n: number) {
    return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
  },

  async evaluateInterview(
    candidateAnswers: { question: string; answer: string; ideal_answer: string; evaluation?: any }[]
  ): Promise<EvaluationReport> {
    
    // 1. Locally aggregate the scores and compile question breakdown
    let sumContent = 0;
    let sumCommunication = 0;
    let sumConfidence = 0;

    const questionEvaluations = candidateAnswers.map((item, index) => {
        const evalData = item.evaluation || {};
        
        const contentScore = evalData.contentScore || 0;
        const communicationScore = evalData.communicationScore || 0;
        const confidenceScore = evalData.confidenceScore || 0;
        
        sumContent += contentScore;
        sumCommunication += communicationScore;
        sumConfidence += confidenceScore;

        // Calculate keyword coverage (matched / total)
        const matched = evalData.matchedKeyPoints?.length || 0;
        const missed = evalData.missingKeyPoints?.length || 0;
        const totalKeywords = matched + missed;
        const keywordCoverage = totalKeywords > 0 ? (matched / totalKeywords) * 100 : 0;

        return {
            questionId: `Q${index + 1}`,
            question: item.question,
            candidateAnswer: item.answer || "[No answer provided]",
            contentScore,
            communicationScore,
            confidenceScore,
            keywordCoverage,
            strengths: evalData.matchedKeyPoints || [],
            weaknesses: evalData.missingKeyPoints || [],
            explanation: evalData.feedback || "Answer recorded.",
            verdict: evalData.verdict || "Partial",
            idealAnswerSummary: item.ideal_answer
        };
    });

    const count = candidateAnswers.length || 1;
    const averageContent = sumContent / count;
    const averageCommunication = sumCommunication / count;
    const averageConfidence = sumConfidence / count;
    const averageKeywordCoverage = questionEvaluations.reduce((acc, q) => acc + q.keywordCoverage, 0) / count;

    // Weighted scoring logic as requested:
    // technicalScore (content) * 0.50 + communicationScore * 0.20 + keywordCoverage * 0.15 + confidenceScore * 0.15
    // Note: Content/Comm are out of 10. Confidence/Coverage are out of 100.
    const weightedScore = 
      ((averageContent / 10) * 100) * 0.50 +
      ((averageCommunication / 10) * 100) * 0.20 +
      averageKeywordCoverage * 0.15 +
      averageConfidence * 0.15;

    let totalScore = Math.round(weightedScore);
    totalScore = Math.max(0, Math.min(100, totalScore));

    let category: "Excellent" | "Good" | "Average" | "Poor" = "Poor";
    if (totalScore >= 85) category = "Excellent";
    else if (totalScore >= 70) category = "Good";
    else if (totalScore >= 50) category = "Average";

    // 2. Generate Executive Summary from AI
    const aggregatedData = {
        averageContent,
        averageCommunication,
        averageConfidence,
        averageKeywordCoverage,
        questionEvaluations: questionEvaluations.map(q => ({
            questionId: q.questionId,
            contentScore: q.contentScore,
            communicationScore: q.communicationScore,
            confidenceScore: q.confidenceScore,
            keywordCoverage: q.keywordCoverage,
            strengths: q.strengths,
            weaknesses: q.weaknesses,
            explanation: q.explanation
        }))
    };

    const prompt = `
You are an expert technical interviewer compiling a final executive summary.
Do NOT re-evaluate the questions. We already have the detailed scores.

INTERVIEW DATA:
${JSON.stringify(aggregatedData, null, 2)}

Overall Weighted Score: ${totalScore}/100

Provide a brief executive summary.
OUTPUT REQUIREMENTS (STRICT JSON ONLY):
{
  "ExecutiveSummary": "<2-3 sentences assessing the candidate globally>",
  "KeyStrengths": ["<strength 1>", "<strength 2>"],
  "KeyWeaknesses": ["<weakness 1>", "<weakness 2>"],
  "HiringRecommendation": "Strong Hire" | "Hire" | "Consider" | "Reject",
  "FinalVerdict": "<1-2 sentence final verdict>"
}`;

    try {
      let text = await resilientGenerate(prompt, 1, 'eval');
      
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid AI response format");
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      const questionBreakdown: QuestionFeedback[] = questionEvaluations.map(q => ({
          question: q.question,
          candidateAnswer: q.candidateAnswer,
          score: q.contentScore,
          verdict: q.verdict as any,
          feedback: q.explanation,
          keyPointsHit: q.strengths,
          keyPointsMissed: q.weaknesses,
          idealAnswerSummary: q.idealAnswerSummary
      }));

      return {
          totalScore,
          category,
          detailedAnalysis: {
              strengths: parsed.KeyStrengths || [],
              failures: parsed.KeyWeaknesses || [],
              metrics: {
                  relevance: averageContent,
                  accuracy: averageContent,
                  clarity: averageCommunication,
                  depth: averageContent,
                  vocabulary: averageCommunication
              }
          },
          questionBreakdown,
          finalVerdict: parsed.ExecutiveSummary || "Interview completed.",
          verdictJustification: parsed.FinalVerdict || "Aggregated from per-question evaluations.",
          hiringRecommendation: parsed.HiringRecommendation || (totalScore >= 70 ? "Hire" : "Consider")
      };
    } catch (error) {
      console.error("Summary generation failed, using fallback:", error);
      
      const questionBreakdown: QuestionFeedback[] = questionEvaluations.map(q => ({
          question: q.question,
          candidateAnswer: q.candidateAnswer,
          score: q.contentScore,
          verdict: q.verdict as any,
          feedback: q.explanation,
          keyPointsHit: q.strengths,
          keyPointsMissed: q.weaknesses,
          idealAnswerSummary: q.idealAnswerSummary
      }));

      return this._buildFallbackReport(candidateAnswers, totalScore, category, averageContent, averageCommunication, questionBreakdown);
    }
  },

  _computeFallbackScore(parsed: any): number {
    return 55;
  },

  _buildFallbackReport(
      candidateAnswers: any[], 
      totalScore: number = 55, 
      category: any = "Average", 
      avgContent: number = 5, 
      avgCommunication: number = 5,
      questionBreakdown: QuestionFeedback[] = []
  ): EvaluationReport {
    return {
      totalScore,
      category,
      detailedAnalysis: {
        strengths: [
          "Candidate attempted all questions",
          "Basic communication was maintained"
        ],
        failures: [
          "Executive summary generation failed — manual review recommended"
        ],
        metrics: { relevance: avgContent, accuracy: avgContent, clarity: avgCommunication, depth: avgContent, vocabulary: avgCommunication }
      },
      questionBreakdown: questionBreakdown.length > 0 ? questionBreakdown : candidateAnswers.map((item, i) => ({
        question: item.question,
        candidateAnswer: item.answer || "[No answer provided]",
        score: item.evaluation?.contentScore || 5,
        verdict: "Partial",
        feedback: "Executive summary failed. See individual question feedback.",
        keyPointsHit: [],
        keyPointsMissed: [],
        idealAnswerSummary: item.ideal_answer
      })),
      finalVerdict: "The candidate completed the interview. Summary AI was unavailable, but question scores are valid.",
      verdictJustification: "Aggregated locally.",
      hiringRecommendation: totalScore >= 70 ? "Hire" : "Consider"
    };
  },

  async generateNextDynamicQuestion(
    role: string,
    history: { question: string; answer: string; ideal_answer: string }[]
  ): Promise<GeneratedQuestion> {
    const prompt = `
    You are an expert interviewer. Generate the next logical question for a candidate.
    
    Role: ${role}
    Interview History:
    ${JSON.stringify(history, null, 2)}

    Instructions:
    1. Analyze the candidate's last answer.
    2. Does it show deep knowledge or surface-level? 
    3. Adapt difficulty: If they did well, go harder. If they struggled, pivot to a slightly easier or different conceptual area of the ${role} role.
    4. Mix of technical, situational, and problem-solving.
    5. Avoid repeating questions.
    6. Return a single question and its ideal_answer.

    Output format (STRICT JSON):
    {
      "question": "Question text",
      "ideal_answer": "Expected key points"
    }`;

    try {
      const text = await resilientGenerate(prompt);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format from AI");

      return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
      console.error("Dynamic Question Error:", error);
      throw new Error("Failed to generate next question");
    }
  },

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${getDedicatedKey()}`);
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error("Error listing models:", error);
      return [];
    }
  }
};

``

