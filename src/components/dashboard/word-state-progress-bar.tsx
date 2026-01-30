'use client';

import { Card } from '@/components/ui/card';

interface WordStateProgressBarProps {
  wordsByState: {
    new: number;
    learning: number;
    reviewing: number;
    mastered: number;
  };
  totalWords: number;
}

export function WordStateProgressBar({ wordsByState, totalWords }: WordStateProgressBarProps) {
  if (totalWords === 0) {
    return (
      <Card className="p-4 bg-slate-800/50 border-slate-700">
        <h3 className="font-medium text-white mb-3">Learning Progress</h3>
        <p className="text-slate-400 text-sm">No words yet. Start adding vocabulary!</p>
      </Card>
    );
  }

  const states = [
    { key: 'mastered', label: 'Mastered', count: wordsByState.mastered, color: 'bg-green-500' },
    { key: 'reviewing', label: 'Reviewing', count: wordsByState.reviewing, color: 'bg-blue-500' },
    { key: 'learning', label: 'Learning', count: wordsByState.learning, color: 'bg-yellow-500' },
    { key: 'new', label: 'New', count: wordsByState.new, color: 'bg-slate-600' },
  ];

  return (
    <Card className="p-4 bg-slate-800/50 border-slate-700">
      <h3 className="font-medium text-white mb-3">Learning Progress</h3>

      {/* Progress bar */}
      <div className="h-4 bg-slate-700 rounded-full overflow-hidden flex">
        {states.map((state) => {
          const percent = (state.count / totalWords) * 100;
          if (percent === 0) return null;
          return (
            <div
              key={state.key}
              className={`${state.color} transition-all`}
              style={{ width: `${percent}%` }}
              title={`${state.label}: ${state.count} (${percent.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3">
        {states.map((state) => (
          <div key={state.key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${state.color}`} />
            <span className="text-sm text-slate-400">
              {state.label}: <span className="text-white">{state.count}</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
