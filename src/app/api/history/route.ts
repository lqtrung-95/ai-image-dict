import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/history - Fetch user's photo analysis history
export async function GET(request: NextRequest) {
  try {
    console.log('[API History] GET request received');
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      console.log('[API History] Unauthorized:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[API History] User:', user.id);
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
      console.error('[API History] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    // Transform detected_objects to match mobile app expected format
    const analyses = (data || []).map((analysis: any) => ({
      ...analysis,
      detected_objects: (analysis.detected_objects || []).map((obj: any) => ({
        id: obj.id,
        zh: obj.label_zh,
        en: obj.label_en,
        pinyin: obj.pinyin,
        confidence: obj.confidence,
        category: obj.category,
      })),
    }));

    console.log('[API History] Found', analyses.length, 'analyses');
    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('[API History] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
