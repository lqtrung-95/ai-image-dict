import OpenAI from 'openai';

// OpenRouter is OpenAI-compatible, so a single client + key serves both the
// vision model (photo analysis) and a cheaper text model (stories, imports).
// This avoids per-provider account/usage gates while keeping the standard
// chat.completions request shape.
export const aiClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

// Vision-capable model — required for image analysis (accepts image_url input).
export const VISION_MODEL = 'meta-llama/llama-4-scout';

// Cheap text-only model for generation tasks (story narratives, vocabulary
// extraction). DeepSeek has no vision, so it must not be used for analyzeImage.
export const TEXT_MODEL = 'deepseek/deepseek-chat';
