'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSpeech } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Flame, 
  BookOpen, 
  GraduationCap, 
  Volume2, 
  TrendingUp,
  Camera,
  Upload,
  FolderOpen,
  History,
  ChevronRight
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
  longestStreak: number;
  totalWords: number;
  learnedWords: number;
  totalPracticeSessions: number;
}

export function DashboardHome() {
  const { speak } = useSpeech();
  const [wordOfDay, setWordOfDay] = useState<WordOfDay | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
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
  }, []);

  const handleSpeak = async () => {
    if (!wordOfDay) return;
    setIsPlaying(true);
    await speak(wordOfDay.word_zh);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const masteryRate = stats?.totalWords 
    ? Math.round((stats.learnedWords / stats.totalWords) * 100) 
    : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back! 👋</h1>
          <p className="text-slate-400">Ready to learn some Chinese today?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/capture">
            <Card className="bg-purple-600 hover:bg-purple-700 border-0 p-4 cursor-pointer transition-colors group">
              <Camera className="w-8 h-8 text-white mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-white">Capture</p>
              <p className="text-sm text-purple-200">Take a photo</p>
            </Card>
          </Link>
          <Link href="/upload">
            <Card className="bg-slate-800/80 hover:bg-slate-700 border-slate-700 p-4 cursor-pointer transition-colors group">
              <Upload className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-white">Upload</p>
              <p className="text-sm text-slate-400">From gallery</p>
            </Card>
          </Link>
          <Link href="/practice">
            <Card className="bg-slate-800/80 hover:bg-slate-700 border-slate-700 p-4 cursor-pointer transition-colors group">
              <GraduationCap className="w-8 h-8 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-white">Practice</p>
              <p className="text-sm text-slate-400">Flashcards</p>
            </Card>
          </Link>
          <Link href="/vocabulary">
            <Card className="bg-slate-800/80 hover:bg-slate-700 border-slate-700 p-4 cursor-pointer transition-colors group">
              <BookOpen className="w-8 h-8 text-pink-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-white">Vocabulary</p>
              <p className="text-sm text-slate-400">{stats?.totalWords || 0} words</p>
            </Card>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-orange-500/10 border-orange-500/30 p-4">
                <Flame className="w-6 h-6 text-orange-400 mb-2" />
                <p className="text-2xl font-bold text-orange-400">{stats?.currentStreak || 0}</p>
                <p className="text-xs text-orange-400/70">Day Streak</p>
              </Card>
              <Card className="bg-blue-500/10 border-blue-500/30 p-4">
                <BookOpen className="w-6 h-6 text-blue-400 mb-2" />
                <p className="text-2xl font-bold text-blue-400">{stats?.totalWords || 0}</p>
                <p className="text-xs text-blue-400/70">Total Words</p>
              </Card>
              <Card className="bg-green-500/10 border-green-500/30 p-4">
                <GraduationCap className="w-6 h-6 text-green-400 mb-2" />
                <p className="text-2xl font-bold text-green-400">{stats?.learnedWords || 0}</p>
                <p className="text-xs text-green-400/70">Mastered</p>
              </Card>
              <Card className="bg-purple-500/10 border-purple-500/30 p-4">
                <TrendingUp className="w-6 h-6 text-purple-400 mb-2" />
                <p className="text-2xl font-bold text-purple-400">{masteryRate}%</p>
                <p className="text-xs text-purple-400/70">Progress</p>
              </Card>
            </div>

            {/* Progress Bar */}
            {stats && stats.totalWords > 0 && (
              <Card className="bg-slate-800/50 border-slate-700 p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-400">Learning Progress</span>
                  <span className="text-sm font-medium text-purple-400">{masteryRate}%</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${masteryRate}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>{stats.learnedWords} mastered</span>
                  <span>{stats.totalWords - stats.learnedWords} to learn</span>
                </div>
              </Card>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-4">
              <Link href="/history">
                <Card className="bg-slate-800/50 border-slate-700 p-4 hover:border-slate-600 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <History className="w-5 h-5 text-slate-400" />
                      <span className="text-white">History</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
              <Link href="/collections">
                <Card className="bg-slate-800/50 border-slate-700 p-4 hover:border-slate-600 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-5 h-5 text-slate-400" />
                      <span className="text-white">Collections</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Right Column - Word of Day */}
          <div className="space-y-6">
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

              {loading ? (
                <div className="space-y-3">
                  <div className="h-12 bg-slate-700/50 rounded animate-pulse" />
                  <div className="h-6 bg-slate-700/50 rounded w-2/3 animate-pulse" />
                </div>
              ) : wordOfDay ? (
                <div>
                  <p className="text-5xl font-bold text-white mb-3">{wordOfDay.word_zh}</p>
                  <p className="text-2xl text-purple-400 mb-2">{wordOfDay.word_pinyin}</p>
                  <p className="text-lg text-slate-400">{wordOfDay.word_en}</p>
                  {wordOfDay.example_sentence && (
                    <p className="text-sm text-slate-500 mt-4 italic border-t border-slate-700 pt-4">
                      "{wordOfDay.example_sentence}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-400 mb-4">No words yet</p>
                  <Link href="/capture">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      <Camera className="w-4 h-4 mr-2" />
                      Capture first photo
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* Practice Reminder */}
            {stats && stats.totalWords > 0 && stats.totalWords > stats.learnedWords && (
              <Card className="bg-slate-800/50 border-slate-700 p-4">
                <p className="text-white font-medium mb-2">
                  📚 {stats.totalWords - stats.learnedWords} words to practice
                </p>
                <p className="text-sm text-slate-400 mb-3">
                  Keep your streak going!
                </p>
                <Link href="/practice">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Start Practice
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

