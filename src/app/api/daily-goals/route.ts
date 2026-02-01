import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth } from '@/lib/supabase/api-auth';

export const dynamic = 'force-dynamic';

export interface DailyGoal {
  id: string;
  user_id: string;
  goal_type: 'words_learned' | 'practice_minutes' | 'reviews_completed';
  target_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/daily-goals
 * Fetch user's daily goals with today's progress
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch active goals
    const { data: goals, error: goalsError } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (goalsError) {
      console.error('Goals fetch error:', goalsError);
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    // Calculate today's progress for each goal type
    const today = new Date().toISOString().split('T')[0];
    const progress: Record<string, number> = {};

    // Words learned today (vocabulary items created today)
    const { count: wordsToday } = await supabase
      .from('vocabulary_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`);

    progress.words_learned = wordsToday || 0;

    // Reviews completed today
    const { count: reviewsToday } = await supabase
      .from('word_practice_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`);

    progress.reviews_completed = reviewsToday || 0;

    // Practice minutes (estimate: ~30 seconds per review)
    progress.practice_minutes = Math.round((progress.reviews_completed * 30) / 60);

    return NextResponse.json({ goals: goals || [], progress });
  } catch (error) {
    console.error('Daily goals error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/daily-goals
 * Create or update a daily goal
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { goalType, targetValue, isActive = true } = body;

    // Validate goal type
    const validTypes = ['words_learned', 'practice_minutes', 'reviews_completed'];
    if (!validTypes.includes(goalType)) {
      return NextResponse.json({ error: 'Invalid goal type' }, { status: 400 });
    }

    // Validate target value
    if (!targetValue || targetValue < 1 || targetValue > 100) {
      return NextResponse.json({ error: 'Target value must be between 1 and 100' }, { status: 400 });
    }

    // Upsert goal (insert or update on conflict)
    const { data, error } = await supabase
      .from('daily_goals')
      .upsert(
        {
          user_id: user.id,
          goal_type: goalType,
          target_value: targetValue,
          is_active: isActive,
        },
        { onConflict: 'user_id,goal_type' }
      )
      .select()
      .single();

    if (error) {
      console.error('Goal upsert error:', error);
      return NextResponse.json({ error: 'Failed to save goal' }, { status: 500 });
    }

    return NextResponse.json({ goal: data });
  } catch (error) {
    console.error('Daily goals POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/daily-goals
 * Deactivate a daily goal
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const goalType = searchParams.get('goalType');

    if (!goalType) {
      return NextResponse.json({ error: 'goalType is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('daily_goals')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('goal_type', goalType);

    if (error) {
      console.error('Goal delete error:', error);
      return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Daily goals DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
