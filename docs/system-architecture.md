# AI Image Dictionary - System Architecture

**Version:** 1.0.0
**Last Updated:** 2026-01-27
**Architecture Pattern:** Layered + MVC

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        USER DEVICES                           │
│              (Web Browser / Mobile via Capacitor)             │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTP/HTTPS
                             │
         ┌───────────────────▼───────────────────┐
         │    NEXTJS APP LAYER (Vercel CDN)      │
         │                                       │
         │  ┌─────────────────────────────────┐ │
         │  │  React Components (19)          │ │
         │  │  - Pages, Layouts, Components   │ │
         │  └────────────┬────────────────────┘ │
         │               │                       │
         │  ┌────────────▼────────────────────┐ │
         │  │  API Routes (Next.js)           │ │
         │  │  /api/analyze                   │ │
         │  │  /api/vocabulary                │ │
         │  │  /api/collections               │ │
         │  └────────────┬────────────────────┘ │
         │               │                       │
         │  ┌────────────▼────────────────────┐ │
         │  │  Service Layer                  │ │
         │  │  - Auth (Supabase)              │ │
         │  │  - Data (Supabase)              │ │
         │  │  - AI (Groq API)                │ │
         │  │  - TTS (Google Cloud + Web)     │ │
         │  └─────────────────────────────────┘ │
         │                                       │
         └───────┬───────────────────────┬───────┘
                 │                       │
         ┌───────▼────────┐      ┌──────▼─────────┐
         │  SUPABASE      │      │  EXTERNAL APIs │
         │  - Auth        │      │  - Groq        │
         │  - PostgreSQL  │      │  - Google TTS  │
         │  - Storage     │      │  - Web Speech  │
         └────────────────┘      └────────────────┘
```

---

## Architectural Layers

### 1. Presentation Layer (UI)

**Technology:** React 19 + Next.js 16 App Router + Tailwind CSS 4

**Components:**
- Page components (route handlers)
- Layout components (navigation, structure)
- UI components (buttons, cards, dialogs)
- Feature components (camera, analysis, vocabulary)
- Skeleton loaders for async states

**Responsibilities:**
- Render user interface
- Capture user input
- Display data in user-friendly format
- Handle loading & error states

**Key Files:**
- `src/app/(auth)/` - Login, signup pages
- `src/app/(protected)/` - Auth-protected pages
- `src/components/` - Reusable components
- `src/app/layout.tsx` - Root layout

### 2. State Management Layer

**Technology:** React Hooks (useState, useEffect, useContext)

**Custom Hooks:**
- `useAuth()` - Authentication state
- `useCamera()` - Camera access & permissions
- `useAnalyze()` - Photo analysis state machine
- `useSpeech()` - Text-to-speech management
- `useIsMobile()` - Device type detection

**Responsibilities:**
- Manage component state (loading, data, errors)
- Handle side effects (fetching, storage)
- Provide reusable logic across components
- Abstract complex logic from UI

**Pattern Example:**
```typescript
const { user, loading, logout } = useAuth();
const { state: analysis, loading, analyze } = useAnalyze();
```

### 3. API Layer (Next.js Route Handlers)

**Technology:** Next.js 16 App Router API Routes

**Route Structure:**
```
/api/
  ├── analyze/ (POST) - AI photo analysis
  ├── analyze-trial/ (POST) - 2 free analyses
  ├── vocabulary/ (GET/POST/PUT/DELETE) - Word management
  ├── collections/ (GET/POST) - Collections
  ├── stats/ (GET) - User statistics
  ├── tts/ (POST) - Text-to-speech proxy
  ├── word-of-day/ (GET) - Daily word
  ├── image-proxy/ (GET) - Image caching
  └── upgrade-interest/ (POST) - Premium signup
