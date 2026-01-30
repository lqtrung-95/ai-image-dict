-- Migration: Convert collections to lists and remove collections

-- 1. Migrate existing collections to vocabulary_lists
INSERT INTO vocabulary_lists (id, user_id, name, color, created_at, updated_at)
SELECT id, user_id, name, color, created_at, created_at
FROM collections
ON CONFLICT (id) DO NOTHING;

-- 2. Migrate vocabulary_items collection assignments to list_vocabulary_items
INSERT INTO list_vocabulary_items (list_id, vocabulary_item_id, added_at)
SELECT collection_id, id, created_at
FROM vocabulary_items
WHERE collection_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Remove collectionId column from vocabulary_items
ALTER TABLE vocabulary_items DROP COLUMN IF EXISTS collection_id;

-- 4. Drop collections table
DROP TABLE IF EXISTS collections CASCADE;
