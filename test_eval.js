import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

let key = "";
try {
  const envContent = fs.readFileSync("server/.env", "utf8");
  const match = envContent.match(/GEMINI_API_KEY=(.*)/);
  if (match) key = match[1].trim();
} catch (e) {}

const genAI = new GoogleGenerativeAI(key || process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const prompt = `
Evaluate this interview based on 4 metrics (0-10 each): Relevance, Accuracy, Clarity, Depth.

Interview Data:
[{"question": "test", "answer": "I don't know", "ideal_answer": "Should know something."}]

Output format (STRICT JSON):
{
  "totalScore": 0-100,
  "category": "Excellent" | "Good" | "Average" | "Poor",
  "detailedAnalysis": {
    "strengths": ["Exactly 3 unique strings"],
    "failures": ["Exactly 3 unique strings"],
    "metrics": {
      "relevance": 0-10,
      "accuracy": 0-10,
      "clarity": 0-10,
      "depth": 0-10
    }
  },
  "finalVerdict": "Summary of performance",
  "verdictJustification": "Critical analysis"
}

Scoring rules:
- Excellent: 85+
- Good: 70-84
- Average: 50-69
- Poor: <50
`;

async function test() {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    console.log('RAW:', text);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");
    console.log('PARSED:', JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('ERROR:', err);
  }
}

test();
