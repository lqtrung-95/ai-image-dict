-- Add generated story content to photo_stories table
ALTER TABLE public.photo_stories
ADD COLUMN IF NOT EXISTS generated_content jsonb;
