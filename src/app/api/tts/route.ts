import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter (resets on server restart)
// For production, use Redis or database-backed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 50; // 50 TTS requests per day
const RATE_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // New window
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
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
    // Check auth
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const { allowed, remaining } = checkRateLimit(user.id);
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

    // Check if Google TTS API key is available
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      // Return 503 to signal client should use fallback
      return NextResponse.json({ error: 'TTS not configured' }, { status: 503 });
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
      return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
    }

    const data = await response.json();
    const audioBuffer = Buffer.from(data.audioContent, 'base64');

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24h
        'X-RateLimit-Remaining': String(remaining),
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}
