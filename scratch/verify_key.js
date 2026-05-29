import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

let key = "";
try {
  const envContent = fs.readFileSync("server/.env", "utf8");
  const match = envContent.match(/GEMINI_API_KEY=(.*)/);
  if (match) key = match[1].trim();
} catch (e) {
  console.error("Failed to read server/.env", e);
}

console.log("Using Server Key:", key ? `${key.substring(0, 15)}...` : "None");

const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function run() {
  try {
    const result = await model.generateContent("Respond with just: API OK");
    console.log("✅ Server key works:", result.response.text().trim());
  } catch (err) {
    console.error("❌ Server key failed:", err.message || err);
  }
}

run();