```

**Responsibilities:**
- Handle HTTP requests
- Validate user authentication
- Enforce rate limiting & permissions
- Call external services
- Return JSON responses
- Handle errors with proper HTTP status codes

**Pattern Example:**
```typescript
// POST /api/vocabulary
export async function POST(req: NextRequest) {
  // 1. Auth check
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Input validation
  const body = await req.json();
  if (!body.wordZh) return Response.json({ error: 'Invalid input' }, { status: 400 });

  // 3. Business logic (save word)
  const supabase = createClient();
  const { data, error } = await supabase.from('vocabulary_items').insert([body]);

  // 4. Error handling & response
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
```

### 4. Service Layer

**External Service Integrations:**

#### A. Groq AI (Image Analysis)
- **Service:** Groq API (Llama 4 Scout vision model)
- **File:** `src/lib/groq.ts`
- **Endpoint:** `/api/analyze`
- **Process:** Base64 image → JSON (objects, scene context)
- **Cost:** ~$0.003 per analysis
- **Reliability:** 99.9% uptime SLA

#### B. Supabase (Database & Auth)
- **Service:** Managed PostgreSQL + Auth
- **Files:** `src/lib/supabase/client.ts`, `server.ts`
- **Features:**
  - User authentication (email/password)
  - Row-Level Security (RLS) for data protection
  - Real-time subscriptions (optional)
  - File storage (S3-backed)
- **Tables:** profiles, photo_analyses, vocabulary_items, etc.

#### C. Google Cloud TTS (Text-to-Speech)
- **Service:** Google Cloud Text-to-Speech API
- **File:** `src/lib/` (called from `/api/tts`)
- **Endpoint:** `/api/tts` proxy route
- **Languages:** Mandarin Chinese (zh-CN)
- **Fallback:** Web Speech API (browser native)

#### D. Image Processing
- **Service:** Client-side compression (canvas API)
- **File:** `src/lib/utils.ts`
- **Process:** File → Canvas → JPEG (optimized)
- **Target:** Max 2MB, 1024x1024px recommended

### 5. Data Layer (Supabase PostgreSQL)

**Database Schema:**

```sql
-- User profiles
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Photo analyses (AI results)
CREATE TABLE photo_analyses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id),
  image_url TEXT NOT NULL,
  scene_context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Detected objects from analyses
