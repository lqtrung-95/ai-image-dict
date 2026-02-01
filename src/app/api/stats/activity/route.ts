import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth } from '@/lib/supabase/api-auth';

export const dynamic = 'force-dynamic';

// GET /api/stats/activity - Activity data for heatmap
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '84'); // 12 weeks default

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get practice attempts grouped by date
    const { data: attempts } = await supabase
      .from('word_practice_attempts')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Group by date
    const activityByDate: Record<string, number> = {};
    (attempts || []).forEach((attempt) => {
      const date = attempt.created_at.split('T')[0];
      activityByDate[date] = (activityByDate[date] || 0) + 1;
    });

    // Generate all dates in range with counts
    const activity: { date: string; wordsReviewed: number }[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      activity.push({
        date: dateStr,
        wordsReviewed: activityByDate[dateStr] || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Activity stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
