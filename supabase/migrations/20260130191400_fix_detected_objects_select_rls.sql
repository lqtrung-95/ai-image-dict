-- Fix RLS policy for detected_objects to ensure SELECT works properly

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage objects from own analyses" ON public.detected_objects;
DROP POLICY IF EXISTS "Users can view objects from own analyses" ON public.detected_objects;

-- Enable RLS
ALTER TABLE public.detected_objects ENABLE ROW LEVEL SECURITY;

-- Create separate policies for each operation for clarity
-- SELECT policy: Users can view objects from their own photo analyses
CREATE POLICY "Users can view own detected objects"
  ON public.detected_objects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.photo_analyses
      WHERE photo_analyses.id = detected_objects.analysis_id
      AND photo_analyses.user_id = auth.uid()
    )
  );

-- INSERT policy: Users can only insert objects for their own analyses
CREATE POLICY "Users can insert own detected objects"
  ON public.detected_objects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.photo_analyses
      WHERE photo_analyses.id = detected_objects.analysis_id
      AND photo_analyses.user_id = auth.uid()
    )
  );

-- UPDATE policy: Users can only update objects from their own analyses
CREATE POLICY "Users can update own detected objects"
  ON public.detected_objects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.photo_analyses
      WHERE photo_analyses.id = detected_objects.analysis_id
      AND photo_analyses.user_id = auth.uid()
    )
  );

-- DELETE policy: Users can only delete objects from their own analyses
CREATE POLICY "Users can delete own detected objects"
  ON public.detected_objects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.photo_analyses
      WHERE photo_analyses.id = detected_objects.analysis_id
      AND photo_analyses.user_id = auth.uid()
    )
  );

-- Also ensure story_photos RLS is correct
DROP POLICY IF EXISTS "Users can view story photos through story" ON public.story_photos;
DROP POLICY IF EXISTS "Users can manage story photos through story" ON public.story_photos;

CREATE POLICY "Users can view own story photos"
  ON public.story_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.photo_stories
      WHERE photo_stories.id = story_photos.story_id
      AND photo_stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own story photos"
  ON public.story_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.photo_stories
      WHERE photo_stories.id = story_photos.story_id
      AND photo_stories.user_id = auth.uid()
    )
  );
