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
