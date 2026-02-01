'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BookmarkX, BookmarkCheck, Volume2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api-client';
import { useSpeech } from '@/hooks/useSpeech';

interface WordOfDay {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
  example_sentence?: string;
  hsk_level?: number;
  is_learned?: boolean;
}

interface WordHistory {
  id: string;
  was_saved: boolean;
  was_dismissed: boolean;
}

export function WordOfDayCard() {
  const [word, setWord] = useState<WordOfDay | null>(null);
  const [history, setHistory] = useState<WordHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { speak } = useSpeech();

  useEffect(() => {
    fetchWordOfDay();
  }, []);

  const fetchWordOfDay = async () => {
    try {
      const response = await apiFetch('/api/word-of-day');
      if (response.ok) {
        const data = await response.json();
        setWord(data.word);
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch word of day:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'save' | 'dismiss') => {
    setActionLoading(true);
    try {
      const response = await apiFetch('/api/word-of-day', {
        method: 'POST',
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);

        if (action === 'save') {
          toast.success('Word saved to your vocabulary!');
        } else {
          toast.info('Word dismissed for today');
        }
      }
    } catch (error) {
      toast.error('Failed to process action');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6 mb-6 animate-pulse">
        <div className="h-32 bg-purple-500/10 rounded-lg" />
      </Card>
    );
  }

  if (!word || history?.was_dismissed) {
    return null;
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card
      className={cn(
        'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6 mb-6',
        history?.was_saved && 'from-green-600/10 to-emerald-600/10 border-green-500/30'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Word of the Day</span>
            <span className="text-slate-500">•</span>
            <span className="text-sm text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {today}
            </span>
          </div>

          {/* Word */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white">{word.word_zh}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speak(word.word_zh)}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
              >
                <Volume2 className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-lg text-purple-300">{word.word_pinyin}</p>
            <p className="text-slate-300">{word.word_en}</p>
          </div>

          {/* Example */}
          {word.example_sentence && (
            <p className="text-sm text-slate-400 italic mb-4">
              &ldquo;{word.example_sentence}&rdquo;
            </p>
          )}

          {/* HSK Badge */}
          {word.hsk_level && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 mb-4">
              HSK {word.hsk_level}
            </span>
          )}
        </div>

        {/* Actions */}
        {!history?.was_saved && (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleAction('save')}
              disabled={actionLoading}
              className="bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              <BookmarkCheck className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button
              onClick={() => handleAction('dismiss')}
              disabled={actionLoading}
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-400"
            >
              <BookmarkX className="w-4 h-4 mr-1" />
              Skip
            </Button>
          </div>
        )}

        {history?.was_saved && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <BookmarkCheck className="w-5 h-5" />
            Saved
          </div>
        )}
      </div>
    </Card>
  );
}
