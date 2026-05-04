
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

// Read directly from .env.local
const envLocal = fs.readFileSync('c:\\Users\\harsh\\Downloads\\reicrew-ai (4)\\.env.local', 'utf8');
const match = envLocal.match(/VITE_GEMINI_API_KEY=(.*)/);
const API_KEY = match ? match[1].trim() : "";

const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
  try {
    console.log("Fetching models...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();
    console.log("Models:", data.models?.map(m => m.name));
    
    const modelName = data.models?.find(m => m.name.includes("gemini"))?.name || "gemini-1.5-flash";
    console.log("Using model:", modelName);

    const model = genAI.getGenerativeModel({ model: modelName.replace("models/", "") });
    const prompt = "Hello, respond with a JSON array containing one number: [1]";
    const result = await model.generateContent(prompt);
    const response2 = await result.response;
    const text = response2.text();
    console.log("Raw Response:", text);
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      console.log("Parsed JSON Match:", jsonMatch[0]);
      console.log("Parsed Object:", JSON.parse(jsonMatch[0]));
    } else {
      console.log("No JSON array found");
    }
  } catch (error) {
    console.error("Gemini Error:", error);
  }
}

test();
