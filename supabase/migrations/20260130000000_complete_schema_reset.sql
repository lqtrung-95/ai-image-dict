-- Complete Schema Reset - Drop all tables and recreate fresh
-- Run this in Supabase SQL Editor to reset everything

-- Drop tables in correct order (foreign key dependencies)
DROP TABLE IF EXISTS public.word_practice_attempts CASCADE;
DROP TABLE IF EXISTS public.practice_sessions CASCADE;
DROP TABLE IF EXISTS public.list_vocabulary_items CASCADE;
DROP TABLE IF EXISTS public.vocabulary_items CASCADE;
DROP TABLE IF EXISTS public.detected_objects CASCADE;
DROP TABLE IF EXISTS public.photo_analyses CASCADE;
DROP TABLE IF EXISTS public.course_ratings CASCADE;
DROP TABLE IF EXISTS public.course_subscriptions CASCADE;
DROP TABLE IF EXISTS public.course_vocabulary_items CASCADE;
DROP TABLE IF EXISTS public.vocabulary_courses CASCADE;
DROP TABLE IF EXISTS public.vocabulary_imports CASCADE;
DROP TABLE IF EXISTS public.vocabulary_lists CASCADE;
DROP TABLE IF EXISTS public.daily_goals CASCADE;
DROP TABLE IF EXISTS public.daily_usage CASCADE;
DROP TABLE IF EXISTS public.upgrade_interest CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS update_course_subscriber_count() CASCADE;
DROP FUNCTION IF EXISTS update_course_rating_avg() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- 1. PROFILES (User profiles linked to auth.users)
-- =====================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 2. USER STATS (Streak tracking)
-- =====================================================
CREATE TABLE public.user_stats (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_practice_date date,
  total_words_learned integer DEFAULT 0,
  total_practice_sessions integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 3. DAILY USAGE (Rate limiting)
-- =====================================================
CREATE TABLE public.daily_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date date DEFAULT CURRENT_DATE NOT NULL,
  analyses_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, usage_date)
);

-- =====================================================
-- 4. PHOTO ANALYSES (AI analysis results)
-- =====================================================
CREATE TABLE public.photo_analyses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  scene_context jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 5. DETECTED OBJECTS (Words detected in photos)
-- =====================================================
CREATE TABLE public.detected_objects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id uuid NOT NULL REFERENCES public.photo_analyses(id) ON DELETE CASCADE,
  label_en text NOT NULL,
  label_zh text NOT NULL,
  pinyin text NOT NULL,
  confidence double precision DEFAULT 0.9,
  bounding_box jsonb,
  category text DEFAULT 'object'::text
);

-- =====================================================
-- 6. VOCABULARY LISTS (User-created lists)
-- =====================================================
CREATE TABLE public.vocabulary_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name character varying(100) NOT NULL,
  description text,
  color character varying(7) DEFAULT '#6366f1',
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 7. VOCABULARY ITEMS (Saved words with SRS)
-- =====================================================
CREATE TABLE public.vocabulary_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  detected_object_id uuid REFERENCES public.detected_objects(id) ON DELETE SET NULL,
  word_zh text NOT NULL,
  word_pinyin text NOT NULL,
  word_en text NOT NULL,
  example_sentence text,
  is_learned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- SRS fields
  easiness_factor double precision DEFAULT 2.5,
  interval_days integer DEFAULT 0,
  next_review_date date DEFAULT CURRENT_DATE,
  repetitions integer DEFAULT 0,
  last_reviewed_at timestamp with time zone,
  correct_streak integer DEFAULT 0,
  hsk_level integer CHECK (hsk_level BETWEEN 1 AND 6)
);

-- =====================================================
-- 8. LIST VOCABULARY ITEMS (Junction table M:N)
-- =====================================================
CREATE TABLE public.list_vocabulary_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id uuid NOT NULL REFERENCES public.vocabulary_lists(id) ON DELETE CASCADE,
  vocabulary_item_id uuid NOT NULL REFERENCES public.vocabulary_items(id) ON DELETE CASCADE,
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(list_id, vocabulary_item_id)
);

-- =====================================================
-- 9. PRACTICE SESSIONS
-- =====================================================
CREATE TABLE public.practice_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  words_practiced integer DEFAULT 0,
  words_known integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 10. WORD PRACTICE ATTEMPTS
