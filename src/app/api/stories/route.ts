import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeString, validateUUID, ValidationError } from '@/lib/validation';

// GET /api/stories - List user's photo stories
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: stories, error } = await supabase
      .from('photo_stories')
      .select(`
        *,
        story_photos(
          id,
          photo_analysis_id,
          order_index,
          caption,
          photo_analyses(id, image_url, created_at)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Stories fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
    }

    // Calculate photo count for each story
    const storiesWithCount = (stories || []).map(story => ({
      ...story,
      photoCount: story.story_photos?.length || 0,
    }));

    return NextResponse.json({ stories: storiesWithCount });
  } catch (error) {
    console.error('Stories error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/stories - Create a new photo story
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
    const title = sanitizeString(body.title, 100);
    const description = body.description ? sanitizeString(body.description, 500) : null;
    const photoIds: string[] = body.photoIds || [];

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create the story
    const { data: story, error: storyError } = await supabase
      .from('photo_stories')
      .insert({
        user_id: user.id,
        title,
        description,
      })
      .select()
      .single();

    if (storyError || !story) {
      console.error('Story creation error:', storyError);
      return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
    }

    // Add photos to story
    if (photoIds.length > 0) {
      const validPhotoIds = photoIds
        .map((id: string) => {
          try {
            return validateUUID(id);
          } catch {
            return null;
          }
        })
        .filter((id): id is string => id !== null);

      if (validPhotoIds.length > 0) {
        const photoInserts = validPhotoIds.map((photoId: string, index: number) => ({
          story_id: story.id,
          photo_analysis_id: photoId,
          order_index: index,
        }));

        const { error: photosError } = await supabase
          .from('story_photos')
          .insert(photoInserts);

        if (photosError) {
          console.error('Story photos insert error:', photosError);
        }

        // Set cover image from first photo
        const { data: firstPhoto } = await supabase
          .from('photo_analyses')
          .select('image_url')
          .eq('id', validPhotoIds[0])
          .single();

        if (firstPhoto?.image_url) {
          await supabase
            .from('photo_stories')
            .update({ cover_image_url: firstPhoto.image_url })
            .eq('id', story.id);
        }
      }
    }

    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Story creation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
