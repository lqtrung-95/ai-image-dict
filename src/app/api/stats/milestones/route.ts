import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const WORD_MILESTONES = [10, 50, 100, 250, 500, 1000, 2500, 5000];
const HSK_TOTAL: Record<number, number> = { 1: 150, 2: 150, 3: 300, 4: 600, 5: 1200, 6: 2500 };

// GET /api/stats/milestones - Return next 4 upcoming milestones with progress
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const [totalResult, hskResult, streakResult] = await Promise.all([
      supabase.from('vocabulary_items').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('vocabulary_items').select('hsk_level, is_learned').eq('user_id', user.id).not('hsk_level', 'is', null),
      supabase.from('user_stats').select('current_streak, longest_streak').eq('id', user.id).single(),
    ]);

    const totalWords = totalResult.count || 0;
    const streak = streakResult.data?.current_streak || 0;

    // HSK mastery counts
    const hskCounts: Record<number, { total: number; learned: number }> = {};
    (hskResult.data || []).forEach(item => {
      const l = item.hsk_level;
      if (!hskCounts[l]) hskCounts[l] = { total: 0, learned: 0 };
      hskCounts[l].total++;
      if (item.is_learned) hskCounts[l].learned++;
    });

    const milestones: { label: string; current: number; target: number; pct: number; done: boolean }[] = [];

    // Word count milestones
    for (const target of WORD_MILESTONES) {
      milestones.push({
        label: `${target} Words`,
        current: Math.min(totalWords, target),
        target,
        pct: Math.min(100, Math.round((totalWords / target) * 100)),
        done: totalWords >= target,
      });
    }

    // HSK mastery milestones
    for (const [levelStr, totals] of Object.entries(HSK_TOTAL)) {
      const level = parseInt(levelStr);
      const learned = hskCounts[level]?.learned || 0;
      const userTotal = hskCounts[level]?.total || 0;
      const target = Math.min(totals, Math.max(userTotal, 1));
      milestones.push({
        label: `HSK ${level} Mastery`,
        current: learned,
        target,
        pct: Math.min(100, Math.round((learned / target) * 100)),
        done: learned >= target,
      });
    }

    // Streak milestones
    for (const days of [7, 30, 100]) {
      milestones.push({
        label: `${days}-Day Streak`,
        current: Math.min(streak, days),
        target: days,
        pct: Math.min(100, Math.round((streak / days) * 100)),
        done: streak >= days,
      });
    }

    // Return next 4 upcoming (not done), sorted by pct desc
    const upcoming = milestones
      .filter(m => !m.done)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);

    return NextResponse.json({ milestones: upcoming });
  } catch (error) {
    console.error('Milestones error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
