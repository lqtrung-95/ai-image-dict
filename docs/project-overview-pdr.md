# AI Image Dictionary - Project Overview & PDR

**Status:** Active Development
**Version:** 1.0.0
**Last Updated:** 2026-01-27

---

## Executive Summary

**AI Image Dictionary** is a Chinese vocabulary learning application that transforms photo-based learning through AI image analysis. Users capture or upload photos, and the app instantly detects objects and provides Chinese vocabulary with pronunciation guides.

**Target Users:** Chinese language learners seeking contextual, visual vocabulary acquisition
**Platform:** Web (Next.js) + Native Apps (Capacitor for iOS/Android)
**Primary Language:** Simplified Chinese with Pinyin & English translations

---

## Product Vision

### Problem Statement

Language learners struggle with two key challenges:
1. **Disconnection from Context** - Flashcards and word lists lack real-world visual context
2. **Vocabulary Retention** - Traditional learning methods (memorization) have low long-term retention
3. **Complexity** - Multiple disparate tools (dictionary, flashcard app, photo app) required

**Current State:** Learners use 3+ apps (dictionary app, flashcard app, photo library) and lack integration between learning and real-world application.

### Solution

AI Image Dictionary bridges this gap by:
- Capturing real-world photos
- Using AI (Groq Llama vision model) to detect objects and context
- Providing instant Chinese vocabulary with cultural/contextual information
- Enabling organized vocabulary management and spaced repetition
- Supporting native mobile apps via Capacitor

---

## Market Opportunity

**Target Market:** Chinese learners (100M+ globally)
**Segment Focus:** Intermediate learners seeking vocabulary expansion
**Use Cases:**
- Travel preparation (learning environment-specific vocabulary)
- Casual learning (gaming-like discovery during daily activities)
- Classroom supplement (teachers using for contextual learning)

**Competitive Advantages:**
1. AI-powered visual learning (not manual curation)
2. Real-world contextualization (not abstract flashcards)
3. Cross-platform (web + native via same codebase)
4. Low cost (Groq API is 3-5x cheaper than competitors)

---

## Functional Requirements

### Core Features (MVP)

#### 1. Photo Capture & Analysis
- Users can capture photos via device camera (browser camera API)
- Users can upload existing photos from device
- AI analyzes image and detects objects (Groq Llama 4 Scout vision model)
- Returns Chinese vocabulary with:
  - Chinese characters (simplified)
  - Pinyin with tone marks
  - English translation (based on selected native language)
  - Confidence score for each detection
  - HSK level (1-6) for each word
  - Example sentences in Chinese + English
- Scene context includes descriptive words (colors, actions, moods)

**Requirement:** Analysis completes in < 5 seconds

#### 2. Vocabulary Management
- Save detected words to personal vocabulary list
- Organize words into user-created vocabulary lists/collections (name, description, color)
- Search saved vocabulary by word, Pinyin, or translation
- View complete learning history (photos + words)
- Delete/unsave words with confirmation
- Photo context: thumbnail with date for each word origin

**Requirement:** Deduplication - prevent saving duplicate words (unique by user_id + word_zh)

#### 3. Practice & Review
- **Flashcard Mode:** 3D flip animation, front shows Chinese, back shows pinyin + English + photo context, Anki-style 4-button rating with interval previews
- **Quiz Modes:**
  - Multiple choice (Chinese to English, 4 options, visual feedback)
  - Listening quiz (Chinese audio to English word selection)
  - Type Pinyin quiz (type pinyin with tone mark normalization, instant validation)
- Session management: progress bar, shuffle, list filter, completion screen with percentage/rating breakdown
- Track practice sessions and streak counts
- Display daily practice history with confidence metrics

**Requirement:** Practice sessions saved for streak calculation, Spaced Repetition SM-2 algorithm implementation

#### 4. Spaced Repetition Learning System (Premium Feature)
- Full SuperMemo SM-2 algorithm implementation
- Adaptive intervals: 1 day → weeks → months based on rating
- Rating scale: 1=Again, 2=Hard, 3=Good, 4=Easy
- Easiness factor tracking (min 1.3)
- Mastered threshold: 21+ day interval
- Due words tracking with daily review queue
- 7-day review forecast

