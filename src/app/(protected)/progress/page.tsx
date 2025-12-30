'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Flame, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  Calendar,
  Target,
  RefreshCw
} from 'lucide-react';

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
  learnedWords: number;
  totalPracticeSessions: number;
  lastPracticeDate: string | null;
  wordsPerDay: Array<{ date: string; count: number }>;
}

export default function ProgressPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Progress</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={fetchStats}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  const masteryRate = stats.totalWords > 0 
    ? Math.round((stats.learnedWords / stats.totalWords) * 100) 
    : 0;

  // Get max count for chart scaling
  const maxCount = Math.max(...stats.wordsPerDay.map(d => d.count), 1);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-6">Your Progress</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Current Streak */}
        <Card className="bg-gradient-to-br from-orange-500/20 to-slate-800/50 border-orange-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-orange-400/70">Current Streak</span>
          </div>
          <p className="text-3xl font-bold text-orange-400">{stats.currentStreak}</p>
          <p className="text-xs text-orange-400/50">
            Best: {stats.longestStreak} days
          </p>
        </Card>

        {/* Total Words */}
        <Card className="bg-gradient-to-br from-blue-500/20 to-slate-800/50 border-blue-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-blue-400/70">Total Words</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">{stats.totalWords}</p>
          <p className="text-xs text-blue-400/50">In your vocabulary</p>
        </Card>

        {/* Mastered */}
        <Card className="bg-gradient-to-br from-green-500/20 to-slate-800/50 border-green-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-400/70">Mastered</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{stats.learnedWords}</p>
          <p className="text-xs text-green-400/50">{masteryRate}% of total</p>
        </Card>

        {/* Practice Sessions */}
        <Card className="bg-gradient-to-br from-purple-500/20 to-slate-800/50 border-purple-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-purple-400/70">Sessions</span>
          </div>
          <p className="text-3xl font-bold text-purple-400">{stats.totalPracticeSessions}</p>
          <p className="text-xs text-purple-400/50">Practice sessions</p>
        </Card>
      </div>

      {/* Mastery Progress Bar */}
      <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Mastery Progress
          </h2>
          <span className="text-2xl font-bold text-purple-400">{masteryRate}%</span>
        </div>
        <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${masteryRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-slate-400">
          <span>{stats.learnedWords} mastered</span>
          <span>{stats.totalWords - stats.learnedWords} still learning</span>
        </div>
      </Card>

      {/* Words Added Chart */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-blue-400" />
          Words Added (Last 7 Days)
        </h2>
        
        <div className="flex items-end justify-between gap-2 h-40">
          {stats.wordsPerDay.map((day, index) => {
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const isToday = day.date === new Date().toISOString().split('T')[0];
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-white">{day.count}</span>
                <div className="w-full flex flex-col-reverse" style={{ height: '100px' }}>
                  <div 
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isToday 
                        ? 'bg-gradient-to-t from-purple-500 to-pink-500' 
                        : 'bg-blue-500/60'
                    }`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                </div>
                <span className={`text-xs ${isToday ? 'text-purple-400 font-medium' : 'text-slate-500'}`}>
                  {dayName}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Motivational Message */}
      {stats.currentStreak > 0 && (
        <div className="mt-8 text-center p-6 rounded-xl bg-gradient-to-r from-orange-900/30 to-purple-900/30 border border-orange-500/20">
          <p className="text-2xl mb-2">🔥</p>
          <p className="text-lg text-white font-medium">
            {stats.currentStreak === 1 
              ? "Great start! Keep practicing tomorrow!" 
              : stats.currentStreak < 7 
                ? `${stats.currentStreak} day streak! You're building momentum!`
                : stats.currentStreak < 30
                  ? `${stats.currentStreak} days! You're on fire! 🎉`
                  : `${stats.currentStreak} days! You're a dedication champion! 🏆`}
          </p>
        </div>
      )}
    </div>
  );
}

