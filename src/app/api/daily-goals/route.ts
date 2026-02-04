import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

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
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

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
  console.log('[POST /api/daily-goals] Received request');
  try {
    const { user, error: authError } = await getAuthUser(request);
    console.log('[POST /api/daily-goals] Auth result:', { user: !!user, error: authError?.message });

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    console.log('[POST /api/daily-goals] Service client created');

    const body = await request.json();
    console.log('[POST /api/daily-goals] Request body:', body);
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

    console.log('[POST /api/daily-goals] Checking for existing goal:', { userId: user.id, goalType });
    // First try to update existing goal
    const { data: existingGoal, error: findError } = await supabase
      .from('daily_goals')
      .select('id')
      .eq('user_id', user.id)
      .eq('goal_type', goalType)
      .maybeSingle();

    console.log('[POST /api/daily-goals] Existing goal check:', { existingGoal: !!existingGoal, findError: findError?.message });

    if (findError) {
      console.error('[POST /api/daily-goals] Find error:', findError);
      return NextResponse.json({ error: 'Database error', details: findError.message }, { status: 500 });
    }

    let data;
    let error;
    if (existingGoal) {
      console.log('[POST /api/daily-goals] Updating existing goal:', existingGoal.id);
      const updateResult = await supabase
        .from('daily_goals')
        .update({
          target_value: targetValue,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGoal.id)
        .select();
      data = updateResult.data?.[0];
      error = updateResult.error;
    } else {
      console.log('[POST /api/daily-goals] Inserting new goal');
      const insertResult = await supabase
        .from('daily_goals')
        .insert({
          user_id: user.id,
          goal_type: goalType,
          target_value: targetValue,
          is_active: isActive,
        })
        .select();
      data = insertResult.data?.[0];
      error = insertResult.error;
    }
    console.log('[POST /api/daily-goals] Save result:', { success: !!data, error: error?.message, errorDetails: error });

    if (error) {
      console.error('[POST /api/daily-goals] Goal save error:', error);
      return NextResponse.json({ error: 'Failed to save goal', details: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ goal: data });
  } catch (error: any) {
    console.error('[POST /api/daily-goals] Caught error:', error);
    return NextResponse.json({ error: 'Server error', details: error?.message || String(error) }, { status: 500 });
  }
}

/**
 * DELETE /api/daily-goals
 * Deactivate a daily goal
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

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
