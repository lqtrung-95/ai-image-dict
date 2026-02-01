import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth, getAuthUser } from '@/lib/supabase/api-auth';
import { sanitizeString, validateHSKLevel, validateSearchQuery, validateUUID, ValidationError } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// GET /api/vocabulary - List user's vocabulary
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);

    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    let listId: string | null = null;
    let search: string | null = null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0); // Min 0

    // Validate and sanitize inputs
    try {
      const rawListId = searchParams.get('list');
      if (rawListId) {
        listId = validateUUID(rawListId);
      }
      const rawSearch = searchParams.get('q');
      if (rawSearch) {
        search = validateSearchQuery(rawSearch);
      }
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    // If filtering by list, query via junction table
    if (listId) {
      const { data: listItems, error: listError, count } = await supabase
        .from('list_vocabulary_items')
        .select(
          `
          vocabulary_item_id,
          vocabulary_items!inner(
            *,
            detected_objects(
              analysis_id,
              photo_analyses(id, image_url, created_at)
            )
          )
        `,
          { count: 'exact' }
        )
        .eq('list_id', listId)
        .order('added_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (listError) {
        console.error('List vocabulary fetch error:', listError);
        return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 });
      }

      // Flatten the nested structure (vocabulary_items is an array from the join)
      const items = (listItems || []).map((item: ListVocabularyItem) => {
        const vocab = item.vocabulary_items[0];
        if (!vocab) return null;
        const photoAnalysis = vocab.detected_objects?.photo_analyses;
        return {
          ...vocab,
          photo_url: photoAnalysis?.image_url || null,
          photo_date: photoAnalysis?.created_at || null,
          analysis_id: photoAnalysis?.id || null,
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      return NextResponse.json({
        items,
        total: count || 0,
        hasMore: offset + limit < (count || 0),
      });
    }

    // Join through detected_objects to photo_analyses to get the original photo
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      // Use parameterized search to prevent SQL injection
      const safeSearch = search.replace(/[%_]/g, '\\$&');
      query = query.or(
        `word_zh.ilike.%${safeSearch}%,word_pinyin.ilike.%${safeSearch}%,word_en.ilike.%${safeSearch}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Vocabulary fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 });
    }

    // Flatten the nested photo context for easier frontend consumption
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

    interface ListVocabularyItem {
      vocabulary_item_id: string;
      vocabulary_items: {
        id: string;
        detected_objects: DetectedObject | null;
        [key: string]: unknown;
      }[];
    }

    const items = (data || []).map((item: VocabularyItemRaw) => {
      const photoAnalysis = item.detected_objects?.photo_analyses;
      return {
        ...item,
        // Add flattened photo context
        photo_url: photoAnalysis?.image_url || null,
        photo_date: photoAnalysis?.created_at || null,
        analysis_id: photoAnalysis?.id || null,
      };
    });

    return NextResponse.json({
      items,
      total: count || 0,
      hasMore: offset + limit < (count || 0),
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Vocabulary error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/vocabulary - Save word to vocabulary
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);

    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate and sanitize inputs
    let wordZh: string, wordPinyin: string, wordEn: string;
    let detectedObjectId: string | null = null;
    let listId: string | null = null;
    let exampleSentence: string | null = null;
    let hskLevel: number | null = null;

    try {
      wordZh = sanitizeString(body.wordZh, 50);
      wordPinyin = sanitizeString(body.wordPinyin, 100);
      wordEn = sanitizeString(body.wordEn, 200);

      if (!wordZh || !wordPinyin || !wordEn) {
        return NextResponse.json(
          { error: 'wordZh, wordPinyin, and wordEn are required' },
          { status: 400 }
        );
      }

      if (body.detectedObjectId) {
        detectedObjectId = validateUUID(body.detectedObjectId);
      }
      if (body.listId) {
        listId = validateUUID(body.listId);
      }
      if (body.exampleSentence) {
        exampleSentence = sanitizeString(body.exampleSentence, 500);
      }
      hskLevel = validateHSKLevel(body.hskLevel);
    } catch (err) {
      if (err instanceof ValidationError) {
        console.error('[vocabulary/POST] Validation error:', err.message, 'Body:', body);
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    // Check if word already exists in user's vocabulary
    const { data: existing } = await supabase
      .from('vocabulary_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('word_zh', wordZh)
      .single();

    if (existing) {
      // If listId is provided, add word to that list via junction table
      if (listId) {
        const { error: junctionError } = await supabase
          .from('list_vocabulary_items')
          .insert({
            list_id: listId,
            vocabulary_item_id: existing.id,
          });

        // Handle duplicate entry gracefully
        if (junctionError && junctionError.code === '23505') {
          return NextResponse.json(
            { error: 'Word already in this list', existingId: existing.id },
            { status: 409 }
          );
        }

        if (junctionError) {
          console.error('List vocabulary insert error:', junctionError);
          return NextResponse.json({ error: 'Failed to add word to list' }, { status: 500 });
        }

        return NextResponse.json({ ...existing, addedToList: listId }, { status: 200 });
      }

      // No listId - just return conflict
      return NextResponse.json(
        { error: 'Word already in vocabulary', existingId: existing.id },
        { status: 409 }
      );
    }

    // Insert new vocabulary item
    const { data, error } = await supabase
      .from('vocabulary_items')
      .insert({
        user_id: user.id,
        word_zh: wordZh,
        word_pinyin: wordPinyin,
        word_en: wordEn,
        detected_object_id: detectedObjectId || null,
        example_sentence: exampleSentence || null,
        hsk_level: hskLevel && hskLevel >= 1 && hskLevel <= 6 ? hskLevel : null,
      })
      .select()
      .single();

    if (error) {
      console.error('[vocabulary/POST] Insert error:', error);
      return NextResponse.json({ error: 'Failed to save word', details: error.message }, { status: 500 });
    }

    // If listId provided, add to list via junction table
    if (listId && data) {
      const { error: junctionError } = await supabase
        .from('list_vocabulary_items')
        .insert({
          list_id: listId,
          vocabulary_item_id: data.id,
        });

      if (junctionError) {
        console.error('List vocabulary insert error:', junctionError);
        // Don't fail the whole request if just the list assignment failed
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Vocabulary error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