#### 5. Progress Tracking & Analytics
- Daily learning streak counter
- Total vocabulary count, words mastered
- Practice session count
- Words learned per day (chart/graph)
- HSK distribution chart (levels 1-6 color-coded)
- 7-day review forecast bar chart
- Activity heatmap (GitHub-style, 84 days)
- Word state breakdown: New → Learning → Reviewing → Mastered
- Motivational messages based on streak

#### 6. Text-to-Speech
- Pronunciation guide for all Chinese words
- Proper tone rendering for Mandarin
- Primary: Google Cloud TTS API (cmn-CN-Wavenet-A, female, speaking rate 0.85)
- Fallback: Web Speech API for browser compatibility
- Manual playback control (button on vocabulary cards)
- Rate limit: 50 requests/day
- Audio resource cleanup (URL revocation, memory leak prevention)

#### 7. Native Language Selection (NEW Feature)
**Purpose:** Allow users to choose their native language for word translations instead of hardcoded English.

**Supported Languages:**
- English (default)
- Vietnamese (Tiếng Việt)
- Korean (한국어)
- Japanese (日本語)
- Spanish (Español)

**Implementation:**
- Language selection in user profile/settings during signup or later in settings page
- Store in `profiles.native_language` (VARCHAR, default='en')
- AI prompt updated to return translations in selected native language
- TTS supports accents for different native languages if available
- Translations cached per language to minimize API calls

**Functional Requirements:**
- Users can change native language anytime in settings
- All existing words display translation in new language when changed
- Future photo analyses return translations in selected language
- Quiz/practice modes adjust to user's native language

#### 8. Authentication & User Profile
- Email/password signup with native language selection
- Email/password login
- Session persistence (cookies)
- Profile management: display name, avatar upload, native language selection
- Password recovery (forgot/reset)
- Account data management: export data, delete account with confirmation
- Logout functionality

#### 9. Trial/Freemium Model
- 2 free photo analyses without account (shows 3 words, rest locked)
- Full features require user account signup
- 6 analyses per day limit for free tier (enforced via `daily_usage` table)
- Premium tier: $4.99/month for unlimited analyses, advanced features (SRS, advanced analytics)

#### 10. Games for Learning
- **Matching Game:** 6 random words (12 cards), Chinese/English pairs, flip animations, move counter, completion celebration
- **Quiz Game:** 10 random questions, multiple choice, score tracking, play again
- Minimum 4 words required to play
- Sound effects & haptic feedback (mobile)

#### 11. Vocabulary Lists & Courses
- **Lists:** User-created collections with name, description, color (14 choices), public/private toggle
- **Courses:** Community-shared courses with name, description, difficulty (1-6), cover image
  - Add/reorder/remove words
  - Publish/unpublish toggle
  - Rate & review (1-5 stars)
  - Browse with filters (difficulty, sort: newest/rating/popular, search)
  - Subscribe/unsubscribe, pagination (20 per page)

#### 12. Word of the Day
- Deterministic selection based on date seed
- Save or dismiss actions
- History tracking
- Featured display on dashboard

#### 13. Photo Stories
- Create stories from multiple photo analyses
- Title + description + photo selection
- Cover image from first photo
- Photo ordering within story

#### 14. Vocabulary Import
- Import from URL (web article scraping) or raw text
- AI extraction of 30-50 words using Groq (llama-3.3-70b-versatile)
- Preview table before saving
- Select which words to save
- Optional list assignment
- Duplicate detection during import
- Security: blocks localhost/internal IPs, rate limited 10/hour

#### 15. Export
- Anki-compatible TSV export
- Filterable by list or HSK level
- HTML formatting for Anki cards (Chinese + pinyin + native language)

