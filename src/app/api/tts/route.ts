import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 50;
const RATE_WINDOW = 24 * 60 * 60 * 1000;
const TTS_BUCKET = 'tts';
const TTS_VOICE = 'cmn-CN-Wavenet-A';
const AUDIO_CACHE_SECONDS = 31536000; // 1 year

function getCachePath(text: string, lang: string) {
  const key = createHash('sha256').update(`${lang}:${TTS_VOICE}:${text}`).digest('hex');
  return `${lang}/${TTS_VOICE}/${key}.mp3`;
}

// Returns the public CDN URL for a cache path — synchronous, no API call.
function getPublicUrl(cachePath: string): string {
  const supabase = createServiceClient();
  const { data } = supabase.storage.from(TTS_BUCKET).getPublicUrl(cachePath);
  return data.publicUrl;
}

// Lightweight existence check via HTTP HEAD against the CDN URL.
// Avoids downloading the audio buffer just to see if it's cached.
async function cdnFileExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
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
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous';
  return `ip:${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  if (entry.count >= RATE_LIMIT) return { allowed: false, remaining: 0 };
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser(request).catch(() => ({ user: null }));
    const { allowed, remaining } = checkRateLimit(getRateLimitKey(request, user?.id));

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again tomorrow.', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }

    const { text, lang = 'zh-CN' } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }

    const sanitizedText = text.trim().slice(0, 200);
    if (!sanitizedText) {
      return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 });
    }

    const cachePath = getCachePath(sanitizedText, lang);
    const publicUrl = getPublicUrl(cachePath);

    // Cache HIT: return CDN URL directly — no audio download, no bandwidth cost.
    const exists = await cdnFileExists(publicUrl);
    if (exists) {
      return NextResponse.json(
        { url: publicUrl },
        { headers: { 'X-TTS-Cache': 'HIT', 'X-RateLimit-Remaining': String(remaining) } }
      );
    }

    // Cache MISS: generate via Google TTS, upload to Storage, return CDN URL.
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { fallback: true, reason: 'TTS not configured' },
        { headers: { 'X-RateLimit-Remaining': String(remaining) } }
      );
    }

    const ttsRes = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: sanitizedText },
          voice: { languageCode: lang, name: TTS_VOICE, ssmlGender: 'FEMALE' },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85 },
        }),
      }
    );

    if (!ttsRes.ok) {
      console.error('Google TTS error:', await ttsRes.json().catch(() => ({})));
      return NextResponse.json(
        { fallback: true, reason: 'TTS provider failed' },
        { headers: { 'X-RateLimit-Remaining': String(remaining) } }
      );
    }

    const ttsData = await ttsRes.json();
    if (!ttsData.audioContent) {
      return NextResponse.json(
        { fallback: true, reason: 'TTS provider returned no audio' },
        { headers: { 'X-RateLimit-Remaining': String(remaining) } }
      );
    }

    const audioBuffer = Buffer.from(ttsData.audioContent, 'base64');
    await storeCachedAudio(cachePath, audioBuffer);

    return NextResponse.json(
      { url: publicUrl },
      { headers: { 'X-TTS-Cache': 'MISS', 'X-RateLimit-Remaining': String(remaining) } }
    );
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ fallback: true, reason: 'TTS unavailable' });
  }
}
