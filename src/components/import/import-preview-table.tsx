'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, Check, X } from 'lucide-react';
import { ExtractedWord, VocabularyList } from '@/types';

interface ImportPreviewTableProps {
  words: ExtractedWord[];
  sourceTitle: string;
  lists: VocabularyList[];
  onSave: (selectedWords: ExtractedWord[], listId?: string) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export function ImportPreviewTable({
  words,
  sourceTitle,
  lists,
  onSave,
  onCancel,
  saving,
}: ImportPreviewTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(words.map((_, i) => i)));
  const [search, setSearch] = useState('');
  const [selectedListId, setSelectedListId] = useState<string>('none');

  const filteredWords = words.filter((word, index) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      word.zh.toLowerCase().includes(q) ||
      word.pinyin.toLowerCase().includes(q) ||
      word.en.toLowerCase().includes(q)
    );
  });

  const toggleWord = (index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === words.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(words.map((_, i) => i)));
    }
  };

  const handleSave = () => {
    const selectedWords = words.filter((_, i) => selectedIds.has(i));
    onSave(selectedWords, selectedListId === 'none' ? undefined : selectedListId);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Preview: {sourceTitle}</h2>
          <p className="text-sm text-slate-400">
            {selectedIds.size} of {words.length} words selected
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      </div>

      {/* Search and list selector */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search words..."
            className="pl-9 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
        <Select value={selectedListId} onValueChange={setSelectedListId}>
          <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
            <SelectValue placeholder="Add to list..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="none" className="text-slate-300">No list</SelectItem>
            {lists.map((list) => (
              <SelectItem key={list.id} value={list.id} className="text-slate-300">
                {list.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Select all */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleAll}
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          {selectedIds.size === words.length ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* Word list */}
      <div className="max-h-[400px] overflow-y-auto space-y-1 pr-2">
        {filteredWords.map((word, displayIndex) => {
          const actualIndex = words.indexOf(word);
          const isSelected = selectedIds.has(actualIndex);

          return (
            <div
              key={actualIndex}
              onClick={() => toggleWord(actualIndex)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-purple-500/20 border border-purple-500/50'
                  : 'bg-slate-800/30 border border-transparent hover:bg-slate-800/50'
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-purple-600' : 'border border-slate-500'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-white">{word.zh}</span>
                  <span className="text-slate-400">{word.pinyin}</span>
                  {word.hskLevel && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      HSK {word.hskLevel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 truncate">{word.en}</p>
                {word.example && (
                  <p className="text-xs text-slate-500 truncate mt-1">{word.example}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div className="flex gap-3 pt-4 border-t border-slate-700">
        <Button variant="ghost" onClick={onCancel} className="flex-1 text-slate-300">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={selectedIds.size === 0 || saving}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            `Save ${selectedIds.size} Words`
          )}
        </Button>
      </div>
    </div>
  );
}
