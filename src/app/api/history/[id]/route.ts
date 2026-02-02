import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/history/[id] - Delete a photo analysis
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { user, error: authError } = await getAuthUser(_request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Verify ownership before delete
    const { data: existing } = await supabase
      .from('photo_analyses')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 });
    }

    const { error } = await supabase
      .from('photo_analyses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('History delete error:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History delete error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
