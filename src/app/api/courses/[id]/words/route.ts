import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/courses/[id]/words - Add word to course
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: courseId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify course ownership
    const { data: course } = await supabase
      .from('vocabulary_courses')
      .select('creator_id')
      .eq('id', courseId)
      .single();

    if (!course || course.creator_id !== user.id) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const { wordZh, wordPinyin, wordEn, exampleSentence, hskLevel } = body;

    if (!wordZh || !wordPinyin || !wordEn) {
      return NextResponse.json({ error: 'wordZh, wordPinyin, and wordEn are required' }, { status: 400 });
    }

    // Get current max sort_order
    const { data: lastWord } = await supabase
      .from('course_vocabulary_items')
      .select('sort_order')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (lastWord?.sort_order || 0) + 1;

    const { data, error } = await supabase
      .from('course_vocabulary_items')
      .insert({
        course_id: courseId,
        word_zh: wordZh.trim(),
        word_pinyin: wordPinyin.trim(),
        word_en: wordEn.trim(),
        example_sentence: exampleSentence?.trim() || null,
        hsk_level: hskLevel && hskLevel >= 1 && hskLevel <= 6 ? hskLevel : null,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Course word add error:', error);
      return NextResponse.json({ error: 'Failed to add word' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Course word add error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT /api/courses/[id]/words - Bulk add or reorder words
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: courseId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify course ownership
    const { data: course } = await supabase
      .from('vocabulary_courses')
      .select('creator_id')
      .eq('id', courseId)
      .single();

    if (!course || course.creator_id !== user.id) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const { words } = body;

    if (!Array.isArray(words)) {
      return NextResponse.json({ error: 'words array is required' }, { status: 400 });
    }

    // Update sort orders
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (word.id) {
        await supabase
          .from('course_vocabulary_items')
          .update({ sort_order: i })
          .eq('id', word.id)
          .eq('course_id', courseId);
      }
    }

    return NextResponse.json({ success: true, reordered: words.length });
  } catch (error) {
    console.error('Course words reorder error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/courses/[id]/words - Remove word from course
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: courseId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify course ownership
    const { data: course } = await supabase
      .from('vocabulary_courses')
      .select('creator_id')
      .eq('id', courseId)
      .single();

    if (!course || course.creator_id !== user.id) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const { wordId } = body;

    if (!wordId) {
      return NextResponse.json({ error: 'wordId is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('course_vocabulary_items')
      .delete()
      .eq('id', wordId)
      .eq('course_id', courseId);

    if (error) {
      console.error('Course word delete error:', error);
      return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Course word delete error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
