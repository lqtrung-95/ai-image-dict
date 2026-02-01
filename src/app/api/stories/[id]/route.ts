import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeString, validateUUID, ValidationError } from '@/lib/validation';
import { generateStoryFromWords } from '@/lib/groq';

export const dynamic = 'force-dynamic';

// GET /api/stories/[id] - Get a specific story with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storyId = validateUUID(id);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: story, error } = await supabase
      .from('photo_stories')
      .select(`
        *,
        story_photos(
          id,
          photo_analysis_id,
          order_index,
          caption,
          photo_analyses(
            id,
            image_url,
            created_at
          )
        )
      `)
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Story fetch error:', error);
      return NextResponse.json({ error: 'Story not found', details: error.message }, { status: 404 });
    }

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Flatten and organize the data
    const sortedPhotos = (story.story_photos || [])
      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index);

    // Get all photo_analysis_ids to fetch vocabulary
    const analysisIds = sortedPhotos
      .map((sp: { photo_analyses?: { id: string } }) => sp.photo_analyses?.id)
      .filter(Boolean);

    // Fetch detected objects (vocabulary) for all photos in parallel
    let allVocabulary: Array<{
      analysis_id: string;
      id: string;
      label_en: string;
      label_zh: string;
      pinyin: string;
      confidence: number;
      category: string;
    }> = [];

    if (analysisIds.length > 0) {
      const { data: detectedObjects, error: vocabError } = await supabase
        .from('detected_objects')
        .select('*')
        .in('analysis_id', analysisIds);

      if (vocabError) {
        console.error('Vocabulary fetch error:', vocabError);
      }

      console.log('Analysis IDs:', analysisIds);
      console.log('Detected objects:', detectedObjects);

      allVocabulary = detectedObjects || [];
    }

    // Group vocabulary by photo_analysis_id
    const vocabularyByAnalysis: Record<string, typeof allVocabulary> = {};
    allVocabulary.forEach((obj) => {
      if (!vocabularyByAnalysis[obj.analysis_id]) {
        vocabularyByAnalysis[obj.analysis_id] = [];
      }
      vocabularyByAnalysis[obj.analysis_id].push(obj);
    });

    // Build photos with vocabulary
    const photos = sortedPhotos.map((sp: {
      id: string;
      caption: string | null;
      photo_analyses?: {
        id: string;
        image_url: string;
        created_at: string;
      };
    }) => ({
      story_photo_id: sp.id,
      caption: sp.caption,
      id: sp.photo_analyses?.id || '',
      image_url: sp.photo_analyses?.image_url || '',
      created_at: sp.photo_analyses?.created_at || '',
      vocabulary: vocabularyByAnalysis[sp.photo_analyses?.id || ''] || [],
    }));

    // Calculate total unique vocabulary count
    const uniqueWords = new Set(allVocabulary.map((v) => v.label_zh));

    return NextResponse.json({
      story: {
        ...story,
        photos,
        vocabularyCount: uniqueWords.size,
        totalVocabularyItems: allVocabulary.length,
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Story fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/stories/[id] - Update a story
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storyId = validateUUID(id);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) {
      updates.title = sanitizeString(body.title, 100);
    }
    if (body.description !== undefined) {
      updates.description = body.description ? sanitizeString(body.description, 500) : null;
    }

    const { data: story, error } = await supabase
      .from('photo_stories')
      .update(updates)
      .eq('id', storyId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json({ story });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Story update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/stories/[id] - Delete a story
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storyId = validateUUID(id);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('photo_stories')
      .delete()
      .eq('id', storyId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Story delete error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/stories/[id]/generate - Generate AI story from vocabulary
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storyId = validateUUID(id);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get story with vocabulary
    const { data: story, error } = await supabase
      .from('photo_stories')
      .select(`
        *,
        story_photos(
          id,
          photo_analysis_id,
          photo_analyses(
            id,
            detected_objects(
              id,
              label_zh,
              label_en,
              pinyin
            )
          )
        )
      `)
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single();

    if (error || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Collect all unique words from all photos
    const words: Array<{ zh: string; pinyin: string; en: string }> = [];
    const seenWords = new Set<string>();

    for (const sp of story.story_photos || []) {
      for (const obj of sp.photo_analyses?.detected_objects || []) {
        if (!seenWords.has(obj.label_zh)) {
          seenWords.add(obj.label_zh);
          words.push({
            zh: obj.label_zh,
            pinyin: obj.pinyin,
            en: obj.label_en,
          });
        }
      }
    }

    if (words.length === 0) {
      return NextResponse.json({ error: 'No vocabulary found to generate story' }, { status: 400 });
    }

    if (words.length === 0) {
      return NextResponse.json({ error: 'No vocabulary found to generate story' }, { status: 400 });
    }

    // Generate story with AI
    const generatedStory = await generateStoryFromWords(words, story.title);

    // Save generated content
    const { data: updatedStory, error: updateError } = await supabase
      .from('photo_stories')
      .update({
        generated_content: generatedStory,
      })
      .eq('id', storyId)
      .eq('user_id', user.id)
      .select(`
        *,
        story_photos(
          id,
          photo_analysis_id,
          order_index,
          caption,
          photo_analyses(
            id,
            image_url,
            created_at
          )
        )
      `)
      .single();

    if (updateError) {
      console.error('Failed to save generated story:', updateError);
    }

    const storyData = updatedStory || story;

    // Reuse the same transformation logic as GET
    const sortedPhotos = (storyData.story_photos || [])
      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index);

    const analysisIds = sortedPhotos
      .map((sp: { photo_analyses?: { id: string } }) => sp.photo_analyses?.id)
      .filter(Boolean);

    let allVocabulary: Array<{
      analysis_id: string;
      id: string;
      label_en: string;
      label_zh: string;
      pinyin: string;
      confidence: number;
      category: string;
    }> = [];

    if (analysisIds.length > 0) {
      const { data: detectedObjects } = await supabase
        .from('detected_objects')
        .select('*')
        .in('analysis_id', analysisIds);
      allVocabulary = detectedObjects || [];
    }

    const vocabularyByAnalysis: Record<string, typeof allVocabulary> = {};
    allVocabulary.forEach((obj) => {
      if (!vocabularyByAnalysis[obj.analysis_id]) {
        vocabularyByAnalysis[obj.analysis_id] = [];
      }
      vocabularyByAnalysis[obj.analysis_id].push(obj);
    });

    const photos = sortedPhotos.map((sp: {
      id: string;
      caption: string | null;
      photo_analyses?: {
        id: string;
        image_url: string;
        created_at: string;
      };
    }) => ({
      story_photo_id: sp.id,
      caption: sp.caption,
      id: sp.photo_analyses?.id || '',
      image_url: sp.photo_analyses?.image_url || '',
      created_at: sp.photo_analyses?.created_at || '',
      vocabulary: vocabularyByAnalysis[sp.photo_analyses?.id || ''] || [],
    }));

    const uniqueWords = new Set(allVocabulary.map((v) => v.label_zh));

    return NextResponse.json({
      story: {
        ...storyData,
        photos,
        vocabularyCount: uniqueWords.size,
        totalVocabularyItems: allVocabulary.length,
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Story generation error:', error);
    return NextResponse.json({ error: 'Failed to generate story' }, { status: 500 });
  }
}
