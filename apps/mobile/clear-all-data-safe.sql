-- Clear all user data (safe version - only existing tables)
-- Run this in Supabase SQL Editor

-- Delete in order (child tables first)
DELETE FROM word_practice_attempts WHERE id IS NOT NULL;
DELETE FROM practice_sessions WHERE id IS NOT NULL;
DELETE FROM list_vocabulary_items WHERE id IS NOT NULL;
DELETE FROM vocabulary_items WHERE id IS NOT NULL;
DELETE FROM detected_objects WHERE id IS NOT NULL;
DELETE FROM photo_analyses WHERE id IS NOT NULL;

-- Verify all counts are 0
SELECT 'vocabulary_items' as table_name, COUNT(*) as count FROM vocabulary_items
UNION ALL SELECT 'photo_analyses', COUNT(*) FROM photo_analyses
UNION ALL SELECT 'detected_objects', COUNT(*) FROM detected_objects
UNION ALL SELECT 'word_practice_attempts', COUNT(*) FROM word_practice_attempts;
