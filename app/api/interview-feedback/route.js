import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function getGeminiResponse(prompt, models) {
  for (const modelName of models) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      if (e.message && (e.message.includes('overloaded') || e.message.includes('503'))) {
        continue; // Try next model
      } else {
        throw e;
      }
    }
  }
  throw new Error('All Gemini models are overloaded. Please try again later.');
}

export async function POST(req) {
  const { feedbackPrompt } = await req.json();
  const models = ['gemini-2.5-pro', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'];
  try {
    const text = await getGeminiResponse(feedbackPrompt, models);
    return NextResponse.json({ feedback: text.trim() });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 
