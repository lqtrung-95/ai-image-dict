'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SrsRating } from '@/lib/spaced-repetition-sm2-algorithm';

interface FlashCardProps {
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  photoUrl?: string | null;
  photoDate?: string | null;
  intervalPreviews?: Record<SrsRating, number>;
  onRate: (rating: SrsRating) => void;
}

const RATING_CONFIG: Record<SrsRating, { label: string; emoji: string; color: string; bgColor: string; borderColor: string }> = {
  1: {
    label: 'Again',
    emoji: '🔄',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 hover:bg-red-500/30',
    borderColor: 'border-red-500/50',
  },
  2: {
    label: 'Hard',
    emoji: '😓',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20 hover:bg-orange-500/30',
    borderColor: 'border-orange-500/50',
  },
  3: {
    label: 'Good',
    emoji: '👍',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20 hover:bg-green-500/30',
    borderColor: 'border-green-500/50',
  },
  4: {
    label: 'Easy',
    emoji: '🎯',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 hover:bg-blue-500/30',
    borderColor: 'border-blue-500/50',
  },
};

function formatIntervalPreview(days: number): string {
  if (days === 0) return 'now';
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  return `${Math.round(days / 30)}mo`;
}

export function FlashCard({
  wordZh,
  wordPinyin,
  wordEn,
  photoUrl,
  photoDate,
  intervalPreviews,
  onRate,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { speak } = useSpeech();
  const [isPlaying, setIsPlaying] = useState(false);

  const formattedDate = photoDate
    ? new Date(photoDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
    await speak(wordZh);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = (rating: SrsRating) => {
    setIsFlipped(false);
    onRate(rating);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card Container */}
      <div
        className="relative h-72 cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <div
          className={cn(
            'absolute inset-0 w-full h-full transition-transform duration-500 transform-style-3d',
            isFlipped && 'rotate-y-180'
          )}
        >
          {/* Front - Chinese Character */}
          <div
            className={cn(
              'absolute inset-0 w-full h-full backface-hidden',
              'bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl',
              'flex flex-col items-center justify-center p-6',
              'shadow-xl border border-purple-500/30'
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSpeak}
              className={cn(
                'absolute top-4 right-4 h-10 w-10 rounded-full',
                isPlaying ? 'text-white bg-white/20' : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              <Volume2 className="w-5 h-5" />
            </Button>

            <h1 className="text-7xl font-bold text-white mb-4">{wordZh}</h1>
            <p className="text-white/60 text-sm">Tap to reveal</p>
          </div>

          {/* Back - Pinyin & English with Photo Context */}
          <div
            className={cn(
              'absolute inset-0 w-full h-full backface-hidden rotate-y-180',
              'bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl',
              'flex flex-col items-center justify-center p-6',
              'shadow-xl border border-slate-600/30'
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSpeak}
              className={cn(
                'absolute top-4 right-4 h-10 w-10 rounded-full',
                isPlaying ? 'text-white bg-white/20' : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              <Volume2 className="w-5 h-5" />
            </Button>

            {/* Photo context thumbnail */}
            {photoUrl && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-500/50 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Where you learned this"
                    className="w-full h-full object-cover"
                  />
                </div>
                {formattedDate && (
                  <span className="text-xs text-slate-400">{formattedDate}</span>
                )}
              </div>
            )}

            <h1 className="text-5xl font-bold text-white mb-2">{wordZh}</h1>
            <p className="text-2xl text-purple-400 mb-2">{wordPinyin}</p>
            <p className="text-xl text-slate-300">{wordEn}</p>
          </div>
        </div>
      </div>

      {/* SRS Rating Buttons - 4 Anki-style buttons */}
      {isFlipped && (
        <div className="grid grid-cols-4 gap-2 mt-6 animate-fade-in">
          {([1, 2, 3, 4] as SrsRating[]).map((rating) => {
            const config = RATING_CONFIG[rating];
            const interval = intervalPreviews?.[rating];

            return (
              <Button
                key={rating}
                onClick={() => handleRate(rating)}
                variant="outline"
                className={cn(
                  'h-16 flex flex-col gap-0.5 px-2',
                  config.borderColor,
                  config.color,
                  config.bgColor
                )}
              >
                <span className="text-sm font-medium">
                  {config.emoji} {config.label}
                </span>
                {interval !== undefined && (
                  <span className="text-xs opacity-70">
                    {formatIntervalPreview(interval)}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      )}

      {!isFlipped && (
        <p className="text-center text-slate-500 mt-6">
          Tap the card to see the answer
        </p>
      )}
    </div>
  );
}
