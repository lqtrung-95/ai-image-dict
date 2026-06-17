import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Insert a course's vocabulary into the user's personal deck, skipping any word
 * (by Chinese text) they already have. Returns how many new words were added.
 */
async function enrollCourseWords(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  courseId: string
): Promise<number> {
  const { data: courseWords } = await supabase
    .from('course_vocabulary_items')
    .select('word_zh, word_pinyin, word_en, example_sentence, hsk_level')
    .eq('course_id', courseId);

  if (!courseWords || courseWords.length === 0) return 0;

  const { data: existing } = await supabase
    .from('vocabulary_items')
    .select('word_zh')
    .eq('user_id', userId)
    .in('word_zh', courseWords.map((w) => w.word_zh));

  const have = new Set((existing ?? []).map((w) => w.word_zh));
  const toInsert = courseWords
    .filter((w) => !have.has(w.word_zh))
    .map((w) => ({
      user_id: userId,
      word_zh: w.word_zh,
      word_pinyin: w.word_pinyin,
      word_en: w.word_en,
      example_sentence: w.example_sentence,
      hsk_level: w.hsk_level,
      source: 'course',
    }));

  if (toInsert.length === 0) return 0;

  const { error } = await supabase.from('vocabulary_items').insert(toInsert);
  if (error) {
    console.error('Course enrollment insert error:', error);
    return 0;
  }
  return toInsert.length;
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

    // Enroll: copy the course's words into the user's personal SRS deck so they
    // become studyable. Words the user already has (matched by Chinese text) are
    // skipped so existing review progress is never overwritten or duplicated.
    const enrolled = await enrollCourseWords(supabase, user.id, courseId);

    return NextResponse.json({ ...data, enrolledWords: enrolled }, { status: 201 });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/courses/[id]/subscribe - Unsubscribe from course
// Pass ?removeWords=true to also delete the course's words from the user's library.
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: courseId } = await params;
    const { user, error: authError } = await getAuthUser(_request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const removeWords = _request.nextUrl.searchParams.get('removeWords') === 'true';
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

    let removedWords = 0;
    if (removeWords) {
      // Fetch the course's word list, then delete only words that were sourced
      // from this course (source='course') to avoid removing manually saved words.
      const { data: courseWords } = await supabase
        .from('course_vocabulary_items')
        .select('word_zh')
        .eq('course_id', courseId);

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
    }

    return NextResponse.json({ success: true, removedWords });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
