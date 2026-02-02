import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClientWithAuth, getAuthUser } from '@/lib/supabase/api-auth';

export const dynamic = 'force-dynamic';

// GET /api/stats - Get user stats including SRS metrics
export async function GET(request: NextRequest) {
  try {
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

    // Get today's date for SRS queries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get next 7 days for forecast
    const next7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      next7Days.push(date.toISOString().split('T')[0]);
    }

    // Fetch all data in parallel
    const [
      statsResult,
      totalWordsResult,
      learnedWordsResult,
      dueWordsResult,
      masteredThisWeekResult,
      efDataResult,
      hskDataResult,
      forecastResult,
      recentWordsResult,
    ] = await Promise.all([
      // User stats
      supabaseAdmin.from('user_stats').select('*').eq('id', user.id).single(),
      // Total words count
      supabaseAdmin.from('vocabulary_items').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      // Learned words count
      supabaseAdmin.from('vocabulary_items').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_learned', true),
      // Due words (null review date or review date <= today)
      supabaseAdmin.from('vocabulary_items').select('id, next_review_date').eq('user_id', user.id).eq('is_learned', false).or(`next_review_date.is.null,next_review_date.lte.${todayStr}`),
      // Mastered this week
      supabaseAdmin.from('vocabulary_items').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_learned', true).gte('last_reviewed_at', sevenDaysAgo.toISOString()),
      // Easiness factor data
      supabaseAdmin.from('vocabulary_items').select('easiness_factor').eq('user_id', user.id).not('easiness_factor', 'is', null),
      // HSK distribution
      supabaseAdmin.from('vocabulary_items').select('hsk_level').eq('user_id', user.id),
      // Review forecast - get all review dates for next 7 days in one query
      supabaseAdmin.from('vocabulary_items').select('next_review_date').eq('user_id', user.id).eq('is_learned', false).gte('next_review_date', todayStr).lte('next_review_date', next7Days[6]),
      // Recent words for activity chart
      supabaseAdmin.from('vocabulary_items').select('created_at').eq('user_id', user.id).gte('created_at', sevenDaysAgo.toISOString()).order('created_at', { ascending: true }),
    ]);

    // Handle user stats - create if not exists
    let stats = statsResult.data;
    if (!stats) {
      const { data: newStats } = await supabaseAdmin
        .from('user_stats')
        .insert({ id: user.id })
        .select()
        .single();
      stats = newStats;
    }

    // Calculate due today count
    const dueToday = dueWordsResult.data?.length || 0;
    console.log('[Stats] Due words query result:', { dueToday, dataLength: dueWordsResult.data?.length, userId: user.id, todayStr });

    // Calculate average easiness factor
    const efData = efDataResult.data || [];
    const averageEaseFactor = efData.length > 0
      ? efData.reduce((sum, item) => sum + (item.easiness_factor || 2.5), 0) / efData.length
      : 2.5;

    // Calculate HSK distribution
    const hskDistribution: Record<string, number> = { hsk1: 0, hsk2: 0, hsk3: 0, hsk4: 0, hsk5: 0, hsk6: 0, unclassified: 0 };
    hskDataResult.data?.forEach((item) => {
      if (item.hsk_level && item.hsk_level >= 1 && item.hsk_level <= 6) {
        hskDistribution[`hsk${item.hsk_level}`]++;
      } else {
        hskDistribution.unclassified++;
      }
    });

    // Calculate review forecast from data
    const reviewForecast = next7Days.map((date) => ({
      date,
      count: forecastResult.data?.filter((item) => item.next_review_date === date).length || 0,
    }));

    // Calculate words per day
    const wordsPerDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      wordsPerDay[date.toISOString().split('T')[0]] = 0;
    }
    recentWordsResult.data?.forEach((word) => {
      const key = word.created_at.split('T')[0];
      if (wordsPerDay[key] !== undefined) {
        wordsPerDay[key]++;
      }
    });

    // Check if streak is still valid
    const lastPractice = stats?.last_practice_date;
    let currentStreak = stats?.current_streak || 0;
    if (lastPractice && lastPractice !== todayStr && lastPractice !== yesterday) {
      currentStreak = 0;
    }

    return NextResponse.json({
      currentStreak,
      longestStreak: stats?.longest_streak || 0,
      totalWords: totalWordsResult.count || 0,
      learnedWords: learnedWordsResult.count || 0,
      totalPracticeSessions: stats?.total_practice_sessions || 0,
      lastPracticeDate: stats?.last_practice_date,
      wordsPerDay: Object.entries(wordsPerDay).map(([date, count]) => ({ date, count })),
      dueToday: dueToday || 0,
      masteredThisWeek: masteredThisWeekResult.count || 0,
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
