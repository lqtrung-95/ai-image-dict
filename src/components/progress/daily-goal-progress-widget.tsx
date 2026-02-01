'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, BookOpen, Clock, CheckCircle, Settings, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

interface DailyGoal {
  id: string;
  goal_type: string;
  target_value: number;
  is_active: boolean;
}

interface GoalProgress {
  words_learned: number;
  practice_minutes: number;
  reviews_completed: number;
}

const GOAL_META: Record<string, { label: string; icon: React.ElementType; color: string; unit: string }> = {
  words_learned: { label: 'New Words', icon: BookOpen, color: 'blue', unit: '' },
  reviews_completed: { label: 'Reviews', icon: CheckCircle, color: 'green', unit: '' },
  practice_minutes: { label: 'Practice', icon: Clock, color: 'purple', unit: 'min' },
};

export function DailyGoalProgressWidget() {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await apiFetch('/api/daily-goals');
        if (response.ok) {
          const data = await response.json();
          setGoals(data.goals || []);
          setProgress(data.progress || null);
        }
      } catch (error) {
        console.error('Failed to fetch daily goals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
        <div className="h-32 animate-pulse bg-slate-700/30 rounded-lg" />
      </Card>
    );
  }

  const activeGoals = goals.filter((g) => g.is_active);

  if (activeGoals.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Daily Goals</h2>
              <p className="text-sm text-slate-400">Set daily targets to track your learning</p>
            </div>
          </div>
          <Link href="/settings">
            <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
              <Settings className="w-4 h-4 mr-2" />
              Set Goals
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Calculate completion status
  const completedGoals = activeGoals.filter((goal) => {
    const current = progress?.[goal.goal_type as keyof GoalProgress] || 0;
    return current >= goal.target_value;
  });

  const allComplete = completedGoals.length === activeGoals.length;

  return (
    <Card
      className={cn(
        'border p-6 mb-8 transition-all',
        allComplete
          ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/30'
          : 'bg-slate-800/50 border-slate-700'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          {allComplete ? (
            <>
              <Trophy className="w-5 h-5 text-yellow-400" />
              Daily Goals Complete!
            </>
          ) : (
            <>
              <Target className="w-5 h-5 text-purple-400" />
              Today&apos;s Goals
            </>
          )}
        </h2>
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {activeGoals.map((goal) => {
          const meta = GOAL_META[goal.goal_type];
          if (!meta) return null;

          const Icon = meta.icon;
          const current = progress?.[goal.goal_type as keyof GoalProgress] || 0;
          const percentage = Math.min(100, Math.round((current / goal.target_value) * 100));
          const isComplete = current >= goal.target_value;

          const colorClasses = {
            blue: {
              bg: 'bg-blue-500',
              text: 'text-blue-400',
              bgLight: 'bg-blue-500/20',
            },
            green: {
              bg: 'bg-green-500',
              text: 'text-green-400',
              bgLight: 'bg-green-500/20',
            },
            purple: {
              bg: 'bg-purple-500',
              text: 'text-purple-400',
              bgLight: 'bg-purple-500/20',
            },
          }[meta.color];

          return (
            <div
              key={goal.id}
              className={cn(
                'p-4 rounded-lg transition-all',
                isComplete ? 'bg-green-500/10 border border-green-500/20' : 'bg-slate-700/30'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('p-1.5 rounded', colorClasses?.bgLight)}>
                  <Icon className={cn('w-4 h-4', colorClasses?.text)} />
                </div>
                <span className="text-sm font-medium text-slate-300">{meta.label}</span>
                {isComplete && <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />}
              </div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-white">{current}</span>
                <span className="text-slate-500">/ {goal.target_value}</span>
                {meta.unit && <span className="text-slate-500 text-sm">{meta.unit}</span>}
              </div>

              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500 rounded-full',
                    isComplete ? 'bg-green-500' : colorClasses?.bg
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {allComplete && (
        <p className="text-center text-green-400 text-sm mt-4">
          Amazing work! You&apos;ve completed all your daily goals!
        </p>
      )}
    </Card>
  );
}
