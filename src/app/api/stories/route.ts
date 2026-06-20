import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { sanitizeString, validateUUID, ValidationError } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// GET /api/stories - List user's photo stories
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: stories, error } = await supabase
      .from('photo_stories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Stories fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
    }

    const storyIds = (stories || []).map((story) => story.id);
    let photoCounts: Record<string, number> = {};

    if (storyIds.length > 0) {
      const { data: storyPhotos, error: photosError } = await supabase
        .from('story_photos')
        .select('story_id')
        .in('story_id', storyIds);

      if (photosError) {
        console.error('Story photo counts fetch error:', photosError);
      }

      photoCounts = (storyPhotos || []).reduce((counts: Record<string, number>, photo) => {
        counts[photo.story_id] = (counts[photo.story_id] || 0) + 1;
        return counts;
      }, {});
    }

    const storiesWithCount = (stories || []).map((story) => ({
      ...story,
      photoCount: photoCounts[story.id] || 0,
    }));

    return NextResponse.json({ stories: storiesWithCount });
  } catch (error) {
    console.error('Stories error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

const FREE_STORY_LIMIT = 3;

// POST /api/stories - Create a new photo story
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Check premium status and enforce story limit for free users
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    if (!profile?.is_premium) {
      const { count } = await supabase
        .from('photo_stories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((count ?? 0) >= FREE_STORY_LIMIT) {
        return NextResponse.json(
          {
            error: 'Story limit reached',
            code: 'STORY_LIMIT_EXCEEDED',
            limit: FREE_STORY_LIMIT,
          },
          { status: 403 }
        );
      }
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
