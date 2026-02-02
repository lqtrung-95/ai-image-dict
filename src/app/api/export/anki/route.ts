import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/export/anki - Export vocabulary as Anki-compatible TSV
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const searchParams = request.nextUrl.searchParams;
    const listId = searchParams.get('list');
    const hskLevel = searchParams.get('hsk');

    // Build query
    let query = supabase
      .from('vocabulary_items')
      .select('*')
      .eq('user_id', user.id);

    if (listId) {
      // Filter by list using junction table
      const { data: listItems } = await supabase
        .from('list_vocabulary_items')
        .select('vocabulary_item_id')
        .eq('list_id', listId);

      if (listItems && listItems.length > 0) {
        const itemIds = listItems.map((li) => li.vocabulary_item_id);
        query = query.in('id', itemIds);
      }
    }

    if (hskLevel) {
      query = query.eq('hsk_level', parseInt(hskLevel));
    }

    const { data: vocabulary, error } = await query.order('created_at');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 });
    }

    // Generate TSV content for Anki
    // Format: Front (Chinese + Pinyin) \t Back (English) \t Tags
    const rows = (vocabulary || []).map((item) => {
      const front = `${item.word_zh}<br><span style="color: #888;">${item.word_pinyin}</span>`;
      const back = item.word_en;
      const example = item.example_sentence ? `<br><br><em>${item.example_sentence}</em>` : '';
      const tags = item.hsk_level ? `HSK${item.hsk_level}` : '';

      return `${front}\t${back}${example}\t${tags}`;
    });

    // Add header
    const tsvContent = '#separator:tab\n#html:true\n' + rows.join('\n');

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ai-dictionary-anki-${timestamp}.txt`;

    return new NextResponse(tsvContent, {
      headers: {
        'Content-Type': 'text/tab-separated-values',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Anki export error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
