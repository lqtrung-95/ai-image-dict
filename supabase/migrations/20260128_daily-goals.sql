-- Migration: Add daily_goals table for tracking user learning objectives
-- Supports goal types: words_learned, practice_minutes, reviews_completed

-- Create daily_goals table
CREATE TABLE IF NOT EXISTS public.daily_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  goal_type varchar(30) NOT NULL,
  target_value integer NOT NULL DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_goal_type UNIQUE (user_id, goal_type)
);

-- Create index for user goals lookup
CREATE INDEX IF NOT EXISTS idx_daily_goals_user
  ON public.daily_goals(user_id)
  WHERE is_active = true;

-- Enable RLS for daily_goals
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policy for daily_goals
DROP POLICY IF EXISTS "Users can manage own daily goals" ON public.daily_goals;
CREATE POLICY "Users can manage own daily goals"
  ON public.daily_goals FOR ALL
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_daily_goals_updated_at ON public.daily_goals;
CREATE TRIGGER trigger_daily_goals_updated_at
  BEFORE UPDATE ON public.daily_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_goals_updated_at();
