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
    candidateAnswers: { question: string; answer: string; ideal_answer: string }[]
  ): Promise<EvaluationReport> {
    // Build a structured comparison for the AI to evaluate against
    const formattedData = candidateAnswers.map((item, i) => ({
      questionNumber: i + 1,
      question: item.question,
      idealAnswer: item.ideal_answer,
      candidateAnswer: item.answer || "[No answer provided]"
    }));

    const prompt = `
You are a strict but fair technical interviewer at a top-tier company. Your job is to evaluate a candidate's interview responses rigorously.

EVALUATION CRITERIA:
- Compare each answer DIRECTLY against the ideal answer provided
- Score based on how many key concepts the candidate actually covered
- Do NOT inflate scores — a vague answer should score low
- A blank or off-topic answer should score 0-2
- An answer that covers all key points concisely should score 8-10

INTERVIEW DATA TO EVALUATE:
${JSON.stringify(formattedData, null, 2)}

SCORING RUBRIC (per question, 0-10):
- 0-2: No answer, completely wrong, or irrelevant
- 3-4: Very partial — mentions topic but misses most key points
- 5-6: Partial — covers some key points but has significant gaps
- 7-8: Good — covers most key points with minor omissions
- 9-10: Excellent — comprehensive, accurate, well-articulated

OVERALL METRICS (0-10 each, averaged across all questions):
- relevance: How well answers addressed the actual question asked
- accuracy: Technical correctness of the content
- clarity: How clearly ideas were communicated
- depth: Level of technical depth demonstrated
- vocabulary: Use of proper technical terminology

OUTPUT REQUIREMENTS (STRICT JSON — no extra text, no markdown):
{
  "totalScore": <integer 0-100, weighted average of question scores>,
  "category": <"Excellent" if >=85 | "Good" if >=70 | "Average" if >=50 | "Poor" if <50>,
  "detailedAnalysis": {
    "strengths": [<3 specific strengths observed in the interview>],
    "failures": [<3 specific areas where the candidate clearly fell short>],
    "metrics": {
      "relevance": <0-10>,
      "accuracy": <0-10>,
      "clarity": <0-10>,
      "depth": <0-10>,
      "vocabulary": <0-10>
    }
  },
  "questionBreakdown": [
    {
      "question": "<question text>",
      "candidateAnswer": "<candidate's answer>",
      "score": <0-10>,
      "verdict": <"Excellent" | "Good" | "Partial" | "Poor">,
      "feedback": "<1-2 sentence specific feedback on this answer>",
      "keyPointsHit": [<list of key concepts the candidate correctly mentioned>],
      "keyPointsMissed": [<list of key concepts from the ideal answer that were missing>],
      "idealAnswerSummary": "<brief summary of what a perfect answer would include>"
    }
  ],
  "finalVerdict": "<2-3 sentence overall assessment of the candidate>",
  "verdictJustification": "<specific technical evidence from the answers to support the verdict>",
  "hiringRecommendation": <"Strong Hire" if >=85 | "Hire" if >=70 | "Consider" if >=50 | "Reject" if <50>
}`;

    try {
      let text = await resilientGenerate(prompt, 2, 'eval');
      
      // Strip markdown code fences if present
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid AI response format");
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Enforce strict total score calculation from question scores to prevent LLM math hallucinations
      if (parsed.questionBreakdown && parsed.questionBreakdown.length > 0) {
        const sum = parsed.questionBreakdown.reduce((acc: number, q: any) => acc + (q.score || 0), 0);
        const avg = sum / parsed.questionBreakdown.length;
        parsed.totalScore = Math.round(avg * 10); // Scale 0-10 to 0-100
      } else {
        parsed.totalScore = 0;
      }
      
      parsed.totalScore = Math.max(0, Math.min(100, parsed.totalScore));
      
      return parsed as EvaluationReport;
    } catch (error) {
      console.error("Error evaluating interview:", error);
      // Structured fallback so the UI doesn't break
      return this._buildFallbackReport(candidateAnswers);
    }
  },

  _computeFallbackScore(parsed: any): number {
    if (parsed.questionBreakdown && parsed.questionBreakdown.length > 0) {
      const avg = parsed.questionBreakdown.reduce((acc: number, q: any) => acc + (q.score || 5), 0) / parsed.questionBreakdown.length;
      return Math.round(avg * 10);
    }
    return 55;
  },

  _buildFallbackReport(candidateAnswers: { question: string; answer: string; ideal_answer: string }[]): EvaluationReport {
    return {
      totalScore: 55,
      category: "Average",
      detailedAnalysis: {
        strengths: [
          "Candidate attempted all questions",
          "Basic communication was maintained",
          "Showed willingness to engage with topics"
        ],
        failures: [
          "Evaluation engine encountered an error — manual review recommended",
          "Detailed scoring unavailable for this session",
          "AI analysis could not be completed successfully"
        ],
        metrics: { relevance: 6, accuracy: 5, clarity: 6, depth: 5, vocabulary: 5 }
      },
      questionBreakdown: candidateAnswers.map((item, i) => ({
        question: item.question,
        candidateAnswer: item.answer || "[No answer provided]",
        score: 5,
        verdict: "Partial",
        feedback: "Evaluation engine failed. Manual review of this answer is recommended.",
        keyPointsHit: [],
        keyPointsMissed: ["Full evaluation not available"],
        idealAnswerSummary: item.ideal_answer
      })),
      finalVerdict: "The candidate completed the interview. A full AI evaluation was not available due to a technical error. Manual review is recommended.",
      verdictJustification: "Evaluation API encountered an error. Scores shown are default placeholders.",
      hiringRecommendation: "Consider"
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
