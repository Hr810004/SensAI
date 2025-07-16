import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
  const { company, role } = await req.json();
  if (!company || !role) {
    return NextResponse.json({ error: 'Missing company or role' }, { status: 400 });
  }

  // Enhanced prompt for company and role specificity, with DSA split
  const prompt = `
You are an expert technical interviewer and career coach.
Generate a mock interview quiz for a candidate applying for the role of '${role}' at '${company}'.

Instructions:
- All questions (Aptitude, CS Fundamentals, DSA, Behavioral, etc.) must be as specific as possible to the company and the target role.
- If the role is commonly hired by the company, tailor all questions to both the company and the role, using public knowledge about the company's interview style, preferred skills, and typical questions for that role at that company.
- If the role is not commonly hired by the company, focus on company-specific questions and the company's general interview process, culture, and values.
- For DSA, generate exactly 2 questions:
    1. One LeetCode-style algorithm question that has been previously or is currently asked by '${company}' for the '${role}' (if public information is available). Specify 'questionType' as 'leetcode-algorithm'. Do not include a code snippet, just the problem statement. Make it as realistic and company-specific as possible.
    2. One code snippet-based question (randomly choose between code correction, code completion, or missing line). Provide a code snippet and specify 'questionType' as 'code-correction', 'code-completion', or 'missing-line'.
  Answers can be text or audio-based.
- For technical and aptitude sections, use question types and topics that are known to be asked by the company for that role, if available.
- For behavioral and communication, use scenarios and values relevant to the company's culture and the target role.
- If public information is not available, use best practices for that company and/or role.

Sections:
1. Aptitude
   - Logical Reasoning (5 MCQs)
   - Critical Reasoning (5 MCQs)
   - Quantitative Aptitude (5 MCQs)
   - Data Interpretation (5 MCQs)
2. CS Fundamentals
   - DSA (2 questions as described above)
   - Operating Systems (2 open-ended)
   - Databases (2 open-ended)
   - Networking (2 open-ended)
   - OOP/Software Engineering (2 open-ended)
3. Behavioral & Communication
   - Behavioral (2 open-ended)
   - Situational (2 open-ended)
   - Communication/Presentation (2 open-ended)

Return the response in this JSON format only, no additional text:
{
  "Aptitude": {
    "Logical Reasoning": [ {question, options, correctAnswer, explanation}, ... ],
    "Critical Reasoning": [ ... ],
    "Quantitative Aptitude": [ ... ],
    "Data Interpretation": [ ... ]
  },
  "CS Fundamentals": {
    "DSA": [ {question, questionType, codeSnippet (optional), explanation}, ... ],
    "Operating Systems": [ {question, explanation}, ... ],
    "Databases": [ {question, explanation}, ... ],
    "Networking": [ {question, explanation}, ... ],
    "OOP/Software Engineering": [ {question, explanation}, ... ]
  },
  "Behavioral & Communication": {
    "Behavioral": [ {question, explanation}, ... ],
    "Situational": [ {question, explanation}, ... ],
    "Communication/Presentation": [ {question, explanation}, ... ]
  }
}
- For DSA, the first question must be a LeetCode-style algorithm problem (no code snippet, 'questionType': 'leetcode-algorithm'), the second must be code snippet-based (with codeSnippet and 'questionType' as described).
- For MCQs, include 4 options, correct answer, and explanation.
- For open-ended, provide question and explanation.
- Do not include any text or markdown outside the JSON.
`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, '').trim();
    const quiz = JSON.parse(cleanedText);
    return NextResponse.json({ quiz });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 