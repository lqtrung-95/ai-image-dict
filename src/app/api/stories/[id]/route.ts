import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { sanitizeString, validateUUID, ValidationError } from '@/lib/validation';
import { generateStoryFromWords } from '@/lib/groq';

export const dynamic = 'force-dynamic';

interface StoryPhotoRow {
  id: string;
  photo_analysis_id: string;
  order_index: number;
  caption: string | null;
}

interface PhotoAnalysisRow {
  id: string;
  image_url: string;
  created_at: string;
}

interface DetectedObjectRow {
  analysis_id: string;
  id: string;
  label_en: string;
  label_zh: string;
  pinyin: string;
  confidence: number;
  category: string;
}

async function fetchStoryPhotos(supabase: ReturnType<typeof createServiceClient>, storyId: string) {
  const { data: storyPhotos, error: photosError } = await supabase
    .from('story_photos')
    .select('id, photo_analysis_id, order_index, caption')
    .eq('story_id', storyId)
    .order('order_index', { ascending: true });

  if (photosError) {
    throw photosError;
  }

  const sortedPhotos = (storyPhotos || []) as StoryPhotoRow[];
  const analysisIds = sortedPhotos.map((photo) => photo.photo_analysis_id).filter(Boolean);

  if (analysisIds.length === 0) {
    return {
      photos: [],
      allVocabulary: [] as DetectedObjectRow[],
    };
  }

  const [{ data: analyses, error: analysesError }, { data: detectedObjects, error: vocabError }] =
    await Promise.all([
      supabase
        .from('photo_analyses')
        .select('id, image_url, created_at')
        .in('id', analysisIds),
      supabase
        .from('detected_objects')
        .select('analysis_id, id, label_en, label_zh, pinyin, confidence, category')
        .in('analysis_id', analysisIds),
    ]);

  if (analysesError) {
    throw analysesError;
  }

  if (vocabError) {
    console.error('Vocabulary fetch error:', vocabError);
  }

  const analysesById = new Map(
    ((analyses || []) as PhotoAnalysisRow[]).map((analysis) => [analysis.id, analysis])
  );

  const allVocabulary = (detectedObjects || []) as DetectedObjectRow[];
  const vocabularyByAnalysis: Record<string, DetectedObjectRow[]> = {};
  allVocabulary.forEach((obj) => {
    if (!vocabularyByAnalysis[obj.analysis_id]) {
      vocabularyByAnalysis[obj.analysis_id] = [];
    }
    vocabularyByAnalysis[obj.analysis_id].push(obj);
  });

  const photos = sortedPhotos.map((storyPhoto) => {
    const analysis = analysesById.get(storyPhoto.photo_analysis_id);
    return {
      story_photo_id: storyPhoto.id,
      caption: storyPhoto.caption,
      id: analysis?.id || storyPhoto.photo_analysis_id,
      image_url: analysis?.image_url || '',
      created_at: analysis?.created_at || '',
      vocabulary: vocabularyByAnalysis[storyPhoto.photo_analysis_id] || [],
    };
  });

  return { photos, allVocabulary };
}

function getUniqueWords(allVocabulary: DetectedObjectRow[]) {
  const words: Array<{ zh: string; pinyin: string; en: string }> = [];
  const seenWords = new Set<string>();

  for (const obj of allVocabulary) {
    if (!seenWords.has(obj.label_zh)) {
      seenWords.add(obj.label_zh);
      words.push({
        zh: obj.label_zh,
        pinyin: obj.pinyin,
        en: obj.label_en,
      });
    }
  }

  return words;
}

// GET /api/stories/[id] - Get a specific story with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storyId = validateUUID(id);
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: story, error } = await supabase
      .from('photo_stories')
      .select('*')
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

    const { photos, allVocabulary } = await fetchStoryPhotos(supabase, storyId);

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
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

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
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

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
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Get story
    const { data: story, error } = await supabase
      .from('photo_stories')
      .select('*')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single();

    if (error || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const storyPhotos = await fetchStoryPhotos(supabase, storyId);
    const words = getUniqueWords(storyPhotos.allVocabulary);

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
      .select('*')
      .single();

    if (updateError) {
      console.error('Failed to save generated story:', updateError);
    }

    const storyData = updatedStory || story;
    const { photos, allVocabulary } = await fetchStoryPhotos(supabase, storyId);

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