-- =====================================================
CREATE TABLE public.word_practice_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vocabulary_item_id uuid NOT NULL REFERENCES public.vocabulary_items(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.practice_sessions(id) ON DELETE SET NULL,
  quiz_mode character varying,
  rating integer,
  is_correct boolean,
  response_time_ms integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 11. DAILY GOALS
-- =====================================================
CREATE TABLE public.daily_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_type character varying NOT NULL,
  target_value integer NOT NULL DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 12. VOCABULARY COURSES
-- =====================================================
CREATE TABLE public.vocabulary_courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name character varying(150) NOT NULL,
  description text,
  cover_image_url text,
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 6),
  is_published boolean DEFAULT false,
  subscriber_count integer DEFAULT 0,
  rating_avg decimal(3,2),
  rating_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 13. COURSE VOCABULARY ITEMS
-- =====================================================
CREATE TABLE public.course_vocabulary_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.vocabulary_courses(id) ON DELETE CASCADE,
  word_zh character varying(50) NOT NULL,
  word_pinyin character varying(100) NOT NULL,
  word_en character varying(200) NOT NULL,
  example_sentence text,
  hsk_level integer CHECK (hsk_level BETWEEN 1 AND 6),
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 14. COURSE SUBSCRIPTIONS
-- =====================================================
CREATE TABLE public.course_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.vocabulary_courses(id) ON DELETE CASCADE,
  progress_percent integer DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  words_learned integer DEFAULT 0,
  last_practiced_at timestamp with time zone,
  subscribed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- 15. COURSE RATINGS
-- =====================================================
CREATE TABLE public.course_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.vocabulary_courses(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- 16. VOCABULARY IMPORTS
-- =====================================================
CREATE TABLE public.vocabulary_imports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type character varying(20) CHECK (source_type IN ('youtube', 'url', 'text')) NOT NULL,
  source_url text,
  source_title character varying(255),
  words_extracted integer DEFAULT 0,
  words_saved integer DEFAULT 0,
  status character varying(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 17. UPGRADE INTEREST
-- =====================================================
CREATE TABLE public.upgrade_interest (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text,
  reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_daily_usage_user ON public.daily_usage(user_id, usage_date);
CREATE INDEX idx_photo_analyses_user ON public.photo_analyses(user_id, created_at DESC);
CREATE INDEX idx_detected_objects_analysis ON public.detected_objects(analysis_id);
CREATE INDEX idx_vocabulary_lists_user ON public.vocabulary_lists(user_id, created_at DESC);
CREATE INDEX idx_vocabulary_lists_public ON public.vocabulary_lists(is_public) WHERE is_public = true;
CREATE INDEX idx_list_vocabulary_items_list ON public.list_vocabulary_items(list_id);
CREATE INDEX idx_list_vocabulary_items_vocab ON public.list_vocabulary_items(vocabulary_item_id);
CREATE INDEX idx_vocabulary_items_user ON public.vocabulary_items(user_id, created_at DESC);
CREATE INDEX idx_vocabulary_items_review ON public.vocabulary_items(user_id, next_review_date);
CREATE INDEX idx_vocabulary_items_hsk ON public.vocabulary_items(hsk_level) WHERE hsk_level IS NOT NULL;
CREATE INDEX idx_practice_sessions_user ON public.practice_sessions(user_id, created_at DESC);
CREATE INDEX idx_word_attempts_user ON public.word_practice_attempts(user_id, created_at DESC);
CREATE INDEX idx_vocabulary_courses_creator ON public.vocabulary_courses(creator_id);
CREATE INDEX idx_vocabulary_courses_published ON public.vocabulary_courses(is_published, rating_avg DESC NULLS LAST) WHERE is_published = true;
CREATE INDEX idx_vocabulary_courses_difficulty ON public.vocabulary_courses(difficulty_level) WHERE is_published = true;
CREATE INDEX idx_course_items_course ON public.course_vocabulary_items(course_id, sort_order);
CREATE INDEX idx_course_subscriptions_user ON public.course_subscriptions(user_id);
CREATE INDEX idx_course_subscriptions_course ON public.course_subscriptions(course_id);
CREATE INDEX idx_course_ratings_course ON public.course_ratings(course_id);
CREATE INDEX idx_vocabulary_imports_user ON public.vocabulary_imports(user_id, created_at DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- User Stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own stats"
  ON public.user_stats FOR ALL
  USING (auth.uid() = id);

-- Daily Usage
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own usage"
  ON public.daily_usage FOR ALL
  USING (auth.uid() = user_id);

-- Photo Analyses
ALTER TABLE public.photo_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own analyses"
  ON public.photo_analyses FOR ALL
  USING (auth.uid() = user_id);

-- Detected Objects (through photo_analyses)
ALTER TABLE public.detected_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view objects from own analyses"
  ON public.detected_objects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.photo_analyses
      WHERE id = detected_objects.analysis_id AND user_id = auth.uid()
    )
  );

-- Vocabulary Lists
ALTER TABLE public.vocabulary_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own lists"
  ON public.vocabulary_lists FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Public lists readable by all"
  ON public.vocabulary_lists FOR SELECT
  USING (is_public = true);

-- List Vocabulary Items
ALTER TABLE public.list_vocabulary_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage items in own lists"
  ON public.list_vocabulary_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vocabulary_lists
      WHERE id = list_vocabulary_items.list_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Users can view items in public lists"
  ON public.list_vocabulary_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vocabulary_lists
      WHERE id = list_vocabulary_items.list_id AND is_public = true
    )
  );

