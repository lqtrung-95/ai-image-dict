// App constants
export const APP_NAME = 'AI Image Dictionary';
export const APP_DESCRIPTION = 'Learn Chinese vocabulary through photos';

// Image constraints
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_COMPRESSION_QUALITY = 0.8;
export const MAX_IMAGE_DIMENSION = 1024;

// API base URL - uses environment variable for mobile
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://ai-image-dict.vercel.app';

// API endpoints
export const API_ROUTES = {
  ANALYZE: `${API_BASE}/api/analyze`,
  ANALYZE_TRIAL: `${API_BASE}/api/analyze-trial`,
  VOCABULARY: `${API_BASE}/api/vocabulary`,
  LISTS: `${API_BASE}/api/lists`,
  COURSES: `${API_BASE}/api/courses`,
  STATS: `${API_BASE}/api/stats`,
  TTS: `${API_BASE}/api/tts`,
  WORD_OF_DAY: `${API_BASE}/api/word-of-day`,
} as const;

// Groq models
export const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// TTS settings
export const TTS_LANGUAGE = 'zh-CN';
export const TTS_SPEAKING_RATE = 0.85;

// UI constants
export const TOAST_DURATION = 3000;
export const DEBOUNCE_DELAY = 300;

// Free trial
export const MAX_FREE_ANALYSES = 2;
export const MAX_DAILY_ANALYSES = 6;

// HSK Levels
export const HSK_LEVELS = [1, 2, 3, 4, 5, 6] as const;

// Practice modes
export const PRACTICE_MODES = {
  FLASHCARD: 'flashcard',
  MULTIPLE_CHOICE: 'multiple-choice',
  LISTENING: 'listening',
  Pinyin: 'pinyin',
} as const;
