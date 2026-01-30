import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ExtractedWord } from '@/types';

interface SaveRequest {
  importId: string;
  words: ExtractedWord[];
  listId?: string;
}

// POST /api/import/save - Save selected words from import preview
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SaveRequest = await request.json();
    const { importId, words, listId } = body;

    if (!importId || !words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: 'importId and words array are required' }, { status: 400 });
    }

    // Verify import record exists and belongs to user
    const { data: importRecord, error: importError } = await supabase
      .from('vocabulary_imports')
      .select('id, user_id')
      .eq('id', importId)
      .single();

    if (importError || !importRecord || importRecord.user_id !== user.id) {
      return NextResponse.json({ error: 'Import record not found' }, { status: 404 });
    }

    // If listId provided, verify it belongs to user
    if (listId) {
      const { data: list } = await supabase
        .from('vocabulary_lists')
        .select('id, user_id')
        .eq('id', listId)
        .single();

      if (!list || list.user_id !== user.id) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 });
      }
    }

    // Get existing vocabulary to check for duplicates
    const existingZhWords = words.map(w => w.zh);
    const { data: existingVocab } = await supabase
      .from('vocabulary_items')
      .select('id, word_zh')
      .eq('user_id', user.id)
      .in('word_zh', existingZhWords);

    const existingZhSet = new Set((existingVocab || []).map(v => v.word_zh));

    // Filter out duplicates
    const newWords = words.filter(w => !existingZhSet.has(w.zh));

    if (newWords.length === 0) {
      // Update import record
      await supabase
        .from('vocabulary_imports')
        .update({ status: 'completed', words_saved: 0 })
        .eq('id', importId);

      return NextResponse.json({
        saved: 0,
        skipped: words.length,
        message: 'All words already exist in your vocabulary',
      });
    }

    // Insert new vocabulary items
    const vocabInsertData = newWords.map(word => ({
      user_id: user.id,
      word_zh: word.zh,
      word_pinyin: word.pinyin,
      word_en: word.en,
      example_sentence: word.example || null,
      hsk_level: word.hskLevel || null,
      is_learned: false,
    }));

    const { data: insertedVocab, error: vocabError } = await supabase
      .from('vocabulary_items')
      .insert(vocabInsertData)
      .select('id');

    if (vocabError) {
      console.error('Vocabulary insert error:', vocabError);
      return NextResponse.json({ error: 'Failed to save vocabulary' }, { status: 500 });
    }

    const savedCount = insertedVocab?.length || 0;

    // If listId provided, add to list
    if (listId && insertedVocab && insertedVocab.length > 0) {
      const listItemsData = insertedVocab.map(vocab => ({
        list_id: listId,
        vocabulary_item_id: vocab.id,
      }));

      await supabase
        .from('list_vocabulary_items')
        .insert(listItemsData);
    }

    // Update import record
    await supabase
      .from('vocabulary_imports')
      .update({ status: 'completed', words_saved: savedCount })
      .eq('id', importId);

    return NextResponse.json({
      saved: savedCount,
      skipped: words.length - savedCount,
      message: `Saved ${savedCount} new words${listId ? ' to list' : ''}`,
    });
  } catch (error) {
    console.error('Save import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save words' },
      { status: 500 }
    );
  }
}
