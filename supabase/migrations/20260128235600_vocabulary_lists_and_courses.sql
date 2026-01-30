-- Migration: Add Vocabulary Lists, Courses, and Import Tracking
-- Vocabulary Management System - Phase 1

-- =====================================================
-- 1. VOCABULARY LISTS (Personal word collections with M:N)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vocabulary_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  color varchar(7) DEFAULT '#6366f1',
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Junction table for M:N relationship (word can be in multiple lists)
CREATE TABLE IF NOT EXISTS public.list_vocabulary_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id uuid REFERENCES public.vocabulary_lists(id) ON DELETE CASCADE NOT NULL,
  vocabulary_item_id uuid REFERENCES public.vocabulary_items(id) ON DELETE CASCADE NOT NULL,
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(list_id, vocabulary_item_id)
);

-- Indexes for vocabulary_lists
CREATE INDEX IF NOT EXISTS idx_vocabulary_lists_user
  ON public.vocabulary_lists(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vocabulary_lists_public
  ON public.vocabulary_lists(is_public) WHERE is_public = true;

-- Indexes for list_vocabulary_items
CREATE INDEX IF NOT EXISTS idx_list_vocabulary_items_list
  ON public.list_vocabulary_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_vocabulary_items_vocab
  ON public.list_vocabulary_items(vocabulary_item_id);

-- RLS for vocabulary_lists
ALTER TABLE public.vocabulary_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own lists" ON public.vocabulary_lists;
CREATE POLICY "Users can manage own lists"
  ON public.vocabulary_lists FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public lists readable by all" ON public.vocabulary_lists;
CREATE POLICY "Public lists readable by all"
  ON public.vocabulary_lists FOR SELECT
  USING (is_public = true);

-- RLS for list_vocabulary_items
ALTER TABLE public.list_vocabulary_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage items in own lists" ON public.list_vocabulary_items;
CREATE POLICY "Users can manage items in own lists"
  ON public.list_vocabulary_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vocabulary_lists
      WHERE id = list_vocabulary_items.list_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view items in public lists" ON public.list_vocabulary_items;
CREATE POLICY "Users can view items in public lists"
  ON public.list_vocabulary_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vocabulary_lists
      WHERE id = list_vocabulary_items.list_id AND is_public = true
    )
  );

-- =====================================================
-- 2. VOCABULARY COURSES (Community-shared curated sets)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vocabulary_courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name varchar(150) NOT NULL,
  description text,
  cover_image_url text,
  difficulty_level integer CHECK (difficulty_level BETWEEN 1 AND 6) DEFAULT 1,
  is_published boolean DEFAULT false,
  subscriber_count integer DEFAULT 0,
  rating_avg decimal(3,2),
  rating_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Course vocabulary items (independent copies, ordered)
CREATE TABLE IF NOT EXISTS public.course_vocabulary_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.vocabulary_courses(id) ON DELETE CASCADE NOT NULL,
  word_zh varchar(50) NOT NULL,
  word_pinyin varchar(100) NOT NULL,
  word_en varchar(200) NOT NULL,
  example_sentence text,
  hsk_level integer CHECK (hsk_level BETWEEN 1 AND 6),
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Course subscriptions (user progress per course)
CREATE TABLE IF NOT EXISTS public.course_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.vocabulary_courses(id) ON DELETE CASCADE NOT NULL,
  progress_percent integer DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  words_learned integer DEFAULT 0,
  last_practiced_at timestamp with time zone,
  subscribed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, course_id)
);

-- Course ratings and reviews
CREATE TABLE IF NOT EXISTS public.course_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.vocabulary_courses(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  review text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, course_id)
);

-- Indexes for vocabulary_courses
CREATE INDEX IF NOT EXISTS idx_vocabulary_courses_creator
  ON public.vocabulary_courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_courses_published
  ON public.vocabulary_courses(is_published, rating_avg DESC NULLS LAST)
  WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_vocabulary_courses_difficulty
  ON public.vocabulary_courses(difficulty_level) WHERE is_published = true;

-- Indexes for course_vocabulary_items
CREATE INDEX IF NOT EXISTS idx_course_vocabulary_items_course
  ON public.course_vocabulary_items(course_id, sort_order);

