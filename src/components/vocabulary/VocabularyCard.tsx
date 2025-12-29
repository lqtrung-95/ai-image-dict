'use client';

import { useState, useEffect } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Volume2, Check, Trash2, Plus, FolderPlus, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Collection {
  id: string;
  name: string;
  color: string;
}

interface VocabularyCardProps {
  id?: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  category?: string;
  isLearned?: boolean;
  isSaved?: boolean;
  collectionName?: string;
  collectionColor?: string;
  onSave?: (collectionId?: string) => void;
  onToggleLearned?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddToCollection?: (id: string, collectionId: string) => void;
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
  collectionName,
  collectionColor,
  onSave,
  onToggleLearned,
  onDelete,
  onAddToCollection,
  className,
}: VocabularyCardProps) {
  const { speak } = useSpeech();
  const [isPlaying, setIsPlaying] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);

  const handleSpeak = async () => {
    setIsPlaying(true);
    await speak(wordZh);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const handleSave = (collectionId?: string) => {
    if (onSave) {
      onSave(collectionId);
      toast.success(collectionId ? 'Added to collection!' : 'Added to vocabulary!');
    }
  };

  const handleDelete = () => {
    if (id && onDelete) {
      onDelete(id);
      toast.success('Removed from vocabulary');
    }
  };

  const fetchCollections = async () => {
    if (collections.length > 0) return;
    setLoadingCollections(true);
    try {
      const response = await fetch('/api/collections');
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleAddToCollection = (collectionId: string) => {
    if (id && onAddToCollection) {
      onAddToCollection(id, collectionId);
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
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {category && (
              <span
                className={cn(
                  'inline-block px-2 py-0.5 rounded text-xs font-medium',
                  categoryColors[category] || 'bg-slate-600 text-slate-300'
                )}
              >
                {category}
              </span>
            )}
            {collectionName && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: `${collectionColor}20`, color: collectionColor }}
              >
                <Folder className="w-3 h-3" />
                {collectionName}
              </span>
            )}
          </div>
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

          {/* Save button with collection picker (for unsaved words) */}
          {!isSaved && onSave && (
            <DropdownMenu onOpenChange={(open) => open && fetchCollections()}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-slate-400 hover:text-green-400 hover:bg-green-500/20"
                  aria-label="Save to vocabulary"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700" align="end">
                <DropdownMenuItem
                  onClick={() => handleSave()}
                  className="text-white focus:bg-slate-700 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2 text-green-400" />
                  Save to vocabulary
                </DropdownMenuItem>
                {collections.length > 0 && <DropdownMenuSeparator className="bg-slate-700" />}
                {loadingCollections ? (
                  <DropdownMenuItem disabled className="text-slate-400">
                    Loading collections...
                  </DropdownMenuItem>
                ) : (
                  collections.map((collection) => (
                    <DropdownMenuItem
                      key={collection.id}
                      onClick={() => handleSave(collection.id)}
                      className="text-white focus:bg-slate-700 cursor-pointer"
                    >
                      <Folder className="w-4 h-4 mr-2" style={{ color: collection.color }} />
                      Save to {collection.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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

          {/* Add to collection dropdown (for saved words) */}
          {isSaved && id && onAddToCollection && (
            <DropdownMenu onOpenChange={(open) => open && fetchCollections()}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-slate-400 hover:text-purple-400 hover:bg-purple-500/20"
                  aria-label="Add to collection"
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                {loadingCollections ? (
                  <DropdownMenuItem disabled className="text-slate-400">
                    Loading...
                  </DropdownMenuItem>
                ) : collections.length === 0 ? (
                  <DropdownMenuItem disabled className="text-slate-400">
                    No collections yet
                  </DropdownMenuItem>
                ) : (
                  collections.map((collection) => (
                    <DropdownMenuItem
                      key={collection.id}
                      onClick={() => handleAddToCollection(collection.id)}
                      className="text-white focus:bg-slate-700 cursor-pointer"
                    >
                      <Folder className="w-4 h-4 mr-2" style={{ color: collection.color }} />
                      {collection.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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

