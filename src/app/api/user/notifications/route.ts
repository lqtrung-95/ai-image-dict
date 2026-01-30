import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/user/notifications - Get notification preferences
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Create default preferences if not exists
      const { data: newPrefs, error: createError } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: 'Failed to get preferences' }, { status: 500 });
      }

      return NextResponse.json({ preferences: newPrefs });
    }

    return NextResponse.json({ preferences: data });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/user/notifications - Update notification preferences
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      wordOfDayEnabled,
      wordOfDayTime,
      reviewRemindersEnabled,
      streakRemindersEnabled,
    } = body;

    const updates: Record<string, unknown> = {};
    if (wordOfDayEnabled !== undefined) updates.word_of_day_enabled = wordOfDayEnabled;
    if (wordOfDayTime !== undefined) updates.word_of_day_time = wordOfDayTime;
    if (reviewRemindersEnabled !== undefined) updates.review_reminders_enabled = reviewRemindersEnabled;
    if (streakRemindersEnabled !== undefined) updates.streak_reminders_enabled = streakRemindersEnabled;

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ preferences: data });
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
