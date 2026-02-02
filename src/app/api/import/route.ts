import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { extractWebArticle } from '@/lib/import/web-article-extractor';
import { extractVocabulary } from '@/lib/import/vocabulary-extractor';
import { ExtractedWord, ImportSourceType } from '@/types';

export const dynamic = 'force-dynamic';

interface ImportRequest {
  type: ImportSourceType;
  source: string;
}

interface ImportResponse {
  importId: string;
  sourceTitle: string;
  preview: ExtractedWord[];
}

// Rate limiting: simple in-memory store (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // imports per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || userLimit.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

// POST /api/import - Start import process, extract and preview vocabulary
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before importing more content.' },
        { status: 429 }
      );
    }

    const body: ImportRequest = await request.json();
    const { type, source } = body;

    if (!type || !source) {
      return NextResponse.json({ error: 'type and source are required' }, { status: 400 });
    }

    if (!['url', 'text'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Use url or text' }, { status: 400 });
    }

    let content: string;
    let sourceTitle: string;
    let sourceUrl: string | null = null;

    // Extract content based on type
    if (type === 'url') {
      const article = await extractWebArticle(source);
      sourceUrl = article.url;
      sourceTitle = article.title;
      content = article.content;
    } else {
      // text type
      if (source.length < 50) {
        return NextResponse.json({ error: 'Text too short. Provide at least 50 characters.' }, { status: 400 });
      }
      if (source.length > 100000) {
        return NextResponse.json({ error: 'Text too long. Maximum 100,000 characters.' }, { status: 400 });
      }
      sourceTitle = 'Manual Text Input';
      content = source;
    }

    // Create import record
    const { data: importRecord, error: insertError } = await supabase
      .from('vocabulary_imports')
      .insert({
        user_id: user.id,
        source_type: type,
        source_url: sourceUrl,
        source_title: sourceTitle.slice(0, 255),
        status: 'processing',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Import record creation error:', insertError);
      return NextResponse.json({ error: 'Failed to create import record' }, { status: 500 });
    }

    // Extract vocabulary using AI
    let extractedWords: ExtractedWord[];
    try {
      extractedWords = await extractVocabulary(content);
    } catch (extractError) {
      // Update import record with error
      await supabase
        .from('vocabulary_imports')
        .update({ status: 'failed', error_message: String(extractError) })
        .eq('id', importRecord.id);

      throw extractError;
    }

    // Update import record with extraction count
    await supabase
      .from('vocabulary_imports')
      .update({ words_extracted: extractedWords.length })
      .eq('id', importRecord.id);

    const response: ImportResponse = {
      importId: importRecord.id,
      sourceTitle,
      preview: extractedWords,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
