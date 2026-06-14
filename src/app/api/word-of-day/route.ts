import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth, getAuthUser } from '@/lib/supabase/api-auth';
import { HSK_SEED_WORDS } from '@/lib/word-of-day-hsk-words';

export const dynamic = 'force-dynamic';

// GET /api/word-of-day - Get word of the day.
// Serves a curated HSK word chosen deterministically by date, so even users
// with an empty vocabulary discover (and can learn) a new word each day.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);

    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Deterministic per-day pick from the curated list
    const seed = parseInt(today.split('-').join(''), 10);
    const word = HSK_SEED_WORDS[seed % HSK_SEED_WORDS.length];

    // Tell the client whether the user already has this word, so the card
    // can hide the "Save" action for words already in their library.
    const { count } = await supabase
      .from('vocabulary_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('word_zh', word.word_zh);

    return NextResponse.json({
      word,
      alreadySaved: (count ?? 0) > 0,
    });
  } catch (error) {
    console.error('Word of day error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/word-of-day - Save or dismiss word of the day
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);

    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'save' or 'dismiss'

    const today = new Date().toISOString().split('T')[0];

    const { data: history } = await supabase
      .from('word_of_day_history')
      .update({
        was_saved: action === 'save',
        was_dismissed: action === 'dismiss',
      })
      .eq('user_id', user.id)
      .eq('date_shown', today)
      .select()
      .single();

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('Word of day action error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
