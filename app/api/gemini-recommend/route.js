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

  // Handle skill gap analysis
  if (body.skillGap) {
    const { skills, targetRole, leetcodeStats, leetcodeTopics } = body;
    if (!targetRole) {
      return NextResponse.json({ error: 'Missing targetRole for skill gap analysis' }, { status: 400 });
    }
    let prompt = `You are an expert career coach AI. The user wants to become a ${targetRole}.
`;
    if (skills && skills.length > 0) {
      prompt += `Their current skills: ${Array.isArray(skills) ? skills.join(", ") : skills}\n`;
    }
    if (leetcodeTopics && Array.isArray(leetcodeTopics) && leetcodeTopics.length > 0) {
      prompt += `Here is a breakdown of their LeetCode practice by topic (format: Topic: Problems Solved):\n`;
      leetcodeTopics.forEach(t => {
        prompt += `- ${t.tagName}: ${t.problemsSolved}\n`;
      });
      prompt += `\nAnalyze which topics are strong (many solved) and which are weak (few or zero solved).\n`;
      prompt += `Give topic-specific advice: For weak topics, recommend a learning path and 2-3 specific resources (courses, books, or websites). For strong topics, suggest how to deepen mastery or apply knowledge.\n`;
      prompt += `Make your advice friendly, actionable, and motivating!`;
    } else if (leetcodeStats) {
      prompt += `LeetCode stats: Total Solved: ${leetcodeStats.totalSolved} out of ${leetcodeStats.totalQuestions} (Easy: ${leetcodeStats.easySolved}, Medium: ${leetcodeStats.mediumSolved}, Hard: ${leetcodeStats.hardSolved}).\n`;
      prompt += `\n1. Analyze the user's current skills and coding practice.\n2. Identify the most important skill gaps for a ${targetRole}.\n3. Recommend a personalized learning path (with 2-3 specific resources, e.g., courses, books, or websites).\n4. Make your advice friendly, actionable, and motivating!`;
    } else {
      prompt += `\n1. Analyze the user's current skills and coding practice.\n2. Identify the most important skill gaps for a ${targetRole}.\n3. Recommend a personalized learning path (with 2-3 specific resources, e.g., courses, books, or websites).\n4. Make your advice friendly, actionable, and motivating!`;
    }
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      // Optionally, parse out recommendations if Gemini returns them as a list
      return NextResponse.json({ gap: response.text().trim(), recommendations: [] });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // Handle Gemini recommendations (LeetCode + targetRole, or just targetRole)
  const { leetcodeStats, leetcodeTopics, targetRole } = body;
  if (!targetRole) {
    return NextResponse.json({ error: 'Missing targetRole' }, { status: 400 });
  }
  let prompt = `You are a creative, encouraging career coach AI. The user wants to become a ${targetRole}.`;
  if (leetcodeTopics && Array.isArray(leetcodeTopics) && leetcodeTopics.length > 0) {
    prompt += `\nTheir LeetCode topic-wise stats are:`;
    leetcodeTopics.forEach(t => {
      prompt += `\n- ${t.tagName}: ${t.problemsSolved}`;
    });
    prompt += `\n1. Give 2-3 specific, actionable, and creative recommendations to improve their coding interview readiness, focusing on weak topics.\n2. Suggest a fun or motivational next step (e.g., a challenge, a resource, or a positive affirmation).\n3. Make your advice friendly and inspiring!`;
  } else if (leetcodeStats) {
    prompt += `\nTheir LeetCode stats are: Total Solved: ${leetcodeStats.totalSolved} out of ${leetcodeStats.totalQuestions} (Easy: ${leetcodeStats.easySolved}, Medium: ${leetcodeStats.mediumSolved}, Hard: ${leetcodeStats.hardSolved}).`;
    prompt += `\n1. Give 2-3 specific, actionable, and creative recommendations to improve their coding interview readiness.\n2. Suggest a fun or motivational next step (e.g., a challenge, a resource, or a positive affirmation).\n3. Make your advice friendly and inspiring!`;
  }
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