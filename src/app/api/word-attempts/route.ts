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
  try {
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      vocabularyItemId,
      courseProgressId, // set when practicing a course word; updates user_course_word_progress
      sessionId,
      quizMode,
      rating,
      responseTimeMs,
    } = body;

    if ((!vocabularyItemId && !courseProgressId) || !rating) {
      return NextResponse.json(
        { error: 'vocabularyItemId or courseProgressId, and rating are required' },
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
    // Use admin client to bypass RLS policies
    const { createClient } = await import('@supabase/supabase-js');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    const isCorrect = rating >= 2;

    // Course word attempt: update user_course_word_progress instead of vocabulary_items
    if (courseProgressId) {
      const { data: progressRows } = await supabaseAdmin
        .from('user_course_word_progress')
        .select('id, easiness_factor, interval_days, repetitions, correct_streak, user_id')
        .eq('id', courseProgressId);

      const progressRow = progressRows?.[0];
      if (!progressRow) {
        return NextResponse.json({ error: 'Course progress not found' }, { status: 404 });
      }
      if (progressRow.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const currentState: SrsState = {
        easinessFactor: progressRow.easiness_factor || 2.5,
        intervalDays: progressRow.interval_days || 0,
        repetitions: progressRow.repetitions || 0,
        correctStreak: progressRow.correct_streak || 0,
      };
      const newState = calculateNextReview(currentState, rating as SrsRating);

      await supabaseAdmin
        .from('user_course_word_progress')
        .update({
          easiness_factor: newState.easinessFactor,
          interval_days: newState.intervalDays,
          next_review_date: newState.nextReviewDate.toISOString().split('T')[0],
          repetitions: newState.repetitions,
          correct_streak: newState.correctStreak,
          last_reviewed_at: new Date().toISOString(),
          is_learned: newState.isLearned,
        })
        .eq('id', courseProgressId);

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
    }

    // Personal library word attempt: update vocabulary_items
    const { data: vocabItems, error: fetchError } = await supabaseAdmin
      .from('vocabulary_items')
      .select('id, easiness_factor, interval_days, repetitions, correct_streak, user_id')
      .eq('id', vocabularyItemId);

    const vocabItem = vocabItems?.[0];

    if (fetchError || !vocabItem) {
      console.error('[WordAttempts] Vocab item not found:', vocabularyItemId, 'Error:', fetchError);
      return NextResponse.json({ error: 'Vocabulary item not found' }, { status: 404 });
    }

    if (vocabItem.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const currentState: SrsState = {
      easinessFactor: vocabItem.easiness_factor || 2.5,
      intervalDays: vocabItem.interval_days || 0,
      repetitions: vocabItem.repetitions || 0,
      correctStreak: vocabItem.correct_streak || 0,
    };

    const newState = calculateNextReview(currentState, rating as SrsRating);

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
      return NextResponse.json({ error: 'Failed to record attempt' }, { status: 500 });
    }

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
      return NextResponse.json({ error: 'Failed to update vocabulary item' }, { status: 500 });
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
