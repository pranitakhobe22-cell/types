import { GoogleGenerativeAI } from "@google/generative-ai";
import { CSE_QUESTION_BANK, ECE_QUESTION_BANK } from "./questionBank";

const getApiKey = () => {
  const key = (import.meta.env?.VITE_GEMINI_API_KEY) || (typeof process !== 'undefined' ? process.env.VITE_GEMINI_API_KEY : "") || "";
  if (!key) console.warn("Gemini API Key not found in environment variables.");
  return key;
};

const getGenAI = () => new GoogleGenerativeAI(getApiKey());

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
    const model = getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" });
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

    const prompt = `
    For these ${role} interview questions, provide a concise but comprehensive "ideal_answer" for each one.
    The ideal answer should cover all key technical points a strong candidate would mention.
    
    Questions:
    ${selected.map((q, i) => `${i+1}. ${q.question}`).join('\n')}

    Output format (STRICT JSON ARRAY OF STRINGS ONLY):
    ["answer 1 text", "answer 2 text", ...]`;

    try {
      const result = await model.generateContent(prompt);
      const idealAnswers = JSON.parse(result.response.text().match(/\[[\s\S]*\]/)![0]);
      
      return selected.map((q, i) => ({
        question: q.question,
        ideal_answer: idealAnswers[i] || "High quality technical response expected."
      }));
    } catch (error) {
      console.error("Ideal answer generation failed, using fallback:", error);
      return selected.map(q => ({
        question: q.question,
        ideal_answer: "Detailed technical response required."
      }));
    }
  },

  _pick(arr: any[], n: number) {
    return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
  },

  async evaluateInterview(
    candidateAnswers: { question: string; answer: string; ideal_answer: string }[]
  ): Promise<EvaluationReport> {
    const model = getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" });

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
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Strip markdown code fences if present
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid AI response format");
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and clamp scores
      if (parsed.totalScore === undefined || isNaN(parsed.totalScore)) {
        parsed.totalScore = this._computeFallbackScore(parsed);
      }
      parsed.totalScore = Math.max(0, Math.min(100, Math.round(parsed.totalScore)));
      
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
    const model = getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" });

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
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${getApiKey()}`);
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error("Error listing models:", error);
      return [];
    }
  }
};
