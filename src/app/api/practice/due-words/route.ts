import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClientWithAuth, getAuthUser } from '@/lib/supabase/api-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/practice/due-words
 * Fetch vocabulary items due for review based on SRS next_review_date
 */
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

    const searchParams = request.nextUrl.searchParams;
    const listId = searchParams.get('list');
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeNew = searchParams.get('includeNew') !== 'false';

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // If filtering by list, query via junction table first
    let vocabularyIds: string[] = [];
    if (listId && listId !== 'all') {
      const { data: listItems, error: listError } = await supabaseAdmin
        .from('list_vocabulary_items')
        .select('vocabulary_item_id')
        .eq('list_id', listId);

      if (listError) {
        console.error('List vocabulary fetch error:', listError);
        return NextResponse.json({ error: 'Failed to fetch list items' }, { status: 500 });
      }

      vocabularyIds = (listItems || []).map((item) => item.vocabulary_item_id);

      // If list is empty, return early
      if (vocabularyIds.length === 0) {
        return NextResponse.json({
          items: [],
          dueCount: 0,
          newCount: 0,
          total: 0,
        });
      }
    }

    // Build query for due words
    // Include words where:
    // 1. next_review_date is null (new words never reviewed)
    // 2. next_review_date <= today (due for review)
    // Use !left modifier to make it a LEFT JOIN (won't filter words without photos)
    let query = supabaseAdmin
      .from('vocabulary_items')
      .select(
        `
        *,
        detected_object:vocabulary_items_detected_object_id_fkey!left(
          analysis_id,
          photo_analysis:photo_analyses!left(id, image_url, created_at)
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .eq('is_learned', false)
      .or(`next_review_date.is.null,next_review_date.lte.${todayStr}`)
      .order('next_review_date', { ascending: true })
      .limit(limit);

    // Filter by vocabulary IDs if list filter is active
    if (vocabularyIds.length > 0) {
      query = query.in('id', vocabularyIds);
    }

    const { data, error, count } = await query;

    console.log('[DueWords] Query result:', { dataLength: data?.length, count, error: error?.message, userId: user.id, todayStr, limit });

    if (error) {
      console.error('Due words fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch due words' }, { status: 500 });
    }

    // Map fields to camelCase for frontend
    const items = (data || []).map((item: any) => {
      const photoAnalysis = item.detected_object?.photo_analysis;
      return {
        id: item.id,
        userId: item.user_id,
        wordZh: item.word_zh,
        wordPinyin: item.word_pinyin,
        wordEn: item.word_en,
        exampleSentence: item.example_sentence,
        isLearned: item.is_learned,
        createdAt: item.created_at,
        easinessFactor: item.easiness_factor,
        intervalDays: item.interval_days,
        nextReviewDate: item.next_review_date,
        repetitions: item.repetitions,
        lastReviewedAt: item.last_reviewed_at,
        correctStreak: item.correct_streak,
        hskLevel: item.hsk_level,
        photoUrl: photoAnalysis?.image_url || null,
        photoDate: photoAnalysis?.created_at || null,
        analysisId: photoAnalysis?.id || item.detected_object?.analysis_id || null,
      };
    });

    // Optionally fetch new words (never reviewed) if includeNew is true
    let newWords: any[] = [];
    if (includeNew && items.length < limit) {
      const remainingLimit = limit - items.length;

      let newQuery = supabaseAdmin
        .from('vocabulary_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_learned', false)
        .is('last_reviewed_at', null)
        .gt('next_review_date', todayStr)
        .order('created_at', { ascending: false })
        .limit(remainingLimit);

      // Apply list filter to new words too
      if (vocabularyIds.length > 0) {
        newQuery = newQuery.in('id', vocabularyIds);
      }

      const { data: newData } = await newQuery;

      if (newData) {
        newWords = (newData as any[]).map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          wordZh: item.word_zh,
          wordPinyin: item.word_pinyin,
          wordEn: item.word_en,
          exampleSentence: item.example_sentence,
          isLearned: item.is_learned,
          createdAt: item.created_at,
          easinessFactor: item.easiness_factor,
          intervalDays: item.interval_days,
          nextReviewDate: item.next_review_date,
          repetitions: item.repetitions,
          lastReviewedAt: item.last_reviewed_at,
          correctStreak: item.correct_streak,
          hskLevel: item.hsk_level,
          photoUrl: null,
          photoDate: null,
          analysisId: null,
        }));
      }
    }

    return NextResponse.json({
      items: [...items, ...newWords],
      dueCount: count || 0,
      newCount: newWords.length,
      total: (count || 0) + newWords.length,
    });
  } catch (error) {
    console.error('Due words error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