#### 16. Daily Goals & Progress Tracking
- 3 goal types: Words Learned, Reviews Completed, Practice Minutes
- Configurable targets (1-100)
- Toggle enable/disable
- Daily progress tracking widget
- Stats overview: streak, due today, total words, mastered count

#### 17. Dashboard & Navigation
- Welcome greeting with user name
- "Continue Learning" section with due words count
- Quick action buttons: Flashcards, Quiz, Capture Photo
- Word of the Day card
- Utility links: History, Collections, Progress
- Sticky header with logo "AI词典"
- Desktop: full nav + Library dropdown (Stories, Lists, Courses, History, Import)
- Mobile: hamburger menu with expandable sections
- User dropdown: avatar + settings + sign out

#### 18. Mobile Apps (Capacitor 7)
- Native iOS + Android apps from shared Next.js codebase
- App ID: com.aiimagedict.app
- Native camera access (front/back, 90% JPEG quality)
- Photo gallery integration
- Splash screen (purple spinner, dark background, 2s)
- Status bar: dark style
- Keyboard management: resize body
- Dual auth: Bearer token (mobile) + cookies (web)
- Push notifications: practice reminders

#### 19. PWA & Offline Support
- Service worker with cache-first strategy
- Static pages cached (login, signup, practice, etc.)
- Offline page at /offline
- Online/offline detection with visual indicator banner
- Background sync stub (sync-vocabulary)
- Push notification infrastructure (practice-reminder)
- PWA manifest: standalone display, portrait, education category

#### 20. Settings & Account
- Profile settings (display name, avatar)
- Native language selection (for translations)
- Daily goals configuration
- Account data management (export, delete)
- Sign out

---

## Non-Functional Requirements

### Performance
| Requirement | Target | Implementation |
|------------|--------|-----------------|
| Photo Analysis | < 5 sec | Groq API optimized |
| Image Upload | < 3 sec | Base64 compression |
| Page Load | < 3 sec | Next.js optimization |
| TTI (Time to Interactive) | < 2 sec | Code splitting, lazy loading |
| API Response | < 1 sec | Caching, indexed queries |

### Scalability
- Database: Supabase PostgreSQL (auto-scaling)
- Image Storage: Supabase Storage (S3-backed)
- API: Next.js deployment on Vercel (serverless)
- Concurrent Users: Target 10K MAU for MVP

### Security
- Authentication: Supabase Auth (password hashing, session mgmt)
- Authorization: RLS (Row-Level Security) on all tables
- Data Privacy: GDPR compliance (data deletion, export)
- HTTPS: All endpoints over SSL/TLS
- Rate Limiting: 6 analyses/day per user (enforced via DB)
- Image Security: Proxy endpoint prevents direct external URLs

### Accessibility
- WCAG 2.1 Level AA compliance
- Color contrast ratios ≥ 4.5:1
- Keyboard navigation support (via Radix UI)
- Alt text for all images
- Semantic HTML structure

### Reliability
- Uptime: 99% (SLA)
- Error Recovery: User-friendly error messages
- Data Backup: Supabase automated backups
- Fallbacks: Web Speech API if Google TTS fails

---

## Technical Architecture

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 16.1.1 App Router | SSR + ISR, fast builds |
| UI | React 19 + shadcn/ui | Component-driven, accessible |
| Styling | Tailwind CSS 4 | Utility-first, responsive |
| Database | Supabase PostgreSQL | Managed, RLS built-in |
| Auth | Supabase Auth | Email/password, secure |
| AI Vision | Groq Llama 4 Scout | Cost-effective, fast |
| TTS | Google Cloud + Web Speech | Multi-platform coverage |
| Mobile | Capacitor 7.4.4 | Native bridge, code reuse |
| Deployment | Vercel | Next.js optimized, free tier |

### System Diagram

