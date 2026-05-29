import { GoogleGenerativeAI } from "@google/generative-ai";
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

const genAI = new GoogleGenerativeAI(key);

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  try {
    const result = await model.generateContent("Hello, are you working?");
    console.log("RESPONSE:", result.response.text());
  } catch (err) {
    console.error("ERROR:", err);
  }
}

run();
