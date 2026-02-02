import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/history/[id] - Get a single analysis detail
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('photo_analyses')
      .select(`
        *,
        detected_objects(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Transform detected_objects to match mobile app expected format
    const analysis = {
      ...data,
      detected_objects: (data.detected_objects || []).map((obj: any) => ({
        id: obj.id,
        zh: obj.label_zh,
        en: obj.label_en,
        pinyin: obj.pinyin,
        confidence: obj.confidence,
        category: obj.category,
      })),
    };

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Analysis detail error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/history/[id] - Delete a photo analysis
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { user, error: authError } = await getAuthUser(request);

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
