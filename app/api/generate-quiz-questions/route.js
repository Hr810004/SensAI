import { NextResponse } from 'next/server';
import { generateQuizPrompt } from '@/actions/interview';

export async function POST(req) {
  const { company, role } = await req.json();
  if (!company || !role) {
    return NextResponse.json({ error: 'Missing company or role' }, { status: 400 });
  }

  try {
    const quiz = await generateQuizPrompt({ company, role });
    return NextResponse.json({ quiz });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 