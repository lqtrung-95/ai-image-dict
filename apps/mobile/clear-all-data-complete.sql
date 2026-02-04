-- Clear ALL user data from AI Image Dictionary database
-- Run this in Supabase SQL Editor
-- WARNING: This will delete all user data but keep table structure and schema

-- Delete in order (child tables with foreign keys first to avoid constraint errors)

-- 1. Practice-related tables (depend on sessions and vocabulary)
DELETE FROM word_practice_attempts WHERE id IS NOT NULL;
DELETE FROM practice_sessions WHERE id IS NOT NULL;

-- 2. List-vocabulary junction table (depends on lists and vocabulary items)
DELETE FROM list_vocabulary_items WHERE id IS NOT NULL;

-- 3. Vocabulary items (depends on detected_objects and profiles)
DELETE FROM vocabulary_items WHERE id IS NOT NULL;

-- 4. Word of day history (depends on vocabulary_items)
DELETE FROM word_of_day_history WHERE id IS NOT NULL;

-- 5. Detected objects (depends on photo_analyses)
DELETE FROM detected_objects WHERE id IS NOT NULL;

-- 6. Story photos junction table (depends on stories and photo_analyses)
DELETE FROM story_photos WHERE id IS NOT NULL;

-- 7. Photo analyses (depends on profiles)
DELETE FROM photo_analyses WHERE id IS NOT NULL;

-- 8. Stories (depends on profiles)
DELETE FROM photo_stories WHERE id IS NOT NULL;

-- 9. Course-related tables
DELETE FROM course_ratings WHERE id IS NOT NULL;
DELETE FROM course_subscriptions WHERE id IS NOT NULL;
DELETE FROM course_vocabulary_items WHERE id IS NOT NULL;
DELETE FROM vocabulary_courses WHERE id IS NOT NULL;

-- 10. Vocabulary lists and imports
DELETE FROM vocabulary_lists WHERE id IS NOT NULL;
DELETE FROM vocabulary_imports WHERE id IS NOT NULL;

-- 11. User settings and stats
DELETE FROM daily_goals WHERE id IS NOT NULL;
DELETE FROM daily_usage WHERE id IS NOT NULL;
DELETE FROM notification_preferences WHERE id IS NOT NULL;
DELETE FROM user_stats WHERE id IS NOT NULL;
DELETE FROM upgrade_interest WHERE id IS NOT NULL;

-- 12. Profiles (extends auth.users - delete last)
DELETE FROM profiles WHERE id IS NOT NULL;

-- ============================================
-- VERIFY ALL DATA IS CLEARED
-- ============================================
SELECT 'vocabulary_items' as table_name, COUNT(*) as count FROM vocabulary_items
UNION ALL SELECT 'detected_objects', COUNT(*) FROM detected_objects
UNION ALL SELECT 'photo_analyses', COUNT(*) FROM photo_analyses
UNION ALL SELECT 'word_practice_attempts', COUNT(*) FROM word_practice_attempts
UNION ALL SELECT 'practice_sessions', COUNT(*) FROM practice_sessions
UNION ALL SELECT 'vocabulary_lists', COUNT(*) FROM vocabulary_lists
UNION ALL SELECT 'list_vocabulary_items', COUNT(*) FROM list_vocabulary_items
UNION ALL SELECT 'vocabulary_courses', COUNT(*) FROM vocabulary_courses
UNION ALL SELECT 'course_vocabulary_items', COUNT(*) FROM course_vocabulary_items
UNION ALL SELECT 'course_subscriptions', COUNT(*) FROM course_subscriptions
UNION ALL SELECT 'course_ratings', COUNT(*) FROM course_ratings
UNION ALL SELECT 'vocabulary_imports', COUNT(*) FROM vocabulary_imports
UNION ALL SELECT 'daily_goals', COUNT(*) FROM daily_goals
UNION ALL SELECT 'daily_usage', COUNT(*) FROM daily_usage
UNION ALL SELECT 'user_stats', COUNT(*) FROM user_stats
UNION ALL SELECT 'photo_stories', COUNT(*) FROM photo_stories
UNION ALL SELECT 'story_photos', COUNT(*) FROM story_photos
UNION ALL SELECT 'word_of_day_history', COUNT(*) FROM word_of_day_history
UNION ALL SELECT 'notification_preferences', COUNT(*) FROM notification_preferences
UNION ALL SELECT 'upgrade_interest', COUNT(*) FROM upgrade_interest
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
ORDER BY table_name;
