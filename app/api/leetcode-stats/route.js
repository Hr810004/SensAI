import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const topics = searchParams.get('topics');
  if (!username) {
    return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  }
  try {
    if (topics === 'true') {
      // Fetch topic/tag stats
      const res = await fetch(`https://alfa-leetcode-api.onrender.com/skillStats/${username}`);
      if (!res.ok) throw new Error('Failed to fetch LeetCode topic stats');
      const data = await res.json();
      return NextResponse.json({
        topics: data.data || [],
      });
    } else {
      // Fetch solved stats as before
      const res = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/solved`);
      if (!res.ok) throw new Error('Failed to fetch LeetCode data');
      const data = await res.json();
      return NextResponse.json({
        totalSolved: data.totalSolved,
        totalQuestions: data.totalQuestions,
        easySolved: data.easySolved,
        mediumSolved: data.mediumSolved,
        hardSolved: data.hardSolved,
      });
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 