import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function getGeminiResponse(prompt, models, imageData) {
  for (const modelName of models) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: modelName });
      let result;
      if (imageData) {
        result = await model.generateContent([
          { text: prompt },
          { inlineData: imageData }
        ]);
      } else {
        result = await model.generateContent(prompt);
      }
      return result.response.text();
    } catch (e) {
      if (e.message && (e.message.includes('overloaded') || e.message.includes('503'))) {
        continue;
      } else {
        throw e;
      }
    }
  }
  throw new Error('All Gemini models are overloaded. Please try again later.');
}

export async function POST(req) {
  const contentType = req.headers.get('content-type') || '';
  const models = ['gemini-2.5-pro', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'];

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const image = formData.get('resumeImage');
    const targetCompany = formData.get('targetCompany');
    const targetRole = formData.get('targetRole');
    if (!image) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json({ error: 'Only PNG, JPG, and JPEG images are allowed.' }, { status: 400 });
    }
    try {
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
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
      const text = await getGeminiResponse(prompt, models, { mimeType: image.type, data: base64 });
      return NextResponse.json({ gap: text.trim() });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  const body = await req.json();

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
      const text = await getGeminiResponse(resumePrompt, models);
      const latexCode = text.trim();
      return NextResponse.json({ latexCode });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

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
    prompt += `\n\n---\n\n**Instructions:**\n- Use section headings with relevant emojis (e.g., '✅ Strengths', '🎯 Areas for Growth', '🛠️ Action Plan', '💡 Recommended Resources', '🚀 Next Steps').\n- For inner points, use clear bullet points (with or without emojis) or numbered lists, whichever is most readable for the content.\n- Add a blank line between each bullet/numbered point and section for readability.\n- Use markdown for all formatting (headings, bold, lists).\n- Analyze the user's current skills, coding practice, and resume.\n- Identify the most important skill gaps for a ${targetRole}.\n- Recommend a personalized learning path (with 2-3 specific resources, e.g., courses, books, or websites).\n- Make your advice concise, visually clear, and motivating.\n- Start each section with a heading and add extra spacing for clarity.\n- End with a motivating closing.\n`;
    try {
      const text = await getGeminiResponse(prompt, models);
      return NextResponse.json({ gap: text.trim(), recommendations: [] });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  const { leetcodeStats, targetRole, resumeText } = body;
  if (!targetRole) {
    return NextResponse.json({ error: 'Missing targetRole' }, { status: 400 });
  }
  let prompt = `You are an expert, friendly career coach AI. Analyze the user's LeetCode stats${resumeText ? ' and resume' : ''} for the role of **${targetRole}**.\n`;
  prompt += `\n**LeetCode Stats:** Total Solved: ${leetcodeStats?.totalSolved || 0}, Easy: ${leetcodeStats?.easySolved || 0}, Medium: ${leetcodeStats?.mediumSolved || 0}, Hard: ${leetcodeStats?.hardSolved || 0}.`;
  if (resumeText) {
    prompt += `\n**Resume:**\n${resumeText}`;
  }
  prompt += `\n\n---\n\n**Instructions:**\n- Use section headings with relevant emojis (e.g., '✅ Strengths', '🎯 Areas for Growth', '🛠️ Action Plan', '💡 Recommended Resources', '🚀 Next Steps').\n- For inner points, use clear bullet points (with or without emojis) or numbered lists, whichever is most readable for the content.\n- Add a blank line between each bullet/numbered point and section for readability.\n- Use markdown for all formatting (headings, bold, lists).\n- Give 2-3 specific, actionable, and creative recommendations to improve their coding interview readiness.\n- Suggest a fun or motivational next step (e.g., a challenge, a resource, or a positive affirmation).\n- Make your advice concise, visually clear, and inspiring.\n- Start with a friendly greeting and end with a motivating closing.\n- Start each section with a heading and add extra spacing for clarity.`;
  try {
    const text = await getGeminiResponse(prompt, models);
    const recommendation = text.trim();
    return NextResponse.json({ recommendation });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 