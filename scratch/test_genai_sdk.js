import { GoogleGenAI } from "@google/genai";
import fs from "fs";

let key = "";
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
  if (match) {
    key = match[1].trim();
  }
} catch (e) {
  console.error("Failed to read .env.local", e);
}

console.log("Using API Key:", key ? `${key.substring(0, 10)}...` : "None");

const ai = new GoogleGenAI({ apiKey: key });

async function run() {
  for (const model of ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"]) {
    console.log(`Testing model: ${model}`);
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: "Hello, are you working?"
      });
      console.log(`SUCCESS for ${model}:`, response.text);
    } catch (err) {
      console.error(`ERROR for ${model}:`, err.message || err);
    }
  }
}

run();
