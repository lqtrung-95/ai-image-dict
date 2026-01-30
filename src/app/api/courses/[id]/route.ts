import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/courses/[id] - Get course details with words
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('vocabulary_courses')
      .select(`
        *,
        profiles(id, display_name)
      `)
      .eq('id', id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check access: published or creator
    if (!course.is_published && (!user || course.creator_id !== user.id)) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get course words
    const { data: words } = await supabase
      .from('course_vocabulary_items')
      .select('*')
      .eq('course_id', id)
      .order('sort_order', { ascending: true });

    // Check if user is subscribed
    let subscription = null;
    if (user) {
      const { data: sub } = await supabase
        .from('course_subscriptions')
        .select('*')
        .eq('course_id', id)
        .eq('user_id', user.id)
        .single();
      subscription = sub;
    }

    // Get user's rating if exists
    let userRating = null;
    if (user) {
      const { data: rating } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', id)
        .eq('user_id', user.id)
        .single();
      userRating = rating;
    }

    return NextResponse.json({
      course: {
        id: course.id,
        creatorId: course.creator_id,
        creatorName: course.profiles?.display_name || 'Anonymous',
        name: course.name,
        description: course.description,
        coverImageUrl: course.cover_image_url,
        difficultyLevel: course.difficulty_level,
        isPublished: course.is_published,
        subscriberCount: course.subscriber_count,
        ratingAvg: course.rating_avg,
        ratingCount: course.rating_count,
        wordCount: words?.length || 0,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        isOwner: user?.id === course.creator_id,
      },
      words: words || [],
      subscription,
      userRating,
    });
  } catch (error) {
    console.error('Course details error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT /api/courses/[id] - Update course (creator only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('vocabulary_courses')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!existing || existing.creator_id !== user.id) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, difficultyLevel, coverImageUrl, isPublished } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (difficultyLevel !== undefined) {
      const level = parseInt(difficultyLevel);
      if (level >= 1 && level <= 6) updates.difficulty_level = level;
    }
    if (coverImageUrl !== undefined) updates.cover_image_url = coverImageUrl || null;
    if (isPublished !== undefined) updates.is_published = isPublished;

    const { data, error } = await supabase
      .from('vocabulary_courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Course update error:', error);
      return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Course update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/courses/[id] - Delete course (creator only)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('vocabulary_courses')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!existing || existing.creator_id !== user.id) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 });
    }

    const { error } = await supabase
      .from('vocabulary_courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Course delete error:', error);
      return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Course delete error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
