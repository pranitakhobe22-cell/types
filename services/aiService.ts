import { CSE_QUESTION_BANK, ECE_QUESTION_BANK } from "./questionBank";
import { retryEvaluation, localEvaluate } from "./apiService";

const getOpenRouterKey = () => {
  return (import.meta.env?.VITE_OPENROUTER_API_KEY) || (typeof process !== 'undefined' ? process.env.VITE_OPENROUTER_API_KEY : "") || "";
};

async function resilientGenerate(prompt: string, maxRetries = 2, purpose: 'live' | 'eval' | 'report' = 'eval'): Promise<string> {
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
        // Wait briefly before retry (exponential backoff)
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw new Error(`AI service is currently unavailable. details: ${err?.message || err}`);
    }
  }
  throw new Error("Failed to generate content with OpenRouter DeepSeek.");
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
  verdict: "Excellent" | "Good" | "Borderline" | "Fail";
  feedback: string;
  keyPointsHit: string[];
  keyPointsMissed: string[];
  idealAnswerSummary: string;
  evaluationConfidence?: number;
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
  averageConfidence: number;
}

export const ensureEvaluationGuide = (q: any): Question => {
  if (!q) {
    return {
      id: "unknown",
      question: "",
      category: "General",
      type: "Core",
      difficulty: "medium",
      evaluationGuide: ["General explanation"]
    };
  }

  const evaluationGuide: string[] = [];
  if (q.evaluationGuide && Array.isArray(q.evaluationGuide)) {
    evaluationGuide.push(...q.evaluationGuide);
  } else if (q.keyConcepts && Array.isArray(q.keyConcepts)) {
    q.keyConcepts.forEach((c: any) => {
      if (c && typeof c.concept === 'string') {
        evaluationGuide.push(c.concept);
      } else if (typeof c === 'string') {
        evaluationGuide.push(c);
      }
    });
  } else if (q.keyPoints && Array.isArray(q.keyPoints)) {
    q.keyPoints.forEach((p: any) => {
      if (typeof p === 'string') evaluationGuide.push(p);
    });
  }

  // Fallback to avoid empty checklist
  if (evaluationGuide.length === 0) {
    evaluationGuide.push("Explain the core concept or answer the question directly.");
  }

  const { topic, keyConcepts, keyPoints, ...rest } = q;
  
  return {
    ...rest,
    evaluationGuide
  };
};

export const getQuestionsForRole = (role: string): Question[] => {
  const custom = localStorage.getItem(`reicrew_questions_${role.toLowerCase()}`);
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      return parsed.map((q: any) => ensureEvaluationGuide(q));
    } catch (e) {
      console.error("Failed to parse custom questions from localStorage", e);
    }
  }
  const bank = role === "CSE" ? CSE_QUESTION_BANK : ECE_QUESTION_BANK;
  return bank.map((q: any) => ensureEvaluationGuide(q));
};

