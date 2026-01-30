# Phase 5: Enhanced Progress Tracking & Statistics Dashboard

## Context Links

- [Phase 1: Database Schema](./phase-01-database-schema-and-migrations.md)
- [Existing Stats API](../../src/app/api/stats/route.ts)
- [Progress Page](../../src/app/(protected)/progress/page.tsx)
- [SRS Types](../../src/types/index.ts)

## Overview

| Field | Value |
|-------|-------|
| Priority | P2 |
| Status | pending |
| Effort | 6h |
| Dependencies | Phases 1-4 complete |

Build comprehensive statistics dashboard showing vocabulary progress across personal lists, subscribed courses, HSK levels, and SRS review status. Includes visualizations and insights.

## Key Insights

- Existing system tracks: streaks, practice sessions, SRS intervals
- New tracking needed: per-list progress, per-course progress, HSK distribution
- Word states: new → learning → reviewing → mastered
- Dashboard should motivate users with achievements and progress visualization

## Requirements

### Functional
- [ ] Overall vocabulary statistics (total words, mastered, learning)
- [ ] Per-list progress (words learned/total, completion %)
- [ ] Per-course progress (synced with course_subscriptions)
- [ ] HSK level distribution chart
- [ ] Word state breakdown (new/learning/reviewing/mastered)
- [ ] Weekly/monthly activity heatmap
- [ ] Due reviews count and upcoming schedule
- [ ] Learning insights (weak areas, suggested focus)

### Non-Functional
- [ ] Dashboard loads < 1 second
- [ ] Statistics cached and updated periodically
- [ ] Mobile-responsive charts
- [ ] Accessible data visualizations

## Architecture

### Word State Definitions

```
NEW: Never practiced (repetitions = 0)
LEARNING: In initial learning phase (repetitions 1-2, interval < 7 days)
REVIEWING: Regular SRS review (repetitions 3+, interval 7-30 days)
MASTERED: Long-term memory (interval > 30 days OR marked is_learned)
```

### Statistics Data Model

```typescript
interface VocabularyStats {
  // Overall
  totalWords: number;
  wordsByState: { new: number; learning: number; reviewing: number; mastered: number };

  // HSK Distribution
  hskDistribution: { level: number; count: number }[];

  // Progress
  listsProgress: { listId: string; name: string; total: number; learned: number }[];
  coursesProgress: { courseId: string; name: string; progressPercent: number }[];

  // Activity
  streakDays: number;
  longestStreak: number;
  weeklyActivity: { date: string; wordsReviewed: number }[];

  // Reviews
  dueToday: number;
  dueThisWeek: number;
  upcomingReviews: { date: string; count: number }[];

  // Insights
  weakAreas: { word: string; correctRate: number }[];
  suggestedFocus: string[];
}
```

### API Aggregation Queries

```sql
-- Word state counts
SELECT
  COUNT(*) FILTER (WHERE repetitions = 0) as new,
  COUNT(*) FILTER (WHERE repetitions BETWEEN 1 AND 2 AND interval_days < 7) as learning,
  COUNT(*) FILTER (WHERE repetitions >= 3 AND interval_days BETWEEN 7 AND 30) as reviewing,
  COUNT(*) FILTER (WHERE interval_days > 30 OR is_learned = true) as mastered
FROM vocabulary_items WHERE user_id = $1;

-- HSK distribution
SELECT hsk_level, COUNT(*)
FROM vocabulary_items
WHERE user_id = $1 AND hsk_level IS NOT NULL
GROUP BY hsk_level ORDER BY hsk_level;

-- Weekly activity (last 7 days)
SELECT DATE(created_at) as date, COUNT(*) as reviews
FROM word_practice_attempts
WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at);

-- Due reviews
SELECT COUNT(*) FROM vocabulary_items
WHERE user_id = $1 AND next_review_date <= CURRENT_DATE;
```

## Related Code Files

### Files to Create
- `src/app/api/stats/detailed/route.ts` - Comprehensive stats endpoint
- `src/app/api/stats/lists/route.ts` - Per-list progress
- `src/app/api/stats/courses/route.ts` - Per-course progress
- `src/components/dashboard/stats-overview-cards.tsx` - Summary cards
- `src/components/dashboard/hsk-distribution-chart.tsx` - HSK pie/bar chart
- `src/components/dashboard/word-state-progress.tsx` - State breakdown
- `src/components/dashboard/activity-heatmap.tsx` - Weekly activity
- `src/components/dashboard/due-reviews-widget.tsx` - Upcoming reviews
- `src/components/dashboard/learning-insights-panel.tsx` - AI-powered insights
- `src/hooks/use-vocabulary-stats.ts` - Stats data hook