```
┌────────────────────────────┐
│   User Device              │
│  (Browser / Mobile App)    │
└────────────┬───────────────┘
             │ HTTP/HTTPS
             │
┌────────────▼───────────────────────┐
│     Next.js App (Vercel)            │
│  ┌─────────────────────────────┐   │
│  │  Pages & Components         │   │
│  │  (React 19, Tailwind CSS)   │   │
│  └────────────┬────────────────┘   │
│               │                     │
│  ┌────────────▼──────┐             │
│  │  API Routes       │             │
│  │  /api/analyze     │             │
│  │  /api/vocabulary  │             │
│  └────────┬──────┬───┘             │
└───────────┼──────┼─────────────────┘
            │      │
      ┌─────▼──┐   │    ┌──────────────┐
      │  Groq  │   └───▶│ Supabase     │
      │  API   │        │ - Auth       │
      └────────┘        │ - PostgreSQL │
                        │ - Storage    │
      ┌──────────────┐  └──────────────┘
      │ Google TTS   │
      │ API / Web    │
      │ Speech API   │
      └──────────────┘
```

### Data Flow

**Photo Analysis Workflow:**
```
1. User captures/uploads photo
   ↓
2. Image compressed (JPEG, max 2MB)
   ↓
3. Convert to Base64 & send to /api/analyze
   ↓
4. API validates auth & rate limit
   ↓
5. Call Groq API with image + prompt
   ↓
6. Parse JSON response (objects, scene context)
   ↓
7. Store in Supabase:
   - photo_analyses table
   - detected_objects table
   ↓
8. Return analysis data & display to user
   ↓
9. User optionally saves words to vocabulary_items
```

**Vocabulary Learning Flow:**
```
1. User saves word from analysis
   ↓
2. POST /api/vocabulary with word data
   ↓
3. Check for duplicates (same word_zh + user_id)
   ↓
4. Insert into vocabulary_items table
   ↓
5. User practices words (quiz/flashcard mode)
   ↓
6. Record practice_sessions
   ↓
7. Update user_stats (streak, count)
```

---

## Success Criteria

### Functional Metrics
- [ ] Photo analysis accuracy ≥ 80% on common objects
- [ ] Scene context includes: objects, colors, actions
- [ ] Users can save/organize ≥ 1000 words
- [ ] Practice modes working for all quiz types
- [ ] Streak counter tracking accurately

### User Engagement Metrics
- [ ] DAU (Daily Active Users): ≥ 100 by month 2
- [ ] Average session length: ≥ 10 minutes
- [ ] Photo analyses per user: ≥ 5 per week
- [ ] Word save rate: ≥ 30% of detected words
- [ ] Return user rate: ≥ 40% (7-day retention)

### Technical Metrics
- [ ] Page load time: < 3 seconds (90th percentile)
- [ ] Photo analysis: < 5 seconds (avg 2-3 seconds)
- [ ] API uptime: ≥ 99%
- [ ] Error rate: < 0.5%

### Business Metrics
- [ ] Cost per analysis: < $0.01 (Groq pricing)
- [ ] Free trial conversion to paid: ≥ 5%
- [ ] Customer acquisition cost (CAC): < $5

---

## Enhanced Features & Scope

### Database Enhancements for Native Language Selection

**New Profiles Column:**
```sql
ALTER TABLE profiles ADD COLUMN native_language VARCHAR(10) DEFAULT 'en';
-- Supported: 'en', 'vi', 'ko', 'ja', 'es'
```

**Updated Vocabulary Items:**
- Store original English translation + cached translations for each language
- Or compute on-the-fly if API call fast enough

**Groq API Prompt Update:**
- Accept `native_language` parameter
- Return translations in requested language

---

## Phased Roadmap

### Phase 1: MVP (Current - Month 1) - COMPLETE
**Scope:** Core features working end-to-end
- Photo analysis (capture + upload) ✓
- Vocabulary CRUD ✓
- Basic practice (flashcard mode) ✓
- Spaced repetition (SM-2) ✓
- Multiple quiz modes ✓
- Authentication ✓
- Progress tracking (stats dashboard) ✓
- Free trial (2 analyses) ✓
- Games (matching, quiz) ✓
- Vocabulary lists & courses ✓
- Word of the day ✓
- Photo stories ✓
- Import/Export ✓
- Daily goals ✓
- PWA & offline support ✓

