import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/vocabulary - List user's vocabulary
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
    const search = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Join through detected_objects to photo_analyses to get the original photo
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (collectionId) {
      query = query.eq('collection_id', collectionId);
    }

    if (search) {
      query = query.or(
        `word_zh.ilike.%${search}%,word_pinyin.ilike.%${search}%,word_en.ilike.%${search}%`
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
    console.error('Vocabulary error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/vocabulary - Save word to vocabulary
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
    const { wordZh, wordPinyin, wordEn, detectedObjectId, collectionId, exampleSentence } = body;

    if (!wordZh || !wordPinyin || !wordEn) {
      return NextResponse.json(
        { error: 'wordZh, wordPinyin, and wordEn are required' },
        { status: 400 }
      );
    }

    // Check if word already exists in user's vocabulary
    const { data: existing } = await supabase
      .from('vocabulary_items')
      .select('id, collection_id')
      .eq('user_id', user.id)
      .eq('word_zh', wordZh)
      .single();

    if (existing) {
      // If collectionId is provided, update the existing word's collection
      if (collectionId) {
        const { data: updated, error: updateError } = await supabase
          .from('vocabulary_items')
          .update({ collection_id: collectionId })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          console.error('Vocabulary update error:', updateError);
          return NextResponse.json({ error: 'Failed to update word' }, { status: 500 });
        }

        return NextResponse.json(updated, { status: 200 });
      }

      // No collectionId - just return conflict
      return NextResponse.json(
        { error: 'Word already in vocabulary', existingId: existing.id },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('vocabulary_items')
      .insert({
        user_id: user.id,
        word_zh: wordZh,
        word_pinyin: wordPinyin,
        word_en: wordEn,
        detected_object_id: detectedObjectId || null,
        collection_id: collectionId || null,
        example_sentence: exampleSentence || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Vocabulary insert error:', error);
      return NextResponse.json({ error: 'Failed to save word' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Vocabulary error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

