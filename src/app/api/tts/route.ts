import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, lang = 'zh-CN' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
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
          input: { text },
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
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}

