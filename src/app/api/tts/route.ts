import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter (resets on server restart)
// For production, use Redis or database-backed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 50; // 50 TTS requests per day
const RATE_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const TTS_BUCKET = 'tts';
const TTS_VOICE = 'cmn-CN-Wavenet-A';
const AUDIO_CACHE_SECONDS = 31536000; // 1 year

function fallbackResponse(reason: string, remaining: number) {
  return NextResponse.json(
    { fallback: true, reason },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-RateLimit-Remaining': String(remaining),
      },
    }
  );
}

function audioResponse(audioBuffer: Buffer, remaining: number, cacheStatus: 'HIT' | 'MISS') {
  return new NextResponse(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': `public, max-age=${AUDIO_CACHE_SECONDS}, immutable`,
      'X-RateLimit-Remaining': String(remaining),
      'X-TTS-Cache': cacheStatus,
    },
  });
}

function getCachePath(text: string, lang: string) {
  const key = createHash('sha256').update(`${lang}:${TTS_VOICE}:${text}`).digest('hex');
  return `${lang}/${TTS_VOICE}/${key}.mp3`;
}

async function getCachedAudio(cachePath: string): Promise<Buffer | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.storage.from(TTS_BUCKET).download(cachePath);

    if (error || !data) return null;

    return Buffer.from(await data.arrayBuffer());
  } catch (error) {
    console.warn('TTS cache read skipped:', error);
    return null;
  }
}

async function storeCachedAudio(cachePath: string, audioBuffer: Buffer) {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.storage.from(TTS_BUCKET).upload(cachePath, audioBuffer, {
      contentType: 'audio/mpeg',
      cacheControl: String(AUDIO_CACHE_SECONDS),
      upsert: false,
    });

    if (error && !error.message.toLowerCase().includes('already exists')) {
      console.warn('TTS cache write skipped:', error.message);
    }
  } catch (error) {
    console.warn('TTS cache write skipped:', error);
  }
}

function getRateLimitKey(request: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`;

  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip =
    forwardedFor?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  return `ip:${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(key);

  if (!userLimit || now > userLimit.resetTime) {
    // New window
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (userLimit.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT - userLimit.count };
}

export async function POST(request: NextRequest) {
  try {
    // TTS is public for trial users. If auth exists, rate limit by user;
    // otherwise rate limit anonymous use by IP.
    const { user } = await getAuthUser(request).catch(() => ({ user: null }));

    // Rate limiting
    const { allowed, remaining } = checkRateLimit(getRateLimitKey(request, user?.id));
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again tomorrow.', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }

    const { text, lang = 'zh-CN' } = await request.json();

    // Input validation
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }

    // Sanitize and limit text length
    const sanitizedText = text.trim().slice(0, 200); // Max 200 characters
    if (sanitizedText.length === 0) {
      return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 });
    }

    const cachePath = getCachePath(sanitizedText, lang);
    const cachedAudio = await getCachedAudio(cachePath);
    if (cachedAudio) {
      return audioResponse(cachedAudio, remaining, 'HIT');
    }

    // Check if Google TTS API key is available
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      return fallbackResponse('TTS not configured', remaining);
    }

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: sanitizedText },
          voice: {
            languageCode: lang,
            name: 'cmn-CN-Wavenet-A', // High-quality Chinese voice
            ssmlGender: 'FEMALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.85, // Slightly slower for learning
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Google TTS API error:', errorData);
      return fallbackResponse('TTS provider failed', remaining);
    }

    const data = await response.json();
    if (!data.audioContent) {
      console.error('Google TTS API response missing audioContent');
      return fallbackResponse('TTS provider returned no audio', remaining);
    }

    const audioBuffer = Buffer.from(data.audioContent, 'base64');
    await storeCachedAudio(cachePath, audioBuffer);

    return audioResponse(audioBuffer, remaining, 'MISS');
  } catch (error) {
    console.error('TTS error:', error);
    return fallbackResponse('TTS unavailable', 0);
  }
}
