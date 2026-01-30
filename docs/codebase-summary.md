# AI Image Dictionary - Codebase Summary

**Project:** AI Image Dictionary (AI词典)
**Stack:** Next.js 16.1.1 + React 19 + TypeScript 5
**Status:** Active Development
**Last Updated:** 2026-01-27

---

## Overview

AI Image Dictionary is a Chinese vocabulary learning application that leverages AI image analysis to help users learn Chinese words contextually. Users capture or upload photos, the app detects objects using Groq AI (Llama 4 Scout vision model), and returns Chinese vocabulary with pronunciation guides.

**Key Statistics:**
- Total codebase: ~8,900 lines (src/)
- 68 source files
- 75,042 tokens in repomix
- Built with Next.js App Router + Supabase + Capacitor

---

## Architecture Overview

### Layer Stack

```
┌─────────────────────────────────────┐
│  UI Layer (React Components)        │
│  - Pages, Layouts, Components       │
├─────────────────────────────────────┤
│  Hooks & State Management           │
│  - useAuth, useCamera, useAnalyze   │
├─────────────────────────────────────┤
│  API Layer (Next.js API Routes)     │
│  - /api/analyze, /api/vocabulary    │
├─────────────────────────────────────┤
│  Service Layer                      │
│  - Groq AI, Supabase, Google TTS    │
├─────────────────────────────────────┤
│  Data Layer (PostgreSQL via Supabase)
│  - profiles, photo_analyses, etc.   │
└─────────────────────────────────────┘
```

---

## Directory Structure

### `/src/app` - Next.js Pages & Routes

**Route Organization:**
```
app/
├── (auth)/               # Public auth pages
│   ├── login/           # Email/password login
│   └── signup/          # User registration
├── (protected)/         # Auth-required pages (checked via layout.tsx)
│   ├── capture/         # Camera capture page
│   ├── vocabulary/      # Saved words list
│   ├── practice/        # Flashcard practice
│   ├── collections/     # Word collections management
│   ├── history/         # Photo analysis history
│   ├── progress/        # Learning statistics
│   ├── quiz/            # Quiz modes
│   ├── analysis/[id]/   # Single analysis view
│   ├── upload/          # Photo upload
│   └── layout.tsx       # Auth guard + navigation
├── api/                 # REST API endpoints
│   ├── analyze/         # AI photo analysis (auth required)
│   ├── analyze-trial/   # Trial analysis (no auth, 2 free tries)
│   ├── vocabulary/      # CRUD vocabulary words
│   ├── collections/     # CRUD collections
│   ├── stats/           # User statistics
│   ├── tts/             # Text-to-speech proxy
│   ├── word-of-day/     # Daily word feature
│   ├── image-proxy/     # Image proxy (security)
│   └── upgrade-interest/# Premium interest tracking
├── try/                 # Trial page (no auth)
├── page.tsx             # Landing page
├── layout.tsx           # Root layout
├── globals.css          # Global styles
└── sitemap.ts           # SEO sitemap
```

**Key Patterns:**
- `(auth)` & `(protected)` are route groups (not in URL)
- Protected pages redirect to login if no auth
- API routes use Next.js 16 App Router

### `/src/components` - React Components

```
components/
├── ui/                    # shadcn/ui base components (32 files)
│   ├── button.tsx        # Button variations
│   ├── card.tsx          # Card container
│   ├── dialog.tsx        # Modal dialog
│   ├── input.tsx         # Input field
│   ├── select.tsx        # Dropdown select
│   ├── avatar.tsx        # User avatar
│   └── ... (others)
├── analysis/             # Analysis result display
│   ├── AnalysisResult.tsx      # Display detected objects
│   ├── AnalysisSkeleton.tsx    # Loading state
│   └── TrialResult.tsx         # Trial result view
├── camera/              # Camera functionality
│   └── CameraCapture.tsx       # Camera UI component
├── practice/            # Flashcard practice
│   └── FlashCard.tsx           # Flashcard component
├── quiz/                # Quiz modes
│   ├── ListeningQuiz.tsx       # Listening comprehension
│   ├── MultipleChoiceQuiz.tsx  # Multiple choice
│   └── TypePinyinQuiz.tsx      # Pinyin input quiz
├── vocabulary/          # Vocabulary display
│   ├── VocabularyCard.tsx      # Word card (largest file: 3,783 tokens)
│   └── VocabularyCardSkeleton.tsx
├── dashboard/           # Dashboard home
│   └── DashboardHome.tsx       # Home page layout
├── layout/              # Navigation
│   └── Header.tsx              # Top navigation bar
├── upload/              # Photo upload
│   └── PhotoUpload.tsx         # Upload UI
└── upgrade/             # Premium features
    └── UpgradeModal.tsx        # Upgrade prompt
```

