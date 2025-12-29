---
phase: implementation
title: Implementation Guide
description: Technical implementation notes, patterns, and code guidelines
feature: photo-vocabulary-detection
---

# Implementation Guide: Photo Vocabulary Detection

## Development Setup
**How do we get started?**

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Groq API key (free tier available)
- Supabase account

### Environment Setup

```bash
# Clone and install
git clone <repo-url>
cd ai-image-dictionary
pnpm install

# Copy environment template
cp .env.example .env.local
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_api_key
GOOGLE_TTS_API_KEY=your_google_tts_api_key
```

### Database Setup

Run these SQL commands in Supabase SQL Editor:

```sql
-- Users table (managed by Supabase Auth, but we extend it)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Photo analyses
create table public.photo_analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  image_url text not null,
  scene_context jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Detected objects
create table public.detected_objects (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid references public.photo_analyses(id) on delete cascade not null,
  label_en text not null,
  label_zh text not null,
  pinyin text not null,
  confidence float,
  bounding_box jsonb,
  category text default 'object'
);

-- Collections
create table public.collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text default '#3b82f6',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Vocabulary items
create table public.vocabulary_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  detected_object_id uuid references public.detected_objects(id) on delete set null,
  collection_id uuid references public.collections(id) on delete set null,
  word_zh text not null,
  word_pinyin text not null,
  word_en text not null,
  example_sentence text,
  is_learned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.photo_analyses enable row level security;
alter table public.detected_objects enable row level security;
alter table public.collections enable row level security;
alter table public.vocabulary_items enable row level security;

-- Profiles: users can only read/update their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Photo analyses: users can only access their own
create policy "Users can view own analyses" on public.photo_analyses for select using (auth.uid() = user_id);
create policy "Users can create own analyses" on public.photo_analyses for insert with check (auth.uid() = user_id);
create policy "Users can delete own analyses" on public.photo_analyses for delete using (auth.uid() = user_id);

-- Detected objects: accessible via analysis ownership
create policy "Users can view objects from own analyses" on public.detected_objects for select 
  using (exists (select 1 from public.photo_analyses where id = analysis_id and user_id = auth.uid()));

-- Collections: users can only access their own
create policy "Users can manage own collections" on public.collections for all using (auth.uid() = user_id);

-- Vocabulary: users can only access their own
create policy "Users can manage own vocabulary" on public.vocabulary_items for all using (auth.uid() = user_id);
```

## Code Structure
**How is the code organized?**

```
src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home/landing page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx          # Protected layout with auth check
│   │   ├── capture/page.tsx
│   │   ├── upload/page.tsx
│   │   ├── analysis/[id]/page.tsx
│   │   ├── vocabulary/page.tsx
│   │   └── history/page.tsx
│   └── api/
│       ├── analyze/route.ts
│       ├── analyses/
│       ├── vocabulary/
│       └── collections/
├── components/
│   ├── ui/                     # Base UI components (Button, Card, Input, etc.)
│   ├── layout/                 # Header, Footer, Navigation
│   ├── auth/                   # Auth-related components
│   ├── camera/                 # CameraCapture, CameraPreview
│   ├── upload/                 # PhotoUpload, DropZone
│   ├── analysis/               # AnalysisResult, ObjectCard, SceneContext
│   ├── vocabulary/             # VocabularyCard, VocabularyList, SearchBar
│   └── sharing/                # ShareButton, ShareCard
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # Auth middleware
│   ├── openai.ts               # OpenAI client and helpers
│   ├── utils.ts                # General utilities
│   └── constants.ts            # App constants
├── hooks/
│   ├── useAuth.ts              # Authentication hook
│   ├── useCamera.ts            # Camera access hook
│   ├── useVocabulary.ts        # Vocabulary CRUD hook
│   ├── useAnalysis.ts          # Analysis hook
│   └── useSpeech.ts            # Text-to-speech hook (Google TTS + fallback)
├── types/
│   └── index.ts                # TypeScript interfaces
└── styles/
    └── globals.css             # Global styles + Tailwind
```

## Implementation Notes
**Key technical details to remember:**

### Core Features

#### Photo Analysis with Groq (Llama 3.2 Vision)

```typescript
// lib/groq.ts
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function analyzeImage(base64Image: string) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.2-90b-vision-preview', // or 'llama-3.2-11b-vision-preview' for faster/cheaper
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this image and identify all visible objects, colors, and actions.
            
For each item, provide:
1. English label
2. Chinese translation (Simplified)
3. Pinyin with tone marks

Also provide a brief scene description.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "sceneDescription": "A brief description of the scene",
  "objects": [
    { "en": "dog", "zh": "狗", "pinyin": "gǒu", "confidence": 0.95, "category": "object" }
  ],
  "colors": [
    { "en": "red", "zh": "红色", "pinyin": "hóngsè" }
  ],
  "actions": [
    { "en": "running", "zh": "跑步", "pinyin": "pǎobù" }
  ]
}`
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}` }
          }
        ]
      }
    ],
    max_tokens: 1000
  });

  const content = response.choices[0].message.content || '{}';
  // Clean up response in case model returns markdown code blocks
  const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(jsonStr);
}
```

