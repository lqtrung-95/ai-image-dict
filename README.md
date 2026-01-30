# AI Image Dictionary (AI词典)

**Transform Chinese vocabulary learning through AI-powered image analysis.**

Users capture or upload photos, AI detects objects and returns instant Chinese vocabulary with pronunciation guides. Learn contextually while building a personal vocabulary library.

## Quick Links

- **Live Demo:** [https://ai-image-dict.vercel.app](https://ai-image-dict.vercel.app) (coming Feb 2026)
- **Documentation:** See `/docs` directory
- **Issue Tracker:** [GitHub Issues](https://github.com/yourusername/ai-image-dict/issues)

---

## Key Features

- **AI Photo Analysis** - Detect objects using Groq Llama 4 Scout vision model
- **Chinese Vocabulary** - Instant vocabulary with 汉字, Pinyin, and English translations
- **Smart Practice** - Flashcard mode, quiz modes, and daily streaks
- **Personal Library** - Organize words into collections and track progress
- **Text-to-Speech** - Hear pronunciations (Google Cloud TTS + Web Speech API)
- **Cross-Platform** - Web app + Native apps (iOS/Android via Capacitor)
- **Free Trial** - 2 free photo analyses without account signup

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js App Router | 16.1.1 |
| UI | React + Tailwind CSS + shadcn/ui | 19 + 4.0 |
| Database | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth | - |
| AI Vision | Groq API (Llama 4 Scout) | Latest |
| TTS | Google Cloud + Web Speech API | - |
| Mobile | Capacitor | 7.4.4 |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account
- Groq API key
- Google Cloud TTS API key (optional, Web Speech API fallback available)

### Installation

```bash
# 1. Clone and install dependencies
git clone https://github.com/yourusername/ai-image-dict.git
cd ai-image-dict
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - GROQ_API_KEY
# - GOOGLE_TTS_API_KEY (optional)

# 3. Set up database
# - Create Supabase project
# - Run migrations (SQL files in docs/database)
# - Enable Row Level Security (RLS) on all tables

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Development

### Available Commands

```bash
npm run dev        # Start development server (http://localhost:3000)
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint checks
npm run format     # Format code with Prettier
npm run type-check # Check TypeScript types
npm run test       # Run tests (when added)
```

### Project Structure

```
src/
├── app/              # Next.js pages & API routes
│   ├── (auth)/      # Login, signup pages
│   ├── (protected)/ # Auth-required pages
│   └── api/         # REST API endpoints
├── components/       # React components
├── hooks/           # Custom React hooks
├── lib/             # Utilities & services
├── types/           # TypeScript definitions
└── proxy.ts         # Image proxy utility
```

See [`docs/codebase-summary.md`](./docs/codebase-summary.md) for detailed architecture.

---

## Documentation

All documentation is in the `/docs` directory:

| File | Purpose |
|------|---------|
| [`project-overview-pdr.md`](./docs/project-overview-pdr.md) | Product overview, requirements, and roadmap |
| [`codebase-summary.md`](./docs/codebase-summary.md) | Architecture, directory structure, key features |
| [`system-architecture.md`](./docs/system-architecture.md) | System design, data flows, integrations |
| [`code-standards.md`](./docs/code-standards.md) | Coding conventions, patterns, best practices |
| [`development-roadmap.md`](./docs/development-roadmap.md) | Development phases, milestones, success metrics |
| [`project-changelog.md`](./docs/project-changelog.md) | Release history and change tracking |

---

## API Routes

### Public Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analyze-trial` | POST | 2 free photo analyses |
| `/api/tts` | POST | Text-to-speech proxy |
| `/api/word-of-day` | GET | Daily word feature |

### Protected Routes (Auth Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analyze` | POST | AI photo analysis |
| `/api/vocabulary` | GET/POST/PUT/DELETE | Vocabulary CRUD |
| `/api/collections` | GET/POST | Collections CRUD |
| `/api/stats` | GET | User statistics |

See [`docs/system-architecture.md`](./docs/system-architecture.md) for detailed API specifications.

---

## Environment Variables

Create a `.env.local` file with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Groq AI
GROQ_API_KEY=your_groq_api_key_here

# Google Cloud TTS (optional - Web Speech API used as fallback)
GOOGLE_TTS_API_KEY=your_google_tts_key_here
```

See `.env.example` for a template.

---

## Database Setup

### Supabase Configuration

1. **Create project** on [supabase.com](https://supabase.com)
2. **Run migrations** - SQL schema files available in project
3. **Enable RLS** - Row-Level Security on all tables
4. **Configure Auth** - Email/password provider in Supabase dashboard

### Key Tables

- `profiles` - User profiles
- `photo_analyses` - Photo analysis records
- `detected_objects` - Objects detected in photos
- `vocabulary_items` - User's saved words
- `collections` - Word collections
- `user_stats` - Learning statistics & streaks
- `practice_sessions` - Practice history

See [`docs/system-architecture.md`](./docs/system-architecture.md) for complete schema.

---

## Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Vercel at https://vercel.com
# - Select your GitHub repo
# - Add environment variables
# - Deploy

# 3. Visit deployed app
# https://your-project.vercel.app
```

### Other Platforms

Can deploy to any Node.js hosting:
- AWS Amplify
- Netlify
- Google Cloud Run
- Digital Ocean

See [Next.js Deployment Docs](https://nextjs.org/docs/deployment) for details.

---

## Contributing

We welcome contributions! Please:

1. **Read** [`docs/code-standards.md`](./docs/code-standards.md) for coding guidelines
2. **Fork** the repository
3. **Create feature branch** (`git checkout -b feature/amazing-feature`)
4. **Follow conventions:** TypeScript strict mode, ESLint, component under 200 LOC
5. **Test changes** locally (`npm run dev`, `npm run lint`, `npm run type-check`)
6. **Commit with message:** `feat: add amazing feature`
7. **Push and create PR** with clear description

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes
# - Edit code
# - Test locally: npm run dev
# - Lint: npm run lint
# - Type check: npm run type-check

# 3. Commit changes
git add .
git commit -m "feat: add your feature"

# 4. Push and create PR
git push origin feature/your-feature
# Then open PR on GitHub
```

---

## Roadmap

### Phase 1: MVP (Feb 2026)
- Core photo analysis
- Vocabulary management
- Basic practice modes
- User authentication
- 50+ beta users

### Phase 2: Growth (Mar 2026)
- Advanced quiz modes
- Collections feature
- Mobile apps (iOS/Android)
- 500+ MAU

### Phase 3: Monetization (Apr 2026)
- Premium subscription ($4.99/month)
- Spaced repetition algorithm
- $1K+ MRR

### Phase 4: Scale (May+ 2026)
- Multiple languages (Japanese, Spanish, Korean)
- Teacher/classroom features
- 5K+ MAU

See [`docs/development-roadmap.md`](./docs/development-roadmap.md) for detailed planning.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/ai-image-dict/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/ai-image-dict/discussions)
- **Documentation:** See `/docs` directory
- **Email:** support@example.com (when available)

---

## License

MIT License - see LICENSE file for details.

---

## Acknowledgments

- Groq for fast, affordable AI vision API
- Supabase for managed PostgreSQL & Auth
- Vercel for Next.js hosting
- Capacitor for cross-platform native support
- Open source community for amazing libraries

---

## Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Groq Console & API](https://console.groq.com)
- [Capacitor Guide](https://capacitorjs.com/docs)
- [Tailwind CSS](https://tailwindcss.com)

---

**Built with ❤️ for language learners. Happy learning!**
