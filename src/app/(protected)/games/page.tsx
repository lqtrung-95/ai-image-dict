'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, Brain, Target, ArrowLeft } from 'lucide-react';
import { MatchingGame } from './components/matching-game';
import { QuizGame } from './components/quiz-game';

type GameMode = 'menu' | 'matching' | 'quiz';

export default function GamesPage() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');

  if (gameMode === 'matching') {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-4 -ml-2 text-slate-400"
          onClick={() => setGameMode('menu')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
        <MatchingGame />
      </div>
    );
  }

  if (gameMode === 'quiz') {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-4 -ml-2 text-slate-400"
          onClick={() => setGameMode('menu')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
        <QuizGame />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Gamepad2 className="w-8 h-8 text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Vocabulary Games</h1>
        <p className="text-slate-400">Make learning fun with interactive games</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          className="bg-slate-800/50 border-slate-700 p-6 hover:border-purple-500/50 transition-colors cursor-pointer"
          onClick={() => setGameMode('matching')}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-1">Matching Game</h2>
              <p className="text-sm text-slate-400 mb-3">
                Match Chinese characters with their English meanings. Test your recognition skills!
              </p>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Play Now
              </Button>
            </div>
          </div>
        </Card>

        <Card
          className="bg-slate-800/50 border-slate-700 p-6 hover:border-purple-500/50 transition-colors cursor-pointer"
          onClick={() => setGameMode('quiz')}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-1">Quiz Mode</h2>
              <p className="text-sm text-slate-400 mb-3">
                Multiple choice questions to test your vocabulary knowledge. How many can you get right?
              </p>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Play Now
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
