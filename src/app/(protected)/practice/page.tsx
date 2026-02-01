'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { Shuffle, RotateCcw, Trophy, BookOpen, Target, Flame, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import {
  type SrsRating,
  type SrsState,
  getIntervalPreviews,
} from '@/lib/spaced-repetition-sm2-algorithm';

interface VocabularyItem {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
  photo_url?: string | null;
  photo_date?: string | null;
  easiness_factor: number;
  interval_days: number;
  repetitions: number;
  correct_streak: number;
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

export default function PracticePage() {
  const router = useRouter();
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

  const fetchDueWords = useCallback(async (listId?: string) => {
    setLoading(true);
    setSessionComplete(false);
    setCurrentIndex(0);
    setStats({ total: 0, again: 0, hard: 0, good: 0, easy: 0 });

    try {
      const params = new URLSearchParams();
      if (listId && listId !== 'all') {
        params.set('list', listId);
      }

      const response = await apiFetch(`/api/practice/due-words?${params}`);
      if (response.ok) {
        const data = await response.json();
        const shuffled = [...data.items].sort(() => Math.random() - 0.5);
        setWords(shuffled);
        setDueCount(data.dueCount);
        setStats((prev) => ({ ...prev, total: shuffled.length }));
      }
    } catch (error) {
      console.error('Failed to fetch due words:', error);
    } finally {
      setLoading(false);
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
    fetchDueWords();
    fetchLists();
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
        easinessFactor: currentWord.easiness_factor || 2.5,
        intervalDays: currentWord.interval_days || 0,
        repetitions: currentWord.repetitions || 0,
        correctStreak: currentWord.correct_streak || 0,
      }
    : null;

  const intervalPreviews = currentSrsState ? getIntervalPreviews(currentSrsState) : undefined;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-6">Practice</h1>
        <div className="h-72 bg-slate-800/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-6">Practice</h1>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">No words due for review</h2>
          <p className="text-slate-400 mb-6">
            {dueCount === 0
              ? 'Add some vocabulary by analyzing photos, or check back tomorrow!'
              : 'Great job! Come back later for more practice.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push('/capture')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Capture Photo
            </Button>
            <Button
              onClick={() => router.push('/progress')}
              variant="outline"
              className="border-slate-600"
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
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-6">Practice Complete!</h1>

        <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            {percentage}% Success!
          </h2>
          <p className="text-slate-400 mb-4">
            You reviewed {totalAnswered} words
          </p>

          {streak > 0 && (
            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full mb-6">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{streak} day streak!</span>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 mb-8">
            <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/30">
              <p className="text-2xl font-bold text-red-400">{stats.again}</p>
              <p className="text-xs text-red-400/80">Again</p>
            </div>
            <div className="bg-orange-500/10 rounded-xl p-3 border border-orange-500/30">
              <p className="text-2xl font-bold text-orange-400">{stats.hard}</p>
              <p className="text-xs text-orange-400/80">Hard</p>
            </div>
            <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/30">
              <p className="text-2xl font-bold text-green-400">{stats.good}</p>
              <p className="text-xs text-green-400/80">Good</p>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/30">
              <p className="text-2xl font-bold text-blue-400">{stats.easy}</p>
              <p className="text-xs text-blue-400/80">Easy</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRestart}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Practice Again
            </Button>
            <Button
              onClick={() => router.push('/progress')}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              View Progress
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Practice</h1>
          <p className="text-slate-400">
            {currentIndex + 1} of {words.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dueCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
              <Calendar className="w-4 h-4" />
              <span>{dueCount} due</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShuffle}
            className="text-slate-400 hover:text-white"
          >
            <Shuffle className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* List Filter */}
      <div className="mb-6">
        <Select value={selectedList} onValueChange={handleListChange}>
          <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
            <SelectValue placeholder="All words" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white focus:bg-slate-700">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                All words ({words.length})
              </div>
            </SelectItem>
            {lists.map((list) => (
              <SelectItem
                key={list.id}
                value={list.id}
                className="text-white focus:bg-slate-700"
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
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-700 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flashcard */}
      {currentWord && (
        <FlashCard
          wordZh={currentWord.word_zh}
          wordPinyin={currentWord.word_pinyin}
          wordEn={currentWord.word_en}
          photoUrl={currentWord.photo_url}
          photoDate={currentWord.photo_date}
          intervalPreviews={intervalPreviews}
          onRate={handleRate}
        />
      )}

      {/* Stats */}
      <div className="flex justify-center gap-4 mt-8">
        <div className="text-center">
          <p className="text-xl font-bold text-red-400">{stats.again}</p>
          <p className="text-xs text-slate-500">Again</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-orange-400">{stats.hard}</p>
          <p className="text-xs text-slate-500">Hard</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-400">{stats.good}</p>
          <p className="text-xs text-slate-500">Good</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-400">{stats.easy}</p>
          <p className="text-xs text-slate-500">Easy</p>
        </div>
      </div>
    </div>
  );
}
