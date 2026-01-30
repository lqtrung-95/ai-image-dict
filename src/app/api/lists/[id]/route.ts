import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/lists/[id] - Get list details with words
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get list details
    const { data: list, error: listError } = await supabase
      .from('vocabulary_lists')
      .select('*')
      .eq('id', id)
      .single();

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Check access: owner or public list
    if (list.user_id !== user.id && !list.is_public) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get pagination params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get words in list with vocabulary details
    const { data: listItems, error: itemsError, count } = await supabase
      .from('list_vocabulary_items')
      .select(`
        id,
        added_at,
        vocabulary_items(*)
      `, { count: 'exact' })
      .eq('list_id', id)
      .order('added_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (itemsError) {
      console.error('List items fetch error:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch list items' }, { status: 500 });
    }

    // Flatten the response
    interface VocabItem {
      id: string;
      is_learned: boolean;
      [key: string]: unknown;
    }
    const words = (listItems || []).map((item) => {
      const vocabItem = item.vocabulary_items as unknown as VocabItem | null;
      return {
        listItemId: item.id,
        addedAt: item.added_at,
        ...vocabItem,
      };
    });

    // Count learned words
    const learnedCount = words.filter((w) => w?.is_learned).length;

    return NextResponse.json({
      list: {
        ...list,
        wordCount: count || 0,
        learnedCount,
      },
      words,
      total: count || 0,
      hasMore: offset + limit < (count || 0),
    });
  } catch (error) {
    console.error('List details error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT /api/lists/[id] - Update list details
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, isPublic } = body;

    // Verify ownership
    const { data: existing } = await supabase
      .from('vocabulary_lists')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (color !== undefined) updates.color = color;
    if (isPublic !== undefined) updates.is_public = isPublic;

    const { data, error } = await supabase
      .from('vocabulary_lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('List update error:', error);
      return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('List update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/lists/[id] - Delete list
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership before delete
    const { data: existing } = await supabase
      .from('vocabulary_lists')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 });
    }

    const { error } = await supabase
      .from('vocabulary_lists')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('List delete error:', error);
      return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('List delete error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
