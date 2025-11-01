// checkModels.js

require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Make sure your GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  console.log("Connecting to Google AI Studio to list models...");
  try {
    const modelList = await genAI.listModels();
    console.log("--- Available Models for 'generateContent' ---");

    for await (const m of modelList) {
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(`- ${m.name}`);
      }
    }
    console.log("-----------------------------------------------");

  } catch (err) {
    console.error("!!! Error listing models:", err.message);
  }
}

listModels();