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
          <p className="text-sm text-[#bacbbe]">
            {selectedIds.size} of {words.length} words selected
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel} className="text-[#bacbbe] hover:text-[#e0e2e8]">
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      </div>

      {/* Search and list selector */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bacbbe]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search words..."
            className="pl-9 bg-[#1c2024] border-white/10 text-white"
          />
        </div>
        <Select value={selectedListId} onValueChange={setSelectedListId}>
          <SelectTrigger className="w-[180px] bg-[#1c2024] border-white/10 text-white">
            <SelectValue placeholder="Add to list..." />
          </SelectTrigger>
          <SelectContent className="bg-[#1c2024] border-white/10">
            <SelectItem value="none" className="text-[#e0e2e8]">No list</SelectItem>
            {lists.map((list) => (
              <SelectItem key={list.id} value={list.id} className="text-[#e0e2e8]">
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
          className="text-sm text-[#76ffbb] hover:text-[#76ffbb]/80"
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
                  ? 'bg-[#76ffbb]/10 border border-[#76ffbb]/50'
                  : 'bg-[#1c2024]/50 border border-transparent hover:bg-[#1c2024]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-[#76ffbb]' : 'border border-slate-500'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-white">{word.zh}</span>
                  <span className="text-[#bacbbe]">{word.pinyin}</span>
                  {word.hskLevel && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[#76ffbb]/10 text-[#76ffbb]/80">
                      HSK {word.hskLevel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#bacbbe] truncate">{word.en}</p>
                {word.example && (
                  <p className="text-xs text-[#849589] truncate mt-1">{word.example}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <Button variant="ghost" onClick={onCancel} className="flex-1 text-[#e0e2e8]">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={selectedIds.size === 0 || saving}
          className="flex-1 bg-[#76ffbb] hover:opacity-90"
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
