import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/courses/[id] - Get course details with words
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { user } = await getAuthUser(request);
    const supabase = createServiceClient();

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

    const locale = request.nextUrl.searchParams.get('locale') || 'en';

    // Pagination + search params for the word list
    const wordsPage = Math.max(1, parseInt(request.nextUrl.searchParams.get('wordsPage') ?? '1'));
    const wordsLimit = Math.min(100, Math.max(10, parseInt(request.nextUrl.searchParams.get('wordsLimit') ?? '50')));
    const wordsSearch = (request.nextUrl.searchParams.get('wordsSearch') ?? '').trim().toLowerCase();
    const wordsOffset = (wordsPage - 1) * wordsLimit;

    // Get total word count (unfiltered) for progress tracking
    const { count: totalWordCount } = await supabase
      .from('course_vocabulary_items')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', id);

    // Build paginated + optionally searched word query
    let wordQuery = supabase
      .from('course_vocabulary_items')
      .select('*', { count: 'exact' })
      .eq('course_id', id)
      .order('sort_order', { ascending: true })
      .range(wordsOffset, wordsOffset + wordsLimit - 1);

    if (wordsSearch) {
      wordQuery = wordQuery.or(
        `word_zh.ilike.%${wordsSearch}%,word_pinyin.ilike.%${wordsSearch}%,word_en.ilike.%${wordsSearch}%`
      );
    }

    const { data: words, count: filteredCount } = await wordQuery;

    // Annotate each word with the user's learning state by matching the course
    // word's Chinese text against their personal deck. State drives the progress
    // ring and per-word dots in the app.
    //   new      → not in deck, or in deck but never reviewed
    //   learning → reviewed at least once, not yet mastered
    //   mastered → is_learned = true
    let annotatedWords = (words || []).map((w) => ({ ...w, state: 'new' as const }));
    let progress = { total: totalWordCount || 0, learned: 0, learning: 0, due: 0 };

    if (user) {
      const todayStr = new Date().toISOString().split('T')[0];
      // Fetch ALL progress rows for this course (not just current page) for accurate totals
      const { data: allProgress } = await supabase
        .from('user_course_word_progress')
        .select('course_vocabulary_item_id, is_learned, last_reviewed_at, next_review_date')
        .eq('user_id', user.id)
        .eq('course_id', id);

      const byItemId = new Map((allProgress ?? []).map((d) => [d.course_vocabulary_item_id, d]));

      // Compute full-course totals
      for (const d of allProgress ?? []) {
        if (d.is_learned) progress.learned += 1;
        else if (d.last_reviewed_at) progress.learning += 1;
        const isDue = !d.is_learned && (!d.next_review_date || d.next_review_date <= todayStr);
        if (isDue) progress.due += 1;
      }

      // Annotate only the current page words with per-word state
      if (words && words.length > 0 && !wordsSearch) {
        annotatedWords = words.map((w) => {
          const d = byItemId.get(w.id);
          let state: 'new' | 'learning' | 'mastered' = 'new';
          if (d) {
            if (d.is_learned) state = 'mastered';
            else if (d.last_reviewed_at) state = 'learning';
          }
          return { ...w, state };
        });
      }
    }

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
        creatorName: course.profiles?.display_name || null,
        name: (locale === 'vi' && course.name_vi) ? course.name_vi : course.name,
        description: (locale === 'vi' && course.description_vi) ? course.description_vi : course.description,
        coverImageUrl: course.cover_image_url,
        difficultyLevel: course.difficulty_level,
        isPublished: course.is_published,
        subscriberCount: course.subscriber_count,
        ratingAvg: course.rating_avg,
        ratingCount: course.rating_count,
        wordCount: totalWordCount || 0,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        isOwner: user?.id === course.creator_id,
      },
      words: annotatedWords,
      wordsTotalCount: totalWordCount || 0,
      wordsFilteredCount: filteredCount || 0,
      wordsPage,
      wordsTotalPages: Math.ceil((wordsSearch ? (filteredCount || 0) : (totalWordCount || 0)) / wordsLimit),
      progress,
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
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

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
    const { user, error: authError } = await getAuthUser(_request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

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
