-- Clear all user data while keeping table structure
-- Run this in Supabase SQL Editor

-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Clear all data in reverse dependency order
DELETE FROM word_practice_attempts;
DELETE FROM practice_sessions;
DELETE FROM list_vocabulary_items;
DELETE FROM vocabulary_items;
DELETE FROM detected_objects;
DELETE FROM photo_analyses;
DELETE FROM story_photos;
DELETE FROM stories;
DELETE FROM vocabulary_lists;
DELETE FROM user_stats;
DELETE FROM user_settings;

-- Reset sequences (optional - if you want IDs to start from 1)
ALTER SEQUENCE IF EXISTS word_practice_attempts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS practice_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vocabulary_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS detected_objects_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS photo_analyses_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stories_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS story_photos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vocabulary_lists_id_seq RESTART WITH 1;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify counts
SELECT
  'vocabulary_items' as table_name, COUNT(*) as count FROM vocabulary_items
UNION ALL
SELECT 'photo_analyses', COUNT(*) FROM photo_analyses
UNION ALL
SELECT 'detected_objects', COUNT(*) FROM detected_objects
UNION ALL
SELECT 'stories', COUNT(*) FROM stories
UNION ALL
SELECT 'vocabulary_lists', COUNT(*) FROM vocabulary_lists
UNION ALL
SELECT 'word_practice_attempts', COUNT(*) FROM word_practice_attempts;
