---
title: "Vocabulary Management System"
description: "Comprehensive vocabulary lists, external imports, community courses, level organization, and enhanced tracking"
status: pending
priority: P2
effort: 32h
branch: main
tags: [vocabulary, lists, import, courses, tracking, hsk]
created: 2026-01-27
---

# Vocabulary Management System Implementation Plan

## Overview

Extend AI Image Dictionary with advanced vocabulary management: personal lists (many-to-many), external content import (YouTube/articles), community courses, HSK level organization, and enhanced progress tracking.

## Phases

| Phase | Title | Effort | Status |
|-------|-------|--------|--------|
| [1](./phase-01-database-schema-and-migrations.md) | Database Schema & Migrations | 4h | pending |
| [2](./phase-02-personal-vocabulary-lists-api-and-ui.md) | Personal Lists API & UI | 6h | pending |
| [3](./phase-03-import-vocabulary-from-external-sources.md) | Import from External Sources | 8h | pending |
| [4](./phase-04-community-vocabulary-courses-system.md) | Community Courses System | 8h | pending |
| [5](./phase-05-enhanced-progress-tracking-and-statistics-dashboard.md) | Enhanced Tracking & Dashboard | 6h | pending |

## Key Dependencies

- Existing: `vocabulary_items`, `collections`, `profiles`, SRS system (migrations applied)
- New packages: `youtube-transcript-plus`, `cheerio`, `@upstash/ratelimit`, `@upstash/redis`
- External: Groq API (vocabulary extraction), Upstash Redis (caching)

## Architecture Summary

```
vocabulary_lists (1:N user, M:N vocabulary_items)
    ├── list_vocabulary_items (junction)
    ├── vocabulary_courses (public/private, subscribers)
    │   ├── course_vocabulary_items
    │   └── course_subscribers
    └── vocabulary_imports (sources: youtube, url, text)
```

## Success Criteria

1. Users can create/manage unlimited personal lists
2. Import vocabulary from YouTube videos and articles
3. Browse and subscribe to community courses
4. Filter vocabulary by HSK level (1-6)
5. Dashboard shows per-list/course progress stats

## Risk Assessment

- YouTube transcript API may break (mitigation: fallback packages)
- Redis required for rate limiting (mitigation: start with in-memory dev mode)
- Community courses need moderation (mitigation: flag/report system)

## Reports

- [URL Extraction Research](./research/researcher-url-extraction.md)

## Validation Summary

**Validated:** 2026-01-27
**Questions asked:** 6

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| Collections vs Lists overlap | Keep both systems separate - collections for simple tags, lists for M:N |
| Community course moderation | User report/flag system only |
| Rate limiting infrastructure | Use Upstash Redis (production-ready) |
| Course words to personal vocab | No auto-copy - user explicitly adds words |
| Pre-built HSK courses | Seed during migration with comprehensive word lists |
| Activity heatmap | Include in MVP dashboard |

### Action Items

- [ ] Add report/flag table and endpoints for course moderation (Phase 4)
- [ ] Expand HSK course seeding to include full word lists (not just 50 samples) (Phase 1)
- [ ] Ensure Upstash Redis env vars documented in setup guide
