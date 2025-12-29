import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/vocabulary/[id] - Remove word from vocabulary
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('vocabulary_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Vocabulary delete error:', error);
      return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vocabulary error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/vocabulary/[id] - Update vocabulary item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isLearned, collectionId } = body;

    const updates: Record<string, unknown> = {};
    if (typeof isLearned === 'boolean') {
      updates.is_learned = isLearned;
    }
    if (collectionId !== undefined) {
      updates.collection_id = collectionId || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vocabulary_items')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Vocabulary update error:', error);
      return NextResponse.json({ error: 'Failed to update word' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Vocabulary error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

