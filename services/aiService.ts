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

import { Question } from "../types";

export interface InterviewBranch {
  q1: Question;
  q2: { easy: Question; medium: Question; hard: Question };
  q3: { easy: Question; medium: Question; hard: Question };
  q4: Question;
  q5: Question;
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
  selectInterviewBranch(role: string): InterviewBranch {
    const bank = role === "CSE" ? CSE_QUESTION_BANK : ECE_QUESTION_BANK;

    // Helper to get questions of specific type and difficulty
    const getQ = (type: string, difficulty?: string, excludeCategories: string[] = []) => {
      let filtered = bank.filter(q => q.type === type);
      if (difficulty) filtered = filtered.filter(q => q.difficulty === difficulty);
      if (excludeCategories.length > 0) {
        filtered = filtered.filter(q => !excludeCategories.includes(q.category || ""));
      }
      
      // Fallback if strict filtering fails (e.g. not enough questions in MVP bank)
      if (filtered.length === 0) {
        filtered = bank.filter(q => q.type === type);
        if (filtered.length === 0) return bank[0]; // Absolute fallback
      }
      
      return this._pick(filtered, 1)[0];
    };

    const q1 = getQ('Fundamentals', 'medium');
    const usedCategories = [q1.category || ""];

    // Ensure diverse categories for Q2
    const q2_easy = getQ('Core', 'easy', usedCategories);
    const q2_medium = getQ('Core', 'medium', usedCategories);
    const q2_hard = getQ('Core', 'hard', usedCategories);

    // Ensure diverse categories for Q3 (just avoid Q1 for now, Q2 is dynamic so avoiding Q2 is trickier here without pre-picking all combinations, but we can avoid Q1 category at least)
    const q3_easy = getQ('Scenario', 'easy', usedCategories);
    const q3_medium = getQ('Scenario', 'medium', usedCategories);
    const q3_hard = getQ('Scenario', 'hard', usedCategories);

    const q4 = getQ('Behavioral Experience');
    const q5 = getQ('Behavioral Situation');

    return {
      q1,
      q2: { easy: q2_easy, medium: q2_medium, hard: q2_hard },
      q3: { easy: q3_easy, medium: q3_medium, hard: q3_hard },
      q4,
      q5
    };
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
        
        const contentScore = evalData.contentScore || 5;
        const techAcc = evalData.analysis?.technicalAccuracy ?? (contentScore * 10);
        const probSolv = evalData.analysis?.problemSolving ?? (contentScore * 10);
        const practExec = evalData.analysis?.practicalExecution ?? (contentScore * 10);
        const comm = evalData.analysis?.communication ?? (contentScore * 10);
        
        const weightedQScore = (techAcc * 0.40) + (probSolv * 0.30) + (practExec * 0.15) + (comm * 0.15); // Out of 100
        
        sumContent += weightedQScore / 10; // For legacy metric calculation (0-10)
        sumCommunication += comm / 10;

        // Calculate keyword coverage (matched / total)
        const matched = evalData.matchedKeyPoints?.length || 0;
        const missed = evalData.missingKeyPoints?.length || 0;
        const totalKeywords = matched + missed;
        const keywordCoverage = totalKeywords > 0 ? (matched / totalKeywords) * 100 : 0;

        return {
            questionId: `Q${index + 1}`,
            question: item.question,
            candidateAnswer: item.answer || "[No answer provided]",
            contentScore: Number((weightedQScore / 10).toFixed(1)),
            communicationScore: Number((comm / 10).toFixed(1)),
            confidenceScore: 0,
            keywordCoverage,
            strengths: evalData.matchedKeyPoints || [],
            weaknesses: evalData.missingKeyPoints || [],
            explanation: evalData.feedback || "Answer recorded.",
            verdict: evalData.verdict || "Partial",
            idealAnswerSummary: item.ideal_answer
        };
    });

    const count = candidateAnswers.length || 1;
    const averageContent = sumContent / count; // 0-10
    const averageCommunication = sumCommunication / count; // 0-10
    const averageKeywordCoverage = questionEvaluations.reduce((acc, q) => acc + q.keywordCoverage, 0) / count;

    // Use unified scoring formula directly for the final score: Average of the weighted question scores
    const weightedScore = (averageContent / 10) * 100;

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