#### Camera Capture Hook

```typescript
// hooks/useCamera.ts
import { useState, useRef, useCallback } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Back camera on mobile
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
  }, [stream]);

  return { videoRef, startCamera, capturePhoto, stopCamera, error };
}
```

#### Text-to-Speech Hook (Google TTS + Web Speech Fallback)

```typescript
// hooks/useSpeech.ts
import { useCallback, useRef } from 'react';

export function useSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Primary: Google Text-to-Speech API
  const speakWithGoogle = useCallback(async (text: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: 'zh-CN' })
      });

      if (!response.ok) return false;

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      await audioRef.current.play();
      return true;
    } catch (error) {
      console.warn('Google TTS failed, falling back to Web Speech:', error);
      return false;
    }
  }, []);

  // Fallback: Browser Web Speech API
  const speakWithWebSpeech = useCallback((text: string, lang: string = 'zh-CN') => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.8; // Slower for learning
    
    speechSynthesis.speak(utterance);
  }, []);

  // Main speak function: Try Google first, fallback to Web Speech
  const speak = useCallback(async (text: string, lang: string = 'zh-CN') => {
    const googleSuccess = await speakWithGoogle(text);
    if (!googleSuccess) {
      speakWithWebSpeech(text, lang);
    }
  }, [speakWithGoogle, speakWithWebSpeech]);

  const stop = useCallback(() => {
    // Stop Google TTS audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Stop Web Speech
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
}
```

```typescript
// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, lang = 'zh-CN' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: lang,
            name: 'cmn-CN-Wavenet-A', // High-quality Chinese voice
            ssmlGender: 'FEMALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.85 // Slightly slower for learning
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('Google TTS API error');
    }

    const data = await response.json();
    const audioBuffer = Buffer.from(data.audioContent, 'base64');

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400' // Cache for 24h
      }
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}
```

### Patterns & Best Practices

#### API Route Pattern

```typescript
// app/api/analyze/route.ts
import { createServerClient } from '@/lib/supabase/server';
import { analyzeImage } from '@/lib/groq';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    // Analyze with OpenAI
    const analysis = await analyzeImage(image);

    // Store in database
    const { data: photoAnalysis, error: dbError } = await supabase
      .from('photo_analyses')
      .insert({
        user_id: user.id,
        image_url: '', // Will update after storage upload
        scene_context: {
          description: analysis.sceneDescription,
          colors: analysis.colors,
          actions: analysis.actions
        }
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Insert detected objects
    const objects = analysis.objects.map((obj: any) => ({
      analysis_id: photoAnalysis.id,
      label_en: obj.en,
      label_zh: obj.zh,
      pinyin: obj.pinyin,
      confidence: obj.confidence || 0.9,
      category: obj.category || 'object'
    }));

    await supabase.from('detected_objects').insert(objects);

    return NextResponse.json({ 
      id: photoAnalysis.id,
      ...analysis 
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' }, 
      { status: 500 }
    );
  }
}
```

#### Component Pattern

```typescript
// components/vocabulary/VocabularyCard.tsx
'use client';

import { useSpeech } from '@/hooks/useSpeech';
import { VocabularyItem } from '@/types';
import { Volume2, Check, Trash2 } from 'lucide-react';

interface VocabularyCardProps {
  item: VocabularyItem;
  onToggleLearned: (id: string) => void;
  onDelete: (id: string) => void;
}

export function VocabularyCard({ item, onToggleLearned, onDelete }: VocabularyCardProps) {
  const { speak } = useSpeech();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{item.word_zh}</h3>
          <p className="text-lg text-blue-600">{item.word_pinyin}</p>
          <p className="text-gray-600">{item.word_en}</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => speak(item.word_zh)}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Play pronunciation"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => onToggleLearned(item.id)}
            className={`p-2 rounded-full ${item.is_learned ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100'}`}
            aria-label={item.is_learned ? 'Mark as learning' : 'Mark as learned'}
          >
            <Check className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full"
            aria-label="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Integration Points
**How do pieces connect?**

### Supabase Client Setup

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/supabase/server.ts
import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerClient() {
  const cookieStore = cookies();
  
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}
```

## Error Handling
**How do we handle failures?**

### API Error Responses

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}
```

### Frontend Error Handling

```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Performance Considerations
**How do we keep it fast?**

### Image Optimization
- Compress images before sending to API (target < 1MB)
- Use WebP format where supported
- Generate thumbnails for history view

```typescript
// lib/image.ts
export async function compressImage(base64: string, maxSize = 1024): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      // Scale down if needed
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = base64;
  });
}
```

### Caching
- Cache vocabulary list with React Query or SWR
- Use Supabase's built-in caching
- Service worker caching for PWA

## Security Notes
**What security measures are in place?**

### Authentication
- All API routes check `supabase.auth.getUser()`
- Protected pages redirect to login if no session
- Tokens stored in httpOnly cookies (handled by Supabase)

### Input Validation
- Validate image type and size on client and server
- Sanitize text inputs
- Rate limit analyze endpoint (consider Vercel's rate limiting)

### Data Access
- Row Level Security (RLS) ensures users only access their data
- Service role key only used server-side
- Never expose API keys to client


