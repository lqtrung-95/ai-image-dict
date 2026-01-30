# Code Review Report - AI Image Dictionary

**Date:** 2026-01-30
**Scope:** Full codebase review
**Files Analyzed:** ~50+ source files
**Lines of Code:** ~8,900 lines

---

## 1. Current Features

### Core Functionality
| Feature | Status | Description |
|---------|--------|-------------|
| AI Photo Analysis | Complete | Groq Llama 4 Scout vision model integration |
| Vocabulary Management | Complete | CRUD operations, search, filtering by lists |
| Flashcard Practice | Complete | SRS (Spaced Repetition System) with 4-button rating |
| Text-to-Speech | Complete | Google Cloud TTS + Web Speech API fallback |
| User Authentication | Complete | Supabase Auth with email/password |
| Word Collections | Complete | Lists with colors, M:N vocabulary relationship |
| Progress Tracking | Complete | Streaks, activity heatmap, HSK distribution |
| Daily Goals | Complete | Configurable targets for words/reviews/time |
| Courses | Complete | Community-shared curated vocabulary sets |
| Import System | Complete | URL and text-based vocabulary import |
| Trial Mode | Complete | 2 free analyses without signup |
| Rate Limiting | Complete | 6 analyses/day for free users |

### Practice Modes
- Flashcards with SRS (Again/Hard/Good/Easy)
- Multiple choice quiz
- Listening quiz
- Pinyin typing quiz

---

## 2. UI/UX Issues

### Critical
| Issue | Location | Impact |
|-------|----------|--------|
| No loading states on API calls | vocabulary/page.tsx | Users may click multiple times |
| Missing error boundaries | Most pages | App crash on errors |

### High Priority
| Issue | Location | Recommendation |
|-------|----------|----------------|
| Mobile camera UX | capture/page.tsx | Add camera permission handling UI |
| No empty state for courses | courses/page.tsx | Add "No courses yet" message |
| Flashcard 3D transform | FlashCard.tsx | Add `transform-style: preserve-3d` CSS |
| Pagination not implemented | vocabulary/page.tsx | Line 217 has TODO comment |

### Medium Priority
| Issue | Recommendation |
|-------|----------------|
| Dark mode only | Consider light mode toggle |
| No keyboard shortcuts | Add space to flip, 1-4 to rate |
| No swipe gestures on mobile | Add swipe to navigate flashcards |
| Confetti/micro-interactions missing | Add celebration on streak milestones |

### Accessibility Issues
- Missing `aria-label` on icon-only buttons in some components
- No focus trap in modals
- No skip-to-content link
- Color contrast on some purple text may fail WCAG AA

---

## 3. Code Quality

### Architecture Strengths
- Clean separation of concerns (components, hooks, lib)
- Proper use of Next.js App Router
- Supabase SSR client correctly implemented
- TypeScript types well-defined
- Consistent error handling patterns

### Code Patterns
```
Good:
- Custom hooks for reusable logic (useAuth, useSpeech, useAnalyze)
- Optimistic updates in UI
- Debounced search
- Proper cleanup in useEffect

Needs Improvement:
- Some components over 200 lines (VocabularyCard.tsx: 483 lines)
- Inline types instead of shared interfaces in some places
- Magic numbers not extracted as constants
```

### Potential Bugs

#### Bug 1: Race Condition in VocabularyCard
**File:** `/src/components/vocabulary/VocabularyCard.tsx`
**Line:** 153-167
**Issue:** `fetchLists` called on every dropdown open, no caching
**Fix:** Add caching or React Query

#### Bug 2: Missing Error Handling
**File:** `/src/app/(protected)/vocabulary/page.tsx`
**Line:** 56-60
**Issue:** Silent fail on fetch error
**Fix:** Add toast notification

#### Bug 3: Memory Leak
**File:** `/src/hooks/useSpeech.ts`
**Line:** 20-28
**Issue:** `URL.createObjectURL` not revoked
**Fix:** Add `URL.revokeObjectURL(audioUrl)` in cleanup

#### Bug 4: Type Safety Gap
**File:** `/src/app/api/analyze/route.ts`
**Line:** 102-109
**Issue:** Inline interface definition, should use shared types
**Fix:** Move to `/src/types/index.ts`

---

## 4. Missing Features for Public Release

### Critical (Must Have)
| Feature | Priority | Effort |
|---------|----------|--------|
| Password reset flow | P0 | 2h |
| Email verification enforcement | P0 | 2h |
| Rate limiting on auth endpoints | P0 | 4h |
| Data export (CSV/JSON) | P0 | 4h |
| Account deletion (GDPR) | P0 | 3h |

### High Priority
| Feature | Priority | Effort |
|---------|----------|--------|
| Premium subscription (Stripe) | P1 | 16h |
| Offline mode / PWA | P1 | 12h |
| Word audio preloading | P1 | 4h |
| Bulk import from CSV | P1 | 6h |
| HSK test simulation | P1 | 8h |

