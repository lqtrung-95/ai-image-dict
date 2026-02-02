import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth, getAuthUser } from '@/lib/supabase/api-auth';

export const dynamic = 'force-dynamic';

// GET /api/word-of-day - Get word of the day
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);

    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if we already have a word for today
    const { data: todayHistory } = await supabase
      .from('word_of_day_history')
      .select(`
        *,
        vocabulary_items(*)
      `)
      .eq('user_id', user.id)
      .eq('date_shown', today)
      .single();

    if (todayHistory) {
      const word = todayHistory.vocabulary_items || {
        id: todayHistory.id,
        word_zh: todayHistory.word_zh,
        word_pinyin: todayHistory.word_pinyin,
        word_en: todayHistory.word_en,
        example_sentence: todayHistory.example_sentence,
        hsk_level: todayHistory.hsk_level,
      };
      return NextResponse.json({
        word,
        history: todayHistory,
        isNew: false,
      });
    }

    // Get user's vocabulary count
    const { count: vocabCount } = await supabase
      .from('vocabulary_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (!vocabCount || vocabCount === 0) {
      return NextResponse.json({ word: null });
    }

    // Use date as seed to get consistent word for the day
    const seed = today.split('-').join('');
    const index = parseInt(seed) % vocabCount;

    // Get the word at that index
    const { data: words } = await supabase
      .from('vocabulary_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .range(index, index);

    if (!words || words.length === 0) {
      return NextResponse.json({ word: null });
    }

    const selectedWord = words[0];

    // Record in history (store word data directly in case vocab item is deleted later)
    const { data: history } = await supabase
      .from('word_of_day_history')
      .insert({
        user_id: user.id,
        vocabulary_item_id: selectedWord.id,
        word_zh: selectedWord.word_zh,
        word_pinyin: selectedWord.word_pinyin,
        word_en: selectedWord.word_en,
        example_sentence: selectedWord.example_sentence,
        hsk_level: selectedWord.hsk_level,
        date_shown: today,
      })
      .select()
      .single();

    return NextResponse.json({
      word: selectedWord,
      history,
      isNew: true,
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
