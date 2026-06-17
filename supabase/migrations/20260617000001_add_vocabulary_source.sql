alter table vocabulary_items
  add column if not exists source text not null default 'capture';

-- Backfill: words with no detected_object_id that were added before this migration
-- are likely from course enrollment. We can't tell with 100% certainty for manual
-- imports, but course words have no detected_object_id and were batch-inserted,
-- so mark them 'course'. Words with a detected_object_id stay 'capture'.
update vocabulary_items
  set source = 'course'
  where detected_object_id is null
    and source = 'capture';
