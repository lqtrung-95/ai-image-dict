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
  const supabase = await createClientWithAuth(request);

  // For mobile requests with Bearer token, we need to verify the token differently
  const authHeader = request?.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');

    // Verify the token by making a request to Supabase auth
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      }
    );

    if (response.ok) {
      const user = await response.json();
      return { user, error: null };
    } else {
      return { user: null, error: new Error('Invalid token') };
    }
  }

  // For web requests, use the standard cookie-based auth
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}
