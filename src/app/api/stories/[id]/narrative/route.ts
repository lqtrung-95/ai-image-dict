import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { validateUUID, ValidationError } from '@/lib/validation';
import { generateStoryNarrative } from '@/lib/story-narrative-generator';

export const dynamic = 'force-dynamic';

// POST /api/stories/[id]/narrative - Generate an AI narrative from the
// vocabulary detected in the story's photos. Returns the narrative without
// persisting it; clients may cache per session.
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

    // Verify ownership and load the story title
    const { data: story, error: storyError } = await supabase
      .from('photo_stories')
      .select('id, title')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Collect vocabulary from all photos in the story
    const { data: storyPhotos } = await supabase
      .from('story_photos')
      .select('photo_analysis_id')
      .eq('story_id', storyId);

    const analysisIds = (storyPhotos || [])
      .map((p) => p.photo_analysis_id)
      .filter(Boolean);

    if (analysisIds.length === 0) {
      return NextResponse.json({ error: 'Story has no photos' }, { status: 400 });
    }

    const { data: detectedObjects } = await supabase
      .from('detected_objects')
      .select('label_zh, label_en, pinyin')
      .in('analysis_id', analysisIds);

    // Deduplicate words by Chinese label
    const seen = new Set<string>();
    const words = (detectedObjects || [])
      .filter((obj) => {
        if (!obj.label_zh || seen.has(obj.label_zh)) return false;
        seen.add(obj.label_zh);
        return true;
      })
      .map((obj) => ({ zh: obj.label_zh, pinyin: obj.pinyin, en: obj.label_en }));

    if (words.length === 0) {
      return NextResponse.json({ error: 'No vocabulary found in story photos' }, { status: 400 });
    }

    const narrative = await generateStoryNarrative(story.title, words);

    // Persist so the client can load it next visit without regenerating
    await supabase
      .from('photo_stories')
      .update({ generated_content: narrative })
      .eq('id', storyId)
      .eq('user_id', user.id);

    return NextResponse.json({ narrative });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Narrative generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Narrative generation failed' },
      { status: 500 }
    );
  }
}
