import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClientWithAuth, getAuthUser } from '@/lib/supabase/api-auth';

export const dynamic = 'force-dynamic';

// GET /api/stats - Get user stats including SRS metrics
export async function GET(request: NextRequest) {
  try {
    console.log('[stats/GET] Headers:', Object.fromEntries(request.headers.entries()));

    const supabase = await createClientWithAuth(request);

    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get user stats
    let { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('id', user.id)
      .single();

    // If no stats exist, create them
    if (!stats) {
      const { data: newStats } = await supabaseAdmin
        .from('user_stats')
        .insert({ id: user.id })
        .select()
        .single();
      stats = newStats;
    }

    // Get vocabulary counts
    const { count: totalWords } = await supabaseAdmin
      .from('vocabulary_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: learnedWords } = await supabaseAdmin
      .from('vocabulary_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_learned', true);

    // Get today's date for SRS queries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Get words due today (SRS)
    const { count: dueToday } = await supabaseAdmin
      .from('vocabulary_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_learned', false)
      .lte('next_review_date', todayStr);

    // Get words mastered this week
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: masteredThisWeek } = await supabaseAdmin
      .from('vocabulary_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_learned', true)
      .gte('last_reviewed_at', sevenDaysAgo.toISOString());

    // Get average easiness factor
    const { data: efData } = await supabaseAdmin
      .from('vocabulary_items')
      .select('easiness_factor')
      .eq('user_id', user.id)
      .not('easiness_factor', 'is', null);

    const averageEaseFactor = efData && efData.length > 0
      ? efData.reduce((sum, item) => sum + (item.easiness_factor || 2.5), 0) / efData.length
      : 2.5;

    // Get HSK distribution
    const { data: hskData } = await supabaseAdmin
      .from('vocabulary_items')
      .select('hsk_level')
      .eq('user_id', user.id);

    const hskDistribution: Record<string, number> = {
      hsk1: 0,
      hsk2: 0,
      hsk3: 0,
      hsk4: 0,
      hsk5: 0,
      hsk6: 0,
      unclassified: 0,
    };

    hskData?.forEach((item) => {
      if (item.hsk_level && item.hsk_level >= 1 && item.hsk_level <= 6) {
        hskDistribution[`hsk${item.hsk_level}`]++;
      } else {
        hskDistribution.unclassified++;
      }
    });

    // Get review forecast (next 7 days)
    const reviewForecast: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const { count } = await supabaseAdmin
        .from('vocabulary_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_learned', false)
        .eq('next_review_date', dateStr);

      reviewForecast.push({ date: dateStr, count: count || 0 });
    }

    // Get words added per day (last 7 days)
    const { data: recentWords } = await supabase
      .from('vocabulary_items')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // Group by day
    const wordsPerDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      wordsPerDay[key] = 0;
    }

    recentWords?.forEach((word) => {
      const key = word.created_at.split('T')[0];
      if (wordsPerDay[key] !== undefined) {
        wordsPerDay[key]++;
      }
    });

    // Check if streak is still valid (practiced today or yesterday)
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastPractice = stats?.last_practice_date;

    let currentStreak = stats?.current_streak || 0;
    if (lastPractice && lastPractice !== todayStr && lastPractice !== yesterday) {
      currentStreak = 0; // Streak broken
    }

    return NextResponse.json({
      // Basic stats
      currentStreak,
      longestStreak: stats?.longest_streak || 0,
      totalWords: totalWords || 0,
      learnedWords: learnedWords || 0,
      totalPracticeSessions: stats?.total_practice_sessions || 0,
      lastPracticeDate: stats?.last_practice_date,
      wordsPerDay: Object.entries(wordsPerDay).map(([date, count]) => ({ date, count })),

      // SRS stats
      dueToday: dueToday || 0,
      masteredThisWeek: masteredThisWeek || 0,
      averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
      hskDistribution,
      reviewForecast,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/stats/practice - Record a practice session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);

    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { wordsPracticed, wordsKnown, durationSeconds } = await request.json();

    // Record the practice session
    await supabaseAdmin.from('practice_sessions').insert({
      user_id: user.id,
      words_practiced: wordsPracticed || 0,
      words_known: wordsKnown || 0,
      duration_seconds: durationSeconds || 0,
    });

    // Update user streak
    await supabaseAdmin.rpc('update_user_streak', { p_user_id: user.id });

    // Get updated stats
    const { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('current_streak, longest_streak')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      currentStreak: stats?.current_streak || 1,
      longestStreak: stats?.longest_streak || 1,
    });
  } catch (error) {
    console.error('Practice session error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