-- Indexes for course_subscriptions
CREATE INDEX IF NOT EXISTS idx_course_subscriptions_user
  ON public.course_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_subscriptions_course
  ON public.course_subscriptions(course_id);

-- Indexes for course_ratings
CREATE INDEX IF NOT EXISTS idx_course_ratings_course
  ON public.course_ratings(course_id);

-- RLS for vocabulary_courses
ALTER TABLE public.vocabulary_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can manage own courses" ON public.vocabulary_courses;
CREATE POLICY "Creators can manage own courses"
  ON public.vocabulary_courses FOR ALL
  USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Published courses readable by all" ON public.vocabulary_courses;
CREATE POLICY "Published courses readable by all"
  ON public.vocabulary_courses FOR SELECT
  USING (is_published = true);

-- RLS for course_vocabulary_items
ALTER TABLE public.course_vocabulary_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can manage course items" ON public.course_vocabulary_items;
CREATE POLICY "Creators can manage course items"
  ON public.course_vocabulary_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vocabulary_courses
      WHERE id = course_vocabulary_items.course_id AND creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Published course items readable by all" ON public.course_vocabulary_items;
CREATE POLICY "Published course items readable by all"
  ON public.course_vocabulary_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vocabulary_courses
      WHERE id = course_vocabulary_items.course_id AND is_published = true
    )
  );

-- RLS for course_subscriptions
ALTER TABLE public.course_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.course_subscriptions;
CREATE POLICY "Users can manage own subscriptions"
  ON public.course_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- RLS for course_ratings
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ratings" ON public.course_ratings;
CREATE POLICY "Users can manage own ratings"
  ON public.course_ratings FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Ratings readable by all" ON public.course_ratings;
CREATE POLICY "Ratings readable by all"
  ON public.course_ratings FOR SELECT
  USING (true);

-- =====================================================
-- 3. VOCABULARY IMPORTS (Track import history)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vocabulary_imports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  source_type varchar(20) CHECK (source_type IN ('youtube', 'url', 'text')) NOT NULL,
  source_url text,
  source_title varchar(255),
  words_extracted integer DEFAULT 0,
  words_saved integer DEFAULT 0,
  status varchar(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for vocabulary_imports
CREATE INDEX IF NOT EXISTS idx_vocabulary_imports_user
  ON public.vocabulary_imports(user_id, created_at DESC);

-- RLS for vocabulary_imports
ALTER TABLE public.vocabulary_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own imports" ON public.vocabulary_imports;
CREATE POLICY "Users can manage own imports"
  ON public.vocabulary_imports FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. HELPER FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update subscriber_count when subscription changes
CREATE OR REPLACE FUNCTION update_course_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.vocabulary_courses
    SET subscriber_count = subscriber_count + 1
    WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.vocabulary_courses
    SET subscriber_count = subscriber_count - 1
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_subscriber_count ON public.course_subscriptions;
CREATE TRIGGER trigger_update_subscriber_count
  AFTER INSERT OR DELETE ON public.course_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_course_subscriber_count();

-- Function to update course rating average when rating changes
CREATE OR REPLACE FUNCTION update_course_rating_avg()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vocabulary_courses
  SET
    rating_avg = (
      SELECT AVG(rating)::decimal(3,2)
      FROM public.course_ratings
      WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.course_ratings
      WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    )
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_rating_avg ON public.course_ratings;
CREATE TRIGGER trigger_update_rating_avg
  AFTER INSERT OR UPDATE OR DELETE ON public.course_ratings
  FOR EACH ROW EXECUTE FUNCTION update_course_rating_avg();

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vocabulary_lists_updated_at ON public.vocabulary_lists;
CREATE TRIGGER trigger_vocabulary_lists_updated_at
  BEFORE UPDATE ON public.vocabulary_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_vocabulary_courses_updated_at ON public.vocabulary_courses;
CREATE TRIGGER trigger_vocabulary_courses_updated_at
  BEFORE UPDATE ON public.vocabulary_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add HSK level index on vocabulary_items if missing
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_hsk
  ON public.vocabulary_items(hsk_level) WHERE hsk_level IS NOT NULL;
