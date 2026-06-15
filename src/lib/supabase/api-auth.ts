import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createServiceClient } from './server';

/**
 * Create Supabase client that supports both cookie-based auth (web) and Bearer token auth (mobile)
 */
export async function createClientWithAuth(request?: NextRequest) {
  const cookieStore = await cookies();

  // Try to get token from Authorization header (mobile app)
  const authHeader = request?.headers.get('authorization');
  const authToken = authHeader?.replace('Bearer ', '');

  // Create client with custom auth header if token exists
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // If we have a Bearer token, inject it as a cookie for the SSR client
          const allCookies = cookieStore.getAll();
          if (authToken) {
            allCookies.push({
              name: 'sb-access-token',
              value: authToken,
            } as any);
          }
          return allCookies;
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if middleware handles session refresh
          }
        },
      },
    }
  );

  return client;
}

/**
 * Get authenticated user from request
 * Supports both cookie-based (web) and Bearer token (mobile) auth
 */
export async function getAuthUser(request?: NextRequest) {
  // For mobile requests with Bearer token, verify directly with Supabase
  // Headers are case-insensitive per HTTP spec, but Next.js normalizes to lowercase
  const headers = Object.fromEntries(request?.headers.entries() || []);
  const authHeader = headers['authorization'];

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await createServiceClient().auth.getUser(token);
    if (error || !user) {
      console.error('[getAuthUser] Token validation failed:', error?.message);
      return { user: null, error: error ?? new Error('Invalid token') };
    }
    return { user, error: null };
  }

  // For web requests, use the standard cookie-based auth
  const supabase = await createClientWithAuth(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}
