# AI Image Dictionary - React Native Migration Analysis Report

## Executive Summary

The AI Image Dictionary codebase is a Next.js web application with Capacitor integration already started. This report identifies all components requiring migration to React Native.

---

## 1. PAGES (src/app/(protected)/)

| File | Status | Migration Notes |
|------|--------|-----------------|
| `layout.tsx` | REWRITE | Next.js-specific auth layout - needs React Native auth wrapper |
| `capture/page.tsx` | ADAPT | Uses web camera - use existing `capture-native/page.tsx` pattern |
| `capture-native/page.tsx` | REUSE | Already uses Capacitor Camera - migrate as-is |
| `upload/page.tsx` | ADAPT | File upload - use Capacitor Filesystem or native picker |
| `analysis/[id]/page.tsx` | ADAPT | Uses `useRouter` - replace with React Navigation |
| `vocabulary/page.tsx` | ADAPT | Heavy use of Next.js Link - replace with navigation |
| `practice/page.tsx` | ADAPT | Uses Next.js router - needs navigation refactor |
| `quiz/page.tsx` | ADAPT | Same as practice - navigation refactor needed |
| `progress/page.tsx` | ADAPT | Uses Next.js Link components |
| `settings/page.tsx` | ADAPT | Uses Next.js Link - navigation refactor |
| `settings/components/*.tsx` | ADAPT | Profile and account management sections |
| `lists/page.tsx` | ADAPT | Uses Next.js Link and Dialog components |
| `lists/[id]/page.tsx` | ADAPT | Dynamic route - needs React Navigation params |
| `courses/page.tsx` | ADAPT | Uses Next.js Link and fetch |
| `courses/[id]/page.tsx` | ADAPT | Dynamic route with params |
| `courses/create/page.tsx` | ADAPT | Form page - navigation refactor |
| `courses/[id]/edit/page.tsx` | ADAPT | Dynamic edit route |
| `games/page.tsx` | ADAPT | Uses Next.js router for game mode switching |
| `games/components/matching-game.tsx` | ADAPT | Game logic reusable, UI needs React Native |
| `games/components/quiz-game.tsx` | ADAPT | Game logic reusable, UI needs React Native |
| `stories/page.tsx` | ADAPT | Uses Next.js Link |
| `stories/[id]/page.tsx` | ADAPT | Dynamic route |
| `stories/new/page.tsx` | ADAPT | Form page |
| `history/page.tsx` | ADAPT | Uses Next.js Link |
| `import/page.tsx` | ADAPT | File import - may need native file picker |

---

## 2. COMPONENTS (src/components/)

### UI Components (shadcn/radix - need React Native equivalents)
| File | Status | Migration Notes |
|------|--------|-----------------|
| `ui/button.tsx` | REWRITE | Use React Native Button/TouchableOpacity |
| `ui/card.tsx` | REWRITE | Use React Native View with styling |
| `ui/dialog.tsx` | REWRITE | Use React Native Modal |
| `ui/dropdown-menu.tsx` | REWRITE | Use React Native Picker or custom menu |
| `ui/input.tsx` | REWRITE | Use React Native TextInput |
| `ui/textarea.tsx` | REWRITE | Use React Native TextInput multiline |
| `ui/select.tsx` | REWRITE | Use React Native Picker |
| `ui/switch.tsx` | REWRITE | Use React Native Switch |
| `ui/avatar.tsx` | REWRITE | Custom Avatar component |
| `ui/label.tsx` | REWRITE | Use React Native Text |
| `ui/progress.tsx` | REWRITE | Custom ProgressBar component |
| `ui/skeleton.tsx` | REWRITE | Custom Skeleton placeholder |
| `ui/loading.tsx` | REWRITE | ActivityIndicator wrapper |
| `ui/sonner.tsx` | REWRITE | Use react-native-toast-message |
| `ui/error-boundary.tsx` | REWRITE | React Native Error Boundary |

