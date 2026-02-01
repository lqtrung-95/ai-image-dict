'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSpeech } from '@/hooks/useSpeech';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Volume2, Plus, Camera, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api-client';

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

export function DashboardHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { speak } = useSpeech();
  const isMobile = useIsMobile();
  const [wordOfDay, setWordOfDay] = useState<WordOfDay | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // On mobile, navigate directly to upload; on desktop, show modal
  const handleAddWords = () => {
    if (isMobile) {
      router.push('/upload');
    } else {
      setShowAddModal(true);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wordRes, statsRes] = await Promise.all([
          apiFetch('/api/word-of-day'),
          apiFetch('/api/stats'),
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

  const displayName = user?.email?.split('@')[0] || 'there';
  const wordsToLearn = (stats?.totalWords || 0) - (stats?.learnedWords || 0);
  const masteryPercent = stats?.totalWords 
    ? Math.round((stats.learnedWords / stats.totalWords) * 100) 
    : 0;
  const hasWords = (stats?.totalWords || 0) > 0;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-xl">
          <div className="h-8 bg-slate-800 rounded w-48 mb-2 animate-pulse" />
          <div className="h-5 bg-slate-800 rounded w-64 mb-8 animate-pulse" />
          <div className="h-32 bg-slate-800 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  // Empty state - no words yet
  if (!hasWords) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-xl">
          {/* Header */}
          <h1 className="text-2xl font-semibold text-white mb-1">
            Welcome back
          </h1>
          
          <div className="mt-16 text-center">
            <p className="text-slate-400 text-lg mb-8">
              You have no words yet
            </p>
            
            <Button 
              onClick={handleAddWords}
              className="bg-purple-600 hover:bg-purple-700 h-12 px-8 text-base"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add your first word
            </Button>
            
            <p className="text-slate-500 text-sm mt-6">
              Tip: Take a photo of any object to learn its Chinese name
            </p>
          </div>

          <AddWordsModal open={showAddModal} onOpenChange={setShowAddModal} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-xl">
        
        {/* 1. Header - Simple greeting */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-1">
            Welcome back, {displayName}
          </h1>
          <p className="text-slate-400">
            Ready to learn some Chinese?
          </p>
        </header>

        {/* 2. Primary Action - Continue Learning */}
        <section className="mb-6 p-5 rounded-lg border border-slate-700 bg-slate-800/30">
          <h2 className="text-lg font-medium text-white mb-1">
            Continue Learning
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            {wordsToLearn} {wordsToLearn === 1 ? 'word' : 'words'} waiting for review
          </p>
          <div className="flex gap-3">
            <Link href="/practice" className="flex-1">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 h-11">
                Flashcards
              </Button>
            </Link>
            <Link href="/quiz" className="flex-1">
              <Button variant="outline" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10 h-11">
                Quiz
              </Button>
            </Link>
          </div>
        </section>

        {/* 3. Secondary Action - Add words */}
        <section className="mb-8">
          <Button 
            variant="outline" 
            onClick={handleAddWords}
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 h-11"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add new words
          </Button>
        </section>

        {/* 4. Lightweight Stats Row */}
        <section className="flex justify-between text-sm text-slate-500 mb-8 px-1">
          <span>🔥 {stats?.currentStreak || 0} days</span>
          <span>📘 {stats?.totalWords || 0} words</span>
          <span>✅ {stats?.learnedWords || 0} mastered</span>
          <span>📈 {masteryPercent}%</span>
        </section>

        {/* 5. Learning Progress */}
        <section className="mb-10">
          <p className="text-sm text-slate-500 mb-3">Learning progress</p>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-slate-600 transition-all duration-500"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-2">
            <span>{stats?.learnedWords || 0} mastered</span>
            <span>{wordsToLearn} to learn</span>
          </div>
        </section>

        {/* 6. Word of the Day */}
        {wordOfDay && (
          <section className="mb-10 p-4 rounded-lg border border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">
              Word of the day
            </p>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-white mb-1">{wordOfDay.word_zh}</p>
                <p className="text-purple-400 mb-1">{wordOfDay.word_pinyin}</p>
                <p className="text-slate-400 text-sm">{wordOfDay.word_en}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSpeak}
                className={cn(
                  'h-10 w-10 rounded-full mt-1',
                  isPlaying ? 'text-purple-400 bg-purple-500/20' : 'text-slate-500 hover:text-white'
                )}
              >
                <Volume2 className="w-5 h-5" />
              </Button>
            </div>
          </section>
        )}

        {/* 7. Utility Links */}
        <section className="flex justify-center gap-8 text-sm">
          <Link href="/history" className="text-slate-500 hover:text-slate-300 transition-colors">
            History
          </Link>
          <Link href="/collections" className="text-slate-500 hover:text-slate-300 transition-colors">
            Collections
          </Link>
          <Link href="/progress" className="text-slate-500 hover:text-slate-300 transition-colors">
            Progress
          </Link>
        </section>

        <AddWordsModal open={showAddModal} onOpenChange={setShowAddModal} />
      </div>
    </div>
  );
}

// Add Words Modal (desktop only)
function AddWordsModal({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Add new words</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Link href="/capture" className="block">
            <Button 
              variant="outline" 
              className="w-full h-14 border-slate-700 text-white hover:bg-slate-700 justify-start px-4"
            >
              <Camera className="w-5 h-5 mr-3 text-purple-400" />
              <div className="text-left">
                <p className="font-medium">Take photo</p>
                <p className="text-xs text-slate-400">Use your camera</p>
              </div>
            </Button>
          </Link>
          <Link href="/upload" className="block">
            <Button 
              variant="outline" 
              className="w-full h-14 border-slate-700 text-white hover:bg-slate-700 justify-start px-4"
            >
              <Upload className="w-5 h-5 mr-3 text-blue-400" />
              <div className="text-left">
                <p className="font-medium">Upload from gallery</p>
                <p className="text-xs text-slate-400">Choose existing photo</p>
              </div>
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