**Component Patterns:**
- Client components use `'use client'` directive
- Skeleton components for loading states
- Radix UI primitives for accessibility
- shadcn/ui for consistent styling

### `/src/hooks` - Custom Hooks

| Hook | Purpose | Key Features |
|------|---------|-------------|
| `useAuth.ts` | Auth state management | User session, login/logout |
| `useCamera.ts` | Camera access | Request permissions, get video stream |
| `useSpeech.ts` | Text-to-speech | Google TTS + Web Speech API fallback |
| `useAnalyze.ts` | Analysis state machine | Loading, error, success states |
| `useIsMobile.ts` | Mobile detection | Returns boolean for responsive UI |

**Usage Pattern:**
```typescript
const { user, loading, logout } = useAuth();
const { canAccess, startCamera } = useCamera();
const { speak } = useSpeech();
```

### `/src/lib` - Utilities & Services

| File | Purpose |
|------|---------|
| `groq.ts` | Groq AI vision API client |
| `utils.ts` | Helpers: compress image, debounce, format |
| `constants.ts` | App config: API keys, limits |
| `supabase/client.ts` | Supabase client (browser) |
| `supabase/server.ts` | Supabase client (SSR) |
| `supabase/middleware.ts` | Auth middleware for API routes |

**Key Integrations:**
- Groq API (Llama 4 Scout vision model)
- Supabase Auth (email/password)
- Google Cloud TTS API
- Web Storage API

### `/src/types` - TypeScript Definitions

Central type definitions for:
- User & auth types
- Photo analysis & detected objects
- Vocabulary items & collections
- Practice sessions & statistics
- API request/response types

**Naming Convention:** Types use PascalCase, interfaces start with `I` (optional)

---

## Data Model

### Core Tables (Supabase PostgreSQL)

| Table | Columns | Purpose |
|-------|---------|---------|
| `profiles` | user_id, display_name, avatar_url | User profiles (extends auth.users) |
| `photo_analyses` | id, user_id, image_url, scene_context | Analysis records |
| `detected_objects` | id, analysis_id, label_*, pinyin, category | Detected objects per analysis |
| `vocabulary_items` | id, user_id, word_*, detected_object_id | Saved words |
| `collections` | id, user_id, name, description | User's word collections |
| `user_stats` | user_id, current_streak, longest_streak | Streak & progress |
| `practice_sessions` | id, user_id, vocabulary_id, correct | Practice history |
| `daily_usage` | user_id, date, usage_count | Rate limiting (6/day free) |
| `upgrade_interest` | user_id, email, timestamp | Premium signup interest |

**Key Features:**
- All tables have RLS (Row-Level Security) enabled
- Auto profile creation via trigger on user signup
- Streak calculation via SQL functions
- Usage limit check via RPC call

---

## Key Features Implementation

### 1. AI Image Analysis

**Flow:** Capture/Upload → Groq API → Save to DB → Display Results

**File:** `/src/app/api/analyze/route.ts`
- Receives Base64 image
- Calls Groq API (Llama 4 Scout vision model)
- Parses JSON response for objects & scene context
- Stores in `photo_analyses` & `detected_objects` tables
- Returns analysis with detected vocabulary

**Prompt:** Requests AI to detect objects with Chinese labels, Pinyin, and scene context in English.

### 2. Vocabulary Management

**CRUD Operations:** `/src/app/api/vocabulary/route.ts`
- POST: Save word from analysis
- GET: Fetch user's vocabulary (paginated)
- PUT: Update word or collection assignment
- DELETE: Remove word

**Deduplication:** Prevents duplicate saves of same word

### 3. Practice Modes

**Components:**
- `FlashCard.tsx` - Traditional flashcard flip
- `MultipleChoiceQuiz.tsx` - 4-option selection
- `ListeningQuiz.tsx` - Chinese to English
- `TypePinyinQuiz.tsx` - Type correct Pinyin

**Storage:** Practice sessions tracked in `practice_sessions` table for streak calculation

### 4. Text-to-Speech

**Endpoint:** `/src/app/api/tts/route.ts`
- Primary: Google Cloud Text-to-Speech API
- Fallback: Web Speech API (browser)
- Handles tone marks for Mandarin

