import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/word-of-day - Get a random word for the day
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

    // Get today's date as seed for consistent daily word
    const today = new Date().toISOString().split('T')[0];
    const seed = today.split('-').join('');

    // Get user's vocabulary count
    const { count } = await supabase
      .from('vocabulary_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!count || count === 0) {
      return NextResponse.json({ word: null });
    }

    // Use date as seed to get consistent word for the day
    const index = parseInt(seed) % count;

    // Get the word at that index
    const { data: words } = await supabase
      .from('vocabulary_items')
      .select('id, word_zh, word_pinyin, word_en, example_sentence, is_learned')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .range(index, index);

    if (!words || words.length === 0) {
      return NextResponse.json({ word: null });
    }

    return NextResponse.json({ word: words[0] });
  } catch (error) {
    console.error('Word of day error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

