import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth, getAuthUser } from '@/lib/supabase/api-auth';
import {
  calculateNextReview,
  SrsRating,
  SrsState,
} from '@/lib/spaced-repetition-sm2-algorithm';

export const dynamic = 'force-dynamic';

/**
 * POST /api/word-attempts
 * Record a practice attempt and update SRS state for a vocabulary item
 */
export async function POST(request: NextRequest) {
  console.log('[WordAttempts] POST handler started');
  try {
    const { user, error: authError } = await getAuthUser(request);
    console.log('[WordAttempts] Auth result:', { user: !!user, error: authError?.message });

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      vocabularyItemId,
      sessionId,
      quizMode,
      rating,
      responseTimeMs,
    } = body;

    console.log('[WordAttempts] Request body:', { vocabularyItemId, quizMode, rating, userId: user.id });

    // Validate required fields
    if (!vocabularyItemId || !rating) {
      return NextResponse.json(
        { error: 'vocabularyItemId and rating are required' },
        { status: 400 }
      );
    }

    // Validate rating is 1-4
    if (rating < 1 || rating > 4) {
      return NextResponse.json(
        { error: 'rating must be between 1 and 4' },
        { status: 400 }
      );
    }

    // Fetch current vocabulary item state
    console.log('[WordAttempts] Looking up vocab item:', vocabularyItemId, 'for user:', user.id);

    // Use admin client to bypass RLS policies
    console.log('[WordAttempts] Creating admin client...');
    const { createClient } = await import('@supabase/supabase-js');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[WordAttempts] Service key exists:', !!serviceKey, 'Length:', serviceKey?.length);

    if (!serviceKey) {
      console.error('[WordAttempts] SUPABASE_SERVICE_ROLE_KEY not set!');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    console.log('[WordAttempts] Querying for vocab item...');
    const { data: vocabItems, error: fetchError } = await supabaseAdmin
      .from('vocabulary_items')
      .select('id, easiness_factor, interval_days, repetitions, correct_streak, user_id')
      .eq('id', vocabularyItemId);

    const vocabItem = vocabItems?.[0];
    console.log('[WordAttempts] Found items:', vocabItems?.length);

    console.log('[WordAttempts] Lookup result:', {
      foundCount: vocabItems?.length,
      vocabItemId: vocabItem?.id,
      error: fetchError?.message,
      errorCode: fetchError?.code,
      userId: user.id,
      vocabUserId: vocabItem?.user_id
    });

    if (fetchError || !vocabItem) {
      console.error('[WordAttempts] Vocab item not found:', vocabularyItemId, 'Error:', fetchError);
      console.error('[WordAttempts] Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      return NextResponse.json(
        { error: 'Vocabulary item not found' },
        { status: 404 }
      );
    }

    // Verify user owns this vocabulary item
    if (vocabItem.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Calculate new SRS state
    const currentState: SrsState = {
      easinessFactor: vocabItem.easiness_factor || 2.5,
      intervalDays: vocabItem.interval_days || 0,
      repetitions: vocabItem.repetitions || 0,
      correctStreak: vocabItem.correct_streak || 0,
    };

    const newState = calculateNextReview(currentState, rating as SrsRating);
    const isCorrect = rating >= 2; // Hard, Good, Easy are considered correct

    // Record the attempt using admin client
    const { error: attemptError } = await supabaseAdmin
      .from('word_practice_attempts')
      .insert({
        user_id: user.id,
        vocabulary_item_id: vocabularyItemId,
        session_id: sessionId || null,
        quiz_mode: quizMode || 'flashcard',
        rating,
        is_correct: isCorrect,
        response_time_ms: responseTimeMs || null,
      });

    if (attemptError) {
      console.error('Attempt insert error:', attemptError);
      return NextResponse.json(
        { error: 'Failed to record attempt' },
        { status: 500 }
      );
    }

    // Update vocabulary item with new SRS state using admin client
    const { error: updateError } = await supabaseAdmin
      .from('vocabulary_items')
      .update({
        easiness_factor: newState.easinessFactor,
        interval_days: newState.intervalDays,
        next_review_date: newState.nextReviewDate.toISOString().split('T')[0],
        repetitions: newState.repetitions,
        correct_streak: newState.correctStreak,
        last_reviewed_at: new Date().toISOString(),
        is_learned: newState.isLearned,
      })
      .eq('id', vocabularyItemId);

    if (updateError) {
      console.error('Vocabulary update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update vocabulary item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      newState: {
        easinessFactor: newState.easinessFactor,
        intervalDays: newState.intervalDays,
        nextReviewDate: newState.nextReviewDate.toISOString().split('T')[0],
        repetitions: newState.repetitions,
        correctStreak: newState.correctStreak,
        isLearned: newState.isLearned,
      },
      isCorrect,
    });
  } catch (error) {
    console.error('Word attempt error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * GET /api/word-attempts
 * Get practice attempt history for a vocabulary item
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);

    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const vocabularyItemId = searchParams.get('vocabularyItemId');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('word_practice_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (vocabularyItemId) {
      query = query.eq('vocabulary_item_id', vocabularyItemId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Attempts fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attempts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attempts: data || [] });
  } catch (error) {
    console.error('Word attempts error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
