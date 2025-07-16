import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
  // Check if the request is multipart/form-data (file upload)
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const image = formData.get('resumeImage');
    const targetCompany = formData.get('targetCompany');
    const targetRole = formData.get('targetRole');
    if (!image) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }
    // Only allow PNG, JPG, JPEG
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json({ error: 'Only PNG, JPG, and JPEG images are allowed.' }, { status: 400 });
    }
    try {
      // Read the image as a buffer and encode as base64
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      // Compose the prompt for resume analysis
      let prompt = `You are an expert, friendly career coach AI. Analyze the user's resume (image attached)`;
      if (targetCompany && targetRole) {
        prompt += ` for a role at **${targetCompany}** as **${targetRole}**`;
      } else if (targetCompany) {
        prompt += ` for a role at **${targetCompany}**`;
      } else if (targetRole) {
        prompt += ` for the role of **${targetRole}**`;
      } else {
        prompt += ' for the role they are targeting.';
      }
      prompt += `\n\n---\n\n**Instructions:**\n- Use section headings with relevant emojis (e.g., '✅ Strengths', '🎯 Areas for Growth', '🛠️ Action Plan', '💡 Recommended Resources', '🚀 Next Steps').\n- For inner points, use either bullet points (with or without emojis) or numbered lists, whichever is most readable for the content.\n- Add a blank line between each bullet/numbered point and section for readability.\n- Use markdown for all formatting (headings, bold, lists).\n- Analyze the user's experience, skills, and education from the resume image.\n- Identify the most important skill gaps for their target company and role.\n- Recommend a personalized learning path (with 2-3 specific resources, e.g., courses, books, or websites).\n- Make your advice concise, visually clear, and motivating.\n- End with a motivating closing.\n`;
      // Send the prompt and image to Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType: image.type, data: base64 } }
      ]);
      const response = await result.response;
      return NextResponse.json({ gap: response.text().trim() });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

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
    const { skills, targetRole, leetcodeStats, resumeText } = body;
    if (!targetRole) {
      return NextResponse.json({ error: 'Missing targetRole for skill gap analysis' }, { status: 400 });
    }
    let prompt = `You are an expert, friendly career coach AI. Analyze the user's readiness for the role of **${targetRole}**.
`;
    if (skills && skills.length > 0) {
      prompt += `\n**Current Skills:** ${Array.isArray(skills) ? skills.join(", ") : skills}`;
    }
    if (leetcodeStats) {
      prompt += `\n**LeetCode Stats:** Total Solved: ${leetcodeStats.totalSolved} out of ${leetcodeStats.totalQuestions} (Easy: ${leetcodeStats.easySolved}, Medium: ${leetcodeStats.mediumSolved}, Hard: ${leetcodeStats.hardSolved})`;
    }
    if (resumeText) {
      prompt += `\n**Resume:**\n${resumeText}`;
    }
    prompt += `\n\n---\n\n**Instructions:**\n- Use section headings with relevant emojis (e.g., '✅ Strengths', '🎯 Areas for Growth', '🛠️ Action Plan', '💡 Recommended Resources', '🚀 Next Steps').\n- For inner points, use either bullet points (with or without emojis) or numbered lists, whichever is most readable for the content.\n- Add a blank line between each bullet/numbered point and section for readability.\n- Use markdown for all formatting (headings, bold, lists).\n- Analyze the user's current skills, coding practice, and resume.\n- Identify the most important skill gaps for a ${targetRole}.\n- Recommend a personalized learning path (with 2-3 specific resources, e.g., courses, books, or websites).\n- Make your advice concise, visually clear, and motivating.\n- End with a motivating closing.\n`;
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return NextResponse.json({ gap: response.text().trim(), recommendations: [] });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // Handle Gemini recommendations (LeetCode + targetRole, or just targetRole)
  const { leetcodeStats, targetRole, resumeText } = body;
  if (!targetRole) {
    return NextResponse.json({ error: 'Missing targetRole' }, { status: 400 });
  }
  let prompt = `You are an expert, friendly career coach AI. Analyze the user's LeetCode stats${resumeText ? ' and resume' : ''} for the role of **${targetRole}**.\n`;
  prompt += `\n**LeetCode Stats:** Total Solved: ${leetcodeStats?.totalSolved || 0}, Easy: ${leetcodeStats?.easySolved || 0}, Medium: ${leetcodeStats?.mediumSolved || 0}, Hard: ${leetcodeStats?.hardSolved || 0}.`;
  if (resumeText) {
    prompt += `\n**Resume:**\n${resumeText}`;
  }
  prompt += `\n\n---\n\n**Instructions:**\n- Use section headings with relevant emojis (e.g., '✅ Strengths', '🎯 Areas for Growth', '🛠️ Action Plan', '💡 Recommended Resources', '🚀 Next Steps').\n- For inner points, use either bullet points (with or without emojis) or numbered lists, whichever is most readable for the content.\n- Add a blank line between each bullet/numbered point and section for readability.\n- Use markdown for all formatting (headings, bold, lists).\n- Give 2-3 specific, actionable, and creative recommendations to improve their coding interview readiness.\n- Suggest a fun or motivational next step (e.g., a challenge, a resource, or a positive affirmation).\n- Make your advice concise, visually clear, and inspiring.\n- Start with a friendly greeting and end with a motivating closing.`;
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