### Feature Components
| File | Status | Migration Notes |
|------|--------|-----------------|
| `camera/CameraCapture.tsx` | REPLACE | Use `use-native-camera.ts` hook instead |
| `analysis/AnalysisResult.tsx` | ADAPT | Remove Next.js Link, use navigation |
| `analysis/AnalysisSkeleton.tsx` | ADAPT | Convert to React Native |
| `analysis/TrialResult.tsx` | ADAPT | Convert to React Native |
| `vocabulary/VocabularyCard.tsx` | ADAPT | Heavy component - needs full rewrite for RN |
| `vocabulary/VocabularyCardSkeleton.tsx` | ADAPT | Convert styling |
| `vocabulary/WordDetailModal.tsx` | ADAPT | Use React Native Modal |
| `practice/FlashCard.tsx` | ADAPT | Flip animation needs react-native-reanimated |
| `quiz/MultipleChoiceQuiz.tsx` | ADAPT | Quiz logic reusable |
| `quiz/ListeningQuiz.tsx` | ADAPT | Uses `useSpeech` hook - should work |
| `quiz/TypePinyinQuiz.tsx` | ADAPT | Text input handling |
| `dashboard/DashboardHome.tsx` | ADAPT | Remove Next.js Link, use navigation |
| `dashboard/stats-overview-cards.tsx` | ADAPT | Styling changes |
| `dashboard/word-state-progress-bar.tsx` | ADAPT | Progress bar styling |
| `dashboard/hsk-distribution-chart.tsx` | ADAPT | Use react-native-chart-kit |
| `dashboard/activity-heatmap.tsx` | ADAPT | Custom heatmap implementation |
| `layout/Header.tsx` | REWRITE | Navigation header - React Native specific |
| `lists/vocabulary-list-card.tsx` | ADAPT | Card component rewrite |
| `lists/add-words-to-list-dialog.tsx` | ADAPT | Use Modal |
| `courses/course-card.tsx` | ADAPT | Card rewrite |
| `word-of-day/word-of-day-card.tsx` | ADAPT | Card rewrite |
| `progress/daily-goal-progress-widget.tsx` | ADAPT | Progress UI |
| `import/import-preview-table.tsx` | ADAPT | Table to list conversion |
| `import/import-source-selector.tsx` | ADAPT | Selection UI |
| `export/anki-export-button.tsx` | ADAPT | Button + API call |
| `upload/PhotoUpload.tsx` | ADAPT | Use Capacitor Camera/Gallery |
| `upgrade/UpgradeModal.tsx` | ADAPT | Use React Native Modal |
| `online-status-provider.tsx` | REUSE | Logic reusable, context works in RN |
| `service-worker-registration.tsx` | REMOVE | Not applicable to React Native |

---

## 3. HOOKS (src/hooks/)

| File | Status | Migration Notes |
|------|--------|-----------------|
| `useAuth.ts` | REUSE | Supabase auth works in React Native |
| `useCamera.ts` | KEEP WEB | Web-only camera - keep for web build |
| `use-native-camera.ts` | REUSE | Already Capacitor-ready - use this |
| `useSpeech.ts` | ADAPT | Uses HTML Audio - needs react-native-sound |
| `useAnalyze.ts` | REUSE | API logic reusable |
| `use-vocabulary-lists.ts` | REUSE | API logic reusable |
| `useIsMobile.ts` | REMOVE | Not needed in React Native |

---

## 4. LIB (src/lib/)

| File | Status | Migration Notes |
|------|--------|-----------------|
| `api-client.ts` | REUSE | Already Capacitor-aware with native detection |
| `supabase/client.ts` | REUSE | Already uses Capacitor Preferences |
| `supabase/server.ts` | REMOVE | Server-side only - not needed in RN |
| `supabase/middleware.ts` | REMOVE | Next.js middleware - not needed |
| `utils.ts` | ADAPT | `compressImage` uses HTML Canvas - needs alternative |
| `constants.ts` | REUSE | Constants are universal |
| `validation.ts` | REUSE | Validation logic reusable |
| `spaced-repetition-sm2-algorithm.ts` | REUSE | Pure algorithm - no changes |
| `groq.ts` | REUSE | API client - works in RN |
| `import/web-article-extractor.ts` | ADAPT | May need native HTTP client |
| `import/vocabulary-extractor.ts` | REUSE | Logic reusable |
| `service-worker-registration.ts` | REMOVE | Not applicable |

---

## 5. API ROUTES (src/app/api/)

All API routes remain on the server - React Native app will call these via `api-client.ts`.

