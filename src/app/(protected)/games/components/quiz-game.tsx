'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, X, RefreshCw, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VocabularyItem {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
}

interface Question {
  word: VocabularyItem;
  options: string[];
  correctIndex: number;
}

export function QuizGame() {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameComplete, setGameComplete] = useState(false);
  const [answered, setAnswered] = useState(false);

  const fetchVocabulary = useCallback(async () => {
    try {
      const response = await fetch('/api/vocabulary?limit=30');
      if (response.ok) {
        const data = await response.json();
        setVocabulary(data.items || []);
        generateQuestions(data.items || []);
      }
    } catch (error) {
      toast.error('Failed to load vocabulary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  const generateQuestions = (items: VocabularyItem[]) => {
    if (items.length < 4) return;

    // Select 10 random items for questions
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);

    const newQuestions: Question[] = selected.map((word) => {
      // Get 3 wrong answers from other words
      const otherWords = items.filter((i) => i.id !== word.id);
      const wrongAnswers = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((i) => i.word_en);

      const options = [...wrongAnswers, word.word_en].sort(() => Math.random() - 0.5);

      return {
        word,
        options,
        correctIndex: options.indexOf(word.word_en),
      };
    });

    setQuestions(newQuestions);
    setCurrentQuestion(0);
    setScore(0);
    setGameComplete(false);
    setSelectedAnswer(null);
    setAnswered(false);
  };

  const handleAnswer = (index: number) => {
    if (answered) return;

    setSelectedAnswer(index);
    setAnswered(true);

    if (index === questions[currentQuestion].correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setGameComplete(true);
    }
  };

  const resetGame = () => {
    generateQuestions(vocabulary);
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
        <div className="h-8 w-48 bg-slate-700 rounded animate-pulse mx-auto" />
      </Card>
    );
  }

  if (vocabulary.length < 4) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
        <p className="text-slate-400">
          You need at least 4 words in your vocabulary to play. Start by capturing some photos!
        </p>
      </Card>
    );
  }

  if (gameComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
        <p className="text-4xl font-bold text-purple-400 mb-2">
          {score}/{questions.length}
        </p>
        <p className="text-slate-400 mb-6">
          {percentage >= 80
            ? 'Excellent work!'
            : percentage >= 60
              ? 'Good job! Keep practicing!'
              : 'Keep practicing to improve!'}
        </p>
        <Button onClick={resetGame} className="bg-purple-600 hover:bg-purple-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Play Again
        </Button>
      </Card>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-400">
          <span>
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span>Score: {score}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
        <p className="text-sm text-slate-400 mb-4">What does this word mean?</p>
        <h2 className="text-4xl font-bold text-white mb-2">{question.word.word_zh}</h2>
        <p className="text-lg text-purple-300">{question.word.word_pinyin}</p>
      </Card>

      {/* Options */}
      <div className="grid gap-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={answered}
            className={cn(
              'w-full p-4 rounded-xl text-left transition-all border-2',
              !answered &&
                'bg-slate-800 border-slate-700 hover:border-purple-500 hover:bg-slate-700',
              answered &&
                index === question.correctIndex &&
                'bg-green-600/20 border-green-500',
              answered &&
                selectedAnswer === index &&
                index !== question.correctIndex &&
                'bg-red-600/20 border-red-500'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-white">{option}</span>
              {answered && index === question.correctIndex && (
                <Check className="w-5 h-5 text-green-400" />
              )}
              {answered &&
                selectedAnswer === index &&
                index !== question.correctIndex && <X className="w-5 h-5 text-red-400" />}
            </div>
          </button>
        ))}
      </div>

      {/* Next Button */}
      {answered && (
        <Button onClick={nextQuestion} className="w-full bg-purple-600 hover:bg-purple-700">
          {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
        </Button>
      )}
    </div>
  );
}
