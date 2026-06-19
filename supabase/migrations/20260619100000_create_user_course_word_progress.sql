-- Per-user SRS progress for course vocabulary, fully separate from the personal library.
-- This replaces the old pattern of copying course words into vocabulary_items on enrollment.
CREATE TABLE IF NOT EXISTS public.user_course_word_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_vocabulary_item_id uuid REFERENCES public.course_vocabulary_items(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.vocabulary_courses(id) ON DELETE CASCADE NOT NULL,
  easiness_factor float DEFAULT 2.5 NOT NULL,
  interval_days integer DEFAULT 0 NOT NULL,
  next_review_date date,
  repetitions integer DEFAULT 0 NOT NULL,
  correct_streak integer DEFAULT 0 NOT NULL,
  last_reviewed_at timestamptz,
  is_learned boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, course_vocabulary_item_id)
);

CREATE INDEX IF NOT EXISTS idx_ucwp_user_course
  ON public.user_course_word_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_ucwp_review_due
  ON public.user_course_word_progress(user_id, course_id, next_review_date);

ALTER TABLE public.user_course_word_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own course word progress"
  ON public.user_course_word_progress FOR ALL
  USING (auth.uid() = user_id);
