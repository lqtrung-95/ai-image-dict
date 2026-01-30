'use client';

import { useState, useEffect, useCallback } from 'react';
import { VocabularyCard } from '@/components/vocabulary/VocabularyCard';
import { VocabularyListSkeleton } from '@/components/vocabulary/VocabularyCardSkeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Download } from 'lucide-react';
import { debounce } from '@/lib/utils';
import { WordDetailModal } from '@/components/vocabulary/WordDetailModal';
import { WordOfDayCard } from '@/components/word-of-day/word-of-day-card';
import { AnkiExportButton } from '@/components/export/anki-export-button';

interface VocabularyItem {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
  example_sentence?: string | null;
  is_learned: boolean;
  created_at: string;
  list_ids?: string[];
  lists?: { id: string; name: string; color: string }[] | null;
  // Photo context
  photo_url?: string | null;
  photo_date?: string | null;
  analysis_id?: string | null;
  // SRS fields
  hsk_level?: number | null;
  next_review_date?: string | null;
  easiness_factor?: number;
  repetitions?: number;
  correct_streak?: number;
}

export default function VocabularyPage() {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchVocabulary = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);

      const response = await fetch(`/api/vocabulary?${params}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
        setTotal(data.total);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch vocabulary:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      fetchVocabulary(query);
    }, 300),
    [fetchVocabulary]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleToggleLearned = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_learned: !i.is_learned } : i))
    );

    try {
      await fetch(`/api/vocabulary/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLearned: !item.is_learned }),
      });
    } catch {
      // Revert on error
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_learned: item.is_learned } : i))
      );
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic update
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((prev) => prev - 1);

    try {
      await fetch(`/api/vocabulary/${id}`, { method: 'DELETE' });
    } catch {
      // Refetch on error
      fetchVocabulary(searchQuery);
    }
  };

  const handleAddToList = async (id: string, listId: string) => {
    try {
      const response = await fetch(`/api/vocabulary/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId }),
      });

      if (response.ok) {
        // Refetch to get updated list info
        fetchVocabulary(searchQuery);
      }
    } catch (error) {
      console.error('Failed to add to list:', error);
    }
  };

  const learnedCount = items.filter((i) => i.is_learned).length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <WordOfDayCard />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Vocabulary</h1>
          <p className="text-slate-400">
            {total} words · {learnedCount} learned
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search words..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 bg-slate-800/50 border-slate-600 text-white"
          />
        </div>
        <AnkiExportButton />
      </div>

      {loading ? (
        <VocabularyListSkeleton count={9} />
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">
            {searchQuery ? 'No words found' : 'No vocabulary yet'}
          </h2>
          <p className="text-slate-400 mb-6">
            {searchQuery
              ? 'Try a different search term'
              : 'Start capturing photos to build your vocabulary!'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => (window.location.href = '/capture')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Capture Photo
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <VocabularyCard
                key={item.id}
                id={item.id}
                wordZh={item.word_zh}
                wordPinyin={item.word_pinyin}
                wordEn={item.word_en}
                exampleSentence={item.example_sentence || undefined}
                isLearned={item.is_learned}
                isSaved={true}
                listName={item.lists?.[0]?.name}
                listColor={item.lists?.[0]?.color}
                photoUrl={item.photo_url}
                photoDate={item.photo_date}
                analysisId={item.analysis_id}
                onToggleLearned={handleToggleLearned}
                onDelete={handleDelete}
                onAddToList={handleAddToList}
                onClick={() => {
                  setSelectedWord(item);
                  setModalOpen(true);
                }}
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-200"
                onClick={() => {
                  // TODO: Implement pagination
                }}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}

      <WordDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        word={selectedWord ? {
          id: selectedWord.id,
          wordZh: selectedWord.word_zh,
          wordPinyin: selectedWord.word_pinyin,
          wordEn: selectedWord.word_en,
          exampleSentence: selectedWord.example_sentence || undefined,
          hskLevel: selectedWord.hsk_level,
          nextReviewDate: selectedWord.next_review_date,
          easinessFactor: selectedWord.easiness_factor,
          repetitions: selectedWord.repetitions,
          correctStreak: selectedWord.correct_streak,
          isLearned: selectedWord.is_learned,
        } : null}
      />
    </div>
  );
}

