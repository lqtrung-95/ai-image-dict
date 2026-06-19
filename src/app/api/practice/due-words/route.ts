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
    const courseId = searchParams.get('course');
    const locale = searchParams.get('locale') || 'en';
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeNew = searchParams.get('includeNew') !== 'false';
    // Exclude legacy course-sourced words from the main personal practice deck
    const excludeCourseWords = !listId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Course practice: query user_course_word_progress joined with course_vocabulary_items.
    // Course words are fully separate from the personal library (vocabulary_items).
    if (courseId) {
      const { data: progressRows, error: progressError } = await supabaseAdmin
        .from('user_course_word_progress')
        .select(`
          id, easiness_factor, interval_days, next_review_date, repetitions,
          correct_streak, last_reviewed_at, is_learned,
          course_vocabulary_items!inner(
            id, word_zh, word_pinyin, word_en, word_vi,
            example_sentence, hsk_level
          )
        `)
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('is_learned', false)
        .or(`next_review_date.is.null,next_review_date.lte.${todayStr}`)
        .order('next_review_date', { ascending: true })
        .limit(limit);

      if (progressError) {
        console.error('Course due-words error:', progressError);
        return NextResponse.json({ error: 'Failed to fetch course words' }, { status: 500 });
      }

      const rows = (progressRows ?? []) as any[];

      const sorted = rows.sort((a: any, b: any) => {
        const aEf = a.easiness_factor ?? 2.5;
        const bEf = b.easiness_factor ?? 2.5;
        if (a.next_review_date && b.next_review_date && a.next_review_date === b.next_review_date) {
          return aEf - bEf;
        }
        return 0;
      });

      const items = sorted.map((row: any) => {
        const cvi = row.course_vocabulary_items;
        const displayMeaning = (locale === 'vi' && cvi.word_vi) ? cvi.word_vi : cvi.word_en;
        return {
          id: row.id, // user_course_word_progress.id — used by word-attempts as courseProgressId
          courseProgressId: row.id,
          wordZh: cvi.word_zh,
          wordPinyin: cvi.word_pinyin,
          wordEn: displayMeaning,
          exampleSentence: cvi.example_sentence,
          hskLevel: cvi.hsk_level,
          easinessFactor: row.easiness_factor,
          intervalDays: row.interval_days,
          nextReviewDate: row.next_review_date,
          repetitions: row.repetitions,
          correctStreak: row.correct_streak,
          lastReviewedAt: row.last_reviewed_at,
          photoUrl: null,
        };
      });

      return NextResponse.json({
        items,
        dueCount: items.length,
        newCount: 0,
        total: items.length,
      });
    }

    // Personal library practice (non-course): query vocabulary_items
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

      if (vocabularyIds.length === 0) {
        return NextResponse.json({ items: [], dueCount: 0, newCount: 0, total: 0 });
      }
    }

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

    if (vocabularyIds.length > 0) {
      query = query.in('id', vocabularyIds);
    }

    // Exclude course-sourced words (legacy entries from old enrollment flow)
    if (excludeCourseWords) {
      query = query.neq('source', 'course');
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Due words fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch due words' }, { status: 500 });
    }

    const sortedData = (data || []).sort((a: any, b: any) => {
      const aEf = a.easiness_factor ?? 2.5;
      const bEf = b.easiness_factor ?? 2.5;
      if (a.next_review_date && b.next_review_date && a.next_review_date === b.next_review_date) {
        return aEf - bEf;
      }
      return 0;
    });

    const items = sortedData.map((item: any) => {
      const photoAnalysis = item.detected_object?.photo_analysis;
      return {
        id: item.id,
        userId: item.user_id,
        wordZh: item.word_zh,
        wordPinyin: item.word_pinyin,
        wordEn: item.word_en,
        exampleSentence: item.example_sentence,
        exampleSentencePinyin: item.example_sentence_pinyin,
        exampleSentenceEn: item.example_sentence_en,
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

      if (vocabularyIds.length > 0) {
        newQuery = newQuery.in('id', vocabularyIds);
      }
      if (excludeCourseWords) {
        newQuery = newQuery.neq('source', 'course');
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
          exampleSentencePinyin: item.example_sentence_pinyin,
          exampleSentenceEn: item.example_sentence_en,
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
