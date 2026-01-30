# Phase 4: Community Vocabulary Courses System

## Context Links

- [Phase 1: Database Schema](./phase-01-database-schema-and-migrations.md)
- [Phase 2: Personal Lists](./phase-02-personal-vocabulary-lists-api-and-ui.md)
- [System Architecture](../../docs/system-architecture.md)
- [Code Standards](../../docs/code-standards.md)

## Overview

| Field | Value |
|-------|-------|
| Priority | P2 |
| Status | pending |
| Effort | 8h |
| Dependencies | Phase 1 complete |

Build community courses feature: users create curated vocabulary courses, others subscribe and track progress. Includes ratings, difficulty levels, and discovery system.

## Key Insights

- Courses are distinct from personal lists (curated content, public by default)
- Course words are independent copies (not linked to creator's vocabulary_items)
- Subscribers track progress separately per course
- Rating system helps surface quality content
- HSK-aligned difficulty levels (1-6) for filtering

## Requirements

### Functional
- [ ] Create/edit/delete vocabulary courses
- [ ] Add ordered vocabulary to course (not linked to personal vocab)
- [ ] Publish/unpublish courses
- [ ] Browse public courses with filters (difficulty, rating, topic)
- [ ] Subscribe to courses
- [ ] Track per-course progress (words learned, completion %)
- [ ] Rate and review courses (1-5 stars)
- [ ] Copy course words to personal vocabulary

### Non-Functional
- [ ] Course discovery page loads < 500ms
- [ ] Pagination for course listings (20 per page)
- [ ] Search by course name/description
- [ ] Sort by: newest, popular, rating

## Architecture

### Course Structure

```
vocabulary_courses
├── course_vocabulary_items (ordered word list)
│   └── Contains: zh, pinyin, en, example, hsk_level, sort_order
├── course_subscriptions (user progress)
│   └── Contains: progress_percent, words_learned, last_practiced_at
└── course_ratings (reviews)
    └── Contains: rating (1-5), review text
```

### User Flows

```
Creator Flow:
1. Create course (name, description, difficulty)
2. Add vocabulary words (manual entry or import from list)
3. Arrange word order
4. Publish course

Learner Flow:
1. Browse/search courses
2. View course details (word count, rating, preview)
3. Subscribe to course
4. Practice words (uses existing SRS system)
5. Track progress on dashboard
6. Rate course after completing
```

## Related Code Files

### Files to Create
- `src/app/api/courses/route.ts` - List/create courses
- `src/app/api/courses/[id]/route.ts` - Get/update/delete course
- `src/app/api/courses/[id]/words/route.ts` - Course vocabulary CRUD
- `src/app/api/courses/[id]/subscribe/route.ts` - Subscribe/unsubscribe
- `src/app/api/courses/[id]/rate/route.ts` - Rate course
- `src/app/(protected)/courses/page.tsx` - Browse courses
- `src/app/(protected)/courses/[id]/page.tsx` - Course details
- `src/app/(protected)/courses/create/page.tsx` - Create course
- `src/app/(protected)/courses/[id]/edit/page.tsx` - Edit course
- `src/components/courses/course-card.tsx` - Course preview card
- `src/components/courses/course-word-editor.tsx` - Add/edit words
- `src/components/courses/course-rating-dialog.tsx` - Rating modal
- `src/components/courses/course-progress-bar.tsx` - Progress display
- `src/hooks/use-courses.ts` - Courses data hook
- `src/hooks/use-course-progress.ts` - Progress tracking hook

### Files to Modify
- `src/types/index.ts` - Add course-related types
- `src/app/(protected)/layout.tsx` - Add Courses nav item
- `src/app/(protected)/practice/page.tsx` - Support practicing course words

## Implementation Steps

### 1. TypeScript Types (0.5h)

```typescript
// Add to src/types/index.ts
export interface VocabularyCourse {
  id: string;
  creatorId: string;
  creatorName?: string;
  name: string;
  description: string;
  coverImageUrl?: string;
  difficultyLevel: 1 | 2 | 3 | 4 | 5 | 6;
  isPublished: boolean;
  subscriberCount: number;
  ratingAvg: number | null;
  ratingCount: number;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseVocabularyItem {
  id: string;
  courseId: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  exampleSentence?: string;
  hskLevel?: number;
  sortOrder: number;
  createdAt: Date;
}

export interface CourseSubscription {
  id: string;
  userId: string;
  courseId: string;
  progressPercent: number;
  wordsLearned: number;
  lastPracticedAt?: Date;
  subscribedAt: Date;
}

export interface CourseRating {
  id: string;
  userId: string;
  courseId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  review?: string;
  createdAt: Date;
}
```

### 2. API Routes - Course CRUD (2h)

```typescript
// GET /api/courses - Browse public courses
// Query: ?difficulty=3&sort=rating&search=hsk&page=1
// Returns: { courses: VocabularyCourse[], total: number }

// POST /api/courses - Create course
// Body: { name, description, difficultyLevel }

// GET /api/courses/[id] - Get course with words
// Returns: { course, words: CourseVocabularyItem[], isSubscribed }

// PUT /api/courses/[id] - Update course (creator only)
// DELETE /api/courses/[id] - Delete course (creator only)
```

### 3. API Routes - Words & Subscription (2h)

```typescript
// POST /api/courses/[id]/words - Add word to course
// PUT /api/courses/[id]/words - Reorder words
// DELETE /api/courses/[id]/words/[wordId] - Remove word

// POST /api/courses/[id]/subscribe - Subscribe to course
// DELETE /api/courses/[id]/subscribe - Unsubscribe

// POST /api/courses/[id]/rate - Rate course
// Body: { rating: 1-5, review?: string }
```

### 4. Browse Courses Page (1.5h)

```typescript
// src/app/(protected)/courses/page.tsx
// Features:
// - Search bar
// - Difficulty filter (HSK 1-6)
// - Sort dropdown (newest, popular, rating)
// - Grid of CourseCard components
// - Pagination
```

### 5. Course Details Page (1h)

```typescript
// src/app/(protected)/courses/[id]/page.tsx
// Features:
// - Course header (name, creator, rating, subscribers)
// - Word list preview (first 10 words)
// - Subscribe/Unsubscribe button
// - Progress bar (if subscribed)
// - Start Practice button
// - Rate button (after some progress)
```

### 6. Course Editor (1h)

```typescript
// src/app/(protected)/courses/create/page.tsx
// src/app/(protected)/courses/[id]/edit/page.tsx
// Features:
// - Form: name, description, difficulty, cover image
// - Word list editor with drag-drop reorder
// - Add word form (zh, pinyin, en, example)
// - Import from personal vocabulary option
// - Publish toggle
```

## Todo List

- [ ] Add TypeScript interfaces for courses
- [ ] Create GET/POST /api/courses endpoint
- [ ] Create GET/PUT/DELETE /api/courses/[id] endpoint
- [ ] Create words management endpoints
- [ ] Create subscribe/unsubscribe endpoint
- [ ] Create rating endpoint
- [ ] Build CourseCard component
- [ ] Build CourseWordEditor component
- [ ] Build CourseRatingDialog component
- [ ] Build CourseProgressBar component
- [ ] Create /courses browse page
- [ ] Create /courses/[id] details page
- [ ] Create /courses/create page
- [ ] Create /courses/[id]/edit page
- [ ] Add Courses navigation link
- [ ] Integrate with practice system
- [ ] Update subscriber_count trigger (denormalization)

## Success Criteria

- [ ] Users can create and publish vocabulary courses
- [ ] Public courses discoverable via browse/search
- [ ] Users can subscribe and track progress
- [ ] Rating system updates course average
- [ ] Course words can be practiced with SRS
- [ ] Creator can edit/unpublish their courses

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low-quality courses spam | Medium | Medium | Report/flag system, min word count |
| Copyright content in courses | Medium | High | Terms of service, DMCA process |
| Progress sync complexity | Medium | Medium | Keep progress simple (% learned) |
| Performance with many courses | Low | Medium | Proper indexes, pagination |

## Security Considerations

- Only creator can edit/delete their course
- RLS: published courses readable by all
- Rate limiting on course creation (5/day)
- Validate word data before saving
- Sanitize user-generated content (XSS prevention)

## Next Steps

After this phase:
- Phase 5: Enhanced tracking dashboard
- Consider: Course categories/tags
- Consider: Featured courses curation
- Consider: Course comments/discussions
