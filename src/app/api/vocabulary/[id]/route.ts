import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// DELETE /api/vocabulary/[id] - Remove word from vocabulary
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

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
    const { id } = await params;
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const body = await request.json();
    const { isLearned, listId } = body;

    const updates: Record<string, unknown> = {};
    if (typeof isLearned === 'boolean') {
      updates.is_learned = isLearned;
    }

    // Handle list assignment via junction table
    if (listId !== undefined) {
      if (listId) {
        // Add to list (ignore duplicate)
        await supabase
          .from('list_vocabulary_items')
          .insert({
            list_id: listId,
            vocabulary_item_id: id,
          })
          .select()
          .single();
      } else {
        // Remove from all lists (listId is null/empty)
        await supabase
          .from('list_vocabulary_items')
          .delete()
          .eq('vocabulary_item_id', id);
      }
    }

    if (Object.keys(updates).length === 0 && listId === undefined) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    // Only update vocabulary_items if there are actual column updates
    let result = null;
    if (Object.keys(updates).length > 0) {
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
      result = data;
    } else {
      // Just fetch the item if no column updates
      const { data, error } = await supabase
        .from('vocabulary_items')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Vocabulary fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch word' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Vocabulary error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

