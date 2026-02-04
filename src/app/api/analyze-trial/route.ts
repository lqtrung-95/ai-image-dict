import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/groq';
import { extractBase64 } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// POST /api/analyze-trial - Trial analysis for non-logged-in users
export async function POST(request: NextRequest) {
  try {
    console.log('[analyze-trial] Received request');
    console.log('[analyze-trial] Headers:', Object.fromEntries(request.headers.entries()));

    const { image } = await request.json();
    if (!image) {
      console.log('[analyze-trial] No image provided');
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    console.log('[analyze-trial] Image received, length:', image.length);

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
        en: obj.en,
        zh: obj.zh,
        pinyin: obj.pinyin,
        confidence: obj.confidence || 0.9,
        category: 'object',
        hskLevel: obj.hskLevel ?? null,
        example: obj.example,
      })),
      ...(analysis.colors || []).map((obj: AIObject) => ({
        id: `trial-color-${Math.random().toString(36).substr(2, 9)}`,
        en: obj.en,
        zh: obj.zh,
        pinyin: obj.pinyin,
        confidence: 0.95,
        category: 'color',
        hskLevel: obj.hskLevel ?? null,
        example: obj.example,
      })),
      ...(analysis.actions || []).map((obj: AIObject) => ({
        id: `trial-action-${Math.random().toString(36).substr(2, 9)}`,
        en: obj.en,
        zh: obj.zh,
        pinyin: obj.pinyin,
        confidence: 0.85,
        category: 'action',
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

