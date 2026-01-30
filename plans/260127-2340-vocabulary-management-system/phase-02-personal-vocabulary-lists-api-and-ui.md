# Phase 2: Personal Vocabulary Lists API & UI

## Context Links

- [Phase 1: Database Schema](./phase-01-database-schema-and-migrations.md)
- [Existing Vocabulary API](../../src/app/api/vocabulary/route.ts)
- [Collections Page](../../src/app/(protected)/collections/page.tsx)
- [Code Standards](../../docs/code-standards.md)

## Overview

| Field | Value |
|-------|-------|
| Priority | P1 |
| Status | pending |
| Effort | 6h |
| Dependencies | Phase 1 complete |

Build API routes and UI components for personal vocabulary lists with many-to-many word assignment. Users can create lists, add/remove words, and view list-specific progress.

## Key Insights

- Existing `collections` is simple 1:1 assignment via collection_id on vocabulary_items
- New `vocabulary_lists` uses junction table for M:N (word in multiple lists)
- Keep existing collections for backward compatibility, lists are additive feature
- UI should support drag-drop or checkbox selection for bulk operations

## Requirements

### Functional
- [ ] CRUD operations for vocabulary lists
- [ ] Add/remove words to/from lists (bulk support)
- [ ] View words in a specific list with pagination
- [ ] List progress stats (total words, learned count, due for review)
- [ ] Share list publicly (toggle is_public)

### Non-Functional
- [ ] API response < 200ms for list operations
- [ ] Optimistic UI updates for smooth UX
- [ ] Mobile-friendly list management UI

## Architecture

### API Endpoints

```
GET    /api/lists              - Get user's lists
POST   /api/lists              - Create new list
GET    /api/lists/[id]         - Get list details + words
PUT    /api/lists/[id]         - Update list (name, description, color)
DELETE /api/lists/[id]         - Delete list (cascade junction entries)

POST   /api/lists/[id]/words   - Add words to list (bulk)
DELETE /api/lists/[id]/words   - Remove words from list (bulk)
```

### Data Flow

```
User creates list → POST /api/lists → Insert vocabulary_lists
User adds words → POST /api/lists/[id]/words → Insert list_vocabulary_items
User views list → GET /api/lists/[id] → Join vocabulary_items via junction
```

## Related Code Files

### Files to Create
- `src/app/api/lists/route.ts` - List CRUD (GET, POST)
- `src/app/api/lists/[id]/route.ts` - Single list (GET, PUT, DELETE)
- `src/app/api/lists/[id]/words/route.ts` - Word assignment (POST, DELETE)
- `src/app/(protected)/lists/page.tsx` - Lists overview page
- `src/app/(protected)/lists/[id]/page.tsx` - Single list view
- `src/components/lists/vocabulary-list-card.tsx` - List card component
- `src/components/lists/add-words-to-list-dialog.tsx` - Word selection dialog
- `src/hooks/use-vocabulary-lists.ts` - Lists data fetching hook

### Files to Modify
- `src/types/index.ts` - Add list-related types
- `src/app/(protected)/layout.tsx` - Add Lists nav item
- `src/components/vocabulary/VocabularyCard.tsx` - Add "Add to List" action

## Implementation Steps

### 1. API Routes (2h)

```typescript
// src/app/api/lists/route.ts
// GET: Fetch user's lists with word counts
// POST: Create new list

// src/app/api/lists/[id]/route.ts
// GET: Fetch list with words (paginated)
// PUT: Update list metadata
// DELETE: Delete list

// src/app/api/lists/[id]/words/route.ts
// POST: { wordIds: string[] } - Add words to list
// DELETE: { wordIds: string[] } - Remove words from list
```

### 2. TypeScript Types (0.5h)

```typescript
// Add to src/types/index.ts
export interface VocabularyList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  isPublic: boolean;
  wordCount: number;
  learnedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListVocabularyItem {
  id: string;
  listId: string;
  vocabularyItemId: string;
  addedAt: Date;
}
```

### 3. Custom Hook (0.5h)

```typescript
// src/hooks/use-vocabulary-lists.ts
export function useVocabularyLists() {
  // Fetch lists with SWR or React Query pattern
  // Return: lists, loading, error, createList, deleteList
}
```

### 4. UI Components (2h)

- `vocabulary-list-card.tsx`: Display list with name, color badge, word count, progress bar
- `add-words-to-list-dialog.tsx`: Dialog with checkbox list of user's vocabulary
- Update `VocabularyCard.tsx`: Add dropdown menu item "Add to List"

### 5. Pages (1h)

- `/lists` page: Grid of list cards, "Create List" button
- `/lists/[id]` page: List details, word grid, edit/delete actions

## Todo List

- [ ] Create API route: GET/POST /api/lists
- [ ] Create API route: GET/PUT/DELETE /api/lists/[id]
- [ ] Create API route: POST/DELETE /api/lists/[id]/words
- [ ] Add TypeScript interfaces for lists
- [ ] Create useVocabularyLists hook
- [ ] Build VocabularyListCard component
- [ ] Build AddWordsToListDialog component
- [ ] Create /lists page
- [ ] Create /lists/[id] page
- [ ] Add navigation link to layout
- [ ] Update VocabularyCard with "Add to List" action

## Success Criteria

- [ ] User can create/edit/delete vocabulary lists
- [ ] User can add same word to multiple lists
- [ ] List shows accurate word count and learned progress
- [ ] Public lists can be viewed by other users (via share link)
- [ ] All operations have proper error handling and loading states

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Slow queries with large lists | Medium | Medium | Pagination, proper indexes |
| UI confusion with lists vs collections | Medium | Low | Clear labeling, tooltip explanations |
| Bulk operations timeout | Low | Medium | Batch in chunks of 50 |

## Security Considerations

- Verify user owns list before CRUD operations
- RLS policy: users can only see own lists + public lists
- Validate wordIds belong to user before adding to list

## Next Steps

After this phase:
- Phase 3: Import vocabulary from external sources
- Consider: Migrate existing collections to lists (optional)
