# Phase 1: Database Schema & Migrations

## Context Links

- [URL Extraction Research](./research/researcher-url-extraction.md)
- [System Architecture](../../docs/system-architecture.md)
- [Existing Types](../../src/types/index.ts)
- [SRS Migration](../../supabase/migrations/20260127_add_srs_fields.sql)

## Overview

| Field | Value |
|-------|-------|
| Priority | P1 (blocking) |
| Status | pending |
| Effort | 4h |
| Dependencies | Supabase PostgreSQL access |

Create database tables for vocabulary lists, courses, imports, and tracking. Enable RLS policies for multi-user security.

## Key Insights

- Existing `collections` table is 1:1 with vocabulary_items (simple assignment)
- New system needs M:N relationship for lists (word can belong to multiple lists)
- Community courses require public visibility + subscription tracking
- Import tracking needed for deduplication and source attribution

## Requirements

### Functional
- [ ] Vocabulary lists with M:N word assignment
- [ ] Course system with public/private visibility
- [ ] Import history tracking (youtube, url, text sources)
- [ ] HSK level filtering support (existing field, add index)
- [ ] Per-list/course progress tracking

### Non-Functional
- [ ] RLS policies on all new tables
- [ ] Indexes for common queries (user_id, created_at, hsk_level)
- [ ] Foreign key cascades for data integrity

## Architecture

### New Tables

```sql
-- Personal vocabulary lists
vocabulary_lists
├── id (uuid, PK)
├── user_id (uuid, FK profiles)
├── name (varchar 100)
├── description (text, nullable)
├── color (varchar 7, hex color)
├── is_public (boolean, default false)
├── created_at, updated_at

-- M:N junction for list-word relationship
list_vocabulary_items
├── id (uuid, PK)
├── list_id (uuid, FK vocabulary_lists)
├── vocabulary_item_id (uuid, FK vocabulary_items)
├── added_at (timestamp)
├── UNIQUE(list_id, vocabulary_item_id)

-- Community courses (curated word sets)
vocabulary_courses
├── id (uuid, PK)
├── creator_id (uuid, FK profiles)
├── name (varchar 150)
├── description (text)
├── cover_image_url (text, nullable)
├── difficulty_level (integer 1-6, HSK-aligned)
├── is_published (boolean)
├── subscriber_count (integer, denormalized)
├── rating_avg (decimal, nullable)
├── rating_count (integer)
├── created_at, updated_at

-- Course vocabulary items (ordered)
course_vocabulary_items
├── id (uuid, PK)
├── course_id (uuid, FK vocabulary_courses)
├── word_zh (varchar)
├── word_pinyin (varchar)
├── word_en (varchar)
├── example_sentence (text, nullable)
├── hsk_level (integer, nullable)
├── sort_order (integer)
├── created_at

-- Course subscriptions
course_subscriptions
├── id (uuid, PK)
├── user_id (uuid, FK profiles)
├── course_id (uuid, FK vocabulary_courses)
├── progress_percent (integer 0-100)
├── words_learned (integer)
├── last_practiced_at (timestamp, nullable)
├── subscribed_at (timestamp)
├── UNIQUE(user_id, course_id)

-- Course ratings
course_ratings
├── id (uuid, PK)
├── user_id (uuid, FK profiles)
├── course_id (uuid, FK vocabulary_courses)
├── rating (integer 1-5)
├── review (text, nullable)
├── created_at
├── UNIQUE(user_id, course_id)

-- Import history
vocabulary_imports
├── id (uuid, PK)
├── user_id (uuid, FK profiles)
├── source_type (varchar: youtube, url, text)
├── source_url (text, nullable)
├── source_title (varchar, nullable)
├── words_extracted (integer)
├── words_saved (integer)
├── status (varchar: pending, processing, completed, failed)
├── error_message (text, nullable)
├── created_at
```

## Related Code Files

### Files to Create
- `supabase/migrations/20260128_vocabulary_lists_and_courses.sql`

### Files to Modify
- `src/types/index.ts` - Add TypeScript interfaces

## Implementation Steps

1. **Create migration file** with all table definitions
2. **Add RLS policies** for each table:
   - vocabulary_lists: owner can CRUD, public lists readable by all
   - list_vocabulary_items: owner of list can CRUD
   - vocabulary_courses: creator CRUD, published readable by all
   - course_subscriptions: subscriber can CRUD own
   - course_ratings: rater can CRUD own, readable by all
   - vocabulary_imports: owner only
3. **Create indexes** for performance:
   - vocabulary_lists(user_id, created_at)
   - vocabulary_courses(is_published, rating_avg DESC)
   - course_subscriptions(user_id), (course_id)
   - vocabulary_items(hsk_level) - add if missing
4. **Add TypeScript interfaces** to types/index.ts
5. **Test migration** locally with `supabase db push` or manual SQL

## Todo List

- [ ] Write SQL migration file
- [ ] Add RLS policies for all tables
- [ ] Create indexes for query optimization
- [ ] Add TypeScript interfaces
- [ ] Test migration on local Supabase
- [ ] Document rollback procedure

## Success Criteria

- [ ] All tables created with correct columns and constraints
- [ ] RLS policies prevent unauthorized access
- [ ] Foreign key cascades work (delete user cascades to lists)
- [ ] TypeScript types match database schema
- [ ] Migration is idempotent (can run multiple times safely)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration conflicts with existing data | Low | High | Test on staging first |
| Performance issues with M:N joins | Medium | Medium | Proper indexes, limit joins |
| RLS policy too restrictive | Medium | Low | Test all CRUD operations |

## Security Considerations

- RLS enforces user_id = auth.uid() for private data
- Public courses/lists readable but not modifiable
- Course ratings visible to all (public reviews)
- Import history private to user

## Next Steps

After this phase:
- Phase 2: Build API routes for personal lists
- Phase 3: Implement import functionality
