'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSpeech } from '@/hooks/useSpeech';
import { Volume2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VocabularyItem {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
}

interface TypePinyinQuizProps {
  words: VocabularyItem[];
  onAnswer: (isCorrect: boolean) => void;
  onComplete: () => void;
}

// Normalize pinyin for comparison (remove tones, lowercase)
function normalizePinyin(pinyin: string): string {
  return pinyin
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (tone marks)
    .replace(/[^a-z]/g, ''); // Remove spaces, numbers, special chars
}

export function TypePinyinQuiz({ words, onAnswer, onComplete }: TypePinyinQuizProps) {
  const { speak } = useSpeech();
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  useEffect(() => {
    setUserInput('');
    setIsAnswered(false);
    setIsCorrect(false);
    // Focus input on new question
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentIndex]);

  const handleSpeak = async () => {
    if (!currentWord) return;
    setIsPlaying(true);
    await speak(currentWord.word_zh);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered || !userInput.trim()) return;

    const normalizedInput = normalizePinyin(userInput);
    const normalizedAnswer = normalizePinyin(currentWord.word_pinyin);

    const correct = normalizedInput === normalizedAnswer;
    setIsCorrect(correct);
    setIsAnswered(true);
    onAnswer(correct);
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    setIsAnswered(true);
    setIsCorrect(false);
    onAnswer(false);
  };

  if (!currentWord) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Type Pinyin</h2>
        <span className="text-slate-400">
          {currentIndex + 1} / {words.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-700 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <p className="text-slate-400 mb-4">Type the pinyin for this word</p>
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-6xl font-bold text-white">{currentWord.word_zh}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSpeak}
            className={cn(
              'h-10 w-10 rounded-full',
              isPlaying ? 'text-green-400 bg-green-500/20' : 'text-slate-400 hover:text-white'
            )}
          >
            <Volume2 className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-slate-500 text-sm mt-2">{currentWord.word_en}</p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type pinyin here..."
            disabled={isAnswered}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn(
              'h-14 text-xl text-center bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500',
              isAnswered && isCorrect && 'border-green-500 bg-green-500/10',
              isAnswered && !isCorrect && 'border-red-500 bg-red-500/10'
            )}
          />
          {isAnswered && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isCorrect ? (
                <Check className="w-6 h-6 text-green-400" />
              ) : (
                <X className="w-6 h-6 text-red-400" />
              )}
            </div>
          )}
        </div>

        {!isAnswered && (
          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              onClick={handleSkip}
              variant="outline"
              className="flex-1 h-12 border-slate-600 text-slate-300"
            >
              Skip
            </Button>
            <Button
              type="submit"
              disabled={!userInput.trim()}
              className="flex-1 h-12 bg-green-600 hover:bg-green-700"
            >
              Check
            </Button>
          </div>
        )}
      </form>

      {/* Answer Feedback */}
      {isAnswered && (
        <div className={cn(
          'text-center mb-6 p-4 rounded-xl border',
          isCorrect 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        )}>
          {isCorrect ? (
            <>
              <p className="text-green-400 font-medium">Correct! 🎉</p>
              <p className="text-white text-lg mt-1">{currentWord.word_pinyin}</p>
            </>
          ) : (
            <>
              <p className="text-red-400 font-medium">Not quite</p>
              <p className="text-slate-400 text-sm mt-1">
                You typed: <span className="text-white">{userInput || '(skipped)'}</span>
              </p>
              <p className="text-slate-400 text-sm">
                Correct answer: <span className="text-green-400 font-medium">{currentWord.word_pinyin}</span>
              </p>
            </>
          )}
        </div>
      )}

      {/* Next Button */}
      {isAnswered && (
        <Button
          onClick={handleNext}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg"
        >
          {currentIndex < words.length - 1 ? 'Next' : 'See Results'}
        </Button>
      )}

      {/* Hint */}
      {!isAnswered && (
        <p className="text-center text-slate-500 text-sm">
          💡 Tone marks are optional (e.g., &quot;nihao&quot; or &quot;nǐ hǎo&quot;)
        </p>
      )}
    </div>
  );
}

