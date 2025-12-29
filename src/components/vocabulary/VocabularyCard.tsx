'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';
import { Volume2, Check, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VocabularyCardProps {
  id?: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  category?: string;
  isLearned?: boolean;
  isSaved?: boolean;
  onSave?: () => void;
  onToggleLearned?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function VocabularyCard({
  id,
  wordZh,
  wordPinyin,
  wordEn,
  category,
  isLearned = false,
  isSaved = false,
  onSave,
  onToggleLearned,
  onDelete,
  className,
}: VocabularyCardProps) {
  const { speak } = useSpeech();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = async () => {
    setIsPlaying(true);
    await speak(wordZh);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
      toast.success('Added to vocabulary!');
    }
  };

  const handleDelete = () => {
    if (id && onDelete) {
      onDelete(id);
      toast.success('Removed from vocabulary');
    }
  };

  const categoryColors: Record<string, string> = {
    object: 'bg-blue-500/20 text-blue-400',
    color: 'bg-pink-500/20 text-pink-400',
    action: 'bg-green-500/20 text-green-400',
  };

  return (
    <div
      className={cn(
        'group p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-colors',
        isLearned && 'border-green-500/30 bg-green-900/10',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {category && (
            <span
              className={cn(
                'inline-block px-2 py-0.5 rounded text-xs font-medium mb-2',
                categoryColors[category] || 'bg-slate-600 text-slate-300'
              )}
            >
              {category}
            </span>
          )}
          <h3 className="text-2xl font-bold text-white mb-1 truncate">{wordZh}</h3>
          <p className="text-lg text-purple-400 mb-1">{wordPinyin}</p>
          <p className="text-slate-400 truncate">{wordEn}</p>
        </div>

        <div className="flex flex-col gap-1">
          {/* Play pronunciation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSpeak}
            className={cn(
              'h-8 w-8 rounded-full',
              isPlaying ? 'text-purple-400 bg-purple-500/20' : 'text-slate-400 hover:text-white'
            )}
            aria-label="Play pronunciation"
          >
            <Volume2 className="w-4 h-4" />
          </Button>

          {/* Save button (for unsaved words) */}
          {!isSaved && onSave && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              className="h-8 w-8 rounded-full text-slate-400 hover:text-green-400 hover:bg-green-500/20"
              aria-label="Save to vocabulary"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}

          {/* Learned toggle (for saved words) */}
          {isSaved && id && onToggleLearned && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleLearned(id)}
              className={cn(
                'h-8 w-8 rounded-full',
                isLearned
                  ? 'text-green-400 bg-green-500/20'
                  : 'text-slate-400 hover:text-green-400 hover:bg-green-500/20'
              )}
              aria-label={isLearned ? 'Mark as learning' : 'Mark as learned'}
            >
              <Check className="w-4 h-4" />
            </Button>
          )}

          {/* Delete button (for saved words) */}
          {isSaved && id && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

