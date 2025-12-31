'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MultipleChoiceQuiz } from '@/components/quiz/MultipleChoiceQuiz';
import { ListeningQuiz } from '@/components/quiz/ListeningQuiz';
import { TypePinyinQuiz } from '@/components/quiz/TypePinyinQuiz';
import { Brain, Headphones, Keyboard, Trophy, RotateCcw, ArrowLeft, Flame } from 'lucide-react';
import { toast } from 'sonner';

type QuizMode = 'select' | 'multiple-choice' | 'listening' | 'type-pinyin';

interface VocabularyItem {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
}

interface QuizStats {
  correct: number;
  incorrect: number;
  total: number;
}

const QUIZ_MODES = [
  {
    id: 'multiple-choice' as const,
    title: 'Multiple Choice',
    description: 'Choose the correct translation',
    icon: Brain,
    color: 'purple',
  },
  {
    id: 'listening' as const,
    title: 'Listening',
    description: 'Listen and pick the right word',
    icon: Headphones,
    color: 'blue',
  },
  {
    id: 'type-pinyin' as const,
    title: 'Type Pinyin',
    description: 'Type the pronunciation',
    icon: Keyboard,
    color: 'green',
  },
];

export default function QuizPage() {
  const router = useRouter();
  const [mode, setMode] = useState<QuizMode>('select');
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QuizStats>({ correct: 0, incorrect: 0, total: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [startTime] = useState(Date.now());

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vocabulary?limit=20');
      if (response.ok) {
        const data = await response.json();
        // Shuffle and take words for quiz
        const shuffled = [...data.items].sort(() => Math.random() - 0.5);
        setWords(shuffled.slice(0, Math.min(10, shuffled.length)));
      }
    } catch (error) {
      console.error('Failed to fetch words:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const recordSession = async () => {
    try {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordsPracticed: stats.total,
          wordsKnown: stats.correct,
          durationSeconds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStreak(data.currentStreak);
        if (data.currentStreak > 1) {
          toast.success(`🔥 ${data.currentStreak} day streak!`);
        }
      }
    } catch (error) {
      console.error('Failed to record session:', error);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    setStats((prev) => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      total: prev.total + 1,
    }));
  };

  const handleComplete = () => {
    setIsComplete(true);
    recordSession();
  };

  const handleRestart = () => {
    setStats({ correct: 0, incorrect: 0, total: 0 });
    setIsComplete(false);
    fetchWords();
  };

  const handleBack = () => {
    if (mode === 'select') {
      router.push('/');
    } else {
      setMode('select');
      setStats({ correct: 0, incorrect: 0, total: 0 });
      setIsComplete(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-6">Quiz</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (words.length < 4) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-6">Quiz</h1>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <Brain className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">Need more words</h2>
          <p className="text-slate-400 mb-6">
            Add at least 4 words to your vocabulary to start quizzing!
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

  // Quiz Complete Screen
  if (isComplete) {
    const percentage = Math.round((stats.correct / stats.total) * 100);
    const emoji = percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪';

    return (
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-6">Quiz Complete!</h1>

        <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
          <div className="text-6xl mb-4">{emoji}</div>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">{percentage}% Correct!</h2>
          <p className="text-slate-400 mb-4">
            You answered {stats.correct} of {stats.total} correctly
          </p>

          {streak > 0 && (
            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full mb-6">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{streak} day streak!</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
              <p className="text-3xl font-bold text-green-400">{stats.correct}</p>
              <p className="text-sm text-green-400/80">Correct</p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
              <p className="text-3xl font-bold text-red-400">{stats.incorrect}</p>
              <p className="text-sm text-red-400/80">Incorrect</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRestart}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => setMode('select')}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              New Quiz
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Mode Selection
  if (mode === 'select') {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-slate-400 hover:text-white -ml-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        <h1 className="text-2xl font-bold text-white mb-2">Choose Quiz Mode</h1>
        <p className="text-slate-400 mb-6">Test your knowledge with {words.length} words</p>

        <div className="space-y-4">
          {QUIZ_MODES.map((quizMode) => {
            const colors = {
              purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500/50',
              blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 hover:border-blue-500/50',
              green: 'from-green-500/20 to-green-500/5 border-green-500/30 hover:border-green-500/50',
            };
            const iconColors = {
              purple: 'text-purple-400',
              blue: 'text-blue-400',
              green: 'text-green-400',
            };

            return (
              <button
                key={quizMode.id}
                onClick={() => setMode(quizMode.id)}
                className={`w-full p-5 rounded-xl bg-gradient-to-b border text-left transition-all ${colors[quizMode.color]}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center">
                    <quizMode.icon className={`w-6 h-6 ${iconColors[quizMode.color]}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{quizMode.title}</h3>
                    <p className="text-sm text-slate-400">{quizMode.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Quiz
  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="text-slate-400 hover:text-white -ml-2 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to modes
      </Button>

      {mode === 'multiple-choice' && (
        <MultipleChoiceQuiz
          words={words}
          onAnswer={handleAnswer}
          onComplete={handleComplete}
        />
      )}

      {mode === 'listening' && (
        <ListeningQuiz
          words={words}
          onAnswer={handleAnswer}
          onComplete={handleComplete}
        />
      )}

      {mode === 'type-pinyin' && (
        <TypePinyinQuiz
          words={words}
          onAnswer={handleAnswer}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}

