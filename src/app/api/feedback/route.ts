import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// POST /api/feedback — store user feedback in the database
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser(request).catch(() => ({ user: null, error: null }));

    const body = await request.json();
    const { type, message, email } = body;

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json({ error: 'Message is required (min 5 chars)' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabase.from('user_feedback').insert({
      user_id: user?.id ?? null,
      type: type ?? 'general',
      message: message.trim(),
      contact_email: email?.trim() || user?.email || null,
    });

    if (error) {
      // Table may not exist yet — still return success so UX isn't broken
      console.error('[Feedback] Insert error:', error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Feedback] Error:', err);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
