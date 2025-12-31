'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useSpeech } from '@/hooks/useSpeech';
import { Volume2, Check, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VocabularyItem {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
}

interface ListeningQuizProps {
  words: VocabularyItem[];
  onAnswer: (isCorrect: boolean) => void;
  onComplete: () => void;
}

export function ListeningQuiz({ words, onAnswer, onComplete }: ListeningQuizProps) {
  const { speak } = useSpeech();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<VocabularyItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  const generateOptions = useCallback(() => {
    if (!currentWord) return;

    const wrongAnswers = words
      .filter((w) => w.id !== currentWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const allOptions = [currentWord, ...wrongAnswers].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  }, [currentWord, words]);

  useEffect(() => {
    generateOptions();
    setSelectedId(null);
    setIsAnswered(false);
    setHasPlayed(false);
  }, [currentIndex, generateOptions]);

  // Auto-play audio when question loads
  useEffect(() => {
    if (currentWord && !hasPlayed) {
      const timer = setTimeout(() => {
        handleSpeak();
        setHasPlayed(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord, hasPlayed]);

  const handleSpeak = async () => {
    if (!currentWord) return;
    setIsPlaying(true);
    await speak(currentWord.word_zh);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const handleSelect = (option: VocabularyItem) => {
    if (isAnswered) return;

    setSelectedId(option.id);
    setIsAnswered(true);

    const isCorrect = option.id === currentWord.id;
    onAnswer(isCorrect);
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  if (!currentWord) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Listening Quiz</h2>
        <span className="text-slate-400">
          {currentIndex + 1} / {words.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-700 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <p className="text-slate-400 mb-6">Listen and choose the correct word</p>
        
        {/* Big Play Button */}
        <button
          onClick={handleSpeak}
          className={cn(
            'w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all',
            isPlaying
              ? 'bg-blue-500 text-white scale-110'
              : 'bg-slate-800 text-blue-400 hover:bg-blue-500/20 hover:scale-105'
          )}
        >
          {isPlaying ? (
            <div className="flex gap-1">
              <div className="w-1.5 h-6 bg-white rounded animate-pulse" />
              <div className="w-1.5 h-8 bg-white rounded animate-pulse delay-75" />
              <div className="w-1.5 h-5 bg-white rounded animate-pulse delay-150" />
            </div>
          ) : (
            <Volume2 className="w-10 h-10" />
          )}
        </button>
        
        <p className="text-slate-500 text-sm mt-4 flex items-center justify-center gap-1">
          <RefreshCw className="w-3 h-3" />
          Tap to play again
        </p>
      </div>

      {/* Options - Show Chinese characters */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          const isCorrect = option.id === currentWord.id;
          const showResult = isAnswered;

          let bgClass = 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50';
          if (showResult && isCorrect) {
            bgClass = 'bg-green-500/20 border-green-500';
          } else if (showResult && isSelected && !isCorrect) {
            bgClass = 'bg-red-500/20 border-red-500';
          }

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              disabled={isAnswered}
              className={cn(
                'p-4 rounded-xl border text-center transition-all',
                bgClass,
                isAnswered && 'cursor-default'
              )}
            >
              <p className="text-2xl font-bold text-white mb-1">{option.word_zh}</p>
              {showResult && (
                <p className="text-sm text-slate-400">{option.word_pinyin}</p>
              )}
              {showResult && isCorrect && (
                <Check className="w-5 h-5 text-green-400 mx-auto mt-2" />
              )}
              {showResult && isSelected && !isCorrect && (
                <X className="w-5 h-5 text-red-400 mx-auto mt-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* Show answer after selection */}
      {isAnswered && (
        <div className="text-center mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <p className="text-slate-400 text-sm">The answer was</p>
          <p className="text-2xl font-bold text-white">{currentWord.word_zh}</p>
          <p className="text-blue-400">{currentWord.word_pinyin}</p>
          <p className="text-slate-300">{currentWord.word_en}</p>
        </div>
      )}

      {/* Next Button */}
      {isAnswered && (
        <Button
          onClick={handleNext}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg"
        >
          {currentIndex < words.length - 1 ? 'Next' : 'See Results'}
        </Button>
      )}
    </div>
  );
}

