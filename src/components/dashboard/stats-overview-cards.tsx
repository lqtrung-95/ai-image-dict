'use client';

import { Card } from '@/components/ui/card';
import { BookOpen, CheckCircle, Clock, Flame } from 'lucide-react';

interface StatsOverviewCardsProps {
  totalWords: number;
  masteredWords: number;
  dueToday: number;
  streakDays: number;
}

export function StatsOverviewCards({
  totalWords,
  masteredWords,
  dueToday,
  streakDays,
}: StatsOverviewCardsProps) {
  const stats = [
    {
      label: 'Total Words',
      value: totalWords,
      icon: BookOpen,
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
    },
    {
      label: 'Mastered',
      value: masteredWords,
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-500/20',
    },
    {
      label: 'Due Today',
      value: dueToday,
      icon: Clock,
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
    },
    {
      label: 'Day Streak',
      value: streakDays,
      icon: Flame,
      color: 'text-red-400',
      bg: 'bg-red-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="p-4 bg-slate-800/50 border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
