import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeImage } from '@/lib/groq';
import { extractBase64 } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    // Extract base64 from data URL
    const base64Image = extractBase64(image);

    // Analyze with Groq AI
    const analysis = await analyzeImage(base64Image);

    // Upload image to Supabase Storage
    const fileName = `${user.id}/${Date.now()}.jpg`;
    const imageBuffer = Buffer.from(base64Image, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Continue without storing image - analysis still works
    }

    // Get signed URL for the image (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from('images')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

    const imageUrl = signedUrlData?.signedUrl || '';

    // Store analysis in database
    const { data: photoAnalysis, error: dbError } = await supabase
      .from('photo_analyses')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        scene_context: {
          description: analysis.sceneDescription || '',
          colors: analysis.colors || [],
          actions: analysis.actions || [],
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    // Insert detected objects
    const allObjects = [
      ...(analysis.objects || []).map((obj: { en: string; zh: string; pinyin: string; confidence?: number }) => ({
        analysis_id: photoAnalysis.id,
        label_en: obj.en,
        label_zh: obj.zh,
        pinyin: obj.pinyin,
        confidence: obj.confidence || 0.9,
        category: 'object',
      })),
      ...(analysis.colors || []).map((obj: { en: string; zh: string; pinyin: string }) => ({
        analysis_id: photoAnalysis.id,
        label_en: obj.en,
        label_zh: obj.zh,
        pinyin: obj.pinyin,
        confidence: 0.95,
        category: 'color',
      })),
      ...(analysis.actions || []).map((obj: { en: string; zh: string; pinyin: string }) => ({
        analysis_id: photoAnalysis.id,
        label_en: obj.en,
        label_zh: obj.zh,
        pinyin: obj.pinyin,
        confidence: 0.85,
        category: 'action',
      })),
    ];

    if (allObjects.length > 0) {
      const { error: objectsError } = await supabase.from('detected_objects').insert(allObjects);

      if (objectsError) {
        console.error('Objects insert error:', objectsError);
      }
    }

    // Fetch the complete analysis with objects
    const { data: completeAnalysis } = await supabase
      .from('photo_analyses')
      .select(
        `
        *,
        detected_objects (*)
      `
      )
      .eq('id', photoAnalysis.id)
      .single();

    return NextResponse.json({
      id: photoAnalysis.id,
      imageUrl: imageUrl,
      sceneDescription: analysis.sceneDescription,
      objects: completeAnalysis?.detected_objects || [],
      colors: analysis.colors || [],
      actions: analysis.actions || [],
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}

