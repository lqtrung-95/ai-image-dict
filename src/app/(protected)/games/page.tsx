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
      <div className="p-6 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4 -ml-2 text-[#bacbbe]"
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
      <div className="p-6 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4 -ml-2 text-[#bacbbe]"
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
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#e0e2e8] tracking-tight">Vocabulary Games</h1>
        <p className="text-[#bacbbe] mt-1 text-sm">Make learning fun with interactive games</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
        <div
          className="bg-[#181c20] border border-white/5 rounded-xl p-6 hover:border-[#76ffbb]/30 transition-all jade-glow ghost-border cursor-pointer group"
          onClick={() => setGameMode('matching')}
        >
          <div className="w-12 h-12 rounded-xl bg-[#76ffbb]/10 border border-[#76ffbb]/20 flex items-center justify-center mb-4 group-hover:bg-[#76ffbb]/15 transition-colors">
            <Brain className="w-6 h-6 text-[#76ffbb]" />
          </div>
          <h2 className="text-lg font-semibold text-[#e0e2e8] mb-1">Matching Game</h2>
          <p className="text-sm text-[#bacbbe] mb-4">
            Match Chinese characters with their English meanings. Test your recognition skills!
          </p>
          <Button size="sm" className="bg-[#76ffbb] text-[#003822] font-semibold hover:opacity-90">
            Play Now
          </Button>
        </div>

        <div
          className="bg-[#181c20] border border-white/5 rounded-xl p-6 hover:border-[#76ffbb]/30 transition-all jade-glow ghost-border cursor-pointer group"
          onClick={() => setGameMode('quiz')}
        >
          <div className="w-12 h-12 rounded-xl bg-[#76ffbb]/10 border border-[#76ffbb]/20 flex items-center justify-center mb-4 group-hover:bg-[#76ffbb]/15 transition-colors">
            <Target className="w-6 h-6 text-[#76ffbb]" />
          </div>
          <h2 className="text-lg font-semibold text-[#e0e2e8] mb-1">Quiz Mode</h2>
          <p className="text-sm text-[#bacbbe] mb-4">
            Multiple choice questions to test your vocabulary knowledge. How many can you get right?
          </p>
          <Button size="sm" className="bg-[#76ffbb] text-[#003822] font-semibold hover:opacity-90">
            Play Now
          </Button>
        </div>
      </div>
    </div>
  );
}
