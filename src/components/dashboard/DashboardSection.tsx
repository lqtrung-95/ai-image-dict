'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSpeech } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Flame, 
  BookOpen, 
  GraduationCap, 
  Volume2, 
  TrendingUp,
  Camera 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WordOfDay {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
  example_sentence?: string;
}

interface Stats {
  currentStreak: number;
  totalWords: number;
  learnedWords: number;
}

export function DashboardSection() {
  const { user, loading: authLoading } = useAuth();
  const { speak } = useSpeech();
  const [wordOfDay, setWordOfDay] = useState<WordOfDay | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [wordRes, statsRes] = await Promise.all([
          fetch('/api/word-of-day'),
          fetch('/api/stats'),
        ]);

        if (wordRes.ok) {
          const data = await wordRes.json();
          setWordOfDay(data.word);
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSpeak = async () => {
    if (!wordOfDay) return;
    setIsPlaying(true);
    await speak(wordOfDay.word_zh);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  // Don't show for non-authenticated users
  if (authLoading || !user) {
    return null;
  }

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-48 bg-slate-800/50 rounded-2xl animate-pulse" />
            <div className="h-48 bg-slate-800/50 rounded-2xl animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Welcome back! 👋</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Word of the Day */}
          <Card className="bg-gradient-to-br from-purple-900/50 to-slate-800/50 border-purple-500/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-purple-400">Word of the Day</h3>
              {wordOfDay && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSpeak}
                  className={cn(
                    'h-8 w-8 rounded-full',
                    isPlaying ? 'text-purple-400 bg-purple-500/20' : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {wordOfDay ? (
              <div>
                <p className="text-4xl font-bold text-white mb-2">{wordOfDay.word_zh}</p>
                <p className="text-xl text-purple-400 mb-1">{wordOfDay.word_pinyin}</p>
                <p className="text-slate-400">{wordOfDay.word_en}</p>
                {wordOfDay.example_sentence && (
                  <p className="text-sm text-slate-500 mt-3 italic">
                    "{wordOfDay.example_sentence}"
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 mb-3">No words yet</p>
                <Link href="/capture">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Camera className="w-4 h-4 mr-2" />
                    Add your first word
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Stats Overview */}
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Your Progress</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Streak */}
              <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-2xl font-bold text-orange-400">
                    {stats?.currentStreak || 0}
                  </span>
                </div>
                <p className="text-xs text-orange-400/70">Day Streak</p>
              </div>

              {/* Total Words */}
              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <span className="text-2xl font-bold text-blue-400">
                    {stats?.totalWords || 0}
                  </span>
                </div>
                <p className="text-xs text-blue-400/70">Total Words</p>
              </div>

              {/* Learned */}
              <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="w-5 h-5 text-green-400" />
                  <span className="text-2xl font-bold text-green-400">
                    {stats?.learnedWords || 0}
                  </span>
                </div>
                <p className="text-xs text-green-400/70">Learned</p>
              </div>

              {/* Progress */}
              <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span className="text-2xl font-bold text-purple-400">
                    {stats?.totalWords 
                      ? Math.round((stats.learnedWords / stats.totalWords) * 100) 
                      : 0}%
                  </span>
                </div>
                <p className="text-xs text-purple-400/70">Mastered</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Link href="/practice" className="flex-1">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Practice
                </Button>
              </Link>
              <Link href="/progress" className="flex-1">
                <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Progress
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

