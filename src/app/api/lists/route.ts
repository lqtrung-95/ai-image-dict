import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth } from '@/lib/supabase/api-auth';

export const dynamic = 'force-dynamic';

// GET /api/lists - Get user's vocabulary lists with word counts
export async function GET(request: NextRequest) {
  try {
    console.log('[lists] Request headers:', Object.fromEntries(request.headers.entries()));
    const supabase = await createClientWithAuth(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[lists] Auth result:', { user: !!user, error: authError?.message });

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('vocabulary_lists')
      .select(`
        *,
        list_vocabulary_items(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lists fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
    }

    // Calculate learned count for each list
    const listsWithProgress = await Promise.all(
      (data || []).map(async (list) => {
        const { count: learnedCount } = await supabase
          .from('list_vocabulary_items')
          .select('vocabulary_items!inner(is_learned)', { count: 'exact', head: true })
          .eq('list_id', list.id)
          .eq('vocabulary_items.is_learned', true);

        return {
          ...list,
          wordCount: list.list_vocabulary_items?.[0]?.count || 0,
          learnedCount: learnedCount || 0,
        };
      })
    );

    return NextResponse.json(listsWithProgress);
  } catch (error) {
    console.error('Lists error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/lists - Create new vocabulary list
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, isPublic } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'Name too long (max 100 chars)' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vocabulary_lists')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#6366f1',
        is_public: isPublic || false,
      })
      .select()
      .single();

    if (error) {
      console.error('List create error:', error);
      return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
    }

    return NextResponse.json({ ...data, wordCount: 0, learnedCount: 0 }, { status: 201 });
  } catch (error) {
    console.error('List create error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
