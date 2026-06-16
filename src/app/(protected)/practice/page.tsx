'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FlashCard } from '@/components/practice/FlashCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shuffle, RotateCcw, Target, Calendar, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import {
  type SrsRating,
  type SrsState,
  getIntervalPreviews,
} from '@/lib/spaced-repetition-sm2-algorithm';

interface VocabularyItem {
  id: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  photoUrl?: string | null;
  photoDate?: string | null;
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  correctStreak: number;
}

interface VocabularyList {
  id: string;
  name: string;
  color: string;
}

interface PracticeStats {
  total: number;
  again: number;
  hard: number;
  good: number;
  easy: number;
}

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course');
  const courseName = searchParams.get('name');

  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [selectedList, setSelectedList] = useState<string>('all');
  const [stats, setStats] = useState<PracticeStats>({
    total: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [sessionId] = useState<string | null>(null);

  const recordPracticeSession = async () => {
    try {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      const wordsKnown = stats.good + stats.easy;
      const wordsPracticed = stats.again + stats.hard + stats.good + stats.easy;

      const response = await apiFetch('/api/stats', {
        method: 'POST',
        body: JSON.stringify({
          wordsPracticed,
          wordsKnown,
          durationSeconds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStreak(data.currentStreak);
        if (data.currentStreak > 1) {
          toast.success(`${data.currentStreak} day streak!`);
        }
      }
    } catch (error) {
      console.error('Failed to record practice session:', error);
    }
  };

  const fetchDueWords = useCallback(async (listId?: string, signal?: AbortSignal) => {
    setLoading(true);
    setSessionComplete(false);
    setCurrentIndex(0);
    setStats({ total: 0, again: 0, hard: 0, good: 0, easy: 0 });

    try {
      const params = new URLSearchParams();
      if (listId && listId !== 'all') {
        params.set('list', listId);
      }
      if (courseId) {
        params.set('course', courseId);
      }

      const response = await apiFetch(`/api/practice/due-words?${params}`, { signal });
      if (signal?.aborted) return;
      if (response.ok) {
        const data = await response.json();
        const shuffled = [...data.items].sort(() => Math.random() - 0.5);
        setWords(shuffled);
        setDueCount(data.dueCount);
        setStats((prev) => ({ ...prev, total: shuffled.length }));
      }
    } catch (error) {
      if ((error as { name?: string }).name === 'AbortError') return;
      console.error('Failed to fetch due words:', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  const fetchLists = useCallback(async () => {
    try {
      const response = await apiFetch('/api/lists');
      if (response.ok) {
        const data = await response.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchDueWords(undefined, controller.signal);
    fetchLists();
    return () => controller.abort();
  }, [fetchDueWords, fetchLists]);

  const handleListChange = (value: string) => {
    setSelectedList(value);
    fetchDueWords(value === 'all' ? undefined : value);
  };

  const handleRate = async (rating: SrsRating) => {
    const currentWord = words[currentIndex];
    if (!currentWord) return;

    // Update local stats
    const ratingKey = { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' }[rating] as keyof PracticeStats;
    setStats((prev) => ({ ...prev, [ratingKey]: prev[ratingKey] + 1 }));

    // Record attempt to API
    try {
      await apiFetch('/api/word-attempts', {
        method: 'POST',
        body: JSON.stringify({
          vocabularyItemId: currentWord.id,
          sessionId,
          quizMode: 'flashcard',
          rating,
        }),
      });
    } catch (error) {
      console.error('Failed to record attempt:', error);
    }

    // Move to next word or complete session
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionComplete(true);
      recordPracticeSession();
    }
  };

  const handleRestart = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIndex(0);
    setStats({ total: words.length, again: 0, hard: 0, good: 0, easy: 0 });
    setSessionComplete(false);
  };

  const handleShuffle = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIndex(0);
  };

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  // Calculate interval previews for current word
  const currentSrsState: SrsState | null = currentWord
    ? {
        easinessFactor: currentWord.easinessFactor || 2.5,
        intervalDays: currentWord.intervalDays || 0,
        repetitions: currentWord.repetitions || 0,
        correctStreak: currentWord.correctStreak || 0,
      }
    : null;

  const intervalPreviews = currentSrsState ? getIntervalPreviews(currentSrsState) : undefined;

  if (loading) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-[#e0e2e8] tracking-tight mb-6">Practice</h1>
        <div className="h-72 bg-[#1c2024] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        {courseId && (
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="inline-flex items-center text-[#bacbbe] hover:text-[#e0e2e8] mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {courseName ?? 'Course'}
          </button>
        )}
        <h1 className="text-3xl font-bold text-[#e0e2e8] tracking-tight mb-6">Practice</h1>
        <div className="text-center py-16 bg-[#181c20] border border-white/5 rounded-2xl">
          <span className="material-symbols-outlined text-5xl text-[#849589] mb-4 block">school</span>
          <h2 className="text-xl font-semibold text-[#e0e2e8] mb-2">No words due for review</h2>
          <p className="text-[#bacbbe] mb-6 max-w-xs mx-auto">
            {courseId
              ? 'Subscribe to this course to add its words to your practice deck, then come back!'
              : dueCount === 0
                ? 'Add some vocabulary by analyzing photos, or check back tomorrow!'
                : 'Great job! Come back later for more practice.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push('/capture')}
              className="bg-[#76ffbb] text-[#003822] font-semibold hover:opacity-90"
            >
              Capture Photo
            </Button>
            <Button
              onClick={() => router.push('/progress')}
              variant="outline"
              className="border-white/10 text-[#e0e2e8]"
            >
              View Progress
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const totalAnswered = stats.again + stats.hard + stats.good + stats.easy;
    const correctCount = stats.good + stats.easy;
    const percentage = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return (
      <div className="p-6 max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-[#e0e2e8] tracking-tight mb-6">Session Complete</h1>

        <div className="bg-[#181c20] border border-white/5 rounded-2xl p-8 text-center ghost-border">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#76ffbb]/10 border border-[#76ffbb]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#76ffbb]" style={{ fontSize: 40 }}>emoji_events</span>
          </div>

          <h2 className="text-4xl font-bold text-[#e0e2e8] mb-1">
            {percentage}%
          </h2>
          <p className="text-[#bacbbe] mb-4">
            {correctCount} of {totalAnswered} words correct
          </p>

          {streak > 0 && (
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-2 rounded-full mb-6">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>local_fire_department</span>
              <span className="font-semibold">{streak} day streak!</span>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 mb-8">
            <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
              <p className="text-2xl font-bold text-red-400">{stats.again}</p>
              <p className="text-xs text-red-400/70 mt-0.5">Again</p>
            </div>
            <div className="bg-orange-500/10 rounded-xl p-3 border border-orange-500/20">
              <p className="text-2xl font-bold text-orange-400">{stats.hard}</p>
              <p className="text-xs text-orange-400/70 mt-0.5">Hard</p>
            </div>
            <div className="bg-[#76ffbb]/10 rounded-xl p-3 border border-[#76ffbb]/20">
              <p className="text-2xl font-bold text-[#76ffbb]">{stats.good}</p>
              <p className="text-xs text-[#76ffbb]/70 mt-0.5">Good</p>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
              <p className="text-2xl font-bold text-blue-400">{stats.easy}</p>
              <p className="text-xs text-blue-400/70 mt-0.5">Easy</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRestart}
              variant="outline"
              className="flex-1 border-white/10 text-[#e0e2e8] hover:bg-[#272a2e]"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Practice Again
            </Button>
            <Button
              onClick={() => router.push('/progress')}
              className="flex-1 bg-[#76ffbb] text-[#003822] font-semibold hover:opacity-90"
            >
              View Progress
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      {/* Back link when coming from a course */}
      {courseId && (
        <button
          onClick={() => router.push(`/courses/${courseId}`)}
          className="inline-flex items-center text-[#bacbbe] hover:text-[#e0e2e8] mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to {courseName ?? 'Course'}
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#e0e2e8] tracking-tight">Practice</h1>
          <p className="text-[#bacbbe] text-sm mt-0.5">
            {courseName ? `${courseName} · ` : ''}{currentIndex + 1} of {words.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dueCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-[#76ffbb] bg-[#76ffbb]/10 px-2 py-1 rounded-full">
              <Calendar className="w-4 h-4" />
              <span>{dueCount} due</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShuffle}
            className="text-[#bacbbe] hover:text-[#e0e2e8]"
          >
            <Shuffle className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* List Filter — hidden when scoped to a course */}
      {!courseId && <div className="mb-6">
        <Select value={selectedList} onValueChange={handleListChange}>
          <SelectTrigger className="bg-[#1c2024] border-white/10 text-white">
            <SelectValue placeholder="All words" />
          </SelectTrigger>
          <SelectContent className="bg-[#1c2024] border-white/10">
            <SelectItem value="all" className="text-white focus:bg-[#272a2e]">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#76ffbb]" />
                All words ({words.length})
              </div>
            </SelectItem>
            {lists.map((list) => (
              <SelectItem
                key={list.id}
                value={list.id}
                className="text-white focus:bg-[#272a2e]"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: list.color }}
                  />
                  {list.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>}

      {/* Progress Bar */}
      <div className="h-2 bg-[#272a2e] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#76ffbb] to-[#76ffbb] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flashcard */}
      {currentWord && (
        <FlashCard
          wordZh={currentWord.wordZh}
          wordPinyin={currentWord.wordPinyin}
          wordEn={currentWord.wordEn}
          photoUrl={currentWord.photoUrl}
          photoDate={currentWord.photoDate}
          intervalPreviews={intervalPreviews}
          onRate={handleRate}
        />
      )}

      {/* Stats */}
      <div className="flex justify-center gap-4 mt-8">
        <div className="text-center">
          <p className="text-xl font-bold text-red-400">{stats.again}</p>
          <p className="text-xs text-[#849589]">Again</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-orange-400">{stats.hard}</p>
          <p className="text-xs text-[#849589]">Hard</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-400">{stats.good}</p>
          <p className="text-xs text-[#849589]">Good</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-400">{stats.easy}</p>
          <p className="text-xs text-[#849589]">Easy</p>
        </div>
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="p-6 max-w-lg mx-auto"><div className="h-72 bg-[#1c2024] rounded-2xl animate-pulse" /></div>}>
      <PracticeContent />
    </Suspense>
  );
}
