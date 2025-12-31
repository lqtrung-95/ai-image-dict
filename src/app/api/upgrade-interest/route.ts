import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/upgrade-interest - Record user's interest in premium
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

    const { email, reason } = await request.json();

    // Record the interest
    const { error: insertError } = await supabase.from('upgrade_interest').insert({
      user_id: user.id,
      email: email || null,
      reason: reason || null,
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to record interest' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upgrade interest error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET /api/upgrade-interest - Check if user already expressed interest
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('upgrade_interest')
      .select('id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    return NextResponse.json({
      hasExpressedInterest: data && data.length > 0,
      lastExpressed: data?.[0]?.created_at || null,
    });
  } catch (error) {
    console.error('Upgrade interest check error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

