import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Use a mock UUID or find an existing session
  const { data: session } = await supabase.from('interview_sessions').select('id').limit(1).single();
  
  if (!session) {
    console.error("No interview sessions found to attach to.");
    return;
  }

  const report = {
    totalScore: 75,
    technicalScore: 7.5,
    communicationScore: 8,
    confidenceScore: 7,
    proctoringScore: 10,
    finalVerdict: "Good",
    hiringRecommendation: "Consider",
    detailedAnalysis: { strengths: ["a"], failures: ["b"] },
    verdictJustification: "because",
    evaluationLogic: { test: true },
    riskScore: 10,
    riskLevel: "Low",
    riskReason: [],
    proctoringSummary: {},
    evaluationWeightsSnapshot: {},
    evaluationVersion: "1",
    evaluationModel: "gemini",
    evaluationPromptVersion: "1",
    candidateOutcome: "Wait"
  };

  const { error } = await supabase
    .from('evaluation_reports')
    .upsert({
        session_id: session.id,
        total_score: report.totalScore,
        technical_score: report.technicalScore,
        communication_score: report.communicationScore,
        confidence_score: report.confidenceScore,
        proctoring_score: report.proctoringScore,
        final_verdict: report.finalVerdict,
        hiring_recommendation: report.hiringRecommendation || 'Consider',
        strengths: report.detailedAnalysis?.strengths || [],
        failures: report.detailedAnalysis?.failures || [],
        verdict_justification: report.verdictJustification,
        evaluation_logic: report.evaluationLogic || {},
        risk_score: report.riskScore,
        risk_level: report.riskLevel,
        risk_reason: report.riskReason || [],
        proctoring_summary: report.proctoringSummary || {},
        evaluation_weights_snapshot: report.evaluationWeightsSnapshot || {},
        evaluation_version: report.evaluationVersion,
        evaluation_model: report.evaluationModel,
        evaluation_prompt_version: report.evaluationPromptVersion,
        evaluated_at: new Date().toISOString(),
        candidate_outcome: report.candidateOutcome
    }, { onConflict: 'session_id' });

  if (error) {
    console.error("FAIL:", error);
  } else {
    console.log("SUCCESS!");
  }
}

run();
