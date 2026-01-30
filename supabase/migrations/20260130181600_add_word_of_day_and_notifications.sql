-- Word of the Day tracking table
CREATE TABLE IF NOT EXISTS word_of_day_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_item_id UUID REFERENCES vocabulary_items(id) ON DELETE CASCADE,
  word_zh VARCHAR(50),
  word_pinyin VARCHAR(100),
  word_en VARCHAR(200),
  example_sentence TEXT,
  hsk_level INTEGER,
  date_shown DATE NOT NULL DEFAULT CURRENT_DATE,
  was_saved BOOLEAN DEFAULT FALSE,
  was_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date_shown)
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_of_day_enabled BOOLEAN DEFAULT TRUE,
  word_of_day_time TIME DEFAULT '09:00:00',
  review_reminders_enabled BOOLEAN DEFAULT TRUE,
  streak_reminders_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_word_of_day_history_user_date ON word_of_day_history(user_id, date_shown);
CREATE INDEX IF NOT EXISTS idx_word_of_day_history_user_saved ON word_of_day_history(user_id, was_saved);

-- RLS Policies
ALTER TABLE word_of_day_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Word of day history policies
CREATE POLICY "Users can view own word of day history"
  ON word_of_day_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own word of day history"
  ON word_of_day_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own word of day history"
  ON word_of_day_history FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Notification preferences policies
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger to auto-create notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();