### Medium Priority
| Feature | Priority | Effort |
|---------|----------|--------|
| Social sharing (cards) | P2 | 6h |
| Leaderboards | P2 | 8h |
| Word of the day | P2 | 4h |
| Dark/light theme | P2 | 4h |
| i18n (Chinese UI) | P2 | 12h |

---

## 5. Security Concerns

### Critical
| Issue | Location | Risk | Fix |
|-------|----------|------|-----|
| No input sanitization on search | vocabulary/route.ts | SQL injection possible | Use parameterized queries |
| API key exposed in client | None found | - | Good - all keys server-side |

### High Priority
| Issue | Location | Risk | Fix |
|-------|----------|------|-----|
| No rate limiting on TTS | tts/route.ts | Abuse possible | Add per-user rate limit |
| No file type validation on upload | utils.ts | Upload non-images | Add MIME type check |
| No max length on text inputs | Multiple | DoS via large payloads | Add maxLength validation |

### Medium Priority
| Issue | Location | Recommendation |
|-------|----------|----------------|
| No CSP headers | next.config.ts | Add Content-Security-Policy |
| No CORS configuration | API routes | Explicitly configure CORS |
| Session not invalidated on logout | useAuth.ts | Call supabase.auth.signOut() properly |

### Security Score: 7/10
- Good: RLS enabled on all tables
- Good: No secrets in client bundle
- Good: Proper auth checks on API routes
- Needs work: Input validation, rate limiting

---

## 6. Performance Analysis

### Current State
| Metric | Status | Notes |
|--------|--------|-------|
| Build time | Good | 2.7s compile |
| Bundle size | Unknown | Need analysis |
| Image optimization | Good | Next.js Image + compression |
| Database queries | Good | Proper indexes |

### Recommendations
1. **Add React Query** - Caching, deduplication, background refetch
2. **Virtualize long lists** - React Virtual for vocabulary lists > 100 items
3. **Lazy load modals** - Dynamic imports for WordDetailModal
4. **Audio preloading** - Preload TTS for next 3 words in practice

---

## 7. Database Schema Review

### Strengths
- Proper foreign key relationships
- RLS policies on all tables
- Appropriate indexes
- Normalized structure

### Concerns
- No soft deletes (hard delete only)
- No audit logging
- `next_review_date` is date, not timestamp (timezone issues possible)

---

## 8. Linting & TypeScript

### ESLint Results
- **Errors:** 0 in src/ (all in .claude/hooks/ test files)
- **Warnings:** Minor unused vars in test files

### TypeScript
- Strict mode enabled
- No type errors on build
- Good type coverage

---

## 9. Recommended Actions (Prioritized)

### Week 1 (Critical)
1. Implement password reset flow
2. Add input sanitization on search
3. Fix memory leak in useSpeech
4. Add rate limiting to TTS endpoint

### Week 2 (High Priority)
1. Implement pagination on vocabulary page
2. Add error boundaries
3. Add loading states
4. Create data export feature

### Week 3 (Medium Priority)
1. Add keyboard shortcuts for practice
2. Implement PWA offline mode
3. Add CSP headers
4. Create account deletion flow

---

## 10. Positive Observations

### Well Done
- Clean, consistent code style
- Good use of TypeScript
- Proper error handling in API routes
- Thoughtful UI with loading skeletons
- Mobile-responsive design
- Good documentation in /docs
- Proper git workflow with migrations
- SRS algorithm implementation
- Activity heatmap visualization

### Code Highlights
```typescript
// Good: Optimistic updates
setItems((prev) =>
  prev.map((i) => (i.id === id ? { ...i, is_learned: !i.is_learned } : i))
);

// Good: Debounced search
const debouncedSearch = useCallback(
  debounce((query: string) => {
    fetchVocabulary(query);
  }, 300),
  [fetchVocabulary]
);

// Good: Fallback pattern in TTS
const googleSuccess = await speakWithGoogle(text);
if (!googleSuccess) {
  speakWithWebSpeech(text, lang);
}
```

---

## Summary

**Overall Rating: 8/10**

The codebase is well-structured, follows modern React patterns, and has good TypeScript coverage. The main areas needing attention before public release are:

1. **Security:** Add input validation and rate limiting
2. **UX:** Complete pagination, add keyboard shortcuts
3. **Features:** Password reset, data export, offline mode
4. **Performance:** Add React Query, virtualize lists

The foundation is solid and the app is feature-rich. With the recommended fixes, it's ready for public beta.

---

## Unresolved Questions

1. What is the planned monetization model (subscription tiers)?
2. Are there plans for team/classroom features?
3. What is the target MAU for initial launch?
4. Is there a backup strategy for user data?
