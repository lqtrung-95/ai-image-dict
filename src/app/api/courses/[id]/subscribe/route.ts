import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/courses/[id]/subscribe - Subscribe to course
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: courseId } = await params;
    const { user, error: authError } = await getAuthUser(_request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Verify course exists and is published
    const { data: course } = await supabase
      .from('vocabulary_courses')
      .select('id, is_published')
      .eq('id', courseId)
      .single();

    if (!course || !course.is_published) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('course_subscriptions')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409 });
    }

    // Create subscription
    const { data, error } = await supabase
      .from('course_subscriptions')
      .insert({
        user_id: user.id,
        course_id: courseId,
        progress_percent: 0,
        words_learned: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Subscribe error:', error);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/courses/[id]/subscribe - Unsubscribe from course
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: courseId } = await params;
    const { user, error: authError } = await getAuthUser(_request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from('course_subscriptions')
      .delete()
      .eq('course_id', courseId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Unsubscribe error:', error);
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
