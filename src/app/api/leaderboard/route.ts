import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/supabase/api-auth';

export const dynamic = 'force-dynamic';

// XP weights: correct attempt = 2 pts, incorrect = 1 pt (rewards effort too)
const XP_CORRECT = 2;
const XP_INCORRECT = 1;
const BOARD_SIZE = 50;

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/leaderboard?tab=weekly|alltime
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthUser(request).catch(() => ({ user: null }));
    const tab = request.nextUrl.searchParams.get('tab') ?? 'weekly';
    const supabase = serviceClient();

    if (tab === 'weekly') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
      weekStart.setHours(0, 0, 0, 0);

      // Aggregate XP from word_practice_attempts this week
      const { data: attempts, error } = await supabase
        .from('word_practice_attempts')
        .select('user_id, is_correct')
        .gte('created_at', weekStart.toISOString());

      if (error) throw error;

      // Compute XP per user
      const xpMap = new Map<string, number>();
      for (const row of attempts ?? []) {
        const pts = row.is_correct ? XP_CORRECT : XP_INCORRECT;
        xpMap.set(row.user_id, (xpMap.get(row.user_id) ?? 0) + pts);
      }

      const topUserIds = [...xpMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, BOARD_SIZE)
        .map(([id]) => id);

      // Include caller even if outside top 50
      const fetchIds = user && !topUserIds.includes(user.id)
        ? [...topUserIds, user.id]
        : topUserIds;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', fetchIds.length > 0 ? fetchIds : ['__none__']);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

      const board = topUserIds.map((uid, i) => ({
        rank: i + 1,
        userId: uid,
        displayName: (profileMap.get(uid) as any)?.display_name ?? 'Learner',
        avatarUrl: (profileMap.get(uid) as any)?.avatar_url ?? null,
        xp: xpMap.get(uid) ?? 0,
        isMe: uid === user?.id,
      }));

      // Caller's own entry (may be outside top 50)
      let myEntry = null;
      if (user) {
        const myXp = xpMap.get(user.id) ?? 0;
        const myRank = [...xpMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .findIndex(([id]) => id === user.id) + 1;
        myEntry = {
          rank: myRank || null,
          userId: user.id,
          displayName: (profileMap.get(user.id) as any)?.display_name ?? 'You',
          avatarUrl: (profileMap.get(user.id) as any)?.avatar_url ?? null,
          xp: myXp,
          isMe: true,
        };
      }

      return NextResponse.json({ board, myEntry, tab: 'weekly', weekStart: weekStart.toISOString() });
    }

    // All-time: rank by total XP from all practice attempts
    const { data: attempts, error: itemsErr } = await supabase
      .from('word_practice_attempts')
      .select('user_id, is_correct');

    if (itemsErr) throw itemsErr;

    const countMap = new Map<string, number>();
    for (const row of attempts ?? []) {
      const pts = row.is_correct ? XP_CORRECT : XP_INCORRECT;
      countMap.set(row.user_id, (countMap.get(row.user_id) ?? 0) + pts);
    }

    const topUserIds = [...countMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, BOARD_SIZE)
      .map(([id]) => id);

    const fetchIds = user && !topUserIds.includes(user.id)
      ? [...topUserIds, user.id]
      : topUserIds;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', fetchIds.length > 0 ? fetchIds : ['__none__']);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    const board = topUserIds.map((uid, i) => ({
      rank: i + 1,
      userId: uid,
      displayName: (profileMap.get(uid) as any)?.display_name ?? 'Learner',
      avatarUrl: (profileMap.get(uid) as any)?.avatar_url ?? null,
      xp: countMap.get(uid) ?? 0,
      isMe: uid === user?.id,
    }));

    let myEntry = null;
    if (user) {
      const myCount = countMap.get(user.id) ?? 0;
      const myRank = [...countMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .findIndex(([id]) => id === user.id) + 1;
      myEntry = {
        rank: myRank || null,
        userId: user.id,
        displayName: (profileMap.get(user.id) as any)?.display_name ?? 'You',
        avatarUrl: (profileMap.get(user.id) as any)?.avatar_url ?? null,
        xp: myCount,
        isMe: true,
      };
    }

    return NextResponse.json({ board, myEntry, tab: 'alltime' });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
