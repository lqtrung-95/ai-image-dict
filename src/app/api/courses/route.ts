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

    // Transform data
    const courses = (data || []).map(course => ({
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
      wordCount: course.course_vocabulary_items?.[0]?.count || 0,
      createdAt: course.created_at,
      isSubscribed: userSubscriptions.has(course.id),
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
