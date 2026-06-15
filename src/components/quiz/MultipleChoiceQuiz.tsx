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
        <span className="text-[#bacbbe]">
          {currentIndex + 1} / {words.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-[#272a2e] rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#76ffbb] to-[#76ffbb] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <p className="text-[#bacbbe] mb-4">What does this mean?</p>
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-5xl font-bold text-white">{currentWord.word_zh}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSpeak}
            className={cn(
              'h-10 w-10 rounded-full',
              isPlaying ? 'text-[#76ffbb] bg-[#76ffbb]/10' : 'text-[#bacbbe] hover:text-[#e0e2e8]'
            )}
          >
            <Volume2 className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-[#76ffbb] text-lg mt-2">{currentWord.word_pinyin}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          const isCorrect = option.id === currentWord.id;
          const showResult = isAnswered;

          let bgClass = 'bg-[#1c2024] border-white/10 hover:border-[#76ffbb]/50';
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
          className="w-full h-12 bg-[#76ffbb] hover:opacity-90 text-lg"
        >
          {currentIndex < words.length - 1 ? 'Next' : 'See Results'}
        </Button>
      )}
    </div>
  );
}

