import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/history - Fetch user's photo analysis history
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('photo_analyses')
      .select(`
        *,
        detected_objects(id)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('History fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    return NextResponse.json({ analyses: data || [] });
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
