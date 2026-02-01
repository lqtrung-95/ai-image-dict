---
title: "Phase 02: Shared Code Extraction and API Client Setup"
description: "Extract reusable types, constants, validation logic and setup API client for mobile"
---

# Phase 02: Shared Code Extraction and API Client Setup

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Previous Phase: [phase-01-expo-project-setup-and-configuration.md](./phase-01-expo-project-setup-and-configuration.md)
- Codebase Analysis: [scout/scout-codebase-analysis-report.md](./scout/scout-codebase-analysis-report.md)

## Overview
- **Priority:** P0
- **Status:** Pending
- **Description:** Extract reusable code from the web app (types, constants, validation) and setup the API client for React Native.
- **Estimated Effort:** 2-3 days

## Key Insights
- Types in `src/types/index.ts` are platform-agnostic and can be reused
- API client already has Capacitor detection and can be adapted
- Supabase client uses Capacitor Preferences - works in React Native
- Validation logic is pure JavaScript - fully reusable

## Requirements

### Functional Requirements
- All TypeScript types available in mobile app
- API client configured for React Native
- Supabase client working with SecureStore
- Constants and validation logic extracted

### Technical Requirements
- Path aliases working for imports
- API base URL configurable via env vars
- Proper error handling for network requests

## Architecture

### Shared Code Structure
```
apps/mobile/lib/
├── types.ts              # Reused from web
├── constants.ts          # Reused from web
├── validation.ts         # Reused from web
├── api-client.ts         # Adapted from web
├── supabase.ts           # New RN-specific client
└── utils.ts              # Adapted utilities
```

## Related Code Files
- `src/types/index.ts` - Types to reuse
- `src/lib/constants.ts` - Constants to reuse
- `src/lib/validation.ts` - Validation to reuse
- `src/lib/api-client.ts` - API client to adapt
- `src/lib/supabase/client.ts` - Supabase client to adapt

## Implementation Steps

### Step 1: Copy Type Definitions
Copy `src/types/index.ts` to `apps/mobile/lib/types.ts`:
```typescript
// All types from web app - platform agnostic
export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

export interface DetectedObject {
  id: string;
  label_english: string;
  label_chinese_simplified: string;
  label_chinese_traditional?: string;
  pinyin: string;
  category: string;
  confidence: number;
}

export interface PhotoAnalysis {
  id: string;
  user_id: string;
  image_url: string;
  scene_context?: string;
  detected_objects: DetectedObject[];
  created_at: string;
}

export interface VocabularyItem {
  id: string;
  user_id: string;
  word_english: string;
  word_chinese_simplified: string;
  word_chinese_traditional?: string;
  pinyin: string;
  notes?: string;
  collection_id?: string;
  detected_object_id?: string;
  created_at: string;
  last_reviewed?: string;
  review_count: number;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  vocabulary_id: string;
  correct: boolean;
  mode: 'flashcard' | 'multiple_choice' | 'listening' | 'typing';
  created_at: string;
}

export interface UserStats {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_words_learned: number;
  total_practice_sessions: number;
  last_practice_date?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  is_official: boolean;
  created_by?: string;
  created_at: string;
  word_count: number;
  average_rating?: number;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  created_by: string;
  created_at: string;
}

export interface DailyGoal {
  user_id: string;
  daily_target: number;
  current_progress: number;
  date: string;
}

export interface WordOfDay {
  id: string;
  word_english: string;
  word_chinese_simplified: string;
  pinyin: string;
  example_sentence?: string;
  date: string;
}
```

### Step 2: Copy Constants
Copy `src/lib/constants.ts` to `apps/mobile/lib/constants.ts`:
```typescript
export const APP_NAME = 'AI Image Dictionary';
export const APP_VERSION = '1.0.0';

// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.aiimagedict.com';

// Limits
export const MAX_FREE_ANALYSES = 2;
export const MAX_DAILY_ANALYSES = 6;
export const MAX_IMAGE_SIZE_MB = 5;

// Practice Modes
export const PRACTICE_MODES = {
  FLASHCARD: 'flashcard',
  MULTIPLE_CHOICE: 'multiple_choice',
  LISTENING: 'listening',
  TYPING: 'typing',
} as const;

// HSK Levels
export const HSK_LEVELS = [1, 2, 3, 4, 5, 6] as const;

// Categories
export const OBJECT_CATEGORIES = [
  'food',
  'animal',
  'plant',
  'furniture',
  'electronics',
  'clothing',
  'vehicle',
  'building',
  'nature',
  'other',
] as const;
```

### Step 3: Copy Validation Logic
Copy `src/lib/validation.ts` to `apps/mobile/lib/validation.ts`:
```typescript
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain an uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain a lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain a number' };
  }
  return { valid: true };
};

export const validatePinyin = (pinyin: string): boolean => {
  // Basic pinyin validation - allows letters, numbers, and tone marks
  const pinyinRegex = /^[a-zA-Z0-9\sāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$/;
  return pinyinRegex.test(pinyin);
};

export const validateChineseCharacter = (char: string): boolean => {
  // Check if string contains Chinese characters
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(char);
};
```

### Step 4: Create API Client
Create `apps/mobile/lib/api-client.ts`:
```typescript
import { API_BASE_URL } from './constants';
import { supabase } from './supabase';

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'An error occurred',
        status: response.status,
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse<T>(response);
  }

  // Upload with FormData (for images)
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
```

### Step 5: Create Supabase Client
Create `apps/mobile/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SecureStore adapter for React Native
const SecureStorageAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

// Fallback to memory storage for SSR/development
const MemoryStorageAdapter = {
  storage: new Map<string, string>(),
  getItem: (key: string) => {
    return Promise.resolve(MemoryStorageAdapter.storage.get(key) || null);
  },
  setItem: (key: string, value: string) => {
    MemoryStorageAdapter.storage.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    MemoryStorageAdapter.storage.delete(key);
    return Promise.resolve();
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? MemoryStorageAdapter : SecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Step 6: Create Utility Functions
Create `apps/mobile/lib/utils.ts`:
```typescript
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export const compressImage = async (
  uri: string,
  maxSize: number = 1024
): Promise<string> => {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxSize } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return manipulated.uri;
};

export const imageToBase64 = async (uri: string): Promise<string> => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
```

### Step 7: Create Environment Types
Create `apps/mobile/types/env.d.ts`:
```typescript
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL: string;
    EXPO_PUBLIC_SUPABASE_URL: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
  }
}
```

## Todo List
- [ ] Copy all TypeScript types from web app
- [ ] Copy constants and configuration
- [ ] Copy validation logic
- [ ] Create API client with auth headers
- [ ] Create Supabase client with SecureStore
- [ ] Create utility functions (image compression, formatting)
- [ ] Setup environment type definitions
- [ ] Test API client with a simple request
- [ ] Verify Supabase auth works
- [ ] Document shared code structure

## Success Criteria
- [ ] All types compile without errors
- [ ] API client can make authenticated requests
- [ ] Supabase client stores tokens securely
- [ ] Image compression works on device
- [ ] No TypeScript errors in lib/ folder

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| SecureStore size limits | Low | Medium | Handle large tokens gracefully |
| API compatibility issues | Medium | High | Test all endpoints early |
| Environment variables not loading | Medium | High | Add validation on startup |

## Security Considerations
- Supabase tokens stored in SecureStore (encrypted)
- API keys never committed to repo
- Environment variables validated at runtime

## Next Steps
After completing this phase, proceed to [Phase 03: Authentication Setup](./phase-03-supabase-authentication-and-navigation-guards.md) to implement auth flows.
