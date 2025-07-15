import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
  const { leetcodeStats, targetRole } = await req.json();
  if (!leetcodeStats || !targetRole) {
    return NextResponse.json({ error: 'Missing leetcodeStats or targetRole' }, { status: 400 });
  }

  const prompt = `You are a creative, encouraging career coach AI. The user wants to become a ${targetRole}.
Their LeetCode stats are: Total Solved: ${leetcodeStats.totalSolved} out of ${leetcodeStats.totalQuestions} (Easy: ${leetcodeStats.easySolved}, Medium: ${leetcodeStats.mediumSolved}, Hard: ${leetcodeStats.hardSolved}).

1. Give 2-3 specific, actionable, and creative recommendations to improve their coding interview readiness.
2. Suggest a fun or motivational next step (e.g., a challenge, a resource, or a positive affirmation).
3. Make your advice friendly and inspiring!`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const recommendation = response.text().trim();
    return NextResponse.json({ recommendation });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 