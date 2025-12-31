'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashCardProps {
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  photoUrl?: string | null;
  photoDate?: string | null;
  onKnow: () => void;
  onStillLearning: () => void;
}

export function FlashCard({
  wordZh,
  wordPinyin,
  wordEn,
  photoUrl,
  photoDate,
  onKnow,
  onStillLearning,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { speak } = useSpeech();
  const [isPlaying, setIsPlaying] = useState(false);

  // Format the date nicely
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

      {/* Action Buttons */}
      {isFlipped && (
        <div className="flex gap-4 mt-6 animate-fade-in">
          <Button
            onClick={() => {
              setIsFlipped(false);
              onStillLearning();
            }}
            variant="outline"
            className="flex-1 h-14 text-lg border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
          >
            Still Learning 📚
          </Button>
          <Button
            onClick={() => {
              setIsFlipped(false);
              onKnow();
            }}
            className="flex-1 h-14 text-lg bg-green-600 hover:bg-green-700"
          >
            Know It! ✓
          </Button>
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

