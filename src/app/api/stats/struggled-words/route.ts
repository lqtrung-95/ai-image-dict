import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/stats/struggled-words - Top words with lowest practice accuracy
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Get all practice attempts with vocabulary item data
    const { data: attempts } = await supabase
      .from('word_practice_attempts')
      .select('vocabulary_item_id, is_correct')
      .eq('user_id', user.id);

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({ words: [] });
    }

    // Group by vocabulary item and calculate accuracy
    const itemStats: Record<string, { correct: number; total: number }> = {};
    attempts.forEach(a => {
      if (!itemStats[a.vocabulary_item_id]) {
        itemStats[a.vocabulary_item_id] = { correct: 0, total: 0 };
      }
      itemStats[a.vocabulary_item_id].total++;
      if (a.is_correct) itemStats[a.vocabulary_item_id].correct++;
    });

    // Find items with at least 3 attempts and sort by accuracy ascending
    const struggled = Object.entries(itemStats)
      .filter(([, s]) => s.total >= 3)
      .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
      .slice(0, 5)
      .map(([id, s]) => ({ id, accuracy: Math.round((s.correct / s.total) * 100), attempts: s.total }));

    if (struggled.length === 0) {
      return NextResponse.json({ words: [] });
    }

    // Fetch vocabulary details for these items
    const { data: vocabItems } = await supabase
      .from('vocabulary_items')
      .select('id, word_zh, word_pinyin, word_en, hsk_level')
      .in('id', struggled.map(s => s.id))
      .eq('user_id', user.id);

    const vocabMap = Object.fromEntries((vocabItems || []).map(v => [v.id, v]));

    const words = struggled
      .map(s => {
        const v = vocabMap[s.id];
        if (!v) return null;
        return {
          id: s.id,
          wordZh: v.word_zh,
          wordPinyin: v.word_pinyin,
          wordEn: v.word_en,
          hskLevel: v.hsk_level,
          accuracy: s.accuracy,
          attempts: s.attempts,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ words });
  } catch (error) {
    console.error('Struggled words error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