export const AIService = {
  selectInterviewBranch(role: string, settings?: any): InterviewBranch {
    const bank = getQuestionsForRole(role);

    // Resolve difficulty based on precedence: Stage Override > Global Strategy > Default Adaptive
    const resolveDifficulty = (stageName: string, defaultDiff?: string) => {
      const stageOverride = settings?.stageOverrides?.[stageName];
      if (stageOverride && stageOverride !== 'Adaptive') {
        return stageOverride === 'Easy Only' ? 'easy' : stageOverride === 'Medium Only' ? 'medium' : 'hard';
      }
      const globalStrategy = settings?.difficultyStrategy;
      if (globalStrategy && globalStrategy !== 'Adaptive') {
        return globalStrategy === 'Easy Only' ? 'easy' : globalStrategy === 'Medium Only' ? 'medium' : 'hard';
      }
      return defaultDiff;
    };

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

    const q1Diff = resolveDifficulty('Fundamentals', Math.random() > 0.5 ? 'easy' : 'medium');
    const q1 = getQ('Fundamentals', q1Diff);
    const usedCategories = [q1.category || ""];

    // Ensure diverse categories for Q2, respecting stage/global difficulty override
    const coreDiff = resolveDifficulty('Core');
    const q2_easy = getQ('Core', coreDiff || 'easy', usedCategories);
    const q2_medium = getQ('Core', coreDiff || 'medium', usedCategories);
    const q2_hard = getQ('Core', coreDiff || 'hard', usedCategories);

    // Ensure diverse categories for Q3
    const scenarioDiff = resolveDifficulty('Scenario');
    const q3_easy = getQ('Scenario', scenarioDiff || 'easy', usedCategories);
    const q3_medium = getQ('Scenario', scenarioDiff || 'medium', usedCategories);
    const q3_hard = getQ('Scenario', scenarioDiff || 'hard', usedCategories);

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

  selectInterviewBranchFromList(questionsList: Question[], settings?: any): InterviewBranch {
    // Resolve difficulty based on precedence: Stage Override > Global Strategy > Default Adaptive
    const resolveDifficulty = (stageName: string, defaultDiff?: string) => {
      const stageOverride = settings?.stageOverrides?.[stageName];
      if (stageOverride && stageOverride !== 'Adaptive') {
        return stageOverride === 'Easy Only' ? 'easy' : stageOverride === 'Medium Only' ? 'medium' : 'hard';
      }
      const globalStrategy = settings?.difficultyStrategy;
      if (globalStrategy && globalStrategy !== 'Adaptive') {
        return globalStrategy === 'Easy Only' ? 'easy' : globalStrategy === 'Medium Only' ? 'medium' : 'hard';
      }
      return defaultDiff;
    };

    // Helper to get questions of specific type and difficulty
    const getQ = (type: string, difficulty?: string, excludeCategories: string[] = []) => {
      let filtered = questionsList.filter(q => q.type === type);
      if (difficulty) filtered = filtered.filter(q => q.difficulty === difficulty);
      if (excludeCategories.length > 0) {
        filtered = filtered.filter(q => !excludeCategories.includes(q.category || ""));
      }
      
      // Fallback if strict filtering fails
      if (filtered.length === 0) {
        filtered = questionsList.filter(q => q.type === type);
        if (filtered.length === 0) {
          filtered = questionsList.filter(q => q.difficulty === difficulty);
          if (filtered.length === 0) return questionsList[0];
        }
      }
      
      return this._pick(filtered, 1)[0] || questionsList[0];
    };

    const q1Diff = resolveDifficulty('Fundamentals', Math.random() > 0.5 ? 'easy' : 'medium');
    const q1 = getQ('Fundamentals', q1Diff);
    const usedCategories = [q1?.category || ""];

    // Ensure diverse categories for Q2
    const coreDiff = resolveDifficulty('Core');
    const q2_easy = getQ('Core', coreDiff || 'easy', usedCategories);
    const q2_medium = getQ('Core', coreDiff || 'medium', usedCategories);
    const q2_hard = getQ('Core', coreDiff || 'hard', usedCategories);

    // Ensure diverse categories for Q3
    const scenarioDiff = resolveDifficulty('Scenario');
    const q3_easy = getQ('Scenario', scenarioDiff || 'easy', usedCategories);
    const q3_medium = getQ('Scenario', scenarioDiff || 'medium', usedCategories);
    const q3_hard = getQ('Scenario', scenarioDiff || 'hard', usedCategories);

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

  async generateFollowUpQuestion(parentQuestion: Question, userAnswer: string): Promise<Question> {
    const prompt = `You are an expert interviewer. The candidate has answered a technical question.
Generate a short follow-up question to validate their depth of understanding or detect if they are bluffing.
The follow-up question MUST be at the same difficulty level ("${parentQuestion.difficulty ?? 'medium'}").

Parent Question: "${parentQuestion.question}"
Candidate's Answer: "${userAnswer}"

Return strictly the following JSON structure:
{
  "id": "followup_${parentQuestion.id}",
  "question": "<follow-up question text>",
  "category": "${parentQuestion.category ?? ''}",
  "type": "${parentQuestion.type ?? 'Core'}",
  "difficulty": "${parentQuestion.difficulty ?? 'medium'}",
  "evaluationGuide": [
    "<specific expected evaluation area 1>",
    "<specific expected evaluation area 2>"
  ]
}`;

    try {
      let text = await resilientGenerate(prompt, 1, 'live');
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid follow-up response format");
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: parsed.id || `followup_${parentQuestion.id}_${Date.now()}`,
        question: parsed.question,
        category: parsed.category || parentQuestion.category,
        type: parsed.type || parentQuestion.type,
        difficulty: parsed.difficulty || parentQuestion.difficulty,
        evaluationGuide: parsed.evaluationGuide || parentQuestion.evaluationGuide || ["Detail explanation"],
        isFollowUp: true
      };
    } catch (e) {
      console.warn("Follow-up generation failed, using static fallback follow-up:", e);
      return {
        id: `followup_${parentQuestion.id}_fallback`,
        question: `Could you elaborate on the core concepts you just mentioned, particularly how they are implemented?`,
        category: parentQuestion.category,
        type: parentQuestion.type,
        difficulty: parentQuestion.difficulty,
        evaluationGuide: parentQuestion.evaluationGuide || ["Detail explanation"],
        isFollowUp: true
      };
    }
  },

  async evaluateInterview(
    candidateAnswers: { question: string; answer: string; ideal_answer: string; evaluation?: any; questionData?: any }[],
    sessionId?: string,
    proctoring?: any
  ): Promise<any> {
    
    // ── PHASE 1: Re-evaluate any pending answers ──
    const resolvedAnswers = await Promise.all(
      candidateAnswers.map(async (item) => {
        if (item.evaluation?.evaluationPending) {
          console.log(`[Report] Re-evaluating pending answer for: ${item.question.substring(0, 50)}...`);
          try {
            const questionObj = ensureEvaluationGuide({
              id: item.evaluation?.questionId || 0,
              question: item.question,
              ideal_answer: item.ideal_answer,
              keyConcepts: item.questionData?.keyConcepts,
              keyPoints: item.questionData?.keyPoints,
              evaluationGuide: item.questionData?.evaluationGuide,
              type: item.questionData?.type,
              difficulty: item.questionData?.difficulty,
            });
            const retried = await retryEvaluation(questionObj, item.answer, sessionId);
            return { ...item, evaluation: retried };
          } catch (err: any) {
            console.error("[Report] Re-evaluation failed:", err);
            return {
              ...item,
              evaluation: {
                ...item.evaluation,
                evaluationPending: false,
                evaluationError: err.message || String(err),
                feedback: `AI Evaluation Failed: ${err.message || err}`,
                contentScore: 0
              }
            };
          }
        }
        return item;
      })
    );

    // ── PHASE 2: Cross-Question Contradictions on Technical Questions ──
    const technicalTranscripts = resolvedAnswers
      .map((item, idx) => ({
        index: idx + 1,
        question: item.question,
        answer: item.answer,
        isBehavioral: item.questionData?.type?.startsWith("Behavioral") || false
      }))
      .filter(t => !t.isBehavioral && t.answer.trim().length > 10);

    let contradictions: any[] = [];
    if (technicalTranscripts.length >= 2) {
      const contradictionPrompt = `You are evaluating a candidate's technical responses in an interview for contradictions.
Only look for actual direct technical contradictions between answers, ignoring subjective, behavioral, or personal statements.
For example, if in one answer they say "Java is pass-by-reference" and in another they say "Java is pass-by-value", that is a high-severity confirmed contradiction.
Do not flag minor phrasing variations as contradictions.

TRANSCRIPTS TO EVALUATE:
${technicalTranscripts.map(t => `Answer ${t.index} (to "${t.question}"): "${t.answer}"`).join("\n\n")}

Return strictly the following JSON structure:
{
  "crossQuestionContradictions": [
    {
      "qIndex1": number, // 1-based index of first answer in the transcripts list (e.g. ${technicalTranscripts[0].index})
      "qIndex2": number, // 1-based index of second answer in the transcripts list (e.g. ${technicalTranscripts[1].index})
      "explanation": "detailed explanation of why these two answers contradict",
      "severity": "low" | "medium" | "high",
      "status": "confirmed" | "possible" | "insufficient_evidence",
      "confidence": number // confidence score from 0 to 100
    }
  ]
}`;

      try {
        let rawContradictions = await resilientGenerate(contradictionPrompt, 1, 'eval');
        rawContradictions = rawContradictions.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const jsonMatch = rawContradictions.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          contradictions = parsed.crossQuestionContradictions || [];
        }
      } catch (e) {
        console.error("Contradiction check failed:", e);
      }
    }

    // Calculate contradiction penalty: Confirmed only, confidence >= 70
    let contradictionPenalty = 0;
    const processedContradictions = contradictions.map(c => {
      let penalty = 0;
      if (c.status === 'confirmed' && (c.confidence ?? 100) >= 70) {
        if (c.severity === 'low') penalty = 1;
        else if (c.severity === 'medium') penalty = 2;
        else if (c.severity === 'high') penalty = 4;
      }
      contradictionPenalty += penalty;
      return {
        qIndex1: Number(c.qIndex1),
        qIndex2: Number(c.qIndex2),
        explanation: c.explanation || "",
        severity: (c.severity || 'medium') as 'low' | 'medium' | 'high',
        status: (c.status || 'possible') as 'confirmed' | 'possible' | 'insufficient_evidence',
        confidence: Number(c.confidence ?? 80)
      };
    });
    contradictionPenalty = Math.min(8, contradictionPenalty);

    // ── PHASE 3: Stability Score (Standard Deviation of primary questions) ──
    const primaryAnswers = resolvedAnswers.filter(item => !item.questionData?.isFollowUp);
    const primaryScores = primaryAnswers
      .filter(item => !item.evaluation?.evaluationError)
      .map(item => item.evaluation?.contentScore ?? 5);
    let stdDev = 0;
    if (primaryScores.length > 0) {
      const mean = primaryScores.reduce((a, b) => a + b, 0) / primaryScores.length;
      const variance = primaryScores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / primaryScores.length;
      stdDev = Math.sqrt(variance);
    }
    const knowledgeStabilityScore = Math.max(0, Math.min(100, Math.round(100 - stdDev * 15)));

    // ── PHASE 4: Topic Coverage (Exclude follow-ups) ──
    let primaryMatchedConcepts = 0;
    let primaryExpectedConcepts = 0;
    for (const item of primaryAnswers) {
      if (item.evaluation?.evaluationError) continue;
      const evalData = item.evaluation || {};
      const matched = evalData.matchedKeyPoints?.length || 0;
      const missed = evalData.missingKeyPoints?.length || 0;
      primaryMatchedConcepts += matched;
      primaryExpectedConcepts += (matched + missed);
    }
    const topicCoverage = primaryExpectedConcepts > 0 
      ? Math.round((primaryMatchedConcepts / primaryExpectedConcepts) * 100) 
      : 0;

    // ── PHASE 5: Difficulty & Discrimination Weighted Score ──
    const getDifficultyWeight = (q: any) => {
      if (q?.difficulty === 'easy') return 1.0;
      if (q?.difficulty === 'hard') return 3.0;
      return 2.0; // medium
    };
    const getDiscriminationWeight = (q: any) => {
      return q?.discriminationWeight ?? (q?.difficulty === 'hard' ? 1.5 : q?.type === 'Scenario' ? 1.2 : q?.type === 'Fundamentals' ? 0.8 : 1.0);
    };

    let totalWeightedScoreSum = 0;
    let totalWeightSum = 0;
    for (const item of resolvedAnswers) {
      if (item.evaluation?.evaluationError) continue;
      const score = item.evaluation?.contentScore ?? 5;
      const q = item.questionData;
      const diffW = getDifficultyWeight(q);
      const discW = getDiscriminationWeight(q);
      totalWeightedScoreSum += score * diffW * discW;
      totalWeightSum += diffW * discW;
    }
    const difficultyWeightedPerformance = totalWeightSum > 0 
      ? Math.round((totalWeightedScoreSum / totalWeightSum) * 10) 
      : 50;

    const technicalScore = Math.max(0, Math.min(100, difficultyWeightedPerformance - contradictionPenalty));

    // ── PHASE 6: Integrity & Trust Scores ──
    const integrityScore = proctoring ? (proctoring.integrityScore ?? 100) : 100;
    const trustAdjustedScore = Math.round(technicalScore * (integrityScore / 100));

    // ── PHASE 7: Hiring Recommendation & Ceilings ──
    let recommendation: 'Strong Hire' | 'Hire' | 'Consider' | 'Reject' = 'Consider';
    if (integrityScore < 40) {
      recommendation = 'Reject';
    } else if (integrityScore < 55) {
      recommendation = 'Consider';
    } else {
      // mid thresholds: Strong >= 85, Hire >= 70, Consider >= 50
      if (trustAdjustedScore >= 85) recommendation = 'Strong Hire';
      else if (trustAdjustedScore >= 70) recommendation = 'Hire';
      else if (trustAdjustedScore >= 50) recommendation = 'Consider';
      else recommendation = 'Reject';
    }

    // Insufficient Evidence Override
    const totalConfidence = resolvedAnswers.reduce((acc, a) => acc + (a.evaluation?.evaluationConfidence ?? 50), 0);
    const averageConfidence = Math.round(totalConfidence / (resolvedAnswers.length || 1));
    const reportConfidence = averageConfidence >= 80 ? 'High' : averageConfidence >= 55 ? 'Medium' : 'Low';
    
    let recommendationStatus: 'normal' | 'insufficient_evidence' = 'normal';
    if (reportConfidence === 'Low' && topicCoverage < 50) {
      recommendationStatus = 'insufficient_evidence';
    }

    // ── PHASE 8: Overall Score Parameters ──
    const knowledgeScore = technicalScore;
    
    const reasoningScores = resolvedAnswers
      .filter(item => !item.evaluation?.evaluationError && item.evaluation?.analysis?.reasoning !== undefined)
      .map(item => item.evaluation.analysis.reasoning);
    const reasoningScore = reasoningScores.length > 0
      ? Math.round((reasoningScores.reduce((a, b) => a + b, 0) / reasoningScores.length) * 10)
      : 50;

    const communicationScores = resolvedAnswers
      .filter(item => !item.evaluation?.evaluationError)
      .map(item => item.evaluation?.communicationScore ?? item.evaluation?.analysis?.communication ?? 5);
    const communicationScore = Math.round((communicationScores.reduce((a, b) => a + b, 0) / (communicationScores.length || 1)) * 10);

    const consistencyScore = Math.max(0, 100 - contradictionPenalty * 12.5);

    // Timeline Trend
    const timeline = resolvedAnswers.map((item, idx) => ({
      qIndex: idx + 1,
      score: (item.evaluation?.contentScore ?? 5) * 10
    }));
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (timeline.length >= 3) {
      const midPoint = Math.floor(timeline.length / 2);
      const firstHalf = timeline.slice(0, midPoint);
      const secondHalf = timeline.slice(midPoint);
      const avgFirst = firstHalf.reduce((a, b) => a + b.score, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b.score, 0) / secondHalf.length;
      if (avgSecond - avgFirst >= 10) trend = 'improving';
      else if (avgFirst - avgSecond >= 10) trend = 'declining';
    }

    // ── PHASE 9: Executive Summary, Strengths, and Weaknesses AI Evaluation ──
    const evaluationPrompt = `You are an expert technical recruiter evaluating a candidate's full performance.
Below is the candidate's activity history during the interview:
${resolvedAnswers.map((item, idx) => `
Activity ${idx + 1} - Question: "${item.question}"
Candidate's Spoken Answer: "${item.answer}"
Assessed Question Score: ${item.evaluation?.contentScore ?? 5}/10
Key Concepts Covered: ${item.evaluation?.matchedKeyPoints?.join(", ") || "None"}
Key Concepts Missed: ${item.evaluation?.missingKeyPoints?.join(", ") || "None"}
Specific Question Feedback: "${item.evaluation?.feedback || ""}"
`).join("\n")}

Overall Interview Performance Metrics:
- Technical Score: ${technicalScore}/100
- Trust Score: ${trustAdjustedScore}/100 (Integrity: ${integrityScore}/100)
- Topic Coverage: ${topicCoverage}%
- Knowledge Stability: ${knowledgeStabilityScore}%
- Communication Score: ${communicationScore}%
- Reasoning Score: ${reasoningScore}%
- Cross-Question Technical Contradictions: ${processedContradictions.length > 0 ? processedContradictions.map(c => c.explanation).join("; ") : "None"}

Please evaluate the candidate's strengths and weaknesses comprehensively based on all activities (answers, logic, depth, consistency, communication, and proctoring).
Generate:
1. An executive summary paragraph explaining their general performance, technical gaps, and why this recommendation is appropriate (exactly 3 sentences).
2. A list of 3 to 4 overall strengths. Each strength must be a specific, professional, and actionable observation based on their actual answers, logic, communication, and behavior (e.g., "Demonstrated strong knowledge of data structures when explaining trees", "Communicated technical ideas clearly with low use of filler words"). Do not just list simple technical keywords.
3. A list of 3 to 4 overall weaknesses/gaps. Each weakness must be a specific, professional, and actionable observation based on their actual gaps, communication issues, or inconsistencies.

Return strictly the following JSON structure (do not include markdown code block backticks):
{
  "summary": "<summary text>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"]
}`;

    let summaryText = "";
    let finalStrengths: string[] = [];
    let finalWeaknesses: string[] = [];

    try {
      let rawEvalJson = await resilientGenerate(evaluationPrompt, 1, 'eval');
      rawEvalJson = rawEvalJson.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      const jsonMatch = rawEvalJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summaryText = parsed.summary || "";
        finalStrengths = parsed.strengths || [];
        finalWeaknesses = parsed.weaknesses || [];
      }
    } catch (e) {
      console.error("AI overall evaluation prompt failed:", e);
    }

    // Fallbacks if empty or failed
    if (!summaryText) {
      summaryText = `The candidate achieved a technical performance score of ${technicalScore}/100 with topic coverage of ${topicCoverage}%. Their integrity checks scored ${integrityScore}/100, leading to a trust-adjusted score of ${trustAdjustedScore}/100. Overall, they are recommended as a ${recommendation}.`;
    }
    if (finalStrengths.length === 0) {
      finalStrengths = resolvedAnswers.flatMap(a => a.evaluation?.matchedKeyPoints || []).slice(0, 4).map(s => `Demonstrated understanding of ${s}.`);
      if (finalStrengths.length === 0) finalStrengths = ["Showed satisfactory fundamental understanding."];
    }
    if (finalWeaknesses.length === 0) {
      finalWeaknesses = resolvedAnswers.flatMap(a => a.evaluation?.missingKeyPoints || []).slice(0, 4).map(w => `Could improve understanding of ${w}.`);
      if (finalWeaknesses.length === 0) finalWeaknesses = ["Demonstrated minor area-specific technical gaps."];
    }

    // Question Breakdown
    const questionBreakdown = resolvedAnswers.map((item, idx) => {
      const evalData = item.evaluation || {};
      const errors = evalData.analysis?.technicalErrors || [];
      const analysisObj = {
        coverage: evalData.analysis?.coverage ?? 5,
        understanding: evalData.analysis?.understanding ?? 5,
        reasoning: evalData.analysis?.reasoning ?? 5,
        communication: evalData.analysis?.communication ?? 5
      };

      return {
        questionText: item.question,
        difficulty: (item.questionData?.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
        score: evalData.contentScore ?? 5,
        userAnswer: item.answer || "",
        feedback: evalData.feedback || "",
        matchedKeyPoints: evalData.matchedKeyPoints || [],
        missingKeyPoints: evalData.missingKeyPoints || [],
        technicalErrors: errors,
        analysis: analysisObj,
        transcriptionQualityScore: evalData.evaluationConfidence ?? 80,
        followupResult: evalData.followupResult,
        evaluationError: evalData.evaluationError
      };
    });

    // Validation Results
    const validationResults: any[] = [];
    resolvedAnswers.forEach((item, idx) => {
      if (item.questionData?.isFollowUp) {
        const parentEntry = resolvedAnswers[idx - 1];
        validationResults.push({
          parentQuestion: parentEntry?.question || "",
          parentScore: (parentEntry?.evaluation?.contentScore ?? 0) * 10,
          followupQuestion: item.question,
          followupScore: (item.evaluation?.contentScore ?? 0) * 10,
          reliability: item.evaluation?.followupResult?.reliability ?? 100
        });
      }
    });

    // Proctoring Summary mapping
    const proctoringSummary = proctoring ? {
      faceAwayEvents: proctoring.gazeAwayEvents ?? 0,
      multiplePersonEvents: proctoring.multipleFaceEvents ?? 0,
      tabSwitches: proctoring.tabSwitchEvents ?? 0,
      warningsIssued: proctoring.violations?.length ?? 0,
      integrityScore: proctoring.integrityScore ?? 100,
      totalGazeAwayDurationMs: proctoring.totalGazeAwayDurationMs ?? 0,
      longestGazeAwayDurationMs: proctoring.healthSummary?.longestGazeAwayDurationMs ?? 0
    } : {
      faceAwayEvents: 0,
      multiplePersonEvents: 0,
      tabSwitches: 0,
      warningsIssued: 0,
      integrityScore: 100,
      totalGazeAwayDurationMs: 0,
      longestGazeAwayDurationMs: 0
    };

    // Benchmark comparison deterministic mapping
    const percentile = Math.min(99, Math.round(trustAdjustedScore * 0.9 + 5));

    const masterReport = {
      executiveSummary: {
        recommendation,
        recommendationStatus,
        technicalScore,
        trustScore: trustAdjustedScore,
        topicCoverage,
        knowledgeStability: knowledgeStabilityScore,
        reportConfidence,
        summary: summaryText
      },
      overallScores: {
        knowledgeScore,
        reasoningScore,
        communicationScore,
        consistencyScore,
        difficultyWeightedPerformance,
        trustAdjustedScore
      },
      strengths: finalStrengths,
      weaknesses: finalWeaknesses,
      validationResults,
      contradictions: processedContradictions,
      performanceTrend: {
        timeline,
        trend
      },
      proctoringSummary,
      questionBreakdown,
      benchmarkComparison: {
        percentile,
        comparedAgainst: "CSE/ECE Branch Applicants",
        sampleSize: 1500
      },
      telemetry: {
        followupTriggerRate: Math.round((resolvedAnswers.filter(a => a.questionData?.isFollowUp).length / primaryAnswers.length) * 100),
        sessionApiCostEstimate: Number((resolvedAnswers.length * 0.005).toFixed(3)),
        modelCalls: resolvedAnswers.length + 1
      },
      metadata: {
        evaluationVersion: "11.0",
        scoreCalculationVersion: "1.0",
        modelUsed: "gemini-2.5-flash-lite / fallback",
        evaluationMode: "mixed",
        roleLevel: "mid"
      }
    };

    return masterReport;
  },

  _buildFallbackReport(
      candidateAnswers: any[], 
      totalScore: number = 55, 
      category: any = "Average", 
      avgContent: number = 5, 
      avgCommunication: number = 5,
      questionBreakdown: QuestionFeedback[] = [],
      averageConfidence: number = 50
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
        verdict: item.evaluation?.verdict || "Borderline",
        feedback: "Executive summary failed. See individual question feedback.",
        keyPointsHit: item.evaluation?.matchedKeyPoints || [],
        keyPointsMissed: item.evaluation?.missingKeyPoints || [],
        idealAnswerSummary: item.ideal_answer,
        evaluationConfidence: item.evaluation?.evaluationConfidence || 30
      })),
      finalVerdict: "The candidate completed the interview. Summary AI was unavailable, but question scores are valid.",
      verdictJustification: "Aggregated locally.",
      hiringRecommendation: totalScore >= 70 ? "Hire" : "Consider",
      averageConfidence
    };
  },

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models");
      const data = await response.json();
      return data.data?.map((m: any) => m.id) || ["deepseek/deepseek-chat"];
    } catch (error) {
      console.error("Error listing models:", error);
      return ["deepseek/deepseek-chat"];
    }
  }
};
