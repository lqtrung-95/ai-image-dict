import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// RevenueCat event types that grant premium access
const PREMIUM_GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE', // lifetime / one-time purchase
  'RENEWAL',
  'PRODUCT_CHANGE',
  'TRANSFER',
  'UNCANCELLATION',
]);

// RevenueCat event types that revoke premium access
const PREMIUM_REVOKE_EVENTS = new Set([
  'EXPIRATION',
  'CANCELLATION',
  'SUBSCRIBER_ALIAS',
]);

export async function POST(request: NextRequest) {
  try {
    // Verify shared secret to authenticate RevenueCat requests
    const authHeader = request.headers.get('authorization');
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('REVENUECAT_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (authHeader !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const event = body?.event;

    if (!event) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const eventType: string = event.type;
    // RevenueCat sends app_user_id as the Supabase user UUID when configured correctly
    const userId: string | undefined = event.app_user_id;
    const expiresAt: string | null = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

    if (!userId) {
      // Some events (e.g. SUBSCRIBER_ALIAS) may not carry a user id — skip silently
      return NextResponse.json({ received: true });
    }

    const supabase = createServiceClient();

    if (PREMIUM_GRANT_EVENTS.has(eventType)) {
      await supabase
        .from('profiles')
        .update({ is_premium: true, premium_expires_at: expiresAt })
        .eq('id', userId);
    } else if (PREMIUM_REVOKE_EVENTS.has(eventType)) {
      await supabase
        .from('profiles')
        .update({ is_premium: false, premium_expires_at: expiresAt })
        .eq('id', userId);
    }
    // All other event types are acknowledged but require no DB change

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('RevenueCat webhook error:', error);
    // Return 200 so RevenueCat doesn't retry on our processing errors
    return NextResponse.json({ received: true });
  }
}