CREATE TABLE detected_objects (
  id UUID PRIMARY KEY,
  analysis_id UUID REFERENCES photo_analyses(id),
  label_en VARCHAR(255),
  label_zh VARCHAR(255),
  pinyin VARCHAR(255),
  confidence DECIMAL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User's saved vocabulary
CREATE TABLE vocabulary_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id),
  word_zh VARCHAR(255),
  word_pinyin VARCHAR(255),
  word_en VARCHAR(255),
  detected_object_id UUID REFERENCES detected_objects(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Word collections
CREATE TABLE collections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id),
  name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Practice session tracking
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id),
  vocabulary_id UUID REFERENCES vocabulary_items(id),
  correct BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User statistics
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(user_id),
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_practice_date DATE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily usage tracking (rate limiting)
CREATE TABLE daily_usage (
  user_id UUID REFERENCES profiles(user_id),
  date DATE,
  usage_count INT DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- Premium interest tracking
CREATE TABLE upgrade_interest (
  user_id UUID REFERENCES profiles(user_id),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Security:**
- All tables have Row-Level Security (RLS) enabled
- Policies check `auth.uid() = user_id`
- Sensitive data encrypted at rest
- Auto-profile creation via trigger

---

## Data Flow Diagrams

### Photo Analysis Flow

```
1. User captures/uploads photo
   ↓
2. Frontend compresses image (JPEG, max 2MB)
   ↓
3. Convert to Base64 & POST to /api/analyze
   ↓
4. API Route Handler
   ├─ Check auth (get user_id)
   ├─ Check rate limit (daily_usage table)
   ├─ Call Groq API with Base64 + prompt
   └─ Parse JSON response
   ↓
5. Save to Database
   ├─ Insert photo_analyses row
   ├─ Insert detected_objects rows (one per object)
   └─ Return analysis ID
   ↓
6. Frontend displays results
   ├─ Show image with detected objects
   ├─ Display Chinese vocabulary + Pinyin
   └─ Offer "Save Word" buttons
   ↓
7. User saves word
   ├─ POST to /api/vocabulary with word data
   ├─ Duplicate check (prevent same word twice)
   └─ Insert vocabulary_items row
```

### Vocabulary Learning Flow

```
1. User navigates to Practice
   ↓
2. Frontend fetches user's vocabulary
   ├─ GET /api/vocabulary?limit=50
   └─ Display words
   ↓
3. User practices (flashcard/quiz mode)
   ├─ View word (Chinese)
   ├─ Guess translation or Pinyin
   ├─ Reveal answer
   └─ Mark correct/incorrect
   ↓
4. Record practice session
   ├─ POST to /api/stats with result
   ├─ Insert practice_sessions row
   └─ Update user_stats streak
   ↓
5. User sees progress
   ├─ Current streak displayed
   ├─ Total words learned
   └─ Practice frequency chart
```

### Authentication Flow

```
1. User visits app
   ↓
2. Check session in localStorage
   ├─ If valid → Redirect to dashboard
   └─ If expired → Show login page
   ↓
3. User enters email + password → Click Sign Up
   ↓
4. Frontend POST to Supabase Auth
   ├─ Email confirmation email sent
   └─ User must verify email
   ↓
5. User confirms email via link
   ↓
6. User can now login
   ├─ POST email + password to Supabase Auth
   ├─ Returns session JWT
   └─ Store in secure cookie (httpOnly)
   ↓
7. All API requests include session
   ├─ Middleware validates JWT
   └─ Extract user_id for authorization
```

---

## Integration Points

### External APIs

| Service | Purpose | Method | Rate Limit |
|---------|---------|--------|-----------|
| **Groq API** | Photo analysis | REST | 30 req/min free |
| **Google Cloud TTS** | Pronunciation | REST | 300K chars/month free |
| **Web Speech API** | TTS fallback | Browser native | Unlimited |
| **Supabase Auth** | User authentication | Client SDK | 50 signups/day free |
| **Supabase DB** | Data storage | Client SDK | 500MB free |
| **Supabase Storage** | Image storage | Client SDK | 1GB free |

### Third-Party Libraries

| Library | Purpose | Version |
|---------|---------|---------|
| Next.js | Framework | 16.1.1 |
| React | UI library | 19.2.3 |
| Tailwind CSS | Styling | 4.0.0 |
| Radix UI | Accessible components | Latest |
| shadcn/ui | Component library | Latest |
| Supabase JS | Database client | 2.89.0 |
| Groq SDK | AI API client | 0.37.0 |
| Capacitor | Mobile bridge | 7.4.4 |

---

## Deployment Architecture

### Frontend (Next.js)
- **Platform:** Vercel (Next.js native)
- **Region:** Auto-selected by Vercel (global CDN)
- **Build:** `npm run build` → serverless functions
- **Environment:** Production, staging, preview

### Database (Supabase)
- **Provider:** Supabase (managed PostgreSQL)
- **Region:** US or EU (configurable)
- **Backups:** Daily automated backups
- **Recovery:** Point-in-time recovery available

### File Storage (Supabase Storage)
- **Provider:** Supabase Storage (S3-backed)
- **Bucket:** `photo-analyses` (user photos)
- **CDN:** Supabase CDN + Cloudflare

### AI Service (Groq API)
- **Provider:** Groq Cloud
- **Authentication:** API key in environment variables
- **Fallback:** Queue system if API down

### Monitoring
- **Errors:** Sentry (JavaScript error tracking)
- **Performance:** Vercel Analytics (Core Web Vitals)
- **Logging:** Supabase logs (database queries)

---

## Security Architecture

### Authentication
- **Method:** Email/password + JWT sessions
- **Storage:** Secure httpOnly cookies
- **Expiration:** 24 hours (configurable)
- **Provider:** Supabase Auth (industry standard)

### Authorization
- **Method:** Row-Level Security (RLS)
- **Level:** Table-based policies
- **Enforcement:** Database enforces at query time
- **Example:** Only user can see their own vocabulary

```sql
-- Vocabulary RLS policy
ALTER TABLE vocabulary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_vocabulary ON vocabulary_items
  FOR ALL USING (user_id = auth.uid());
```

### Data Protection
- **Transmission:** TLS 1.3+ (HTTPS)
- **Storage:** Encryption at rest (Supabase)
- **Backup:** Encrypted backups
- **Secrets:** Environment variables, never committed

### Rate Limiting
- **Free Tier:** 6 photo analyses per day
- **Implementation:** `daily_usage` table + API check
- **Enforcement:** Database query before Groq API call
- **Premium:** Unlimited (future)

### API Security
- **Input Validation:** Check type & format before processing
- **Auth Check:** Verify session on protected routes
- **Error Messages:** Don't leak sensitive info
- **CORS:** Restricted to domain origin
- **CSRF:** Protected by SameSite cookies

---

## Scaling Strategy

### Current State (MVP)
- Single Next.js deployment
- Managed database (Supabase)
- Suitable for < 10K DAU

### Phase 2 (10K - 100K DAU)
- Image caching (CDN)
- Database read replicas
- Groq API rate limit handling
- Search indexing (Elasticsearch optional)

### Phase 3 (100K+ DAU)
- Microservices (auth, analysis, vocabulary)
- Message queue (Bull, RabbitMQ)
- Caching layer (Redis)
- Database sharding by user_id
- Analytics warehouse (BigQuery)

### Infrastructure as Code
- **Tool:** Terraform (future)
- **Version Control:** Infrastructure in git
- **CI/CD:** Automated deployment pipelines

---

## Technology Decision Rationale

| Component | Choice | Alternatives | Reason |
|-----------|--------|--------------|--------|
| Frontend | Next.js | React SPA, Remix | SSR benefits, fast builds, vercel integration |
| Database | Supabase | Firebase, MongoDB | RLS built-in, PostgreSQL power, SQL |
| Auth | Supabase Auth | Auth0, Firebase Auth | Integrated, no extra cost |
| AI Vision | Groq | OpenAI, Google Vision | Cost-effective (~$0.003/call) |
| TTS | Google Cloud + Web Speech | AWS Polly, Elevenlabs | Cost, reliability, fallback |
| Styling | Tailwind CSS | Bootstrap, Material UI | Utility-first, smaller bundle |
| Mobile | Capacitor | React Native, Flutter | Code reuse, web-based |
| Deployment | Vercel | AWS, Google Cloud, Heroku | Optimized for Next.js, ease of use |

---

## Performance Optimization

### Frontend
- Code splitting with `next/dynamic`
- Image optimization with `next/image`
- Font optimization with `next/font`
- CSS-in-JS eliminated (Tailwind CSS)
- Lazy loading of routes & components

### Backend
- Database indexing on frequently queried columns (user_id, created_at)
- Connection pooling (Supabase)
- Caching (Redis for future scaling)
- Query optimization (avoid N+1)

### Network
- CDN for static assets (Vercel CDN)
- Image compression before upload (< 2MB)
- HTTP/2 & HTTP/3 support
- Gzip compression for responses

### Monitoring & Optimization
- Core Web Vitals tracking (Vercel Analytics)
- Error tracking (Sentry)
- Performance monitoring (custom logs)
- User behavior analytics (Mixpanel optional)

---

## References

- **Next.js Architecture:** https://nextjs.org/docs/getting-started/project-structure
- **Supabase Docs:** https://supabase.com/docs
- **Groq API:** https://console.groq.com/docs/
- **Capacitor Guide:** https://capacitorjs.com/docs/getting-started
- **PostgreSQL Best Practices:** https://www.postgresql.org/docs/current/

