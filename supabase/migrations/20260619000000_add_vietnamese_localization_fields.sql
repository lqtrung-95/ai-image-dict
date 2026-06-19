-- Add Vietnamese localization fields to vocabulary_courses and course_vocabulary_items
-- These fields are optional (NULL-safe); the API falls back to English when NULL.

ALTER TABLE vocabulary_courses
  ADD COLUMN IF NOT EXISTS name_vi TEXT,
  ADD COLUMN IF NOT EXISTS description_vi TEXT;

ALTER TABLE course_vocabulary_items
  ADD COLUMN IF NOT EXISTS word_vi TEXT;

COMMENT ON COLUMN vocabulary_courses.name_vi IS 'Vietnamese course name (falls back to name if NULL)';
COMMENT ON COLUMN vocabulary_courses.description_vi IS 'Vietnamese course description (falls back to description if NULL)';
COMMENT ON COLUMN course_vocabulary_items.word_vi IS 'Vietnamese translation of the word (falls back to word_en if NULL)';
