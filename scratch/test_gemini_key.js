
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Read directly from .env.local in current dir
const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/VITE_GEMINI_API_KEY=(.*)/);
const API_KEY = match ? match[1].trim() : "";

const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
  try {
    console.log("Testing API Key:", API_KEY.substring(0, 5) + "...");
    
    // List models first to see what's available
    console.log("Fetching available models...");
    const responseModels = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const modelsData = await responseModels.json();
    
    if (modelsData.error) {
        throw new Error(modelsData.error.message);
    }

    const availableModels = modelsData.models?.map(m => m.name.replace("models/", "")) || [];
    console.log("Available Models:", availableModels.join(", "));

    // Select a valid model
    const preferredModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    const selectedModel = preferredModels.find(m => availableModels.includes(m)) || availableModels[0];

    if (!selectedModel) {
        throw new Error("No available models found for this API key.");
    }

    console.log("Selected Model:", selectedModel);
    const model = genAI.getGenerativeModel({ model: selectedModel });
    const prompt = "Respond with 'API Key is working' if you receive this.";
    
    console.log("Sending request to Gemini...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Gemini Response:", text);
    
    if (text.includes("API Key is working")) {
        console.log("✅ Gemini API Key is valid and working!");
    } else {
        console.log("⚠️ Received unexpected response, but API call succeeded.");
    }
  } catch (error) {
    console.error("❌ Gemini API Error:");
    if (error.message.includes("API_KEY_INVALID")) {
        console.error("The API key is invalid.");
    } else if (error.message.includes("quota")) {
        console.error("The API key has exceeded its quota.");
    } else {
        console.error(error.message);
    }
  }
}

test();
