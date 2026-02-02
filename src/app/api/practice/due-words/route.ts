import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth, getAuthUser } from '@/lib/supabase/api-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/practice/due-words
 * Fetch vocabulary items due for review based on SRS next_review_date
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);

    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      const { data: listItems, error: listError } = await supabase
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
    let query = supabase
      .from('vocabulary_items')
      .select(
        `
        *,
        detected_objects(
          analysis_id,
          photo_analyses(id, image_url, created_at)
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

    if (error) {
      console.error('Due words fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch due words' }, { status: 500 });
    }

    // Flatten photo context for frontend
    interface DetectedObject {
      analysis_id: string;
      photo_analyses: {
        id: string;
        image_url: string;
        created_at: string;
      } | null;
    }

    interface VocabularyItemRaw {
      id: string;
      detected_objects: DetectedObject | null;
      [key: string]: unknown;
    }

    const items = (data || []).map((item: VocabularyItemRaw) => {
      const photoAnalysis = item.detected_objects?.photo_analyses;
      return {
        ...item,
        photo_url: photoAnalysis?.image_url || null,
        photo_date: photoAnalysis?.created_at || null,
        analysis_id: photoAnalysis?.id || null,
      };
    });

    // Optionally fetch new words (never reviewed) if includeNew is true
    let newWords: VocabularyItemRaw[] = [];
    if (includeNew && items.length < limit) {
      const remainingLimit = limit - items.length;

      let newQuery = supabase
        .from('vocabulary_items')
        .select(
          `
          *,
          detected_objects(
            analysis_id,
            photo_analyses(id, image_url, created_at)
          )
        `
        )
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
        newWords = newData.map((item: VocabularyItemRaw) => {
          const photoAnalysis = item.detected_objects?.photo_analyses;
          return {
            ...item,
            photo_url: photoAnalysis?.image_url || null,
            photo_date: photoAnalysis?.created_at || null,
            analysis_id: photoAnalysis?.id || null,
          };
        });
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
