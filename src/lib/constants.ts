// App constants
export const APP_NAME = 'AI Image Dictionary';
export const APP_DESCRIPTION = 'Learn Chinese vocabulary through photos';

// Image constraints
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_COMPRESSION_QUALITY = 0.8;
export const MAX_IMAGE_DIMENSION = 1024;

// API base URL - uses relative paths on web, absolute URL on native apps
// Set NEXT_PUBLIC_API_BASE_URL in .env for native builds (e.g., https://your-app.vercel.app)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// API endpoints
export const API_ROUTES = {
  ANALYZE: `${API_BASE}/api/analyze`,
  VOCABULARY: `${API_BASE}/api/vocabulary`,
  COLLECTIONS: `${API_BASE}/api/collections`,
  ANALYSES: `${API_BASE}/api/analyses`,
  TTS: `${API_BASE}/api/tts`,
} as const;

// Groq models (Llama 4 Scout with vision support)
export const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
export const GROQ_VISION_MODEL_FAST = 'meta-llama/llama-4-scout-17b-16e-instruct';

// TTS settings
export const TTS_LANGUAGE = 'zh-CN';
export const TTS_SPEAKING_RATE = 0.85;

// UI constants
export const TOAST_DURATION = 3000;
export const DEBOUNCE_DELAY = 300;

