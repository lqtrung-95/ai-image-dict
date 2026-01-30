import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/user/delete - Delete user account and all data (GDPR compliance)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { confirmation } = body;

    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        { error: 'Invalid confirmation code. Please type DELETE_MY_ACCOUNT to confirm.' },
        { status: 400 }
      );
    }

    // Delete user's data in correct order (respecting foreign key constraints)
    // 1. Delete practice items first (references vocabulary_items)
    const { error: practiceItemsError } = await supabase
      .from('practice_items')
      .delete()
      .eq('user_id', user.id);

    if (practiceItemsError) {
      console.error('Error deleting practice items:', practiceItemsError);
    }

    // 2. Delete practice sessions
    const { error: sessionsError } = await supabase
      .from('practice_sessions')
      .delete()
      .eq('user_id', user.id);

    if (sessionsError) {
      console.error('Error deleting practice sessions:', sessionsError);
    }

    // 3. Delete SRS items
    const { error: srsError } = await supabase.from('srs_items').delete().eq('user_id', user.id);

    if (srsError) {
      console.error('Error deleting SRS items:', srsError);
    }

    // 4. Delete list vocabulary items (junction table)
    // First get all user's vocabulary item IDs
    const { data: vocabItems } = await supabase
      .from('vocabulary_items')
      .select('id')
      .eq('user_id', user.id);

    if (vocabItems && vocabItems.length > 0) {
      const vocabIds = vocabItems.map((v) => v.id);
      const { error: listItemsError } = await supabase
        .from('list_vocabulary_items')
        .delete()
        .in('vocabulary_item_id', vocabIds);

      if (listItemsError) {
        console.error('Error deleting list vocabulary items:', listItemsError);
      }
    }

    // 5. Delete lists
    const { error: listsError } = await supabase.from('lists').delete().eq('user_id', user.id);

    if (listsError) {
      console.error('Error deleting lists:', listsError);
    }

    // 6. Delete detected objects
    const { error: objectsError } = await supabase
      .from('detected_objects')
      .delete()
      .eq('user_id', user.id);

    if (objectsError) {
      console.error('Error deleting detected objects:', objectsError);
    }

    // 7. Delete photo analyses
    const { error: photosError } = await supabase
      .from('photo_analyses')
      .delete()
      .eq('user_id', user.id);

    if (photosError) {
      console.error('Error deleting photo analyses:', photosError);
    }

    // 8. Delete daily goals
    const { error: goalsError } = await supabase
      .from('daily_goals')
      .delete()
      .eq('user_id', user.id);

    if (goalsError) {
      console.error('Error deleting daily goals:', goalsError);
    }

    // 9. Delete vocabulary items
    const { error: vocabError } = await supabase
      .from('vocabulary_items')
      .delete()
      .eq('user_id', user.id);

    if (vocabError) {
      console.error('Error deleting vocabulary items:', vocabError);
    }

    // 10. Delete profile
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    // 11. Finally, delete the auth user
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return NextResponse.json(
        { error: 'Failed to delete account. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
