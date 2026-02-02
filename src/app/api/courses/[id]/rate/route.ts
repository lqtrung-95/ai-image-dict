import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/courses/[id]/rate - Rate course
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: courseId } = await params;
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const body = await request.json();
    const { rating, review } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }

    // Verify course exists and is published
    const { data: course } = await supabase
      .from('vocabulary_courses')
      .select('id, is_published')
      .eq('id', courseId)
      .single();

    if (!course || !course.is_published) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Upsert rating (update if exists, insert if not)
    const { data, error } = await supabase
      .from('course_ratings')
      .upsert({
        user_id: user.id,
        course_id: courseId,
        rating: Math.floor(rating),
        review: review?.trim() || null,
      }, { onConflict: 'user_id,course_id' })
      .select()
      .single();

    if (error) {
      console.error('Rate error:', error);
      return NextResponse.json({ error: 'Failed to rate course' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Rate error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/courses/[id]/rate - Remove rating
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: courseId } = await params;
    const { user, error: authError } = await getAuthUser(_request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from('course_ratings')
      .delete()
      .eq('course_id', courseId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete rating error:', error);
      return NextResponse.json({ error: 'Failed to delete rating' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete rating error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
