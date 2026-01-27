import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/practice/due-words
 * Fetch vocabulary items due for review based on SRS next_review_date
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get('collection');
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeNew = searchParams.get('includeNew') !== 'false';

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Build query for due words
    let query = supabase
      .from('vocabulary_items')
      .select(
        `
        *,
        collections(name, color),
        detected_objects(
          analysis_id,
          photo_analyses(id, image_url, created_at)
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .eq('is_learned', false)
      .lte('next_review_date', todayStr)
      .order('next_review_date', { ascending: true })
      .limit(limit);

    if (collectionId && collectionId !== 'all') {
      query = query.eq('collection_id', collectionId);
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

      const { data: newData } = await supabase
        .from('vocabulary_items')
        .select(
          `
          *,
          collections(name, color),
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
