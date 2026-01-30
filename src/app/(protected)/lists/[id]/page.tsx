'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Edit2,
  Loader2,
  BookOpen,
  Globe,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { VocabularyList, VocabularyItem } from '@/types';
import { AddWordsToListDialog } from '@/components/lists/add-words-to-list-dialog';

interface ListWord extends VocabularyItem {
  listItemId: string;
  addedAt: string;
}

interface ListDetails {
  list: VocabularyList & { wordCount: number; learnedCount: number };
  words: ListWord[];
  total: number;
  hasMore: boolean;
}

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;

  const [data, setData] = useState<ListDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const response = await fetch(`/api/lists/${listId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/lists');
          return;
        }
        throw new Error('Failed to fetch list');
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch list:', error);
      toast.error('Failed to load list');
    } finally {
      setLoading(false);
    }
  }, [listId, router]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleAddWords = async (wordIds: string[]) => {
    try {
      const response = await fetch(`/api/lists/${listId}/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordIds }),
      });
      if (!response.ok) throw new Error('Failed to add words');
      const result = await response.json();
      toast.success(`Added ${result.added} words to list`);
      fetchList();
    } catch {
      toast.error('Failed to add words');
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedWords.size === 0) return;
    setRemoving(true);
    try {
      const response = await fetch(`/api/lists/${listId}/words`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordIds: Array.from(selectedWords) }),
      });
      if (!response.ok) throw new Error('Failed to remove words');
      toast.success(`Removed ${selectedWords.size} words from list`);
      setSelectedWords(new Set());
      fetchList();
    } catch {
      toast.error('Failed to remove words');
    } finally {
      setRemoving(false);
    }
  };

  const toggleWordSelection = (wordId: string) => {
    setSelectedWords((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  };

  const filteredWords = (data?.words || []).filter((word) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      word.wordZh?.toLowerCase().includes(q) ||
      word.wordPinyin?.toLowerCase().includes(q) ||
      word.wordEn?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-8 w-48 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { list, words } = data;
  const progressPercent = list.wordCount > 0
    ? Math.round((list.learnedCount / list.wordCount) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/lists"
          className="inline-flex items-center text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Lists
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${list.color}20` }}
            >
              <BookOpen className="w-6 h-6" style={{ color: list.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{list.name}</h1>
                {list.isPublic ? (
                  <span title="Public"><Globe className="w-4 h-4 text-green-400" /></span>
                ) : (
                  <span title="Private"><Lock className="w-4 h-4 text-slate-500" /></span>
                )}
              </div>
              {list.description && (
                <p className="text-slate-400 mt-1">{list.description}</p>
              )}
              <p className="text-sm text-slate-500 mt-1">
                {list.wordCount} words &middot; {progressPercent}% learned
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar */}
        {list.wordCount > 0 && (
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, backgroundColor: list.color }}
            />
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search words..."
            className="pl-9 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Words
        </Button>
        {selectedWords.size > 0 && (
          <Button
            variant="destructive"
            onClick={handleRemoveSelected}
            disabled={removing}
          >
            {removing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Remove ({selectedWords.size})
          </Button>
        )}
      </div>

      {/* Word list */}
      {words.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">No words yet</h2>
          <p className="text-slate-400 mb-6">Add words from your vocabulary to this list</p>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Words
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredWords.map((word) => (
            <Card
              key={word.id}
              className={`p-4 bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer ${
                selectedWords.has(word.id) ? 'border-purple-500 bg-purple-500/10' : ''
              }`}
              onClick={() => toggleWordSelection(word.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedWords.has(word.id)}
                    onChange={() => toggleWordSelection(word.id)}
                    className="w-4 h-4 rounded border-slate-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-medium text-white">{word.wordZh}</span>
                      <span className="text-slate-400">{word.wordPinyin}</span>
                      {word.hskLevel && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                          HSK {word.hskLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400">{word.wordEn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {word.isLearned && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                      Learned
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add words dialog */}
      <AddWordsToListDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        listId={listId}
        listName={list.name}
        existingWordIds={words.map((w) => w.id)}
        onAddWords={handleAddWords}
      />
    </div>
  );
}
