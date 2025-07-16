import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
export async function POST(req) {
  try {
    const { question, answer } = await req.json();
    const prompt = `You are an expert interview coach. Here is a technical interview question and a candidate's answer. Give concise, constructive feedback (2-3 sentences) on the answer, focusing on clarity, relevance, and how it could be improved.\n\nQuestion: ${question}\nAnswer: ${answer}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const feedback = response.text().trim();
    return new Response(JSON.stringify({ feedback }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(error?.message || "Failed to get feedback.", {
      status: 400,
    });
  }
} 
