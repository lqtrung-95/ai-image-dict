'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Flame,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Calendar,
  Target,
  RefreshCw,
  Play,
  Clock,
  BarChart3,
} from 'lucide-react';
import { DailyGoalProgressWidget } from '@/components/progress/daily-goal-progress-widget';
import { ActivityHeatmap } from '@/components/dashboard/activity-heatmap';
import { WordStateProgressBar } from '@/components/dashboard/word-state-progress-bar';

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
  learnedWords: number;
  totalPracticeSessions: number;
  lastPracticeDate: string | null;
  wordsPerDay: Array<{ date: string; count: number }>;
  // SRS stats
  dueToday: number;
  masteredThisWeek: number;
  averageEaseFactor: number;
  hskDistribution: Record<string, number>;
  reviewForecast: Array<{ date: string; count: number }>;
}

const HSK_COLORS: Record<string, string> = {
  hsk1: 'bg-green-500',
  hsk2: 'bg-emerald-500',
  hsk3: 'bg-yellow-500',
  hsk4: 'bg-orange-500',
  hsk5: 'bg-red-500',
  hsk6: 'bg-purple-500',
  unclassified: 'bg-slate-500',
};

const HSK_LABELS: Record<string, string> = {
  hsk1: 'HSK 1',
  hsk2: 'HSK 2',
  hsk3: 'HSK 3',
  hsk4: 'HSK 4',
  hsk5: 'HSK 5',
  hsk6: 'HSK 6',
  unclassified: 'Other',
};

export default function ProgressPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<{ date: string; wordsReviewed: number }[]>([]);
  const [detailedStats, setDetailedStats] = useState<{
    wordsByState: { new: number; learning: number; reviewing: number; mastered: number };
  } | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, activityRes, detailedRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/stats/activity?days=84'),
        fetch('/api/stats/detailed'),
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const data = await statsRes.json();
      setStats(data);

      if (activityRes.ok) {
        const activityJson = await activityRes.json();
        setActivityData(activityJson.activity || []);
      }

      if (detailedRes.ok) {
        const detailedJson = await detailedRes.json();
        setDetailedStats(detailedJson);
      }
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

  // Empty state - no vocabulary yet
  if (stats.totalWords === 0) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Your Progress</h1>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">No progress yet</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Start building your vocabulary by analyzing photos. Your progress stats will appear here!
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push('/capture')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Capture Photo
            </Button>
            <Button
              onClick={() => router.push('/upload')}
              variant="outline"
              className="border-slate-600"
            >
              Upload Image
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const masteryRate = stats.totalWords > 0
    ? Math.round((stats.learnedWords / stats.totalWords) * 100)
    : 0;

  // Get max count for charts
  const maxWordsPerDay = Math.max(...stats.wordsPerDay.map((d) => d.count), 1);
  const maxForecast = Math.max(...stats.reviewForecast.map((d) => d.count), 1);

  // Calculate total HSK words for percentage
  const totalHskWords = Object.values(stats.hskDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-6">Your Progress</h1>

      {/* Due Today CTA */}
      {stats.dueToday > 0 && (
        <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  {stats.dueToday} words due for review
                </p>
                <p className="text-sm text-purple-300/70">
                  Keep your streak alive!
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/practice')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Practice Now
            </Button>
          </div>
        </Card>
      )}

      {/* Daily Goals Widget */}
      <DailyGoalProgressWidget />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Current Streak */}
        <Card className="bg-gradient-to-br from-orange-500/20 to-slate-800/50 border-orange-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-orange-400/70">Current Streak</span>
          </div>
          <p className="text-3xl font-bold text-orange-400">{stats.currentStreak}</p>
          <p className="text-xs text-orange-400/50">Best: {stats.longestStreak} days</p>
        </Card>

        {/* Due Today */}
        <Card className="bg-gradient-to-br from-purple-500/20 to-slate-800/50 border-purple-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-purple-400/70">Due Today</span>
          </div>
          <p className="text-3xl font-bold text-purple-400">{stats.dueToday}</p>
          <p className="text-xs text-purple-400/50">Words to review</p>
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
          <p className="text-xs text-green-400/50">
            {masteryRate}% of total
            {stats.masteredThisWeek > 0 && ` (+${stats.masteredThisWeek} this week)`}
          </p>
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

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* HSK Distribution */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            HSK Level Distribution
          </h2>
          {totalHskWords > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.hskDistribution).map(([level, count]) => {
                if (count === 0) return null;
                const percentage = Math.round((count / totalHskWords) * 100);
                return (
                  <div key={level}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{HSK_LABELS[level]}</span>
                      <span className="text-slate-400">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${HSK_COLORS[level]} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">
              No HSK data yet. Words will be classified as you add them.
            </p>
          )}
        </Card>

        {/* Review Forecast */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Review Forecast (Next 7 Days)
          </h2>
          <div className="flex items-end justify-between gap-2 h-32">
            {stats.reviewForecast.map((day, index) => {
              const height = maxForecast > 0 ? (day.count / maxForecast) * 100 : 0;
              const date = new Date(day.date);
              const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
              const isToday = index === 0;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-white">{day.count}</span>
                  <div className="w-full flex flex-col-reverse" style={{ height: '80px' }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-cyan-500 to-purple-500'
                          : 'bg-cyan-500/60'
                      }`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className={`text-xs ${isToday ? 'text-cyan-400 font-medium' : 'text-slate-500'}`}>
                    {dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Activity Heatmap */}
      {activityData.length > 0 && (
        <div className="mb-8">
          <ActivityHeatmap activity={activityData} />
        </div>
      )}

      {/* Word State Progress */}
      {detailedStats && (
        <div className="mb-8">
          <WordStateProgressBar
            wordsByState={detailedStats.wordsByState}
            totalWords={stats?.totalWords || 0}
          />
        </div>
      )}

      {/* Words Added Chart */}
      <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
          <Target className="w-5 h-5 text-blue-400" />
          Words Added (Last 7 Days)
        </h2>

        <div className="flex items-end justify-between gap-2 h-40">
          {stats.wordsPerDay.map((day, index) => {
            const height = maxWordsPerDay > 0 ? (day.count / maxWordsPerDay) * 100 : 0;
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

      {/* Practice Sessions */}
      <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Practice Sessions
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              You&apos;ve completed {stats.totalPracticeSessions} practice sessions
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-purple-400">{stats.totalPracticeSessions}</p>
            <p className="text-xs text-slate-500">Total sessions</p>
          </div>
        </div>
      </Card>

      {/* Motivational Message */}
      {stats.currentStreak > 0 && (
        <div className="text-center p-6 rounded-xl bg-gradient-to-r from-orange-900/30 to-purple-900/30 border border-orange-500/20">
          <p className="text-2xl mb-2">
            {stats.currentStreak >= 30 ? '🏆' : stats.currentStreak >= 7 ? '🎉' : '🔥'}
          </p>
          <p className="text-lg text-white font-medium">
            {stats.currentStreak === 1
              ? 'Great start! Keep practicing tomorrow!'
              : stats.currentStreak < 7
                ? `${stats.currentStreak} day streak! You're building momentum!`
                : stats.currentStreak < 30
                  ? `${stats.currentStreak} days! You're on fire!`
                  : `${stats.currentStreak} days! You're a dedication champion!`}
          </p>
        </div>
      )}
    </div>
  );
}
