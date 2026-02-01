import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * Create Supabase client that supports both cookie-based auth (web) and Bearer token auth (mobile)
 */
export async function createClientWithAuth(request?: NextRequest) {
  const cookieStore = await cookies();

  // Try to get token from Authorization header (mobile app)
  let authToken = request?.headers.get('authorization')?.replace('Bearer ', '');

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
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

  // If we have a Bearer token from mobile, set it as the session
  if (authToken) {
    await client.auth.setSession({
      access_token: authToken,
      refresh_token: '', // Mobile app handles refresh separately
    });
  }

  return client;
}
