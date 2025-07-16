import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
  const body = await req.json();
  
  // Handle resume LaTeX generation
  if (body.prompt && body.formData) {
    const { prompt, formData, currentLatex } = body;
    
    const resumePrompt = `You are an expert LaTeX resume writer. The user has provided their resume data and wants you to improve or modify their LaTeX code.

Current LaTeX Code:
${currentLatex}

User's Request: ${prompt}

User's Resume Data:
${JSON.stringify(formData, null, 2)}

Please provide an improved or modified LaTeX code based on the user's request. 
- Keep the same document structure and commands
- Only modify what the user specifically requested
- Ensure all LaTeX syntax is correct
- Return ONLY the complete LaTeX code, no explanations or markdown formatting
- Make sure all user data is properly included in the output`;

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      const result = await model.generateContent(resumePrompt);
      const response = await result.response;
      const latexCode = response.text().trim();
      
      return NextResponse.json({ latexCode });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
  
  // Handle existing leetcode recommendations
  const { leetcodeStats, targetRole } = body;
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const recommendation = response.text().trim();
    return NextResponse.json({ recommendation });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 