import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
  const { company, role } = await req.json();
  if (!company || !role) {
    return NextResponse.json({ error: 'Missing company or role' }, { status: 400 });
  }

  // Define the quiz structure
  const sections = [
    {
      name: 'Aptitude',
      subsections: [
        { name: 'Logical Reasoning', count: 5 },
        { name: 'Critical Reasoning', count: 5 },
        { name: 'Quantitative Aptitude', count: 5 },
        { name: 'Data Interpretation', count: 5 },
      ],
    },
    {
      name: 'CS Fundamentals',
      subsections: [
        { name: 'DSA', count: 2 },
        { name: 'Operating Systems', count: 2 },
        { name: 'Databases', count: 2 },
        { name: 'Networking', count: 2 },
        { name: 'OOP/Software Engineering', count: 2 },
      ],
    },
    {
      name: 'Behavioral & Communication',
      subsections: [
        { name: 'Behavioral', count: 2 },
        { name: 'Situational', count: 2 },
        { name: 'Communication/Presentation', count: 2 },
      ],
    },
  ];

  // Helper to generate questions for a subsection
  async function generateQuestions(section, subsection, count) {
    let prompt = '';
    if (section === 'Aptitude') {
      prompt = `Generate ${count} ${subsection} aptitude MCQ questions (with 4 options and correct answer) for a ${role} interview at ${company}. Return JSON: [{question, options, correctAnswer, explanation}]`;
    } else if (section === 'CS Fundamentals') {
      prompt = `Generate ${count} open-ended ${subsection} technical interview questions for a ${role} interview at ${company}. Return JSON: [{question, explanation}]`;
    } else if (section === 'Behavioral & Communication') {
      prompt = `Generate ${count} open-ended ${subsection} interview questions for a ${role} interview at ${company}. Return JSON: [{question, explanation}]`;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, '').trim();
    try {
      return JSON.parse(cleanedText);
    } catch {
      return [];
    }
  }

  // Generate all questions
  const quiz = {};
  for (const section of sections) {
    quiz[section.name] = {};
    for (const sub of section.subsections) {
      quiz[section.name][sub.name] = await generateQuestions(section.name, sub.name, sub.count);
    }
  }

  return NextResponse.json({ quiz });
} 