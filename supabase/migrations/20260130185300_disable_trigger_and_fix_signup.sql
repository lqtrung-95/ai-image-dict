-- Disable the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Also disable other triggers that might cause issues
DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_stats ON auth.users;

-- Sync all existing auth.users to profiles
INSERT INTO public.profiles (id, display_name, created_at)
SELECT id, email, created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Sync user_stats for profiles that don't have them
INSERT INTO public.user_stats (id, current_streak, longest_streak)
SELECT id, 0, 0
FROM public.profiles
WHERE id NOT IN (SELECT id FROM public.user_stats)
ON CONFLICT (id) DO NOTHING;
