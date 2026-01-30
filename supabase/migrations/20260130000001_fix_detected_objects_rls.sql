-- Fix RLS policy for detected_objects to allow INSERT

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view objects from own analyses" ON public.detected_objects;

-- Create comprehensive policy for all operations
CREATE POLICY "Users can manage objects from own analyses"
  ON public.detected_objects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.photo_analyses
      WHERE id = detected_objects.analysis_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.photo_analyses
      WHERE id = detected_objects.analysis_id AND user_id = auth.uid()
    )
  );
