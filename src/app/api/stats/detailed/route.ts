import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/stats/detailed - Comprehensive vocabulary statistics
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all vocabulary items with SRS data
    const { data: vocabItems } = await supabase
      .from('vocabulary_items')
      .select('id, is_learned, hsk_level, repetitions, interval_days, next_review_date')
      .eq('user_id', user.id);

    const items = vocabItems || [];
    const today = new Date().toISOString().split('T')[0];

    // Calculate word states
    const wordsByState = {
      new: 0,
      learning: 0,
      reviewing: 0,
      mastered: 0,
    };

    let dueToday = 0;
    let dueThisWeek = 0;
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekDate = weekFromNow.toISOString().split('T')[0];

    items.forEach((item) => {
      const reps = item.repetitions || 0;
      const interval = item.interval_days || 0;

      if (reps === 0) {
        wordsByState.new++;
      } else if (reps <= 2 && interval < 7) {
        wordsByState.learning++;
      } else if (interval > 30 || item.is_learned) {
        wordsByState.mastered++;
      } else {
        wordsByState.reviewing++;
      }

      // Due counts
      if (item.next_review_date) {
        if (item.next_review_date <= today) {
          dueToday++;
        }
        if (item.next_review_date <= weekDate) {
          dueThisWeek++;
        }
      }
    });

    // HSK distribution
    const hskCounts: Record<number, number> = {};
    items.forEach((item) => {
      if (item.hsk_level) {
        hskCounts[item.hsk_level] = (hskCounts[item.hsk_level] || 0) + 1;
      }
    });
    const hskDistribution = Object.entries(hskCounts)
      .map(([level, count]) => ({ level: parseInt(level), count }))
      .sort((a, b) => a.level - b.level);

    // Get streak from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_days, longest_streak')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      totalWords: items.length,
      wordsByState,
      hskDistribution,
      dueToday,
      dueThisWeek,
      streakDays: profile?.streak_days || 0,
      longestStreak: profile?.longest_streak || 0,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
