# Research Report: Community Vocabulary Courses Database Schema
**Date:** 2026-01-27 | **Status:** Complete

---

## Executive Summary

Design PostgreSQL schema for community courses supporting:
- User-generated + pre-built (HSK 1-6, IT, Business, Daily Conversation) courses
- Many-to-many course ↔ vocabulary relationships
- Subscription/follow system with RLS-based visibility
- Rating & popularity tracking
- Efficient queries for due words per course

---

## Proposed Tables & SQL Schema

### 1. **courses** table (NEW)
```sql
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'hsk', 'it', 'business', 'daily', 'user-generated'
  hsk_level INTEGER, -- 1-6 for HSK courses, NULL for others
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  visibility VARCHAR(20) DEFAULT 'private', -- 'private', 'public', 'subscribers-only'
  rating_avg FLOAT DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  subscriber_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(creator_id, name)
);

CREATE INDEX idx_courses_creator_id ON public.courses(creator_id);
CREATE INDEX idx_courses_published ON public.courses(is_published, visibility);
CREATE INDEX idx_courses_category ON public.courses(category);
CREATE INDEX idx_courses_hsk_level ON public.courses(hsk_level) WHERE hsk_level IS NOT NULL;
CREATE INDEX idx_courses_rating ON public.courses(rating_avg DESC, rating_count DESC);
```

### 2. **course_words** table (NEW - Many-to-Many Junction)
```sql
CREATE TABLE public.course_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  vocabulary_item_id UUID NOT NULL REFERENCES public.vocabulary_items(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  position INTEGER NOT NULL, -- Order within course
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id, vocabulary_item_id)
);

CREATE INDEX idx_course_words_course ON public.course_words(course_id);
CREATE INDEX idx_course_words_vocabulary ON public.course_words(vocabulary_item_id);
```

### 3. **course_subscriptions** table (NEW)
```sql
CREATE TABLE public.course_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,

  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_course_subscriptions_user ON public.course_subscriptions(user_id, is_active);
CREATE INDEX idx_course_subscriptions_course ON public.course_subscriptions(course_id);
```

### 4. **course_ratings** table (NEW)
```sql
CREATE TABLE public.course_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id, user_id)
);

CREATE INDEX idx_course_ratings_course ON public.course_ratings(course_id);
CREATE INDEX idx_course_ratings_user ON public.course_ratings(user_id);
```

### 5. **course_progress** table (NEW - Track per-user learning)
```sql
CREATE TABLE public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  words_learned INTEGER DEFAULT 0,
  words_total INTEGER DEFAULT 0,
  completion_percentage FLOAT DEFAULT 0,
  last_studied_at TIMESTAMP,

  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_course_progress_user_course ON public.course_progress(user_id, course_id);
```

---

## RLS Policy Patterns

### courses table RLS
```sql
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Creators can manage own courses
CREATE POLICY "Creators manage own courses"
  ON public.courses FOR ALL
  USING (auth.uid() = creator_id);

-- Published public courses visible to all
CREATE POLICY "Public courses visible to all"
  ON public.courses FOR SELECT
  USING (is_published = TRUE AND visibility = 'public');

-- Subscriber-only courses visible to subscribers
CREATE POLICY "Subscribers-only visible to subscribers"
  ON public.courses FOR SELECT
  USING (
    is_published = TRUE
    AND visibility = 'subscribers-only'
    AND EXISTS (
      SELECT 1 FROM public.course_subscriptions
      WHERE course_id = courses.id
      AND user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- Private courses only visible to creator
CREATE POLICY "Private courses only to creator"
  ON public.courses FOR SELECT
  USING (visibility = 'private' AND auth.uid() = creator_id);
```

### course_words table RLS
```sql
ALTER TABLE public.course_words ENABLE ROW LEVEL SECURITY;

-- Users can read from public/subscribed courses
CREATE POLICY "Read from accessible courses"
  ON public.course_words FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_words.course_id
      AND (
        (is_published = TRUE AND visibility = 'public')
        OR (auth.uid() = creator_id)
        OR (
          is_published = TRUE
          AND visibility = 'subscribers-only'
          AND EXISTS (
            SELECT 1 FROM public.course_subscriptions
            WHERE course_id = courses.id
            AND user_id = auth.uid()
            AND is_active = TRUE
          )
        )
      )
    )
  );

-- Creators can add words to own courses
CREATE POLICY "Creators manage course words"
  ON public.course_words FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_words.course_id
      AND creator_id = auth.uid()
    )
  );
```

