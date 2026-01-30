'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Volume2, Check, Trash2, Plus, FolderPlus, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
];

interface VocabularyList {
  id: string;
  name: string;
  color: string;
}

interface VocabularyCardProps {
  id?: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  exampleSentence?: string;
  category?: string;
  isLearned?: boolean;
  isSaved?: boolean;
  listName?: string;
  listColor?: string;
  photoUrl?: string | null;
  photoDate?: string | null;
  analysisId?: string | null;
  onSave?: (listId?: string) => void;
  onToggleLearned?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddToList?: (id: string, listId: string) => void;
  onClick?: () => void;
  className?: string;
}

export function VocabularyCard({
  id,
  wordZh,
  wordPinyin,
  wordEn,
  exampleSentence,
  category,
  isLearned = false,
  isSaved = false,
  listName,
  listColor,
  photoUrl,
  photoDate,
  analysisId,
  onSave,
  onToggleLearned,
  onDelete,
  onAddToList,
  onClick,
  className,
}: VocabularyCardProps) {
  const { speak } = useSpeech();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExampleExpanded, setIsExampleExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#3b82f6');
  const [creating, setCreating] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState<'save' | 'add' | null>(null);

  const handleSpeak = async () => {
    setIsPlaying(true);
    await speak(wordZh);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const handleSave = (listId?: string) => {
    if (onSave) {
      onSave(listId);
      toast.success(listId ? 'Added to list!' : 'Added to vocabulary!');
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName.trim(), color: newListColor }),
      });

      if (response.ok) {
        const newList = await response.json();
        setLists((prev) => [newList, ...prev]);

        // Auto-save/add to the new list
        if (pendingSaveAction === 'save') {
          handleSave(newList.id);
        } else if (pendingSaveAction === 'add' && id && onAddToList) {
          onAddToList(id, newList.id);
          toast.success(`Added to ${newList.name}!`);
        }

        setShowCreateDialog(false);
        setNewListName('');
        setPendingSaveAction(null);
      } else {
        toast.error('Failed to create list');
      }
    } catch (error) {
      console.error('Failed to create list:', error);
      toast.error('Failed to create list');
    } finally {
      setCreating(false);
    }
  };

  const openCreateDialog = (action: 'save' | 'add') => {
    setPendingSaveAction(action);
    setShowCreateDialog(true);
  };

  const handleDelete = () => {
    if (id && onDelete) {
      onDelete(id);
      toast.success('Removed from vocabulary');
      setShowDeleteConfirm(false);
    }
  };

  const fetchLists = async () => {
    if (lists.length > 0) return;
    setLoadingLists(true);
    try {
      const response = await fetch('/api/lists');
      if (response.ok) {
        const data = await response.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleAddToList = (listId: string) => {
    if (id && onAddToList) {
      onAddToList(id, listId);
    }
  };

  const categoryColors: Record<string, string> = {
    object: 'bg-blue-500/20 text-blue-400',
    color: 'bg-pink-500/20 text-pink-400',
    action: 'bg-green-500/20 text-green-400',
  };

  // Format the date nicely
  const formattedDate = photoDate
    ? new Date(photoDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className={cn(
        'group p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-colors',
        isLearned && 'border-green-500/30 bg-green-900/10',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Photo thumbnail */}
        {photoUrl && (
          <a
            href={analysisId ? `/analysis/${analysisId}` : '#'}
            className="flex-shrink-0 group/photo"
            title="View original photo"
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-600 group-hover/photo:border-purple-500/50 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Source photo"
                className="w-full h-full object-cover"
              />
            </div>
            {formattedDate && (
              <p className="text-[10px] text-slate-500 text-center mt-1">{formattedDate}</p>
            )}
          </a>
        )}

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
            {listName && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: `${listColor}20`, color: listColor }}
              >
                <Folder className="w-3 h-3" />
                {listName}
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-white mb-1 truncate">{wordZh}</h3>
          <p className="text-lg text-purple-400 mb-1">{wordPinyin}</p>
          <p className="text-slate-400 truncate">{wordEn}</p>
          {exampleSentence && (
            <button
              onClick={() => setIsExampleExpanded(!isExampleExpanded)}
              className="text-left w-full mt-2 group/example"
            >
              <p
                className={cn(
                  'text-sm text-slate-500 italic transition-all',
                  !isExampleExpanded && 'line-clamp-2'
                )}
              >
                &ldquo;{exampleSentence}&rdquo;
              </p>
              {!isExampleExpanded && exampleSentence.length > 80 && (
                <span className="text-xs text-purple-400 opacity-0 group-hover/example:opacity-100 transition-opacity">
                  Tap to expand
                </span>
              )}
            </button>
          )}
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

          {/* Save button with list picker (for unsaved words) */}
          {!isSaved && onSave && (
            <DropdownMenu onOpenChange={(open) => open && fetchLists()}>
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
                <DropdownMenuSeparator className="bg-slate-700" />
                {loadingLists ? (
                  <DropdownMenuItem disabled className="text-slate-400">
                    Loading lists...
                  </DropdownMenuItem>
                ) : (
                  lists.map((list) => (
                    <DropdownMenuItem
                      key={list.id}
                      onClick={() => handleSave(list.id)}
                      className="text-white focus:bg-slate-700 cursor-pointer"
                    >
                      <Folder className="w-4 h-4 mr-2" style={{ color: list.color }} />
                      Save to {list.name}
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  onClick={() => openCreateDialog('save')}
                  className="text-purple-400 focus:bg-slate-700 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create new list
                </DropdownMenuItem>
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

          {/* Add to list dropdown (for saved words) */}
          {isSaved && id && onAddToList && (
            <DropdownMenu onOpenChange={(open) => open && fetchLists()}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-slate-400 hover:text-purple-400 hover:bg-purple-500/20"
                  aria-label="Add to list"
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700" align="end">
                {loadingLists ? (
                  <DropdownMenuItem disabled className="text-slate-400">
                    Loading...
                  </DropdownMenuItem>
                ) : (
                  lists.map((list) => (
                    <DropdownMenuItem
                      key={list.id}
                      onClick={() => handleAddToList(list.id)}
                      className="text-white focus:bg-slate-700 cursor-pointer"
                    >
                      <Folder className="w-4 h-4 mr-2" style={{ color: list.color }} />
                      {list.name}
                    </DropdownMenuItem>
                  ))
                )}
                {lists.length > 0 && <DropdownMenuSeparator className="bg-slate-700" />}
                <DropdownMenuItem
                  onClick={() => openCreateDialog('add')}
                  className="text-purple-400 focus:bg-slate-700 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create new list
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Delete button (for saved words) - always visible for mobile accessibility */}
          {isSaved && id && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-8 w-8 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Create List Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Create List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name"
                className="bg-slate-700/50 border-slate-600 text-white"
                autoFocus
              />
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewListColor(color)}
                    className={cn(
                      'w-7 h-7 rounded-full transition-transform',
                      newListColor === color && 'scale-110 ring-2 ring-white'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreateList}
              disabled={!newListName.trim() || creating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {creating ? 'Creating...' : 'Create & Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Word?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-400">
              Are you sure you want to remove <span className="text-white font-medium">{wordZh}</span> ({wordEn}) from your vocabulary?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

