-- Fix RLS policy for vocabulary_items to handle missing profiles
-- The issue is that vocabulary_items.user_id references profiles(id)
-- but the RLS policy checks auth.uid() which may not match if profile doesn't exist

-- First, ensure the profile exists for authenticated users
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile if it doesn't exist
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.user_id, 'User')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile when vocabulary item is inserted
DROP TRIGGER IF EXISTS ensure_profile_before_vocab_insert ON public.vocabulary_items;
CREATE TRIGGER ensure_profile_before_vocab_insert
  BEFORE INSERT ON public.vocabulary_items
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();

-- Alternative: Allow inserts when user_id matches auth.uid()
DROP POLICY IF EXISTS "Users can manage own vocabulary" ON public.vocabulary_items;
CREATE POLICY "Users can manage own vocabulary"
  ON public.vocabulary_items FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Also ensure existing users have profiles
INSERT INTO public.profiles (id, display_name)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', 'User')
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id
)
ON CONFLICT (id) DO NOTHING;
