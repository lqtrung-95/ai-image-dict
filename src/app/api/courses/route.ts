import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/courses - Browse public courses
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthUser(request);
    const supabase = createServiceClient();

    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'en';
    const difficulty = searchParams.get('difficulty');
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('vocabulary_courses')
      .select(`
        *,
        profiles(id, display_name),
        course_vocabulary_items(count)
      `, { count: 'exact' })
      .eq('is_published', true);

    // Filter by difficulty
    if (difficulty && parseInt(difficulty) >= 1 && parseInt(difficulty) <= 6) {
      query = query.eq('difficulty_level', parseInt(difficulty));
    }

    // Search by name/description
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sort
    if (sort === 'rating') {
      query = query.order('rating_avg', { ascending: false, nullsFirst: false });
    } else if (sort === 'popular') {
      query = query.order('subscriber_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Courses fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }

    // Get user's subscriptions if logged in
    let userSubscriptions: Set<string> = new Set();
    if (user) {
      const { data: subs } = await supabase
        .from('course_subscriptions')
        .select('course_id')
        .eq('user_id', user.id);
      userSubscriptions = new Set((subs || []).map(s => s.course_id));
    }

    // Compute learning progress for the subscribed courses on this page so the
    // list cards can show "learned / due" without opening each course. Done in
    // two bulk queries (course words + matching deck rows) rather than per-course.
    const progressByCourse = new Map<string, { total: number; learned: number; due: number }>();
    const subscribedOnPage = (data || []).filter((c) => userSubscriptions.has(c.id)).map((c) => c.id);
    if (user && subscribedOnPage.length > 0) {
      const { data: courseWords } = await supabase
        .from('course_vocabulary_items')
        .select('course_id, word_zh')
        .in('course_id', subscribedOnPage);

      const allZh = [...new Set((courseWords ?? []).map((w) => w.word_zh))];
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: deck } = allZh.length
        ? await supabase
            .from('vocabulary_items')
            .select('word_zh, is_learned, next_review_date')
            .eq('user_id', user.id)
            .in('word_zh', allZh)
        : { data: [] as { word_zh: string; is_learned: boolean; next_review_date: string | null }[] };

      const byZh = new Map((deck ?? []).map((d) => [d.word_zh, d]));
      for (const cw of courseWords ?? []) {
        let p = progressByCourse.get(cw.course_id);
        if (!p) { p = { total: 0, learned: 0, due: 0 }; progressByCourse.set(cw.course_id, p); }
        p.total += 1;
        const d = byZh.get(cw.word_zh);
        if (d) {
          if (d.is_learned) p.learned += 1;
          else if (!d.next_review_date || d.next_review_date <= todayStr) p.due += 1;
        }
      }
    }

    // Transform data — serve locale-appropriate name/description
    const courses = (data || []).map(course => ({
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
      wordCount: course.course_vocabulary_items?.[0]?.count || 0,
      createdAt: course.created_at,
      isSubscribed: userSubscriptions.has(course.id),
      progress: progressByCourse.get(course.id) || null,
    }));

    return NextResponse.json({
      courses,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Courses error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/courses - Create new course
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const body = await request.json();
    const { name, description, difficultyLevel, coverImageUrl } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (name.length > 150) {
      return NextResponse.json({ error: 'Name too long (max 150 chars)' }, { status: 400 });
    }

    const level = parseInt(difficultyLevel) || 1;
    if (level < 1 || level > 6) {
      return NextResponse.json({ error: 'Difficulty level must be 1-6' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vocabulary_courses')
      .insert({
        creator_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        difficulty_level: level,
        cover_image_url: coverImageUrl || null,
        is_published: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Course create error:', error);
      return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Course create error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
