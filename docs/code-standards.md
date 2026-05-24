# AI Image Dictionary - Code Standards & Guidelines

**Version:** 1.0.0
**Last Updated:** 2026-01-27
**Applies To:** TypeScript, React, Next.js codebase

---

## Table of Contents

1. [File Organization](#file-organization)
2. [Naming Conventions](#naming-conventions)
3. [TypeScript Guidelines](#typescript-guidelines)
4. [React Component Patterns](#react-component-patterns)
5. [API Route Patterns](#api-route-patterns)
6. [Styling Conventions](#styling-conventions)
7. [Error Handling](#error-handling)
8. [State Management](#state-management)
9. [Testing Strategy](#testing-strategy)
10. [Code Quality](#code-quality)

---

## File Organization

### Directory Structure Rules

**Follow this structure:**
```
src/
├── app/              # Next.js pages & routes (App Router)
├── components/       # Reusable React components
├── hooks/           # Custom React hooks
├── lib/             # Utilities, services, configuration
├── types/           # TypeScript type definitions
└── proxy.ts         # Image proxy utility
```

### Module Organization

**Keep files focused and under 200 lines of code when possible.**

**Breaking Apart Large Files:**
- `VocabularyCard.tsx` (3,783 tokens) → Consider extracting:
  - `VocabularyCardContent.tsx` (display logic)
  - `VocabularyCardActions.tsx` (buttons/actions)
  - `VocabularyCardHeader.tsx` (header section)

**File Naming Convention:**
- React components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Hooks: `useHookName.ts`
- Types: Keep in `types/index.ts` or co-locate

**Example:**
```
✓ src/components/vocabulary/VocabularyCard.tsx
✓ src/hooks/useCamera.ts
✓ src/lib/groq.ts
✓ src/app/api/analyze/route.ts
✗ src/components/vocabulary/card.tsx (should be PascalCase)
✗ src/lib/ImageCompressionUtility.ts (should be kebab-case)
```

---

## Naming Conventions

### TypeScript/Variables

| Entity | Convention | Example |
|--------|-----------|---------|
| Constants | SCREAMING_SNAKE_CASE | `MAX_PHOTO_SIZE`, `API_TIMEOUT` |
| Variables | camelCase | `currentStreak`, `imageUrl` |
| Functions | camelCase | `formatPinyin()`, `compressImage()` |
| Classes | PascalCase | `PhotoAnalysis`, `UserProfile` |
| Interfaces | I + PascalCase (optional) | `IPhotoAnalysis`, `IDetectedObject` |
| Types | PascalCase | `User`, `AnalysisResult` |
| Enums | PascalCase | `QuizType`, `AnalysisStatus` |

### React Components

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `VocabularyCard`, `CameraCapture` |
| Props interface | Component + 'Props' | `VocabularyCardProps` |
| Event handlers | on + EventName | `onSaveWord`, `onAnalysisComplete` |
| Boolean props | is/has/can prefix | `isLoading`, `hasError`, `canAccess` |

### API Routes

| Endpoint | Pattern | Example |
|----------|---------|---------|
| Create | POST `/api/{resource}` | `POST /api/vocabulary` |
| Read | GET `/api/{resource}[/{id}]` | `GET /api/vocabulary/123` |
| Update | PUT/PATCH `/api/{resource}/{id}` | `PUT /api/vocabulary/123` |
| Delete | DELETE `/api/{resource}/{id}` | `DELETE /api/vocabulary/123` |
| Action | POST `/api/{resource}/{action}` | `POST /api/analyze` |

---

## TypeScript Guidelines

### Type Safety

**Always use TypeScript for type safety:**

```typescript
// ✓ Good: Explicit types
function compressImage(file: File): Promise<Blob> {
  // ...
}

interface VocabularyWord {
  wordZh: string;
  pinyin: string;
  wordEn: string;
}

// ✗ Bad: Any type
function compressImage(file: any): any {
  // ...
}
```

### Type Definitions

**Location:** Keep shared types in `src/types/index.ts`

```typescript
// src/types/index.ts
export interface PhotoAnalysis {
  id: string;
  userId: string;
  imageUrl: string;
  detectedObjects: DetectedObject[];
  createdAt: Date;
}

export interface DetectedObject {
  id: string;
  labelEn: string;
  labelZh: string;
  pinyin: string;
  confidence: number;
}

// ✓ Good: Co-locate if small & specific to component
interface VocabularyCardProps {
  word: DetectedObject;
  onSave: (word: DetectedObject) => Promise<void>;
}
```

### Null/Undefined Handling

```typescript
// ✓ Good: Explicit null checks
const analysis = data?.analysis ?? null;
if (!analysis) {
  setError('Analysis not found');
  return;
}

// Use optional chaining & nullish coalescing
const streak = stats?.currentStreak ?? 0;

// ✗ Bad: Loose equality
if (data == null) { } // Avoid ==, use === or Optional chaining

// ✗ Bad: Truthy checks on numbers/booleans
if (count) { } // 0 is falsy, use !== 0
```

### Strict Mode

**Ensure `tsconfig.json` has strict settings:**
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}
```

---

## React Component Patterns

### Component Structure

**Follow this template:**

```typescript
'use client'; // If using client-side hooks

import { useState, useEffect } from 'react';
import type { VocabularyCardProps } from '@/types';
import { Button } from '@/components/ui/button';

// Component implementation
export function VocabularyCard({ word, onSave }: VocabularyCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(word);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
}
```

### Client vs Server Components

```typescript
// ✓ Server Component (default)
// - No 'use client' directive
// - Can directly access databases, secrets
// - Better for static content

export default function Page() {
  return <div>Server-rendered</div>;
}

// ✓ Client Component (interactive)
'use client';
import { useState } from 'react';

export function InteractiveComponent() {
  const [state, setState] = useState(null);
  return <button onClick={() => setState(1)}>Click</button>;
}
```

### Hooks Usage

**Custom hooks reduce component complexity:**

```typescript
// ✓ Good: Extract logic into hooks
function useAnalyze() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async (image: File) => {
    setLoading(true);
    try {
      const result = await fetch('/api/analyze', { /* ... */ });
      setState(result);
    } finally {
      setLoading(false);
    }
  };

  return { state, loading, analyze };
}

// ✓ Good: Use in components
export function CameraCapture() {
  const { state, loading, analyze } = useAnalyze();
  return <button onClick={() => analyze(file)}>Analyze</button>;
}
```

### Props Destructuring

```typescript
// ✓ Good: Destructure in function signature
function VocabularyCard({ word, onSave }: VocabularyCardProps) {
  return <div>{word.wordZh}</div>;
}

// ✓ Good: With default values
function Button({ text = 'Click me', disabled = false }: ButtonProps) {
  return <button disabled={disabled}>{text}</button>;
}

// ✗ Bad: Accessing props without destructuring
function VocabularyCard(props: VocabularyCardProps) {
  return <div>{props.word.wordZh}</div>; // Extra verbose
}
```

### Effect Dependencies

```typescript
// ✓ Good: Clear dependencies
useEffect(() => {
  fetchData();
}, [id]); // Only run when id changes

// ✓ Good: Cleanup functions
useEffect(() => {
  const timer = setInterval(() => updateStreak(), 1000);
  return () => clearInterval(timer); // Cleanup
}, []);

// ✗ Bad: Missing dependencies
useEffect(() => {
  fetchData(id); // id is dependency but not listed
}, []);

// ✗ Bad: All functions as dependencies
useEffect(() => {
  analyze();
}, [analyze]); // Creates infinite loop
```

---

## API Route Patterns

### Route Handlers

**Location:** `src/app/api/{resource}/route.ts`

**Template:**
```typescript
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET handler
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('vocabulary_items')
      .select('*');

    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch vocabulary' },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    if (!body.wordZh || !body.pinyin) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('vocabulary_items')
      .insert([body])
      .select();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: 'Failed to save vocabulary' },
      { status: 500 }
    );
  }
}
```

### Auth Checking

```typescript
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Continue with authenticated request
  // ...
}
```

### Error Responses

**Use consistent HTTP status codes:**

| Status | Meaning | Use Case |
|--------|---------|----------|
| 200 | OK | Success with data |
| 201 | Created | POST created resource |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | No/invalid auth |
| 403 | Forbidden | User lacks permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate (e.g., word already saved) |
| 500 | Server Error | Unexpected error |

---

## Styling Conventions

### Tailwind CSS

**Use utility classes, not arbitrary values when possible:**

```typescript
// ✓ Good: Standard Tailwind utilities
<div className="mb-4 p-3 rounded-lg bg-slate-800 text-white">
  Content
</div>

// ✓ Good: Use responsive prefixes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  Items
</div>

// ✗ Bad: Arbitrary values
<div className="mb-[18px] p-[14px]">
  Don't use arbitrary values when standard exists
</div>
```

### Color Palette

**Standardized colors for consistency:**

| Element | Color | Tailwind Class |
|---------|-------|-----------------|
| Background | Dark slate | `bg-slate-900`, `bg-slate-800` |
| Text (primary) | White | `text-white` |
| Text (secondary) | Light slate | `text-slate-200`, `text-slate-300` |
| Primary action | Purple | `bg-purple-600`, `hover:bg-purple-700` |
| Error | Red | `text-red-400`, `bg-red-900/20` |
| Success | Green | `text-green-400`, `bg-green-900/20` |
| Border | Slate | `border-slate-600`, `border-slate-700` |

### Component Styling

```typescript
// ✓ Good: Use className consistently
export function VocabularyCard({ word }: VocabularyCardProps) {
  return (
    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
      <h3 className="text-lg font-bold text-white">{word.labelZh}</h3>
      <p className="text-slate-300">{word.pinyin}</p>
    </div>
  );
}

// ✗ Bad: Inline styles
<div style={{ padding: '16px', borderRadius: '8px' }}>
  Avoid inline styles - use Tailwind classes
</div>
```

### Dark Mode

**Dark mode is default; light mode support optional:**

```typescript
// ✓ Good: Dark-first design
<div className="bg-slate-900 text-white">
  Dark by default
</div>

// ✓ Good: For optional light mode
<div className="dark:bg-slate-900 dark:text-white bg-white text-slate-900">
  Light & dark support
</div>
```

---

## Internationalization (i18n) & Native Language Support

### Language Configuration

**Supported Languages:**
```typescript
// src/lib/constants.ts
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', native: 'English' },
  vi: { name: 'Vietnamese', native: 'Tiếng Việt' },
  ko: { name: 'Korean', native: '한국어' },
  ja: { name: 'Japanese', native: '日本語' },
  es: { name: 'Spanish', native: 'Español' },
} as const;

export type NativeLanguage = keyof typeof SUPPORTED_LANGUAGES;
```

### User Language Preference

**Accessing user language:**
```typescript
// Hook pattern
const useUserLanguage = () => {
  const { user } = useAuth();
  return user?.user_metadata?.native_language || 'en';
};

// In component
const userLanguage = useUserLanguage();
const translatedWord = word.word_native?.[userLanguage] || word.word_en;
```

### API Patterns with Language

**Including language in API calls:**
```typescript
// When calling Groq API from server
const language = user.native_language;
const groqPrompt = generatePrompt(image, language);
const response = await groq.create({ prompt: groqPrompt });

// Groq response includes native language translations
const wordData = {
  word_zh: response.label_zh,
  word_pinyin: response.pinyin,
  word_en: response.label_en,
  word_native: {  // Store all language translations
    en: response.label_en,
    vi: response.label_vi,
    ko: response.label_ko,
    ja: response.label_ja,
    es: response.label_es,
  },
  example_sentence_zh: response.example_zh,
  example_sentence_native: response.example[language],
};
```

### Component Display Pattern

**Display translations based on user preference:**
```typescript
interface WordDisplayProps {
  word: VocabularyItem;
  userLanguage: NativeLanguage;
}

export function WordDisplay({ word, userLanguage }: WordDisplayProps) {
  // Get translation in user's language, fallback to English
  const translation = word.word_native?.[userLanguage] || word.word_en;

  return (
    <div className="space-y-2">
      <p className="text-2xl font-bold">{word.word_zh}</p>
      <p className="text-slate-300">{word.word_pinyin}</p>
      <p className="text-white">{translation}</p>
      <p className="text-sm text-slate-400">
        {word.example_sentence_zh}
      </p>
      <p className="text-sm text-slate-300">
        {word.example_sentence_native}
      </p>
    </div>
  );
}
```

### Database Query Pattern

**Filter by language when needed:**
```typescript
// Don't filter in query - store all translations, filter on display
const words = await supabase
  .from('vocabulary_items')
  .select('*')
  .eq('user_id', userId)
  .limit(50);

// Filter to user's language on display (already have all languages in JSONB)
const displayWords = words.map(word => ({
  ...word,
  display_translation: word.word_native[userLanguage],
}));
```

---

## Error Handling

### Try-Catch Pattern

```typescript
// ✓ Good: Proper error handling
async function analyzePhoto(file: File) {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Photo analysis error:', message);
    throw error; // Re-throw or handle
  }
}

// ✓ Good: In components
export function CameraCapture() {
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (file: File) => {
    try {
      const result = await analyzePhoto(file);
      setError(null);
      // Handle success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Capture failed';
      setError(message);
    }
  };

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return <CameraUI onCapture={handleCapture} />;
}
```

- Map technical errors to user-friendly messages (never expose stack traces)
- Use `<ErrorBoundary>` component (`src/components/ui/error-boundary.tsx`) for React errors

---

## State Management

- Separate state concerns: `useState` for simple, `useReducer` for complex
- Always use cleanup in `useEffect` (`mounted` flag pattern)
- Never fetch data outside `useEffect` — causes infinite re-renders

---

## Testing Strategy

### Test Focus Areas

- **Unit tests**: Pure functions (utils, SM-2 algorithm, validation)
- **Component tests**: User interactions and rendering (`@testing-library/react`)
- **API tests**: Route handlers with mocked Supabase

### Coverage Goals

| Area | Target | Focus |
|------|--------|-------|
| Utilities | 100% | Pure functions |
| Hooks | 80%+ | State management |
| Components | 70%+ | User interactions |
| API routes | 80%+ | Happy path + errors |

---

## Code Quality

### Linting

**Run before commit:**
```bash
npm run lint
```

**ESLint config enforces:**
- No unused variables
- Consistent naming
- No console logs in production
- Proper import order

### Formatting

**Prettier enforces code style:**
```bash
npm run format
```

**Style Rules:**
- Line length: 100 characters
- Indentation: 2 spaces
- Semicolons: Required
- Quotes: Single quotes (except JSX)
- Trailing commas: ES5

### TypeScript Checking

**Type check before deployment:**
```bash
npm run type-check
```

**Ensure no `any` types and all errors caught.**

### Code Review Checklist

Before submitting PR:
- [ ] Code follows naming conventions
- [ ] No `console.log` or debugging code left
- [ ] Error handling in place (try-catch, null checks)
- [ ] TypeScript types complete (no `any`)
- [ ] Tests written for new features
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Components under 200 LOC (or justified)
- [ ] Commits are focused & descriptive

---

## Performance Guidelines

- **Image optimization**: Always compress before upload (max 1024px, quality 0.85)
- **Code splitting**: Use `next/dynamic` for heavy components (Quiz, Games)
- **Context over prop drilling**: Use React Context for shared data (auth, online status)
- **Memoization**: `useMemo`/`useCallback` for expensive computations, not simple values

---

## Documentation Standards

- Comment "why", not "what" — explain business logic, not obvious code
- Use JSDoc for public functions with `@param`, `@returns`, `@throws`
- No `console.log` in production — use structured error handling

---

## Common Pitfalls to Avoid

| Pitfall | Problem | Fix |
|---------|---------|-----|
| `any` type | Loses type safety | Specify proper types |
| Missing error handling | App crashes | Add try-catch & null checks |
| Prop drilling | Hard to maintain | Use context or custom hooks |
| Console.log left in | Noise in production | Remove or use logger |
| No dependency array | Infinite loops | List all dependencies |
| Mutating state | React won't update | Create new objects |
| Large components | Hard to test | Split into smaller ones |
| Missing keys in lists | React warnings | Add unique key prop |
| fetch() without error handling | Unhandled promises | Add try-catch |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-27 | Initial code standards |

