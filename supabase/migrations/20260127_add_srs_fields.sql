-- Migration: Add SRS (Spaced Repetition System) fields
-- Run this on existing databases to add SRS support

-- Add SRS columns to vocabulary_items
ALTER TABLE public.vocabulary_items
  ADD COLUMN IF NOT EXISTS easiness_factor float DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS interval_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_review_date date DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS repetitions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS correct_streak integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hsk_level integer;

-- Create index for due words query (if not exists)
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_due
  ON public.vocabulary_items(user_id, next_review_date)
  WHERE is_learned = false;

-- Create word_practice_attempts table for per-word tracking
CREATE TABLE IF NOT EXISTS public.word_practice_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vocabulary_item_id uuid REFERENCES public.vocabulary_items(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES public.practice_sessions(id) ON DELETE SET NULL,
  quiz_mode varchar(20),
  rating integer,
  is_correct boolean,
  response_time_ms integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for word_practice_attempts
CREATE INDEX IF NOT EXISTS idx_word_practice_attempts_user
  ON public.word_practice_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_word_practice_attempts_vocab
  ON public.word_practice_attempts(vocabulary_item_id);
CREATE INDEX IF NOT EXISTS idx_word_practice_attempts_created
  ON public.word_practice_attempts(created_at DESC);

-- Enable RLS for word_practice_attempts
ALTER TABLE public.word_practice_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policy for word_practice_attempts (drop if exists, then create)
DROP POLICY IF EXISTS "Users can manage own word attempts" ON public.word_practice_attempts;
CREATE POLICY "Users can manage own word attempts"
  ON public.word_practice_attempts FOR ALL
  USING (auth.uid() = user_id);

-- Update existing vocabulary items to have next_review_date = created_at::date
-- so they become due immediately
UPDATE public.vocabulary_items
SET next_review_date = created_at::date
WHERE next_review_date IS NULL;
