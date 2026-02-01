'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { VocabularyItem } from '@/types';

interface AddWordsToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  listName: string;
  existingWordIds: string[];
  onAddWords: (wordIds: string[]) => Promise<void>;
}

export function AddWordsToListDialog({
  open,
  onOpenChange,
  listId,
  listName,
  existingWordIds,
  onAddWords,
}: AddWordsToListDialogProps) {
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchWords();
      setSelectedIds(new Set());
      setSearch('');
    }
  }, [open, listId]);

  const fetchWords = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/vocabulary?limit=200');
      if (response.ok) {
        const data = await response.json();
        // Filter out words already in the list
        const availableWords = (data.items || []).filter(
          (w: VocabularyItem) => !existingWordIds.includes(w.id)
        );
        setWords(availableWords);
      }
    } catch (error) {
      console.error('Failed to fetch words:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWords = words.filter((word) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      word.wordZh.toLowerCase().includes(q) ||
      word.wordPinyin.toLowerCase().includes(q) ||
      word.wordEn.toLowerCase().includes(q)
    );
  });

  const toggleWord = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      await onAddWords(Array.from(selectedIds));
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white">Add Words to {listName}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search words..."
            className="pl-9 bg-slate-700/50 border-slate-600 text-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 mt-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              {words.length === 0 ? 'No words available to add' : 'No matching words found'}
            </div>
          ) : (
            filteredWords.map((word) => (
              <label
                key={word.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    selectedIds.has(word.id)
                      ? 'bg-purple-600 border-purple-600'
                      : 'border-slate-500 bg-transparent'
                  }`}
                  onClick={() => toggleWord(word.id)}
                >
                  {selectedIds.has(word.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{word.wordZh}</span>
                    <span className="text-slate-400 text-sm">{word.wordPinyin}</span>
                  </div>
                  <span className="text-slate-400 text-sm truncate block">{word.wordEn}</span>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <span className="text-sm text-slate-400">
            {selectedIds.size} word{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-slate-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedIds.size === 0 || submitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${selectedIds.size} Word${selectedIds.size !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
