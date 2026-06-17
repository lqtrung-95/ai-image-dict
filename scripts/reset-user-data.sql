-- Reset all data for a specific user.
-- Usage: replace :user_id with the actual UUID, then run via psql or Supabase SQL editor.
--
-- Example:
--   psql "$DATABASE_URL" -v user_id="'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'" -f scripts/reset-user-data.sql
--
-- CAUTION: This is irreversible. Back up data before running in production.

DO $$
DECLARE
  uid uuid := :'user_id';
BEGIN

  -- Word-level practice history
  DELETE FROM word_practice_attempts  WHERE user_id = uid;
  DELETE FROM practice_sessions       WHERE user_id = uid;

  -- SRS deck and lists
  DELETE FROM list_vocabulary_items   WHERE vocabulary_item_id IN (
    SELECT id FROM vocabulary_items WHERE user_id = uid
  );
  DELETE FROM vocabulary_items        WHERE user_id = uid;
  DELETE FROM vocabulary_lists        WHERE user_id = uid;

  -- Course enrolments and ratings (does NOT delete community courses themselves)
  DELETE FROM course_subscriptions    WHERE user_id = uid;
  DELETE FROM course_ratings          WHERE user_id = uid;

  -- Photo library
  DELETE FROM story_photos            WHERE story_id IN (
    SELECT id FROM photo_stories WHERE user_id = uid
  );
  DELETE FROM photo_stories           WHERE user_id = uid;
  DELETE FROM detected_objects        WHERE analysis_id IN (
    SELECT id FROM photo_analyses WHERE user_id = uid
  );
  DELETE FROM photo_analyses          WHERE user_id = uid;

  -- Word-of-day history
  DELETE FROM word_of_day_history     WHERE user_id = uid;

  -- Usage / stats
  DELETE FROM daily_usage             WHERE user_id = uid;
  DELETE FROM daily_goals             WHERE user_id = uid;
  DELETE FROM user_stats              WHERE user_id = uid;

  -- Imports
  DELETE FROM vocabulary_imports      WHERE user_id = uid;

  -- Notification preferences (reset to defaults on next login)
  DELETE FROM notification_preferences WHERE user_id = uid;

  -- Reset profile display name (keeps the auth account)
  UPDATE profiles
  SET display_name = NULL
  WHERE id = uid;

  RAISE NOTICE 'Reset complete for user %', uid;
END $$;