**Hook:** `useSpeech.ts` manages playback

### 5. Authentication

**Provider:** Supabase Auth
- Email/password signup & login
- Auto profile creation
- Session management via cookies
- Protected routes in layout.tsx

---

## API Routes Summary

### Authentication Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analyze` | POST | AI image analysis |
| `/api/vocabulary` | GET/POST/PUT/DELETE | Vocabulary CRUD |
| `/api/collections` | GET/POST | Collections CRUD |
| `/api/stats` | GET | User statistics |

### Public Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analyze-trial` | POST | 2 free trial analyses |
| `/api/tts` | POST | Text-to-speech (any user) |
| `/api/word-of-day` | GET | Daily word feature |

### Utility Routes

| Endpoint | Purpose |
|----------|---------|
| `/api/image-proxy` | Cache & serve images securely |
| `/api/upgrade-interest` | Track premium interest |

---

## Styling & UI

**CSS Framework:** Tailwind CSS 4 + shadcn/ui
- Radix UI components for accessibility
- Dark mode by default
- Responsive design (mobile-first)
- Custom animations via tw-animate-css

**Color Scheme:**
- Primary: Purple (600/700)
- Background: Slate (800/900)
- Text: White/slate-200
- Accent: Various (error=red, success=green)

---

## Performance Considerations

| Area | Target | Implementation |
|------|--------|-----------------|
| Photo Analysis | < 5 seconds | Groq API + queue handling |
| Image Loading | Optimized | Next.js Image + compression |
| Bundle Size | Minimal | Code splitting, lazy loading |
| Database | Indexed | Proper indexes on user_id, timestamps |
| Rate Limiting | 6 analyses/day free | `daily_usage` table + RPC check |

---

## Security Measures

1. **RLS (Row-Level Security)**: All tables enforced at Supabase level
2. **Image Proxy**: `/api/image-proxy` prevents direct external URLs
3. **Rate Limiting**: Daily usage tracked per user
4. **Auth Middleware**: Validates user session on protected routes
5. **Input Validation**: API routes validate request data
6. **Environment Variables**: Sensitive keys in `.env.local` (not committed)

---

## Dependencies

### Core
- **next** 16.1.1 - React framework
- **react** 19.2.3 - UI library
- **typescript** 5 - Type safety

### UI/Styling
- **tailwindcss** 4 - Utility CSS
- **@radix-ui/** - Accessible components
- **shadcn/ui** - Component library (via components/ui/)
- **lucide-react** - Icons
- **sonner** - Toast notifications

### Backend/Services
- **@supabase/supabase-js** 2.89.0 - Database & auth
- **@supabase/ssr** 0.8.0 - Server-side rendering support
- **groq-sdk** 0.37.0 - Groq AI API client

### Mobile
- **@capacitor/core** 7.4.4 - Native bridge (iOS/Android)

### Utilities
- **clsx** - Class name utilities
- **tailwind-merge** - Tailwind class merging
- **class-variance-authority** - Component variants

---

## File Size Analysis

**Top 5 Largest Files (by tokens):**
1. VocabularyCard.tsx - 3,783 tokens (16,869 chars)
2. page.tsx (landing) - 3,262 tokens (12,128 chars)
3. TrialResult.tsx - 3,009 tokens (12,579 chars)
4. try/page.tsx - 2,992 tokens (12,273 chars)
5. practice/page.tsx - 2,821 tokens (11,205 chars)

**Recommendation:** VocabularyCard.tsx could be refactored into smaller components if needed (currently at 5% of total codebase)

---

## Development Workflow

### Setup
```bash
npm install
cp .env.example .env.local  # Add credentials
npm run dev
```

### Key Commands
```bash
npm run dev       # Development server
npm run build     # Production build
npm run lint      # ESLint check
npm run format    # Prettier format
npm run type-check # TypeScript check
```

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`
- `GOOGLE_TTS_API_KEY`

---

## Future Expansion Points

1. **Monorepo Structure**: If adding native apps, consider turborepo
2. **Spaced Repetition**: Algorithm for SRS practice
3. **Offline Support**: Service Workers for PWA
4. **Social Features**: Sharing & leaderboards
5. **Advanced Analytics**: Learning patterns & recommendations
6. **Multi-language**: Extend beyond Simplified Chinese

---

## References

- **Groq API Docs:** https://console.groq.com/
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/
- **Capacitor:** https://capacitorjs.com/

