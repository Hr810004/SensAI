import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) {
    return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  }
  try {
    // Use unofficial API: https://leetcode-api-faisalshohag.vercel.app/
    const res = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${username}`);
    if (!res.ok) throw new Error('Failed to fetch LeetCode data');
    const data = await res.json();
    // data contains: totalSolved, totalQuestions, easySolved, mediumSolved, hardSolved, etc.
    return NextResponse.json({
      totalSolved: data.totalSolved,
      totalQuestions: data.totalQuestions,
      easySolved: data.easySolved,
      mediumSolved: data.mediumSolved,
      hardSolved: data.hardSolved,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 