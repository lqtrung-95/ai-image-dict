'use client';

import { useState, useEffect } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Volume2, Calendar, TrendingUp, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PracticeAttempt {
  id: string;
  quiz_mode: string;
  rating: number;
  is_correct: boolean;
  created_at: string;
}

interface WordDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  word: {
    id: string;
    wordZh: string;
    wordPinyin: string;
    wordEn: string;
    exampleSentence?: string;
    hskLevel?: number | null;
    nextReviewDate?: string | null;
    easinessFactor?: number;
    repetitions?: number;
    correctStreak?: number;
    isLearned?: boolean;
  } | null;
}

// HSK level colors and labels
const HSK_CONFIG: Record<number, { color: string; bg: string; label: string }> = {
  1: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'HSK 1 - Beginner' },
  2: { color: 'text-lime-400', bg: 'bg-lime-500/20', label: 'HSK 2 - Elementary' },
  3: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'HSK 3 - Intermediate' },
  4: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'HSK 4 - Upper-Intermediate' },
  5: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'HSK 5 - Advanced' },
  6: { color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'HSK 6 - Proficient' },
};

function HskBadge({ level }: { level: number }) {
  const config = HSK_CONFIG[level];
  if (!config) return null;

  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium', config.bg, config.color)}>
      <Star className="w-3.5 h-3.5" />
      HSK {level}
    </span>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const labels = ['Again', 'Hard', 'Good', 'Easy'];
  const colors = [
    'bg-red-500/20 text-red-400',
    'bg-orange-500/20 text-orange-400',
    'bg-green-500/20 text-green-400',
    'bg-blue-500/20 text-blue-400',
  ];

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', colors[rating - 1])}>
      {labels[rating - 1]}
    </span>
  );
}

export function WordDetailModal({ open, onOpenChange, word }: WordDetailModalProps) {
  const { speak } = useSpeech();
  const [isPlaying, setIsPlaying] = useState(false);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Fetch practice history when modal opens
  useEffect(() => {
    if (!open || !word?.id) {
      setAttempts([]);
      return;
    }

    const fetchAttempts = async () => {
      setLoadingAttempts(true);
      try {
        const response = await fetch(`/api/word-attempts?vocabularyItemId=${word.id}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setAttempts(data.attempts || []);
        }
      } catch (error) {
        console.error('Failed to fetch attempts:', error);
      } finally {
        setLoadingAttempts(false);
      }
    };

    fetchAttempts();
  }, [open, word?.id]);

  const handleSpeak = async () => {
    if (!word) return;
    setIsPlaying(true);
    await speak(word.wordZh);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  if (!word) return null;

  const hskLevel = word.hskLevel;
  const hskConfig = hskLevel ? HSK_CONFIG[hskLevel] : null;

  // Format next review date
  const formatNextReview = (dateStr?: string | null) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reviewDate = new Date(date);
    reviewDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  // Calculate accuracy from attempts
  const accuracy = attempts.length > 0
    ? Math.round((attempts.filter(a => a.is_correct).length / attempts.length) * 100)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            Word Details
            {hskLevel && <HskBadge level={hskLevel} />}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Word info */}
          <div className="text-center p-4 rounded-lg bg-slate-700/30">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h2 className="text-4xl font-bold text-white">{word.wordZh}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSpeak}
                className={cn(
                  'h-10 w-10 rounded-full',
                  isPlaying ? 'text-purple-400 bg-purple-500/20' : 'text-slate-400 hover:text-white'
                )}
              >
                <Volume2 className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xl text-purple-400 mb-1">{word.wordPinyin}</p>
            <p className="text-lg text-slate-300">{word.wordEn}</p>
          </div>

          {/* HSK Level Description */}
          {hskConfig && (
            <div className={cn('p-3 rounded-lg', hskConfig.bg)}>
              <p className={cn('text-sm font-medium', hskConfig.color)}>
                {hskConfig.label}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {hskLevel === 1 && 'Common everyday vocabulary. ~150 words at this level.'}
                {hskLevel === 2 && 'Basic conversation vocabulary. ~300 words at this level.'}
                {hskLevel === 3 && 'Daily communication. ~600 words at this level.'}
                {hskLevel === 4 && 'Fluent conversation. ~1200 words at this level.'}
                {hskLevel === 5 && 'Complex topics. ~2500 words at this level.'}
                {hskLevel === 6 && 'Native-level fluency. ~5000+ words at this level.'}
              </p>
            </div>
          )}

          {/* Example sentence */}
          {word.exampleSentence && (
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Example</h3>
              <p className="text-slate-300 italic">&ldquo;{word.exampleSentence}&rdquo;</p>
            </div>
          )}

          {/* SRS Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-700/30">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Next Review</span>
              </div>
              <p className="text-white font-medium">{formatNextReview(word.nextReviewDate)}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-700/30">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Streak</span>
              </div>
              <p className="text-white font-medium">{word.correctStreak || 0} correct</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-700/30">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Reviews</span>
              </div>
              <p className="text-white font-medium">{word.repetitions || 0} times</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-700/30">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Star className="w-4 h-4" />
                <span className="text-xs">Accuracy</span>
              </div>
              <p className="text-white font-medium">
                {accuracy !== null ? `${accuracy}%` : 'No data'}
              </p>
            </div>
          </div>

          {/* Mastery status */}
          {word.isLearned && (
            <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30">
              <p className="text-green-400 font-medium text-center">
                Mastered!
              </p>
            </div>
          )}

          {/* Practice History */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">Recent Practice</h3>
            {loadingAttempts ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-slate-700/30 rounded animate-pulse" />
                ))}
              </div>
            ) : attempts.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                No practice history yet. Start practicing to track progress!
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-2 rounded bg-slate-700/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 capitalize">
                        {attempt.quiz_mode.replace('-', ' ')}
                      </span>
                      <RatingBadge rating={attempt.rating} />
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(attempt.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
