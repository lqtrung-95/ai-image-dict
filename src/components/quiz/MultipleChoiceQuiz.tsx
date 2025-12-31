'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useSpeech } from '@/hooks/useSpeech';
import { Volume2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VocabularyItem {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
}

interface MultipleChoiceQuizProps {
  words: VocabularyItem[];
  onAnswer: (isCorrect: boolean) => void;
  onComplete: () => void;
}

export function MultipleChoiceQuiz({ words, onAnswer, onComplete }: MultipleChoiceQuizProps) {
  const { speak } = useSpeech();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<VocabularyItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  const generateOptions = useCallback(() => {
    if (!currentWord) return;

    // Get 3 random wrong answers
    const wrongAnswers = words
      .filter((w) => w.id !== currentWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Combine with correct answer and shuffle
    const allOptions = [currentWord, ...wrongAnswers].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  }, [currentWord, words]);

  useEffect(() => {
    generateOptions();
    setSelectedId(null);
    setIsAnswered(false);
  }, [currentIndex, generateOptions]);

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
        <h2 className="text-xl font-bold text-white">Multiple Choice</h2>
        <span className="text-slate-400">
          {currentIndex + 1} / {words.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-700 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <p className="text-slate-400 mb-4">What does this mean?</p>
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-5xl font-bold text-white">{currentWord.word_zh}</h1>
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
        <p className="text-purple-400 text-lg mt-2">{currentWord.word_pinyin}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          const isCorrect = option.id === currentWord.id;
          const showResult = isAnswered;

          let bgClass = 'bg-slate-800/50 border-slate-700 hover:border-purple-500/50';
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
                'w-full p-4 rounded-xl border text-left transition-all',
                bgClass,
                isAnswered && 'cursor-default'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-white text-lg">{option.word_en}</span>
                {showResult && isCorrect && <Check className="w-5 h-5 text-green-400" />}
                {showResult && isSelected && !isCorrect && <X className="w-5 h-5 text-red-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      {isAnswered && (
        <Button
          onClick={handleNext}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-lg"
        >
          {currentIndex < words.length - 1 ? 'Next' : 'See Results'}
        </Button>
      )}
    </div>
  );
}