-- Vocabulary Items
ALTER TABLE public.vocabulary_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own vocabulary"
  ON public.vocabulary_items FOR ALL
  USING (auth.uid() = user_id);

-- Practice Sessions
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions"
  ON public.practice_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Word Practice Attempts
ALTER TABLE public.word_practice_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own attempts"
  ON public.word_practice_attempts FOR ALL
  USING (auth.uid() = user_id);

-- Daily Goals
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own goals"
  ON public.daily_goals FOR ALL
  USING (auth.uid() = user_id);

-- Vocabulary Courses
ALTER TABLE public.vocabulary_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage own courses"
  ON public.vocabulary_courses FOR ALL
  USING (auth.uid() = creator_id);
CREATE POLICY "Published courses readable by all"
  ON public.vocabulary_courses FOR SELECT
  USING (is_published = true);

-- Course Vocabulary Items
ALTER TABLE public.course_vocabulary_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage course items"
  ON public.course_vocabulary_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vocabulary_courses
      WHERE id = course_vocabulary_items.course_id AND creator_id = auth.uid()
    )
  );
CREATE POLICY "Published course items readable by all"
  ON public.course_vocabulary_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vocabulary_courses
      WHERE id = course_vocabulary_items.course_id AND is_published = true
    )
  );

-- Course Subscriptions
ALTER TABLE public.course_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own subscriptions"
  ON public.course_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Course Ratings
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ratings"
  ON public.course_ratings FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Ratings readable by all"
  ON public.course_ratings FOR SELECT
  USING (true);

-- Vocabulary Imports
ALTER TABLE public.vocabulary_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own imports"
  ON public.vocabulary_imports FOR ALL
  USING (auth.uid() = user_id);

-- Upgrade Interest
ALTER TABLE public.upgrade_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own interest"
  ON public.upgrade_interest FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update subscriber_count
CREATE OR REPLACE FUNCTION update_course_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.vocabulary_courses SET subscriber_count = subscriber_count + 1 WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.vocabulary_courses SET subscriber_count = subscriber_count - 1 WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_subscriber_count
  AFTER INSERT OR DELETE ON public.course_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_course_subscriber_count();

-- Function to update course rating average
CREATE OR REPLACE FUNCTION update_course_rating_avg()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vocabulary_courses SET
    rating_avg = (SELECT AVG(rating)::decimal(3,2) FROM public.course_ratings WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)),
    rating_count = (SELECT COUNT(*) FROM public.course_ratings WHERE course_id = COALESCE(NEW.course_id, OLD.course_id))
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_rating_avg
  AFTER INSERT OR UPDATE OR DELETE ON public.course_ratings
  FOR EACH ROW EXECUTE FUNCTION update_course_rating_avg();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vocabulary_lists_updated_at
  BEFORE UPDATE ON public.vocabulary_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_vocabulary_courses_updated_at
  BEFORE UPDATE ON public.vocabulary_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_daily_goals_updated_at
  BEFORE UPDATE ON public.daily_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
