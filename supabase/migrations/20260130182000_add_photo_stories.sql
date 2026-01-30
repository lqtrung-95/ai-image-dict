-- Photo Stories table
CREATE TABLE IF NOT EXISTS photo_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for story photos
CREATE TABLE IF NOT EXISTS story_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES photo_stories(id) ON DELETE CASCADE,
  photo_analysis_id UUID NOT NULL REFERENCES photo_analyses(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, photo_analysis_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_photo_stories_user_id ON photo_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_story_photos_story_id ON story_photos(story_id);
CREATE INDEX IF NOT EXISTS idx_story_photos_photo_analysis_id ON story_photos(photo_analysis_id);

-- RLS Policies
ALTER TABLE photo_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_photos ENABLE ROW LEVEL SECURITY;

-- Photo stories policies
CREATE POLICY "Users can view own photo stories"
  ON photo_stories FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own photo stories"
  ON photo_stories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own photo stories"
  ON photo_stories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own photo stories"
  ON photo_stories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Story photos policies
CREATE POLICY "Users can view story photos through story"
  ON story_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photo_stories
      WHERE photo_stories.id = story_photos.story_id
      AND photo_stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage story photos through story"
  ON story_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photo_stories
      WHERE photo_stories.id = story_photos.story_id
      AND photo_stories.user_id = auth.uid()
    )
  );
