import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Create per-user SRS progress rows for every word in the course.
 * Course words are tracked in user_course_word_progress — they are never
 * copied into the user's personal vocabulary_items library.
 */
async function initializeCourseProgress(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  courseId: string
): Promise<number> {
  const { data: courseWords } = await supabase
    .from('course_vocabulary_items')
    .select('id')
    .eq('course_id', courseId);

  if (!courseWords || courseWords.length === 0) return 0;

  const rows = courseWords.map((w) => ({
    user_id: userId,
    course_vocabulary_item_id: w.id,
    course_id: courseId,
  }));

  // Ignore conflicts — user may have partial progress from a prior subscription
  const { error } = await supabase
    .from('user_course_word_progress')
    .upsert(rows, { onConflict: 'user_id,course_vocabulary_item_id', ignoreDuplicates: true });

  if (error) {
    console.error('Course progress init error:', error);
    return 0;
  }
  return rows.length;
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

    const { data: course } = await supabase
      .from('vocabulary_courses')
      .select('id, is_published')
      .eq('id', courseId)
      .single();

    if (!course || !course.is_published) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from('course_subscriptions')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409 });
    }

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

    const initialized = await initializeCourseProgress(supabase, user.id, courseId);

    return NextResponse.json({ ...data, enrolledWords: initialized }, { status: 201 });
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

    // Delete SRS progress rows for this course
    await supabase
      .from('user_course_word_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('course_id', courseId);

    // Clean up legacy vocabulary_items that were copied on enrollment (source='course')
    // This handles users who enrolled before the separated-progress architecture.
    const { data: courseWords } = await supabase
      .from('course_vocabulary_items')
      .select('word_zh')
      .eq('course_id', courseId);

    let removedWords = 0;
    const wordZhList = (courseWords ?? []).map((w) => w.word_zh);
    if (wordZhList.length > 0) {
      const { count } = await supabase
        .from('vocabulary_items')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
        .eq('source', 'course')
        .in('word_zh', wordZhList);
      removedWords = count ?? 0;
    }

    return NextResponse.json({ success: true, removedWords });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
