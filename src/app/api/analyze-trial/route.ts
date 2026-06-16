import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/groq';
import { extractBase64 } from '@/lib/utils';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Server-side cap on the unauthenticated, paid-AI trial endpoint. The mobile
// client also enforces a 1-use trial, but that lives in AsyncStorage and is
// trivially bypassed (reinstall / direct API call), so this protects cost.
const TRIAL_IP_LIMIT = 10;
const TRIAL_IP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

// POST /api/analyze-trial - Trial analysis for non-logged-in users
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`analyze-trial:${ip}`, TRIAL_IP_LIMIT, TRIAL_IP_WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Trial limit reached. Sign up to keep analyzing.', code: 'TRIAL_RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    // Extract base64 from data URL
    const base64Image = extractBase64(image);

    // Analyze with Groq AI
    const analysis = await analyzeImage(base64Image);

    // Define types for AI response
    interface AIObject {
      en: string;
      zh: string;
      pinyin: string;
      confidence?: number;
      hskLevel?: number | null;
      example?: { zh: string; pinyin: string; en: string };
    }

    // Combine all detected items
    const allObjects = [
      ...(analysis.objects || []).map((obj: AIObject) => ({
        id: `trial-obj-${Math.random().toString(36).substr(2, 9)}`,
        label_en: obj.en,
        label_zh: obj.zh,
        en: obj.en,
        zh: obj.zh,
        pinyin: obj.pinyin,
        confidence: obj.confidence || 0.9,
        category: 'object',
        hsk_level: obj.hskLevel ?? null,
        hskLevel: obj.hskLevel ?? null,
        example: obj.example,
      })),
      ...(analysis.colors || []).map((obj: AIObject) => ({
        id: `trial-color-${Math.random().toString(36).substr(2, 9)}`,
        label_en: obj.en,
        label_zh: obj.zh,
        en: obj.en,
        zh: obj.zh,
        pinyin: obj.pinyin,
        confidence: 0.95,
        category: 'color',
        hsk_level: obj.hskLevel ?? null,
        hskLevel: obj.hskLevel ?? null,
        example: obj.example,
      })),
      ...(analysis.actions || []).map((obj: AIObject) => ({
        id: `trial-action-${Math.random().toString(36).substr(2, 9)}`,
        label_en: obj.en,
        label_zh: obj.zh,
        en: obj.en,
        zh: obj.zh,
        pinyin: obj.pinyin,
        confidence: 0.85,
        category: 'action',
        hsk_level: obj.hskLevel ?? null,
        hskLevel: obj.hskLevel ?? null,
        example: obj.example,
      })),
    ];

    // Build example sentences map
    const exampleSentences: Record<string, { zh: string; pinyin: string; en: string }> = {};
    // Build HSK levels map
    const hskLevels: Record<string, number | null> = {};
    allObjects.forEach((obj) => {
      if (obj.example) {
        exampleSentences[obj.zh] = obj.example as { zh: string; pinyin: string; en: string };
      }
      if (obj.hskLevel !== undefined) {
        hskLevels[obj.zh] = obj.hskLevel;
      }
    });

    // Reconstruct data URL for display
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

    return NextResponse.json({
      id: `trial-${Date.now()}`,
      imageUrl: imageDataUrl,
      sceneDescription: analysis.sceneDescription,
      sceneDescriptionZh: analysis.sceneDescriptionZh,
      sceneDescriptionPinyin: analysis.sceneDescriptionPinyin,
      objects: allObjects,
      exampleSentences,
      hskLevels,
      isTrial: true,
    });
  } catch (error) {
    console.error('[analyze-trial] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