### Files to Modify
- `src/app/(protected)/progress/page.tsx` - Replace with new dashboard
- `src/types/index.ts` - Add stats-related types

## Implementation Steps

### 1. TypeScript Types (0.5h)

```typescript
// Add to src/types/index.ts
export type WordState = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface VocabularyStats {
  totalWords: number;
  wordsByState: Record<WordState, number>;
  hskDistribution: { level: number; count: number }[];
  dueToday: number;
  dueThisWeek: number;
  streakDays: number;
  longestStreak: number;
}

export interface ListProgress {
  listId: string;
  name: string;
  color: string;
  totalWords: number;
  learnedWords: number;
  progressPercent: number;
}

export interface WeeklyActivity {
  date: string;
  wordsReviewed: number;
  minutesPracticed: number;
}
```

### 2. Stats API Endpoints (2h)

```typescript
// GET /api/stats/detailed
// Returns comprehensive VocabularyStats object

// GET /api/stats/lists
// Returns ListProgress[] for user's lists

// GET /api/stats/courses
// Returns course progress from course_subscriptions

// GET /api/stats/activity?days=30
// Returns WeeklyActivity[] for heatmap
```

### 3. Dashboard Components (2.5h)

#### StatsOverviewCards
```typescript
// 4 cards: Total Words, Mastered, Due Today, Streak
// Icons + numbers + trend indicator
```

#### HskDistributionChart
```typescript
// Bar chart or pie chart showing HSK level breakdown
// Use recharts or chart.js (already may exist)
```

#### WordStateProgress
```typescript
// Horizontal stacked bar: new | learning | reviewing | mastered
// With percentages and counts
```

#### ActivityHeatmap
```typescript
// GitHub-style contribution graph
// Color intensity = words reviewed that day
// Last 12 weeks
```

#### DueReviewsWidget
```typescript
// Card showing: Due today, Due this week
// "Start Review" button
// Mini calendar with due dates highlighted
```

#### LearningInsightsPanel
```typescript
// AI-generated suggestions:
// - "Focus on HSK 3 words this week"
// - "You're weak on tone marks - try listening practice"
// - "Great streak! Keep it up!"
```

### 4. Progress Page Redesign (1h)

```typescript
// src/app/(protected)/progress/page.tsx
// Layout:
// - Top: StatsOverviewCards (4 columns)
// - Middle Left: WordStateProgress + HskDistributionChart
// - Middle Right: DueReviewsWidget + ActivityHeatmap
// - Bottom: ListProgress cards + CourseProgress cards
// - Sidebar: LearningInsightsPanel
```

## Todo List

- [ ] Add TypeScript interfaces for stats
- [ ] Create GET /api/stats/detailed endpoint
- [ ] Create GET /api/stats/lists endpoint
- [ ] Create GET /api/stats/courses endpoint
- [ ] Create GET /api/stats/activity endpoint
- [ ] Build StatsOverviewCards component
- [ ] Build HskDistributionChart component
- [ ] Build WordStateProgress component
- [ ] Build ActivityHeatmap component
- [ ] Build DueReviewsWidget component
- [ ] Build LearningInsightsPanel component
- [ ] Redesign /progress page with new dashboard
- [ ] Add useVocabularyStats hook
- [ ] Test with various data scenarios (new user, power user)

## Success Criteria

- [ ] Dashboard shows accurate word counts by state
- [ ] HSK distribution reflects actual vocabulary
- [ ] Per-list and per-course progress displays correctly
- [ ] Activity heatmap shows last 12 weeks
- [ ] Due reviews count matches actual due words
- [ ] Page loads within 1 second
- [ ] Mobile responsive layout works

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Slow aggregation queries | Medium | Medium | Database indexes, caching |
| Chart library bundle size | Low | Low | Lazy load charts |
| Stale statistics | Medium | Low | Add refresh button, cache TTL |
| Complex mobile layout | Medium | Medium | Simplify for mobile view |

## Security Considerations

- Stats endpoints require authentication
- Only return stats for authenticated user's data
- Don't expose other users' statistics

## Next Steps

After this phase:
- Full feature complete
- Consider: Export statistics as PDF/image
- Consider: Compare progress with community averages
- Consider: Achievement badges/gamification
