
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
        difficulty: "easy",
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

  const isBehavioral = currentQuestion.type?.startsWith("Behavioral");
  const keyConceptsStr = currentQuestion.keyConcepts 
    ? currentQuestion.keyConcepts.map(kc => `[${kc.importance.toUpperCase()}] ${kc.concept}`).join("\n")
    : (currentQuestion.keyPoints?.join(", ") || "Analyze based on general knowledge.");

  // Construct persona based on settings
  const difficulty = settings?.difficulty ?? "Medium";
  const preset = settings?.preset ?? "Normal";

  let difficultyRubric = "Difficulty: MEDIUM.\n- Focus: Balanced evaluation.\n- Passing score: 7/10.";
  if (difficulty === 'Very Easy' || difficulty === 'Easy') {
    difficultyRubric = `Difficulty: EASY.\n- Focus: CONCEPTUAL UNDERSTANDING.\n- Passing score: 5/10.`;
  } else if (difficulty === 'Hard' || difficulty === 'Very Hard') {
    difficultyRubric = `Difficulty: STRICT/HARD.\n- Focus: PRECISION and DEPTH.\n- Passing score: 8/10.`;
  }

  const technicalSchema = `"analysis": {
        "technicalAccuracy": 0-10,
        "conceptCoverage": 0-10,
        "depth": 0-10,
        "communication": 0-10
      }`;

  const behavioralSchema = `"behavioralMetrics": {
        "communication": 0-10,
        "problemSolving": 0-10,
        "ownership": 0-10,
        "teamwork": 0-10,
        "adaptability": 0-10,
        "leadershipPotential": 0-10,
        "responseStructure": 0-10,
        "evidenceStrength": 0-10
      }`;

  const evalPrompt = `
    You are an advanced AI Interview Evaluator. 
    CORE RULES:
    1. NO ASSUMPTIONS: Do not assume skills.
    2. NO GENERIC PRAISE: Back up feedback with specific reasons.
    3. DEPTH OVER SURFACE: Penalize memorized answers.

    [INTERVIEW CONTEXT]
    Position: ${candidate.position || 'Engineer'}
    Question Type: ${currentQuestion.type || 'Technical'}
    ${difficultyRubric}

    [QUESTION AND CONCEPTS]
    Question: "${currentQuestion.question}"
    Target Key Concepts to look for: 
    ${keyConceptsStr}
    
    Candidate's Answer: "${answer}"

    Return strict JSON with:
    {
      "contentScore": number (0-10),
      "verdict": "Pass" | "Borderline" | "Fail",
      "feedback": "Concise 2-sentence feedback, NO GENERIC PRAISE",
      "matchedKeyPoints": ["point1", ...],
      "missingKeyPoints": ["point1", ...],
      ${isBehavioral ? behavioralSchema : technicalSchema}
    }
  `;

  const generateEval = async (prompt: string, useFallback = false): Promise<EvaluationResult> => {
    let cleanText = "";
    if (!useFallback) {
      const evalAi = getEvalAi();
      const evalResponse = await evalAi.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      cleanText = evalResponse.text || "{}";
    } else {
      cleanText = await fallbackToNvidia(prompt);
    }

    cleanText = cleanText.trim();
    if (cleanText.startsWith('\`\`\`json')) cleanText = cleanText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '');
    else if (cleanText.startsWith('\`\`\`')) cleanText = cleanText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '');

    const evalJson = JSON.parse(cleanText);

    // Map new fields back to legacy fields for frontend compatibility if needed
    let finalAnalysis = evalJson.analysis;
    if (evalJson.analysis && evalJson.analysis.conceptCoverage !== undefined) {
      finalAnalysis = {
        technicalAccuracy: evalJson.analysis.technicalAccuracy,
        problemSolving: evalJson.analysis.conceptCoverage, // mapping
        practicalExecution: evalJson.analysis.depth, // mapping
        communication: evalJson.analysis.communication
      };
    }

    return {
      questionId: Number(currentQuestion.id),
      questionText: currentQuestion.question,
      userAnswer: answer,
      contentScore: evalJson.contentScore ?? 0,
      grammarScore: 0,
      fluencyScore: 0,
      communicationScore: evalJson.analysis?.communication || evalJson.behavioralMetrics?.communication || 0,
      matchedKeyPoints: evalJson.matchedKeyPoints || [],
      missingKeyPoints: evalJson.missingKeyPoints || [],
      verdict: evalJson.verdict || "Borderline",
      feedback: evalJson.feedback || "Answer recorded.",
      analysis: finalAnalysis,
      behavioralMetrics: evalJson.behavioralMetrics,
      confidenceScore: visualMetrics?.confidenceLevel ?? 0,
      expressionAnalysis: "Visual analysis processed.",
      timestamp: new Date().toISOString()
    };
  };

  try {
    const evaluation = await generateEval(evalPrompt, false);
    return { evaluation, nextQuestion: null };
  } catch (error) {
    console.warn("Gemini Evaluation Failed, attempting NVIDIA fallback...", error);
    try {
      const evaluation = await generateEval(evalPrompt, true);
      return { evaluation, nextQuestion: null };
    } catch (nvidiaErr) {
      console.error("NVIDIA Evaluation Fallback also failed:", nvidiaErr);
      // Safe Fallback
      const fallbackEval: EvaluationResult = {
        questionId: Number(currentQuestion.id),
        questionText: currentQuestion.question,
        userAnswer: answer,
        contentScore: 0,
        grammarScore: 0,
        fluencyScore: 0,
        communicationScore: 0,
        matchedKeyPoints: [],
        missingKeyPoints: [],
        verdict: "Borderline",
        feedback: "Evaluation is pending due to system load. Answer recorded successfully.",
        confidenceScore: visualMetrics?.confidenceLevel ?? 0,
        expressionAnalysis: "N/A",
        timestamp: new Date().toISOString(),
        evaluationPending: true // Mark as pending!
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