### course_subscriptions table RLS
```sql
ALTER TABLE public.course_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users manage own subscriptions
CREATE POLICY "Users manage own subscriptions"
  ON public.course_subscriptions FOR ALL
  USING (auth.uid() = user_id);
```

### course_ratings table RLS
```sql
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;

-- Users manage own ratings
CREATE POLICY "Users manage own ratings"
  ON public.course_ratings FOR ALL
  USING (auth.uid() = user_id);

-- Read ratings for public courses
CREATE POLICY "Read ratings for accessible courses"
  ON public.course_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_ratings.course_id
      AND (visibility = 'public' OR creator_id = auth.uid())
    )
  );
```

---

## Common Query Patterns

### Get user's courses (subscribed + owned)
```sql
SELECT c.* FROM public.courses c
LEFT JOIN public.course_subscriptions cs ON c.id = cs.course_id
WHERE c.creator_id = auth.uid()
  OR (cs.user_id = auth.uid() AND cs.is_active = TRUE)
ORDER BY c.updated_at DESC;
```

### Get due words for a course (user's next review)
```sql
SELECT vi.*
FROM public.vocabulary_items vi
JOIN public.course_words cw ON vi.id = cw.vocabulary_item_id
WHERE cw.course_id = $1
  AND vi.user_id = auth.uid()
  AND vi.next_review_date <= CURRENT_DATE
ORDER BY vi.next_review_date ASC
LIMIT 20;
```

### Popular/featured courses
```sql
SELECT c.*, COUNT(cs.id) as subscriber_count
FROM public.courses c
LEFT JOIN public.course_subscriptions cs ON c.id = cs.course_id
WHERE c.is_published = TRUE AND c.visibility = 'public'
GROUP BY c.id
ORDER BY c.is_featured DESC, subscriber_count DESC
LIMIT 10;
```

### Get course progress
```sql
SELECT cp.*, c.name, c.description
FROM public.course_progress cp
JOIN public.courses c ON cp.course_id = c.id
WHERE cp.user_id = auth.uid()
ORDER BY cp.last_studied_at DESC NULLS LAST;
```

### Add word to course (maintain position)
```sql
WITH max_pos AS (
  SELECT COALESCE(MAX(position), 0) + 1 as next_pos
  FROM public.course_words
  WHERE course_id = $1
)
INSERT INTO public.course_words (course_id, vocabulary_item_id, added_by_user_id, position)
SELECT $1, $2, auth.uid(), next_pos FROM max_pos;
```

---

## Migration Strategy

### Phase 1: Create new tables
```bash
# 1. Create courses, course_words, subscriptions, ratings
# 2. Enable RLS on all new tables
# 3. Create policies
```

### Phase 2: Pre-built courses
```sql
-- Create system user for pre-built courses
INSERT INTO profiles (id, display_name)
VALUES ('00000000-0000-0000-0000-000000000000', 'System');

-- Create HSK 1-6 courses
INSERT INTO courses (creator_id, name, category, hsk_level, is_published, visibility, is_featured)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'HSK 1', 'hsk', 1, TRUE, 'public', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'HSK 2', 'hsk', 2, TRUE, 'public', TRUE),
  -- ... etc
```

### Phase 3: Data migration
- Link existing vocabulary to built-in courses via course_words
- Initialize course_progress for active users
- Backfill course_subscriptions for users following topics

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Separate `courses` table | Decouples course metadata from words; supports shared word libraries |
| UUID PK for course_words | Allows soft deletes & audit trails if needed; RLS-friendly |
| course_progress denormalized | Avoid expensive GROUP BY queries on practice attempts |
| is_featured boolean | Easy filtering for homepage; avoids join overhead |
| Visibility enum | Simplifies RLS logic; prevents invalid states |
| rating_avg + count on courses | Denormalized for fast sorting; update via trigger |

---

## Performance Considerations

- **Index on (user_id, next_review_date)** for SRS queries within courses
- **Materialized view** for trending courses: `CREATE MATERIALIZED VIEW trending_courses_today...`
- **Partition courses by hsk_level** if >100K courses
- **Avoid subqueries in RLS** – use joins or simple conditions
- **Add created_at index** on ratings for "new courses" timeline

---

## Unresolved Questions

1. Should pre-built courses be updatable (new HSK words), or immutable?
2. Do word positions need to be globally unique, or per-course?
3. Should deleted courses remain soft-deleted for audit purposes?
4. Rate limit policy: users per course subscription or global?
5. Should course_progress auto-delete on unsubscribe, or archive?