| Route | Used By | Notes |
|-------|---------|-------|
| `analyze/route.ts` | Camera, Upload | Core feature - image analysis |
| `analyze-trial/route.ts` | Try page | Trial analysis |
| `vocabulary/route.ts` | Vocabulary page | CRUD operations |
| `vocabulary/[id]/route.ts` | VocabularyCard | Single item operations |
| `lists/route.ts` | Lists page | List CRUD |
| `lists/[id]/route.ts` | List detail | Single list operations |
| `lists/[id]/words/route.ts` | List management | Word list management |
| `courses/route.ts` | Courses page | Course listing |
| `courses/[id]/route.ts` | Course detail | Single course |
| `courses/[id]/rate/route.ts` | Course rating | Rating system |
| `courses/[id]/subscribe/route.ts` | Course subscription | Subscribe/unsubscribe |
| `courses/[id]/words/route.ts` | Course words | Word management |
| `practice/due-words/route.ts` | Practice page | SRS due words |
| `word-attempts/route.ts` | FlashCard | Record practice attempts |
| `stats/route.ts` | Dashboard, Progress | User statistics |
| `stats/activity/route.ts` | Progress | Activity heatmap data |
| `stats/detailed/route.ts` | Progress | Detailed stats |
| `daily-goals/route.ts` | Settings | Daily goal management |
| `word-of-day/route.ts` | Dashboard | Word of the day |
| `tts/route.ts` | useSpeech | Text-to-speech |
| `user/profile/route.ts` | Settings | Profile management |
| `user/avatar/route.ts` | Settings | Avatar upload |
| `user/notifications/route.ts` | Settings | Notification preferences |
| `user/export/route.ts` | Settings | Data export |
| `user/delete/route.ts` | Settings | Account deletion |
| `import/route.ts` | Import page | Word extraction |
| `import/save/route.ts` | Import page | Save imported words |
| `export/anki/route.ts` | Vocabulary page | Anki export |
| `stories/route.ts` | Stories page | Story CRUD |
| `stories/[id]/route.tsx` | Story detail | Single story |
| `image-proxy/route.ts` | Image loading | Proxy external images |
| `upgrade-interest/route.ts` | Upgrade modal | Track upgrade interest |

---

## 6. TYPES (src/types/)

| File | Status | Migration Notes |
|------|--------|-----------------|
| `index.ts` | REUSE | All type definitions are platform-agnostic |

---

## Migration Checklist Summary

### Pages to Migrate: 24 files
- [ ] layout.tsx (auth wrapper)
- [ ] capture/page.tsx
- [ ] capture-native/page.tsx (reference)
- [ ] upload/page.tsx
- [ ] analysis/[id]/page.tsx
- [ ] vocabulary/page.tsx
- [ ] practice/page.tsx
- [ ] quiz/page.tsx
- [ ] progress/page.tsx
- [ ] settings/page.tsx
- [ ] settings/components/*.tsx (2 files)
- [ ] lists/page.tsx
- [ ] lists/[id]/page.tsx
- [ ] courses/page.tsx
- [ ] courses/[id]/page.tsx
- [ ] courses/create/page.tsx
- [ ] courses/[id]/edit/page.tsx
- [ ] games/page.tsx
- [ ] games/components/*.tsx (2 files)
- [ ] stories/page.tsx
- [ ] stories/[id]/page.tsx
- [ ] stories/new/page.tsx
- [ ] history/page.tsx
- [ ] import/page.tsx

### Components to Migrate: 40+ files
- [ ] All UI components (12 files) - full rewrite needed
- [ ] Feature components (28+ files) - adapt for React Native

### Hooks: 7 files
- [ ] useAuth.ts (reuse)
- [ ] use-native-camera.ts (reuse)
- [ ] useSpeech.ts (adapt)
- [ ] useAnalyze.ts (reuse)
- [ ] use-vocabulary-lists.ts (reuse)
- [ ] useCamera.ts (web only - keep)
- [ ] useIsMobile.ts (remove)

### Library Files: 14 files
- [ ] api-client.ts (reuse)
- [ ] supabase/client.ts (reuse)
- [ ] utils.ts (adapt image compression)
- [ ] constants.ts (reuse)
- [ ] validation.ts (reuse)
- [ ] spaced-repetition-sm2-algorithm.ts (reuse)
- [ ] groq.ts (reuse)
- [ ] import/*.ts (adapt)

### Types: 1 file
- [ ] index.ts (reuse as-is)

---

## Unresolved Questions

1. **Navigation Structure**: Should React Native use bottom tabs like the web mobile menu or a drawer navigation?
2. **Image Storage**: Current app uses Supabase Storage - keep same approach or use native device storage?
3. **Offline Support**: Web app has service workers - should React Native implement offline SQLite storage?
4. **Authentication Flow**: Use Supabase native auth or deep-link back to web auth?
5. **Push Notifications**: Not implemented in web - add for React Native?
6. **Analytics**: Current web has basic stats - add more comprehensive mobile analytics?