**Success Criteria:** MVP deployed, 50+ beta users, core features stable ✓

### Phase 2: Growth & Language Support (Month 2-3)
**Scope:** Enhance UX, expand features, add native language selection
- Native language selection for translations (Vietnamese, Korean, Japanese, Spanish) ← NEW
- Mobile app packaging (Capacitor iOS/Android) improvements
- Advanced analytics tracking
- Community features (ratings, reviews, public courses)
- Optimized Groq prompts for different native languages
- Localized UI for different languages

**Success Criteria:** 500+ MAU, iOS/Android builds stable, 20%+ native language feature adoption

### Phase 3: Monetization (Month 3-4)
**Scope:** Premium tier & retention features
- Premium subscription ($4.99/month)
- Unlimited analyses
- Advanced statistics & insights
- Native language selection included in premium
- Social sharing features
- Email reminders

**Success Criteria:** 10% conversion to paid, $1K MRR, positive unit economics

### Phase 4: Scale & Expansion (Month 5+)
**Scope:** Expand audience & global reach
- Marketing campaigns (TikTok, Reddit, Discord, language learning communities)
- Affiliate program
- Teacher/classroom features
- Extend native language support beyond initial 5
- Community features (leaderboards, badges)
- Mobile app store distribution (App Store, Google Play)

**Success Criteria:** 5K+ MAU, 20%+ retention, native language feature driving 30%+ engagement

---

## Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|-----------|
| Groq API reliability | High | Low | Build Google Vision fallback, test thoroughly |
| Low user adoption | High | Medium | Focus on community marketing, educator partnerships |
| Image quality issues | Medium | Medium | Implement robust image preprocessing, user guidance |
| Privacy concerns | Medium | Low | Clear data policy, GDPR compliance, data deletion |
| Competitive entry | Medium | Medium | Focus on differentiation (affordability, UX) |
| AI accuracy issues | Medium | Medium | User feedback loop, continuous prompt optimization |

---

## Constraints & Dependencies

### Technical Constraints
- Browser camera API requires HTTPS
- Image analysis limited to 12MB max file size
- Groq API rate limits (varies by tier)
- Supabase storage limits (project tier dependent)

### Business Constraints
- MVP timeline: 4-6 weeks
- Solo developer or small team
- Limited marketing budget
- Storage costs scale with image volume

### External Dependencies
- Groq API availability & pricing
- Supabase stability & scaling
- Google Cloud TTS API
- Capacitor ecosystem maturity

---

## Success Definition

**MVP Success (End of Phase 1):**
- Core features working without major bugs
- 50+ active beta users
- Photo analysis completing in < 5 seconds
- User satisfaction score ≥ 4/5

**Growth Success (End of Phase 2):**
- 500+ monthly active users
- iOS/Android apps functional
- Positive unit economics (revenue > costs)
- User retention ≥ 40% (7-day)

**Market Success (End of Phase 3):**
- 5K+ monthly active users
- 10%+ paid subscription conversion
- $1K+ monthly recurring revenue
- Net Promoter Score (NPS) ≥ 40

---

## Go/No-Go Decision Points

### Month 1 (MVP Launch)
- **Go Criteria:** Core features working, 50+ users, 4+ CSAT
- **No-Go:** Major bugs preventing photo analysis, < 20 users, cost per analysis > $0.05

### Month 2 (Growth Phase)
- **Go Criteria:** 500+ MAU, iOS/Android working, > 3 sessions/user/week
- **No-Go:** < 250 MAU, mobile builds failing, user churn > 60%

### Month 3 (Monetization)
- **Go Criteria:** 5% paid conversion, positive CAC:LTV ratio
- **No-Go:** < 2% conversion, CAC > LTV, revenue < costs

---

## References & Resources

- **Groq Docs:** https://console.groq.com/docs/
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Capacitor Docs:** https://capacitorjs.com/docs
- **Requirements Specification:** `/docs/ai/requirements/feature-photo-vocabulary-detection.md`

