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
import { Shuffle, RotateCcw, Trophy, BookOpen, Target } from 'lucide-react';

interface VocabularyItem {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
}

interface Collection {
  id: string;
  name: string;
  color: string;
}

interface PracticeStats {
  total: number;
  known: number;
  stillLearning: number;
}

export default function PracticePage() {
  const router = useRouter();
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [stats, setStats] = useState<PracticeStats>({ total: 0, known: 0, stillLearning: 0 });
  const [sessionComplete, setSessionComplete] = useState(false);

  const fetchWords = useCallback(async (collectionId?: string) => {
    setLoading(true);
    setSessionComplete(false);
    setCurrentIndex(0);
    setStats({ total: 0, known: 0, stillLearning: 0 });

    try {
      const params = new URLSearchParams();
      if (collectionId && collectionId !== 'all') {
        params.set('collection', collectionId);
      }

      const response = await fetch(`/api/vocabulary?${params}`);
      if (response.ok) {
        const data = await response.json();
        // Shuffle the words
        const shuffled = [...data.items].sort(() => Math.random() - 0.5);
        setWords(shuffled);
        setStats((prev) => ({ ...prev, total: shuffled.length }));
      }
    } catch (error) {
      console.error('Failed to fetch words:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/collections');
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    }
  }, []);

  useEffect(() => {
    fetchWords();
    fetchCollections();
  }, [fetchWords, fetchCollections]);

  const handleCollectionChange = (value: string) => {
    setSelectedCollection(value);
    fetchWords(value === 'all' ? undefined : value);
  };

  const handleKnow = () => {
    setStats((prev) => ({ ...prev, known: prev.known + 1 }));
    goToNext();
  };

  const handleStillLearning = () => {
    setStats((prev) => ({ ...prev, stillLearning: prev.stillLearning + 1 }));
    goToNext();
  };

  const goToNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  const handleRestart = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIndex(0);
    setStats({ total: words.length, known: 0, stillLearning: 0 });
    setSessionComplete(false);
  };

  const handleShuffle = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIndex(0);
  };

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

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
          <h2 className="text-xl font-medium text-white mb-2">No words to practice</h2>
          <p className="text-slate-400 mb-6">
            Add some vocabulary first by analyzing photos!
          </p>
          <Button
            onClick={() => router.push('/capture')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Capture Photo
          </Button>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const percentage = Math.round((stats.known / stats.total) * 100);

    return (
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-6">Practice Complete!</h1>

        <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            {percentage}% Correct!
          </h2>
          <p className="text-slate-400 mb-8">
            You reviewed {stats.total} words
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
              <p className="text-3xl font-bold text-green-400">{stats.known}</p>
              <p className="text-sm text-green-400/80">Known</p>
            </div>
            <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/30">
              <p className="text-3xl font-bold text-orange-400">{stats.stillLearning}</p>
              <p className="text-sm text-orange-400/80">Still Learning</p>
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
              onClick={() => router.push('/vocabulary')}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              View Vocabulary
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

      {/* Collection Filter */}
      <div className="mb-6">
        <Select value={selectedCollection} onValueChange={handleCollectionChange}>
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
            {collections.map((collection) => (
              <SelectItem
                key={collection.id}
                value={collection.id}
                className="text-white focus:bg-slate-700"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: collection.color }}
                  />
                  {collection.name}
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
          onKnow={handleKnow}
          onStillLearning={handleStillLearning}
        />
      )}

      {/* Stats */}
      <div className="flex justify-center gap-6 mt-8">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">{stats.known}</p>
          <p className="text-xs text-slate-500">Known</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-400">{stats.stillLearning}</p>
          <p className="text-xs text-slate-500">Learning</p>
        </div>
      </div>
    </div>
  );
}

