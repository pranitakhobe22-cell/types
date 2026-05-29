import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

async function testKey(path, keyName) {
  let key = "";
  try {
    const envContent = fs.readFileSync(path, "utf8");
    const match = envContent.match(new RegExp(`${keyName}=(.*)`));
    if (match) {
      key = match[1].trim();
    }
  } catch (e) {
    console.error(`Failed to read ${path}`, e);
    return;
  }

  console.log(`Using Key from ${path} (${keyName}):`, key ? `${key.substring(0, 10)}...` : "None");
  const genAI = new GoogleGenerativeAI(key);
  
  for (const modelName of ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"]) {
    const model = genAI.getGenerativeModel({ model: modelName });
    try {
      const result = await model.generateContent("Hello, are you working?");
      console.log(`  SUCCESS for ${modelName}:`, result.response.text().substring(0, 30));
    } catch (err) {
      console.error(`  ERROR for ${modelName}:`, err.message || err);
    }
  }
}

async function run() {
  await testKey(".env.local", "VITE_GEMINI_API_KEY");
  console.log("--------------------------------------");
  await testKey("server/.env", "GEMINI_API_KEY");
}

run();
