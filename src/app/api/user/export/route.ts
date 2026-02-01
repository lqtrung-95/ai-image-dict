import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/user/export - Export all user data (GDPR compliance)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data in parallel
    const [
      profileRes,
      vocabularyRes,
      listsRes,
      listItemsRes,
      practiceSessionsRes,
      practiceItemsRes,
      dailyGoalsRes,
      photoAnalysesRes,
      detectedObjectsRes,
      srsItemsRes,
    ] = await Promise.all([
      // Profile
      supabase.from('profiles').select('*').eq('id', user.id).single(),

      // Vocabulary items
      supabase.from('vocabulary_items').select('*').eq('user_id', user.id),

      // Lists
      supabase.from('lists').select('*').eq('user_id', user.id),

      // List vocabulary items (via junction table)
      supabase
        .from('list_vocabulary_items')
        .select(
          `
          *,
          vocabulary_items!inner(id)
        `
        )
        .eq('vocabulary_items.user_id', user.id),

      // Practice sessions
      supabase.from('practice_sessions').select('*').eq('user_id', user.id),

      // Practice items
      supabase.from('practice_items').select('*').eq('user_id', user.id),

      // Daily goals
      supabase.from('daily_goals').select('*').eq('user_id', user.id),

      // Photo analyses
      supabase.from('photo_analyses').select('*').eq('user_id', user.id),

      // Detected objects
      supabase.from('detected_objects').select('*').eq('user_id', user.id),

      // SRS items
      supabase.from('srs_items').select('*').eq('user_id', user.id),
    ]);

    // Compile export data
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      data: {
        profile: profileRes.data || null,
        vocabulary: vocabularyRes.data || [],
        lists: listsRes.data || [],
        listVocabularyItems: listItemsRes.data || [],
        practiceSessions: practiceSessionsRes.data || [],
        practiceItems: practiceItemsRes.data || [],
        dailyGoals: dailyGoalsRes.data || [],
        photoAnalyses: photoAnalysesRes.data || [],
        detectedObjects: detectedObjectsRes.data || [],
        srsItems: srsItemsRes.data || [],
      },
      stats: {
        totalVocabulary: vocabularyRes.data?.length || 0,
        totalLists: listsRes.data?.length || 0,
        totalPracticeSessions: practiceSessionsRes.data?.length || 0,
        totalPhotoAnalyses: photoAnalysesRes.data?.length || 0,
      },
    };

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ai-dictionary-export-${timestamp}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
