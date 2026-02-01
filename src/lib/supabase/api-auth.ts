import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * Create Supabase client that supports both cookie-based auth (web) and Bearer token auth (mobile)
 */
export async function createClientWithAuth(request?: NextRequest) {
  const cookieStore = await cookies();

  // Try to get token from Authorization header (mobile app)
  const authToken = request?.headers.get('authorization')?.replace('Bearer ', '');

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
  console.log('[getAuthUser] Checking auth...');

  // For mobile requests with Bearer token, verify directly with Supabase
  // Headers are case-insensitive, check both cases
  const authHeader = request?.headers.get('authorization') || request?.headers.get('Authorization');
  console.log('[getAuthUser] Auth header:', authHeader ? 'present' : 'missing');
  console.log('[getAuthUser] All headers:', Object.fromEntries(request?.headers.entries() || []));

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    console.log('[getAuthUser] Token length:', token.length);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('[getAuthUser] Supabase URL exists:', !!supabaseUrl);
    console.log('[getAuthUser] Anon key exists:', !!anonKey);

    // Verify the token by making a request to Supabase auth
    const response = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': anonKey!,
        },
      }
    );

    console.log('[getAuthUser] Supabase auth response status:', response.status);

    if (response.ok) {
      const user = await response.json();
      console.log('[getAuthUser] User authenticated:', user.id);
      return { user, error: null };
    } else {
      const errorText = await response.text();
      console.error('[getAuthUser] Token validation failed:', response.status, errorText);
      return { user: null, error: new Error(`Invalid token: ${response.status}`) };
    }
  }

  // For web requests, use the standard cookie-based auth
  const supabase = await createClientWithAuth(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('[getAuthUser] Cookie auth result:', { user: !!user, error: error?.message });
  return { user, error };
}
