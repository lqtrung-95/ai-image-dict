import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase-client';

WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = 'google';

function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryPart = url.includes('?') ? url.split('?')[1]?.split('#')[0] : '';
  const hashPart = url.includes('#') ? url.split('#')[1] : '';

  for (const part of [queryPart, hashPart]) {
    if (!part) continue;
    new URLSearchParams(part).forEach((value, key) => {
      params[key] = value;
    });
  }
  return params;
}

export async function createSessionFromUrl(url: string) {
  const params = parseUrlParams(url);

  if (params.error_description || params.error) {
    throw new Error(params.error_description || params.error);
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return supabase.auth.getSession();
  }

  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return { data };
  }

  throw new Error('No auth credentials returned');
}

async function ensureUserProfile(userId: string, metadata: Record<string, unknown>) {
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).single();
  if (existing) return;

  const displayName =
    (metadata.full_name as string) ||
    (metadata.name as string) ||
    (metadata.display_name as string) ||
    'User';

  const avatarUrl = (metadata.avatar_url as string) || (metadata.picture as string) || null;

  await supabase.from('profiles').insert({
    id: userId,
    display_name: displayName,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  });

  await supabase.from('user_stats').insert({
    id: userId,
    current_streak: 0,
    longest_streak: 0,
    total_words_learned: 0,
    total_practice_sessions: 0,
  });
}

export async function signInWithOAuth(provider: OAuthProvider) {
  const redirectTo = Linking.createURL('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('OAuth URL missing');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success') {
    throw new Error('Sign in was cancelled');
  }

  const sessionResult = await createSessionFromUrl(result.url);
  const session = sessionResult.data?.session;

  if (session?.user) {
    await ensureUserProfile(session.user.id, session.user.user_metadata ?? {});
  }

  return session;
}
