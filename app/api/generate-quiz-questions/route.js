import { NextResponse } from 'next/server';
import { generateQuizPrompt } from '@/actions/interview';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';

export async function POST(req) {
  const { company, role } = await req.json();
  if (!company || !role) {
    return NextResponse.json({ error: 'Missing company or role' }, { status: 400 });
  }

  try {
    // Get user context
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        industry: true,
        skills: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const quiz = await generateQuizPrompt({ company, role, user });
    return NextResponse.json({ quiz });
  } catch (e) {
    console.error('Quiz generation error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 