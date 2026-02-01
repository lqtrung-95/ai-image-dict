import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/lists/[id]/words - Add words to list (bulk)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: listId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify list ownership
    const { data: list } = await supabase
      .from('vocabulary_lists')
      .select('user_id')
      .eq('id', listId)
      .single();

    if (!list || list.user_id !== user.id) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const { wordIds } = body;

    if (!Array.isArray(wordIds) || wordIds.length === 0) {
      return NextResponse.json({ error: 'wordIds array is required' }, { status: 400 });
    }

    // Verify all words belong to user
    const { data: userWords } = await supabase
      .from('vocabulary_items')
      .select('id')
      .eq('user_id', user.id)
      .in('id', wordIds);

    const validWordIds = (userWords || []).map((w) => w.id);

    if (validWordIds.length === 0) {
      return NextResponse.json({ error: 'No valid words found' }, { status: 400 });
    }

    // Insert word-list relationships (ignore duplicates)
    const insertData = validWordIds.map((wordId) => ({
      list_id: listId,
      vocabulary_item_id: wordId,
    }));

    const { data, error } = await supabase
      .from('list_vocabulary_items')
      .upsert(insertData, { onConflict: 'list_id,vocabulary_item_id', ignoreDuplicates: true })
      .select();

    if (error) {
      console.error('Add words to list error:', error);
      return NextResponse.json({ error: 'Failed to add words' }, { status: 500 });
    }

    return NextResponse.json({
      added: data?.length || 0,
      message: `Added ${data?.length || 0} words to list`,
    });
  } catch (error) {
    console.error('Add words error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/lists/[id]/words - Remove words from list (bulk)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: listId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify list ownership
    const { data: list } = await supabase
      .from('vocabulary_lists')
      .select('user_id')
      .eq('id', listId)
      .single();

    if (!list || list.user_id !== user.id) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const { wordIds } = body;

    if (!Array.isArray(wordIds) || wordIds.length === 0) {
      return NextResponse.json({ error: 'wordIds array is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('list_vocabulary_items')
      .delete()
      .eq('list_id', listId)
      .in('vocabulary_item_id', wordIds);

    if (error) {
      console.error('Remove words from list error:', error);
      return NextResponse.json({ error: 'Failed to remove words' }, { status: 500 });
    }

    return NextResponse.json({
      removed: wordIds.length,
      message: `Removed ${wordIds.length} words from list`,
    });
  } catch (error) {
    console.error('Remove words error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
