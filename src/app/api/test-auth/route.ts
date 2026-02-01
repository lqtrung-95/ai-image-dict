import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const headers = Object.fromEntries(request.headers.entries());
  const authHeader = headers['authorization'];
  console.log('[test-auth] All header keys:', Object.keys(headers));

  // Try to get user if token exists
  let userInfo = null;
  let error = null;

  if (authHeader) {
    try {
      const { user, error: authError } = await getAuthUser(request);
      userInfo = user ? { id: user.id, email: user.email } : null;
      error = authError?.message;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    }
  }

  return NextResponse.json({
    hasAuthHeader: !!authHeader,
    authHeaderPrefix: authHeader ? authHeader.substring(0, 20) + '...' : null,
    allHeaders: Object.keys(headers),
    user: userInfo,
    error,
    timestamp: new Date().toISOString(),
  });
}
