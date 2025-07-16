import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) {
    return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  }
  try {
    // Fetch solved stats from leetcode-stats-api.herokuapp.com
    const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
    if (!res.ok) throw new Error('Failed to fetch LeetCode data');
    const data = await res.json();
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