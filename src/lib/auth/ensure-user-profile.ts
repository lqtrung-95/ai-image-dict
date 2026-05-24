import type { SupabaseClient, User } from '@supabase/supabase-js';

/** Create profiles + user_stats for OAuth users (DB triggers are disabled). */
export async function ensureUserProfile(supabase: SupabaseClient, user: User) {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (existingProfile) return;

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.display_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'User';

  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined) ||
    null;

  await supabase.from('profiles').insert({
    id: user.id,
    display_name: displayName,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  });

  await supabase.from('user_stats').insert({
    id: user.id,
    current_streak: 0,
    longest_streak: 0,
    total_words_learned: 0,
    total_practice_sessions: 0,
  });
}

export function safeRedirectPath(path: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/';
  return path;
}
